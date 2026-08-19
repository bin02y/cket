import ecoExpressLogo from '../assets/eco-express-logo-transparent.png'

export function AppHeader() {
  return (
    <header className="app-header">
      <a className="brand" href="#main-content" aria-label="Eco Express 홈으로 이동">
        <span className="brand-logo"><img src={ecoExpressLogo} alt="ECO EXPRESS" /></span>
      </a>
    </header>
  )
}
