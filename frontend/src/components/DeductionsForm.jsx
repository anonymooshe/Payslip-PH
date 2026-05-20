export default function DeductionsForm({ deductions, onChange }) {
  const set = (field) => (e) => onChange({ ...deductions, [field]: e.target.value })

  return (
    <div className="card" style={{animationDelay:'.15s'}}>
      <div className="card-head">
        <div className="card-icon red">📉</div>
        <div><h2>Deductions</h2><span>Government contributions and other deductions</span></div>
      </div>
      <div className="fg fg-3">
        <div className="field"><label>SSS contribution (₱)</label><input type="number" value={deductions.sss} onChange={set('sss')} min="0" placeholder="0.00"/></div>
        <div className="field"><label>PhilHealth (₱)</label><input type="number" value={deductions.philhealth} onChange={set('philhealth')} min="0" placeholder="0.00"/></div>
        <div className="field"><label>Pag-IBIG (₱)</label><input type="number" value={deductions.pagibig} onChange={set('pagibig')} min="0" placeholder="0.00"/></div>
      </div>
      <div className="fg fg-2" style={{marginTop:'12px'}}>
        <div className="field"><label>Withholding tax (₱)</label><input type="number" value={deductions.tax} onChange={set('tax')} min="0" placeholder="0.00"/></div>
        <div className="field"><label>Other deductions (₱)</label><input type="number" value={deductions.other} onChange={set('other')} min="0" placeholder="0.00"/></div>
      </div>
    </div>
  )
}
