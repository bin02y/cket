import { Icon } from './Icon'

type AppHeaderProps = {
  balance: number
}

export function AppHeader({ balance }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a className="brand" href="#main-content" aria-label="Eco Express 홈으로 이동">
        <span className="brand__mark"><Icon name="leaf" /></span>
        <span>
          <strong>ECO EXPRESS</strong>
          <small>YOUTH ESG ACADEMY</small>
        </span>
      </a>
      <div className="point-chip" aria-label={`현재 에코 포인트 ${balance}점`}>
        <span className="point-chip__leaf"><Icon name="leaf" /></span>
        <span><strong>{balance.toLocaleString('ko-KR')}</strong> P</span>
      </div>
    </header>
  )
}
