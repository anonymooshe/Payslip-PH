import { peso } from '../utils/helpers'

export default function Results({ result, empPosition, onPrint, onDownload }) {
  if (!result) return null
  const r = result
  const position = empPosition || 'Position | Department'

  const earningsHtml = r.earnings.length > 0
    ? r.earnings.map(e =>
        `<div class="ps-row"><span class="ps-label">${e.label}</span><span class="ps-amt">${peso(e.amount)}</span></div>`
      ).join('')
    : '<div class="ps-row" style="color:var(--ink3);font-size:12px">No earnings recorded.</div>'

  const deductionsHtml = r.deductions.length > 0
    ? r.deductions.map(d =>
        `<div class="ps-row deduct"><span class="ps-label">− ${d.label}</span><span class="ps-amt">${peso(d.amount)}</span></div>`
      ).join('')
    : '<div class="ps-row" style="color:var(--ink3);font-size:12px">No deductions.</div>'

  return (
    <div id="results" className="show" style={{display:'block'}}>
      <div className="metrics" style={{marginTop:'1.5rem'}}>
        <div className="metric">
          <div className="m-label">Work days</div>
          <div className="m-val">{r.workDays}</div>
          <div className="m-sub">days recorded</div>
        </div>
        <div className="metric">
          <div className="m-label">Hourly rate</div>
          <div className="m-val">{peso(r.hourlyRate)}</div>
          <div className="m-sub">per hour</div>
        </div>
        <div className="metric">
          <div className="m-label">Regular hours</div>
          <div className="m-val">{r.totalRegHrs.toFixed(2)}</div>
          <div className="m-sub">total hours</div>
        </div>
        <div className="metric">
          <div className="m-label">OT hours</div>
          <div className="m-val">{r.totalOTHrs.toFixed(2)}</div>
          <div className="m-sub">total hours</div>
        </div>
      </div>

      <div className="metrics" style={{marginTop:'1.5rem'}}>
        <div className="metric accent">
          <div className="m-label">Gross pay</div>
          <div className="m-val">{peso(r.grossPay)}</div>
          <div className="m-sub">before deductions</div>
        </div>
        <div className="metric">
          <div className="m-label">Deductions</div>
          <div className="m-val" style={{color:'var(--red)'}}>{peso(r.totalDeductions)}</div>
          <div className="m-sub">total withheld</div>
        </div>
        <div className="metric green">
          <div className="m-label">Net pay</div>
          <div className="m-val">{peso(r.netPay)}</div>
          <div className="m-sub">take-home amount</div>
        </div>
      </div>

      <div id="payslip-card" className="card">
        <div className="payslip">
          <div className="payslip-header">
            <div>
              <div style={{fontSize:'10px',letterSpacing:'.1em',textTransform:'uppercase',color:'#6b7280',marginBottom:'4px'}}>Official Payslip</div>
              <div className="emp-name">{r.employeeName}</div>
              <div className="emp-meta">{position}</div>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <div className="payslip-badge">
                <div className="bd-label">Period</div>
                <div className="bd-val">{r.period}</div>
              </div>
              <div className="payslip-badge">
                <div className="bd-label">Monthly</div>
                <div className="bd-val">{r.baseLabel || '—'}</div>
              </div>
            </div>
          </div>

          <div className="ps-body">
            <div className="ps-section">
              <div className="ps-section-title">Earnings</div>
              <div dangerouslySetInnerHTML={{__html: earningsHtml}} />
            </div>
            <div className="ps-divider"></div>
            <div className="ps-total">
              <span className="ps-label">Gross Pay</span>
              <span className="ps-amt">{peso(r.grossPay)}</span>
            </div>
            <div className="ps-section" style={{marginTop:'1rem'}}>
              <div className="ps-section-title">Deductions</div>
              <div dangerouslySetInnerHTML={{__html: deductionsHtml}} />
            </div>
            <div className="ps-divider"></div>
            <div className="ps-total">
              <span className="ps-label">Total Deductions</span>
              <span className="ps-amt" style={{color:'var(--red)'}}>{peso(r.totalDeductions)}</span>
            </div>
            <div className="ps-net">
              <div>
                <div className="label">NET PAY</div>
                <div style={{fontSize:'11px',color:'#6b7280',marginTop:'1px'}}>{r.employeeName} · Period {r.period} · {r.workDays} days</div>
              </div>
              <div className="amount">{peso(r.netPay)}</div>
            </div>
          </div>
        </div>

        <div className="action-row">
          <button className="btn-action btn-print" onClick={onPrint}>🖨 Print payslip</button>
          <button className="btn-action btn-download" onClick={onDownload}>⬇ Download .txt</button>
        </div>
      </div>
    </div>
  )
}
