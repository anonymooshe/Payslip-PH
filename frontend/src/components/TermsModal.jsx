export default function TermsModal({ show, onClose }) {
  if (!show) return null
  return (
    <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h3>Terms of Use</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <h4>1. Purpose</h4>
          <p>PaySlip PH is a payroll calculation tool designed to assist Philippine employers in computing employee salaries in accordance with Department of Labor and Employment (DOLE) labor standards. This tool is provided for informational and computational convenience only.</p>

          <h4>2. Accuracy Disclaimer</h4>
          <p>While every effort has been made to ensure that calculations reflect current DOLE multipliers and Philippine labor regulations, PaySlip PH does not guarantee the accuracy, completeness, or timeliness of its computations. Users are strongly advised to:</p>
          <ul>
            <li>Verify all computed results against official DOLE guidelines and BIR tax tables.</li>
            <li>Consult with a licensed HR professional, accountant, or labor law practitioner before finalizing payroll disbursements.</li>
            <li>Check for updates to SSS, PhilHealth, and Pag-IBIG contribution schedules, as these are subject to periodic changes by the respective government agencies.</li>
          </ul>

          <h4>3. No Legal Advice</h4>
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

          <p style={{color:'var(--ink3)',marginTop:'1.5rem',fontSize:'13px'}}><em>Last updated: May 2026</em></p>
        </div>
      </div>
    </div>
  )
}
