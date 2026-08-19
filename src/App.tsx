import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { AuthScreen } from './components/AuthScreen'
import { BottomNavigation } from './components/BottomNavigation'
import { BoothGuide } from './components/BoothGuide'
import { Icon } from './components/Icon'
import { MyProfile } from './components/MyProfile'
import { RewardShop } from './components/RewardShop'
import { loadParticipantData, saveRewardRedemption, translateDataError } from './lib/participantData'
import { isSupabaseConfigured, profileFromAuthUser, supabase, translateAuthError } from './lib/supabase'
import type { AuthActionResult, AuthCredentials, CheckoutDetails, ParticipantProfile, PointTransaction, RewardId, RewardOrder, RewardRedemptionResult, SignUpDetails, TabId } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('booths')
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantProfile | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [orders, setOrders] = useState<RewardOrder[]>([])
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured)
  const [dataError, setDataError] = useState('')
  const dataRequestId = useRef(0)
  const completedBooths = new Set(transactions.flatMap((transaction) => transaction.missionId ? [transaction.missionId] : []))
  const balance = transactions.reduce((total, transaction) => total + transaction.amount, 0)

  const loadRemoteState = useCallback(async (user: User) => {
    const requestId = ++dataRequestId.current
    setDataError('')
    try {
      const data = await loadParticipantData(user)
      if (dataRequestId.current !== requestId) return null
      setCurrentParticipant(data.profile)
      setTransactions(data.transactions)
      setOrders(data.orders)
      return null
    } catch (error) {
      if (dataRequestId.current !== requestId) return null
      const message = translateDataError(error)
      setDataError(message)
      return message
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false)
      return
    }

    let isActive = true

    async function syncSession(session: Session | null) {
      if (!isActive) return
      if (!session) {
        dataRequestId.current += 1
        setCurrentParticipant(null)
        setTransactions([])
        setOrders([])
        setDataError('')
        setIsAuthLoading(false)
        return
      }

      setCurrentParticipant(profileFromAuthUser(session.user))
      await loadRemoteState(session.user)
      if (isActive) setIsAuthLoading(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void syncSession(session)
      }, 0)
    })

    return () => {
      isActive = false
      dataRequestId.current += 1
      listener.subscription.unsubscribe()
    }
  }, [loadRemoteState])

  async function signUp(details: SignUpDetails): Promise<AuthActionResult> {
    if (!supabase) return { error: '현재 회원가입 연결을 사용할 수 없습니다. 관리자에게 문의해 주세요.' }

    const { data, error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: { data: { display_name: details.name } },
    })
    if (error) return { error: translateAuthError(error.message) }
    if (!data.session) return { error: '가입 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.' }

    setCurrentParticipant(profileFromAuthUser(data.session.user))
    setActiveTab('booths')
    return {}
  }

  async function login(credentials: AuthCredentials): Promise<AuthActionResult> {
    if (!supabase) return { error: '현재 로그인 연결을 사용할 수 없습니다. 관리자에게 문의해 주세요.' }

    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (error) return { error: translateAuthError(error.message) }

    setCurrentParticipant(profileFromAuthUser(data.user))
    setActiveTab('booths')
    return {}
  }

  async function logout() {
    dataRequestId.current += 1
    if (supabase) await supabase.auth.signOut()
    setCurrentParticipant(null)
    setTransactions([])
    setOrders([])
    setDataError('')
    setActiveTab('booths')
  }

  async function deleteAccount() {
    const participantId = currentParticipant?.id
    if (supabase) {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
      if (error) return '계정 삭제 서버 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      await supabase.auth.signOut()
    }
    dataRequestId.current += 1
    setCurrentParticipant(null)
    setTransactions([])
    setOrders([])
    setDataError('')
    setActiveTab('booths')
    if (participantId) {
      try {
        window.localStorage.removeItem(`eco-express-shop:${participantId}:v1`)
      } catch {
        // Account deletion is complete even when browser storage is unavailable.
      }
    }
    return null
  }

  async function refreshCurrentParticipant() {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    if (!data.session) return '로그인 세션이 만료됐습니다. 다시 로그인해 주세요.'
    return loadRemoteState(data.session.user)
  }

  async function redeemReward(rewardId: RewardId, pointsToUse: number, checkout: CheckoutDetails): Promise<RewardRedemptionResult> {
    try {
      const result = await saveRewardRedemption(rewardId, pointsToUse, checkout)
      if (result.status === 'success' || result.status === 'insufficient') await refreshCurrentParticipant()
      return result
    } catch (error) {
      return { status: 'error', message: translateDataError(error) }
    }
  }

  async function retryDataLoad() {
    await refreshCurrentParticipant()
  }

  function navigateTo(tab: TabId) {
    setActiveTab(tab)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  if (isAuthLoading) return <main className="auth-loading" aria-live="polite"><span><Icon name="leaf" /></span><strong>안전한 탑승 정보를 확인하고 있어요</strong></main>
  if (!currentParticipant) return <AuthScreen onLogin={login} onSignUp={signUp} />

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      {dataError ? <div className="data-status-banner" role="alert"><span><Icon name="warning" /></span><p><strong>활동 기록을 불러오지 못했어요</strong>{dataError}</p><button type="button" onClick={retryDataLoad}>다시 연결</button></div> : null}
      {activeTab === 'education' ? (
        <BoothGuide section="education" />
      ) : activeTab === 'experiment' ? (
        <main id="main-content" className="page empty-tab-page" aria-label="실험" />
      ) : activeTab === 'booths' ? (
        <BoothGuide section="booths" />
      ) : activeTab === 'shop' ? (
        <RewardShop participantId={currentParticipant.id} participantName={currentParticipant.name} balance={balance} completedStamps={completedBooths.size} onRedeem={redeemReward} />
      ) : (
        <MyProfile profile={currentParticipant} completedBooths={completedBooths} orders={orders} onLogout={logout} onDeleteAccount={deleteAccount} />
      )}
      <BottomNavigation activeTab={activeTab} onChange={navigateTo} />
    </div>
  )
}

export default App
