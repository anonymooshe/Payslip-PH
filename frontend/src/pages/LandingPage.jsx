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
          
            <div className="modal-body"style={{ textAlign: 'left' }}>
              <h4>1. Purpose</h4>
              <p>
                <p>PaySlip PH is a payroll calculation tool designed to assist Philippine employers in computing employee salaries in accordance with Department of Labor and Employment (DOLE) labor standards. This tool is provided for informational and computational convenience only.</p>
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
              <p>PaySlip PH does not constitute legal, tax, or professional advice. The developers and contributors of this software assume no liability for errors, omissions, or any consequences arising from the use of computed results.</p>
          
              <h4>4. Data Privacy</h4>
              <p>This application performs all calculations locally. Employee names, salary details, and DTR entries entered into this tool are not stored, transmitted, or collected by any third party. No personal data is retained after the browser session ends.</p>
          
              <h4>5. Limitation of Liability</h4>
              <p>To the maximum extent permitted by applicable law, the developers, contributors, and maintainers of PaySlip PH shall not be held liable for any direct, indirect, incidental, special, consequential, or punitive damages—including but not limited to:</p>
              <ul>
                <li>Legal penalties, fines, or sanctions from government agencies (DOLE, BIR, SSS, PhilHealth, Pag-IBIG).</li>
                <li>Underpayment or overpayment of employee salaries, benefits, or contributions.</li>
                <li>Loss of data, profits, business opportunities, or reputation.</li>
                <li>Claims, suits, or actions brought by employees, contractors, or third parties resulting from the use of this software.</li>
              </ul>
          
              <p>By using this software, you expressly agree to indemnify and hold harmless the developers from any and all claims, liabilities, damages, and legal costs arising out of your use of PaySlip PH.</p>
          
              <h4>6. Use at Your Own Risk</h4>
              <p>By using PaySlip PH, you acknowledge and agree that your use of this tool is entirely at your own risk. The software is provided "as is" without warranties of any kind, either express or implied.</p>
          
              <h4>7. License</h4>
              <p>This software is intended for personal and organizational use. Redistribution or commercial use without explicit permission from the author is prohibited.</p>
              
              <h4>8. Updates</h4>
              <p>These Terms of Use may be revised at any time. Continued use of the application after changes constitutes acceptance of the updated terms.</p>
          
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
