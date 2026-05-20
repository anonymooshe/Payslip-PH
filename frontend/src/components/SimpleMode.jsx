import { SIMPLE_CATEGORIES } from '../utils/constants'

const fmt = (v) => '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function SimpleMode({ simpleCats, fixedHourly, onCatChange, onFixedHourlyChange }) {
  const rate = Number(fixedHourly) || 0
  const daily = rate * 8
  let total = 0

  const rows = SIMPLE_CATEGORIES.map(cat => {
    const raw = Number(simpleCats[cat.key]) || 0
    const hours = cat.hoursPerUnit ? raw * cat.hoursPerUnit : raw
    const amount = hours * rate * cat.mult
    total += amount
    return { ...cat, raw, amount }
  })

  return (
    <div className="card" style={{animationDelay:'.1s'}}>
      <div className="card-head">
        <div className="card-icon blue">⚡</div>
        <div><h2>Simple Calculation</h2><span>Categorized hours × DOLE multipliers — no DTR needed</span></div>
      </div>

      <div className="fg" style={{marginBottom:'16px'}}>
        <div className="field" style={{maxWidth:'260px'}}>
          <label>Base hourly rate (₱)</label>
          <input type="number" value={fixedHourly} onChange={onFixedHourlyChange} min="0" step="0.01" placeholder="e.g. 100.00"/>
        </div>
        <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px',fontSize:'13px',color:'var(--ink3)'}}>
          Daily rate: <strong style={{color:'var(--ink)',marginLeft:'4px'}}>{fmt(daily)}</strong>
        </div>
      </div>

      <div className="dtr-wrap">
        <table className="dtr-table">
          <thead>
            <tr>
              <th style={{minWidth:'180px'}}>Day type</th>
              <th style={{minWidth:'90px'}}>Amount</th>
              <th>× Mult</th>
              <th>Computed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cat) => (
              <tr key={cat.key}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input
                      type="number"
                      value={simpleCats[cat.key]}
                      onChange={e => onCatChange(cat.key, e.target.value)}
                      min="0"
                      step="0.5"
                      style={{width:'80px'}}
                      placeholder="0"
                    />
                    <span style={{fontSize:'12px',color:'var(--ink3)'}}>{cat.unit}</span>
                    <span style={{fontSize:'13px',fontWeight:'500'}}>{cat.label}</span>
                  </div>
                </td>
                <td className="num" style={{fontSize:'13px',color:'var(--ink2)'}}>{fmt(cat.raw * (cat.hoursPerUnit || 1) * rate)}</td>
                <td className="num" style={{fontSize:'13px',color:'var(--accent)'}}>×{cat.mult.toFixed(2)}</td>
                <td className="num" style={{fontWeight:'600',color:'var(--ink)'}}>{fmt(cat.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop:'12px', padding:'14px 18px',
        background:'linear-gradient(135deg,#1a56db,#0e3fa8)',
        borderRadius:'10px', color:'#fff',
        display:'flex', justifyContent:'space-between',
        fontSize:'16px', fontWeight:'600'
      }}>
        <span>Estimated Gross Pay</span>
        <span>{fmt(total)}</span>
      </div>

      <div style={{marginTop:'8px',padding:'8px 12px',background:'var(--gold-bg)',borderRadius:'7px',fontSize:'12px',color:'var(--gold)'}}>
        💡 Hours are multiplied by base hourly rate × DOLE rate multiplier. Add deductions below to compute net pay.
      </div>
    </div>
  )
}
