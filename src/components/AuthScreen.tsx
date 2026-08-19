import { useState, type FormEvent } from 'react'
import type { AuthActionResult, AuthCredentials, SignUpDetails } from '../types'
import ecoExpressLogo from '../assets/eco-express-logo-transparent.png'
import { Icon } from './Icon'

type AuthMode = 'login' | 'signup'

type AuthScreenProps = {
  onLogin: (credentials: AuthCredentials) => Promise<AuthActionResult>
  onSignUp: (details: SignUpDetails) => Promise<AuthActionResult>
}

export function AuthScreen({ onLogin, onSignUp }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email')).trim().toLowerCase()
    const password = String(formData.get('password'))

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상 입력해 주세요.')
      return
    }

    if (mode === 'signup') {
      const name = String(formData.get('name')).trim()
      if (!name) {
        setError('참가자 이름을 입력해 주세요.')
        return
      }
      setIsSubmitting(true)
      try {
        const result = await onSignUp({ name, email, password })
        setError(result.error ?? '')
        setNotice(result.notice ?? '')
      } catch {
        setError('네트워크 연결을 확인한 뒤 다시 시도해 주세요.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onLogin({ email, password })
      setError(result.error ?? '')
      setNotice(result.notice ?? '')
    } catch {
      setError('네트워크 연결을 확인한 뒤 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="auth-page">
      <section className="auth-scene" aria-label="풀밭 위를 달리는 에코 익스프레스" role="img">
        <a className="auth-brand" href="#main-content" aria-label="Eco Express">
          <span className="brand-logo brand-logo--auth"><img src={ecoExpressLogo} alt="ECO EXPRESS" /></span>
        </a>
        <div className="auth-scene__copy">
          <h1>배우고, 실천하고,<br /><em>더 푸른 내일로</em></h1>
          <p>청년 ESG 아카데미의 공조 기술 체험부터 친환경 리워드까지 하나의 여정으로 기록하세요.</p>
          <div className="auth-feature-list">
            <span><Icon name="train" /><strong>5 ECO STAMPS</strong></span>
            <span><Icon name="sparkle" /><strong>ECO PASSPORT</strong></span>
            <span><Icon name="shop" /><strong>REWARD SHOP</strong></span>
          </div>
        </div>
        <div className="auth-landscape" aria-hidden="true"><i /><i /><div className="auth-train"><span /><span /><span /></div><div className="auth-rail" /></div>
      </section>

      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel__mobile-brand"><span className="brand-logo"><img src={ecoExpressLogo} alt="ECO EXPRESS" /></span></div>
        <h2 id="auth-title">{mode === 'signup' ? '에코 여정을 시작해요' : '다시 만나 반가워요'}</h2>
        <p>{mode === 'signup' ? '간편 가입 후 부스 스탬프와 나의 ESG 변화를 기록할 수 있어요.' : '가입한 이메일로 에코 익스프레스에 다시 탑승하세요.'}</p>

        <div className="auth-tabs" role="tablist" aria-label="인증 방식">
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => changeMode('signup')}>회원가입</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => changeMode('login')}>로그인</button>
        </div>

        <form className="auth-form" onSubmit={submit} key={mode}>
          {mode === 'signup' ? <label><span>참가자 이름</span><input name="name" type="text" autoComplete="name" placeholder="이름을 입력해 주세요" /></label> : null}
          <label><span>이메일</span><input name="email" type="email" autoComplete="email" placeholder="eco@example.com" /></label>
          <label><span>비밀번호</span><input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="6자 이상 입력해 주세요" /></label>
          <p className="auth-error" role="alert" aria-live="polite">{error}</p>
          {notice ? <p className="auth-notice" role="status">{notice}</p> : null}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? '연결 중...' : mode === 'signup' ? '가입하고 출발하기' : '로그인하기'} {!isSubmitting ? <Icon name="arrow" /> : null}</button>
        </form>
      </section>
    </main>
  )
}
