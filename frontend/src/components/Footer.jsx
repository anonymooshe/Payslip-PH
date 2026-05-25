export default function Footer({ onShowTerms, onHome }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-mark">₱</div>
          <div>
            <div className="footer-logo-name">PaySlip PH</div>
            <div className="footer-logo-sub">Payroll calculator based on Philippine labor standards</div>
          </div>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link" onClick={onHome}>Home</a>
          <span className="footer-dot">·</span>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); onShowTerms() }}>Terms of Use</a>
          <span className="footer-dot">·</span>
          <span className="footer-copy">© 2026 PaySlip PH</span>
        </div>
      </div>
    </footer>
  )
}
