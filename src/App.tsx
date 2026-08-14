import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { AcademyMissions } from './components/AcademyMissions'
import { AppHeader } from './components/AppHeader'
import { AuthScreen } from './components/AuthScreen'
import { BottomNavigation } from './components/BottomNavigation'
import { BoothGuide } from './components/BoothGuide'
import { EcoWallet } from './components/EcoWallet'
import { HomeDashboard } from './components/HomeDashboard'
import { Icon } from './components/Icon'
import { MyProfile } from './components/MyProfile'
import { RewardShop } from './components/RewardShop'
import { loadParticipantData, saveMissionCompletion, saveRewardRedemption, translateDataError } from './lib/participantData'
import { isSupabaseConfigured, profileFromAuthUser, supabase, translateAuthError } from './lib/supabase'
import type { AuthActionResult, AuthCredentials, MissionId, ParticipantProfile, PointTransaction, RewardId, RewardRedemptionResult, SignUpDetails, TabId } from './types'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantProfile | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const dataRequestId = useRef(0)
  const completedMissions = new Set(transactions.flatMap((transaction) => transaction.missionId ? [transaction.missionId] : []))
  const balance = transactions.reduce((total, transaction) => total + transaction.amount, 0)

  const loadRemoteState = useCallback(async (user: User) => {
    const requestId = ++dataRequestId.current
    setIsDataLoading(true)
    setDataError('')
    try {
      const data = await loadParticipantData(user)
      if (dataRequestId.current !== requestId) return null
      setCurrentParticipant(data.profile)
      setTransactions(data.transactions)
      return null
    } catch (error) {
      if (dataRequestId.current !== requestId) return null
      const message = translateDataError(error)
      setDataError(message)
      return message
    } finally {
      if (dataRequestId.current === requestId) setIsDataLoading(false)
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
        setDataError('')
        setIsAuthLoading(false)
        return
      }

      setCurrentParticipant(profileFromAuthUser(session.user))
      await loadRemoteState(session.user)
      if (isActive) setIsAuthLoading(false)
    }

    void supabase.auth.getSession().then(({ data }) => syncSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session)
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
    await loadRemoteState(data.session.user)
    setActiveTab('home')
    return {}
  }

  async function login(credentials: AuthCredentials): Promise<AuthActionResult> {
    if (!supabase) return { error: '현재 로그인 연결을 사용할 수 없습니다. 관리자에게 문의해 주세요.' }

    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (error) return { error: translateAuthError(error.message) }

    setCurrentParticipant(profileFromAuthUser(data.user))
    await loadRemoteState(data.user)
    setActiveTab('home')
    return {}
  }

  async function logout() {
    dataRequestId.current += 1
    if (supabase) await supabase.auth.signOut()
    setCurrentParticipant(null)
    setTransactions([])
    setDataError('')
    setActiveTab('home')
  }

  async function deleteAccount() {
    if (supabase) {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
      if (error) return '계정 삭제 서버 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      await supabase.auth.signOut()
    }
    dataRequestId.current += 1
    setCurrentParticipant(null)
    setTransactions([])
    setDataError('')
    setActiveTab('home')
    return null
  }

  async function refreshCurrentParticipant() {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    if (!data.session) return '로그인 세션이 만료됐습니다. 다시 로그인해 주세요.'
    return loadRemoteState(data.session.user)
  }

  async function completeMission(missionId: MissionId, bonusPoints = 0) {
    try {
      await saveMissionCompletion(missionId, bonusPoints)
      await refreshCurrentParticipant()
      return null
    } catch (error) {
      return translateDataError(error)
    }
  }

  async function redeemReward(rewardId: RewardId): Promise<RewardRedemptionResult> {
    try {
      const result = await saveRewardRedemption(rewardId)
      if (result.status === 'success') await refreshCurrentParticipant()
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isAuthLoading) return <main className="auth-loading" aria-live="polite"><span><Icon name="leaf" /></span><strong>안전한 탑승 정보를 확인하고 있어요</strong></main>
  if (!currentParticipant) return <AuthScreen onLogin={login} onSignUp={signUp} />

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <AppHeader balance={balance} />
      {dataError ? <div className="data-status-banner" role="alert"><span><Icon name="warning" /></span><p><strong>활동 기록을 불러오지 못했어요</strong>{dataError}</p><button type="button" onClick={retryDataLoad}>다시 연결</button></div> : null}
      {isDataLoading && !dataError ? <div className="data-sync-status" role="status"><span className="status-dot" /> Supabase 활동 기록 동기화 중</div> : null}
      {activeTab === 'home' ? (
        <HomeDashboard participantName={currentParticipant.name} balance={balance} completedMissions={completedMissions} onOpenMissions={() => navigateTo('missions')} />
      ) : activeTab === 'booths' ? (
        <BoothGuide completedMissions={completedMissions} onOpenMissions={() => navigateTo('missions')} onOpenShop={() => navigateTo('shop')} />
      ) : activeTab === 'missions' ? (
        <AcademyMissions completedMissions={completedMissions} onMissionComplete={completeMission} />
      ) : activeTab === 'wallet' ? (
        <EcoWallet balance={balance} transactions={transactions} completedMissions={completedMissions} onOpenMissions={() => navigateTo('missions')} />
      ) : activeTab === 'shop' ? (
        <RewardShop balance={balance} onRedeem={redeemReward} onOpenWallet={() => navigateTo('wallet')} />
      ) : (
        <MyProfile profile={currentParticipant} balance={balance} transactions={transactions} completedMissions={completedMissions} onLogout={logout} onDeleteAccount={deleteAccount} onOpenMissions={() => navigateTo('missions')} />
      )}
      <BottomNavigation activeTab={activeTab} onChange={navigateTo} />
    </div>
  )
}

export default App
