import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowTerms(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="landing-page">
      <div className="logo-wrap">
        <div className="outer-glow" />
        <div className="landing-logo">
          <div className="logo-inner">₱</div>
        </div>
      </div>

      <h1>PaySlip <em>PH</em></h1>

      <p className="subtitle">
        Payroll calculator for Philippine employers based on labor standards. 
        Compute salaries with overtime, holiday pay, and rest day premiums — accurately, every time.
      </p>

      <div className="landing-features">
        <div className="landing-feat"><strong>⏱ Overtime</strong>Regular & holiday OT rates</div>
        <div className="landing-feat"><strong>📅 Holidays</strong>Special & legal multipliers</div>
        <div className="landing-feat"><strong>📉 Deductions</strong>SSS · PhilHealth · Pag-IBIG</div>
      </div>

      <Link to="/calculator" className="btn-landing">Get Started</Link>

      <div className="landing-footer">
        &copy; 2026 PaySlip PH. All rights reserved.
        <span style={{margin: '0 8px', color: '#6b7280'}}>·</span>
        <a onClick={() => setShowTerms(true)}>Terms of Use</a>
      </div>

      {showTerms && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setShowTerms(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Terms of Use</h3>
              <button
                className="modal-close"
                onClick={() => setShowTerms(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          
            <div className="modal-body">
              <h4>1. Purpose</h4>
              <p>
                PaySlip PH is a payroll calculation tool designed to assist Philippine employers
                in computing employee salaries based on publicly available Philippine labor standards
                and DOLE guidelines. This tool is provided for informational and computational purposes only.
              </p>
          
              <h4>2. Accuracy Disclaimer</h4>
              <p>
                While efforts are made to ensure calculations reflect current payroll rules and contribution rates,
                PaySlip PH does not guarantee the accuracy, completeness, or timeliness of results. Users are advised to:
              </p>
              <ul>
                <li>Verify results against official DOLE, BIR, SSS, PhilHealth, and Pag-IBIG references.</li>
                <li>Consult a qualified HR professional or accountant before payroll processing.</li>
                <li>Regularly check for updates in government-mandated rates and tables.</li>
              </ul>
          
              <h4>3. No Legal or Professional Advice</h4>
              <p>
                PaySlip PH does not provide legal, tax, or accounting advice. Users are responsible for how they apply
                the computed results in real payroll processes.
              </p>
          
              <h4>4. Data Privacy</h4>
              <p>
                This application performs all calculations locally in your browser. No employee data,
                salary information, or time records are stored, transmitted, or collected.
              </p>
          
              <h4>5. Limitation of Liability</h4>
              <p>
                To the maximum extent permitted by law, the developers of PaySlip PH are not liable for any damages or losses
                arising from the use of this software, including but not limited to:
              </p>
              <ul>
                <li>Payroll miscalculations or discrepancies</li>
                <li>Government penalties, fines, or compliance issues</li>
                <li>Data loss or business interruptions</li>
                <li>Claims from employees or third parties</li>
              </ul>
          
              <p>
                By using this software, you agree that you are solely responsible for verifying payroll outputs before use.
              </p>
          
              <h4>6. Use at Your Own Risk</h4>
              <p>
                PaySlip PH is provided "as is" without warranties of any kind, either express or implied.
                Use of this tool is entirely at your own discretion and risk.
              </p>
          
              <h4>7. License</h4>
              <p>
                This software is intended for personal and organizational use. Redistribution, resale, or commercial use
                without permission is not allowed.
              </p>
          
              <h4>8. Updates</h4>
              <p>
                These Terms may be updated from time to time. Continued use of the application means you accept any changes.
              </p>
          
              <p
                style={{
                  color: "#6b7280",
                  marginTop: "1.5rem",
                  fontSize: "13px",
                }}
              >
                <em>Last updated: May 2026</em>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
