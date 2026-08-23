import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import type { AuthActionResult, AuthCredentials, SignUpDetails } from '../types'

type AuthMode = 'login' | 'signup'

type AuthScreenProps = {
  onLogin: (credentials: AuthCredentials) => Promise<AuthActionResult>
  onSignUp: (details: SignUpDetails) => Promise<AuthActionResult>
  onClose: () => void
}

export function AuthScreen({ onLogin, onSignUp, onClose }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  function closeOnBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

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
        setError('이름을 입력해 주세요.')
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
    <div className="auth-dialog-backdrop" role="presentation" onMouseDown={closeOnBackdrop}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-label="회원 인증">
        <div className="auth-panel">
        <div className="auth-tabs" role="tablist" aria-label="인증 방식">
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => changeMode('signup')}>회원가입</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => changeMode('login')}>로그인</button>
        </div>

        <form className="auth-form" onSubmit={submit} key={mode}>
          {mode === 'signup' ? <label><span>이름</span><input name="name" type="text" autoComplete="name" placeholder="이름을 입력해 주세요" autoFocus /></label> : null}
          <label><span>이메일</span><input name="email" type="email" autoComplete="email" placeholder="eco@example.com" autoFocus={mode === 'login'} /></label>
          <label><span>비밀번호</span><input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="6자 이상 입력해 주세요" /></label>
          <p className="auth-error" role="alert" aria-live="polite">{error}</p>
          {notice ? <p className="auth-notice" role="status">{notice}</p> : null}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? '연결 중...' : mode === 'signup' ? '가입' : '로그인'}</button>
        </form>
        </div>
      </section>
    </div>
  )
}
