import { useState, useEffect } from 'react'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
import './App.css'

const DAY_TYPES = [
  { v: 'regular', l: 'Regular workday', cls: 'type-regular' },
  { v: 'rest_day', l: 'Rest day (worked)', cls: 'type-rest' },
  { v: 'special', l: 'Special holiday', cls: 'type-special' },
  { v: 'special_rest', l: 'Special on Rest', cls: 'type-special' },
  { v: 'legal', l: 'Legal holiday', cls: 'type-legal' },
  { v: 'legal_rest', l: 'Legal on Rest', cls: 'type-legal' },
  { v: 'absent', l: 'Absent / unpaid leave', cls: 'type-absent' },
]

const STATUS_OPTIONS = ['', 'WFH', 'Leave', 'Sick', 'Holiday']

function App() {
  const [rateMode, setRateMode] = useState('monthly')
  const [monthlySalary, setMonthlySalary] = useState(20000)
  const [fixedHourly, setFixedHourly] = useState(112.50)
  const [stHours, setStHours] = useState(80)
  const [stPay, setStPay] = useState(9000)
  const [period, setPeriod] = useState('1-15')
  const [empName, setEmpName] = useState('')
  const [deductions, setDeductions] = useState({ sss: 0, philhealth: 0, pagibig: 0, tax: 0, other: 0 })
  const [entries, setEntries] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const showToast = (msg) => {
    Toastify({
      text: msg,
      duration: 2500,
      gravity: 'top',
      position: 'right',
      style: { background: '#1a1a2e', borderRadius: '8px', fontFamily: 'Outfit, sans-serif' }
    }).showToast()
  }

  const getHourlyRate = () => {
    if (rateMode === 'monthly') return (monthlySalary / 26 / 8)
    if (rateMode === 'hourly') return fixedHourly
    return (stPay / stHours)
  }

  const updateRateInfo = () => {
    const h = getHourlyRate()
    const d = h * 8
    if (rateMode === 'monthly') {
      document.getElementById('dailyDisplay').textContent = peso(d)
      document.getElementById('hourlyDisplay').textContent = peso(h)
    } else if (rateMode === 'hourly') {
      document.getElementById('dailyDisplayH').textContent = peso(d)
      document.getElementById('monthlyDisplayH').textContent = peso(d * 26)
    } else {
      document.getElementById('stHourlyDisplay').textContent = peso(h)
      document.getElementById('stDailyDisplay').textContent = peso(d)
    }
  }

  const peso = (v) => '₱' + Math.abs(v).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})

  const addRow = (d = null) => {
    const newEntry = d || { date: '', type: 'regular', reg: 8, ot: 0, status: '' }
    setEntries([...entries, newEntry])
  }

  const updateEntry = (index, field, value) => {
    const newEntries = [...entries]
    newEntries[index][field] = value
    setEntries(newEntries)
  }

  const removeRow = (index) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const clearAllRows = () => {
    setEntries([])
    showToast('✓ All rows cleared')
  }

  const loadSample = () => {
    if (entries.length > 0 && !window.confirm('This will replace all current entries. Continue?')) return
    const year = new Date().getFullYear()
    const sample = [
      { date: `${year}-04-14`, type: 'regular', reg: 8, ot: 0, status: '' },
      { date: `${year}-04-15`, type: 'regular', reg: 8, ot: 0, status: '' },
      { date: `${year}-04-16`, type: 'regular', reg: 8, ot: 0, status: 'WFH' },
      { date: `${year}-04-17`, type: 'regular', reg: 8, ot: 0, status: '' },
      { date: `${year}-04-18`, type: 'rest_day', reg: 0, ot: 0, status: '' },
      { date: `${year}-04-19`, type: 'rest_day', reg: 0, ot: 0, status: '' },
      { date: `${year}-04-20`, type: 'regular', reg: 8, ot: 0, status: 'WFH' },
      { date: `${year}-04-21`, type: 'regular', reg: 8, ot: 0, status: '' },
      { date: `${year}-04-22`, type: 'regular', reg: 8, ot: 0, status: '' },
      { date: `${year}-04-23`, type: 'regular', reg: 8, ot: 0, status: '' },
      { date: `${year}-04-24`, type: 'regular', reg: 8, ot: 0, status: 'WFH' },
      { date: `${year}-04-25`, type: 'rest_day', reg: 0, ot: 0, status: '' },
      { date: `${year}-04-26`, type: 'rest_day', reg: 0, ot: 0, status: '' },
      { date: `${year}-04-27`, type: 'regular', reg: 8, ot: 1, status: '' },
    ]
    setEntries(sample)
    showToast('✓ Sample data loaded')
  }

  const compute = async () => {
    const hourly = getHourlyRate()
    if (!hourly) {
      showToast('⚠ Please enter a valid pay rate.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        rateMode,
        dtrEntries: entries.map(e => ({
          date: e.date,
          type: e.type,
          reg: Number(e.reg) || 0,
          ot: Number(e.ot) || 0,
          status: e.status
        })),
        period,
        empName: empName || 'Employee',
        sss: Number(deductions.sss) || 0,
        philhealth: Number(deductions.philhealth) || 0,
        pagibig: Number(deductions.pagibig) || 0,
        tax: Number(deductions.tax) || 0,
        otherDeductions: Number(deductions.other) || 0,
      }
      
      if (rateMode === 'monthly') payload.monthlySalary = Number(monthlySalary)
      if (rateMode === 'hourly') payload.fixedHourly = Number(fixedHourly)
      if (rateMode === 'straight') {
        payload.stHours = Number(stHours)
        payload.stPay = Number(stPay)
      }

      const res = await fetch('/api/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        showToast('⚠ ' + (err.error || 'Server error'))
        return
      }

      const r = await res.json()
      setResult(r)
      showToast('✓ Payslip computed successfully')
      
      // Update UI elements
      document.getElementById('mWorkDays').textContent = r.workDays
      document.getElementById('mRegHrs').textContent = r.totalRegHrs.toFixed(2)
      document.getElementById('mOTHrs').textContent = r.totalOTHrs.toFixed(2)
      document.getElementById('mHourly').textContent = peso(r.hourlyRate)
      document.getElementById('mGross').textContent = peso(r.grossPay)
      document.getElementById('mDeduct').textContent = peso(r.totalDeductions)
      document.getElementById('mNet').textContent = peso(r.netPay)
      
      document.getElementById('psName').textContent = r.employeeName
      document.getElementById('psMeta').textContent = empName || 'Employee'
      document.getElementById('psPeriod').textContent = r.period
      document.getElementById('psMonthly').textContent = r.baseLabel || ''
      
      document.getElementById('psEarnings').innerHTML = r.earnings.map(e =>
        `<div class="ps-row"><span class="ps-label">${e.label}</span><span class="ps-amt">${peso(e.amount)}</span></div>`
      ).join('') || '<div class="ps-row" style="color:var(--ink3);font-size:12px">No earnings recorded.</div>'
      
      document.getElementById('psGross').textContent = peso(r.grossPay)
      
      document.getElementById('psDeductions').innerHTML = r.deductions.map(d =>
        `<div class="ps-row deduct"><span class="ps-label">− ${d.label}</span><span class="ps-amt">${peso(d.amount)}</span></div>`
      ).join('') || '<div class="ps-row" style="color:var(--ink3);font-size:12px">No deductions.</div>'
      
      document.getElementById('psTotalDeduct').textContent = peso(r.totalDeductions)
      document.getElementById('psNet').textContent = peso(r.netPay)
      document.getElementById('psNetLabel').textContent = `${r.employeeName} · Period ${r.period} · ${r.workDays} days`
      
      const resultsEl = document.getElementById('results')
      resultsEl.classList.add('show')
      resultsEl.style.display = 'block'
    } catch (e) {
      showToast('⚠ Connection error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const printPayslip = async () => {
    if (!result) return
    try {
      const res = await fetch('/api/print-payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      })
      if (!res.ok) throw new Error('Server error: ' + res.status)
      const html = await res.text()
      const pw = window.open('', '_blank')
      pw.document.write(html)
      pw.document.close()
    } catch (e) {
      showToast('⚠ Error generating payslip: ' + e.message)
    }
  }

  const downloadTxt = () => {
    if (!result) {
      showToast('⚠ No result to download.')
      return
    }
    const r = result
    const sep = '='.repeat(52)
    const thin = '-'.repeat(52)
    let txt = `${sep}\n  PAYSLIP — ${r.employeeName}\n  Period: ${r.period}\n${thin}\n  EARNINGS\n${thin}\n`

    r.earnings.forEach(e => {
      txt += `  ${e.label.padEnd(32)}₱${e.amount.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}\n`
    })

    txt += `${thin}\n  ${'Gross Pay'.padEnd(32)}₱${r.grossPay.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}\n${thin}\n  DEDUCTIONS\n${thin}\n`

    r.deductions.forEach(d => {
      txt += `  − ${d.label.padEnd(30)}₱${d.amount.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}\n`
    })

    txt += `${thin}\n  ${'Total Deductions'.padEnd(32)}₱${r.totalDeductions.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}\n${sep}\n  ${'NET PAY'.padEnd(32)}₱${r.netPay.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}\n${sep}\n`

    const a = document.createElement('a')
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt)
    a.download = `payslip_${r.employeeName.replace(/\s+/g,'_')}_${r.period}.txt`
    a.click()
    showToast('⬇ Payslip downloaded')
  }

  return (
    <div className="app">
      <header className="header">
        <a href="/" style={{display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',color:'#fff',marginRight:'14px',fontSize:'13px',fontWeight:'500',padding:'6px 12px',borderRadius:'6px',background:'rgba(255,255,255,0.08)',transition:'background 0.15s'}}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>
          Home
        </a>
        <div className="logo">
          <div className="logo-mark">₱</div>
          <div>
            <div className="logo-name">PaySlip PH</div>
            <div className="logo-tag">DOLE-compliant payroll calculator</div>
          </div>
        </div>
        <div className="header-right">🇵🇭 Philippine Labor Standards</div>
      </header>

      <div className="page">
        <div className="hero">
          <h1>Compute salary<br/><em>accurately, every time</em></h1>
          <p>Regular · Overtime · Rest Day · Special &amp; Legal Holidays</p>
          <div className="period-pills">
            <button className={`pill ${period === '1-15' ? 'active' : ''}`} onClick={() => setPeriod('1-15')}>1st period (1–15)</button>
            <button className={`pill ${period === '16-30' ? 'active' : ''}`} onClick={() => setPeriod('16-30')}>2nd period (16–30)</button>
          </div>
        </div>

        {/* Employee Setup */}
        <div className="card" style={{animationDelay:'.05s'}}>
          <div className="card-head">
            <div className="card-icon blue">👤</div>
            <div><h2>Employee &amp; Salary</h2><span>Basic information and pay rate</span></div>
          </div>

          <div className="fg fg-2" style={{marginBottom:'14px'}}>
            <div className="field">
              <label>Employee name</label>
              <input value={empName} onChange={e => setEmpName(e.target.value)} placeholder="e.g. Juan dela Cruz"/>
            </div>
            <div className="field">
              <label>Position / Department</label>
              <input placeholder="e.g. Clerk · Accounting"/>
            </div>
          </div>

          {/* Rate mode toggle */}
          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'11px',fontWeight:'500',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--ink3)',marginBottom:'8px'}}>Rate input mode</div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button className={`rate-mode-btn ${rateMode === 'monthly' ? 'active' : ''}`} onClick={() => { setRateMode('monthly'); updateRateInfo() }}>📅 Monthly salary</button>
              <button className={`rate-mode-btn ${rateMode === 'hourly' ? 'active' : ''}`} onClick={() => { setRateMode('hourly'); updateRateInfo() }}>⏱ Fixed hourly rate</button>
              <button className={`rate-mode-btn ${rateMode === 'straight' ? 'active' : ''}`} onClick={() => { setRateMode('straight'); updateRateInfo() }}>📋 Straight time (hrs ÷ pay)</button>
            </div>
          </div>

          {/* Monthly mode */}
          {rateMode === 'monthly' && (
            <div id="mode-monthly">
              <div className="fg fg-2">
                <div className="field">
                  <label>Monthly basic salary (₱)</label>
                  <input type="number" value={monthlySalary} onChange={e => { setMonthlySalary(e.target.value); updateRateInfo() }} min="0" step="100"/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px'}}>
                  <div style={{padding:'10px 14px',background:'#f0f7ff',borderRadius:'8px',fontSize:'12px',color:'var(--ink3)',display:'flex',gap:'1.5rem',flexWrap:'wrap',width:'100%'}}>
                    <span>📊 Daily: <strong id="dailyDisplay" style={{color:'var(--ink)'}}>₱769.23</strong></span>
                    <span>⏱ Hourly: <strong id="hourlyDisplay" style={{color:'var(--ink)'}}>₱96.15</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hourly mode */}
          {rateMode === 'hourly' && (
            <div id="mode-hourly">
              <div className="fg fg-2">
                <div className="field">
                  <label>Fixed hourly rate (₱)</label>
                  <input type="number" value={fixedHourly} onChange={e => { setFixedHourly(e.target.value); updateRateInfo() }} min="0" step="0.01"/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px'}}>
                  <div style={{padding:'10px 14px',background:'#f0f7ff',borderRadius:'8px',fontSize:'12px',color:'var(--ink3)',display:'flex',gap:'1.5rem',flexWrap:'wrap',width:'100%'}}>
                    <span>📊 Daily (×8): <strong id="dailyDisplayH" style={{color:'var(--ink)'}}>₱900.00</strong></span>
                    <span>📅 Monthly equiv: <strong id="monthlyDisplayH" style={{color:'var(--ink)'}}>₱23,400.00</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Straight time mode */}
          {rateMode === 'straight' && (
            <div id="mode-straight">
              <div className="fg fg-3">
                <div className="field">
                  <label>Straight time hours</label>
                  <input type="number" value={stHours} onChange={e => { setStHours(e.target.value); updateRateInfo() }} min="1" step="1"/>
                </div>
                <div className="field">
                  <label>Straight time pay (₱)</label>
                  <input type="number" value={stPay} onChange={e => { setStPay(e.target.value); updateRateInfo() }} min="0" step="100"/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px'}}>
                  <div style={{padding:'10px 14px',background:'#ecfdf5',border:'1px solid #a7f3d0',borderRadius:'8px',fontSize:'12px',color:'var(--ink3)',width:'100%'}}>
                    <div>⏱ Computed hourly: <strong id="stHourlyDisplay" style={{color:'var(--green)'}}>₱112.50</strong></div>
                    <div style={{marginTop:'3px'}}>📊 Daily (×8): <strong id="stDailyDisplay" style={{color:'var(--green)'}}>₱900.00</strong></div>
                  </div>
                </div>
              </div>
              <div style={{marginTop:'8px',padding:'8px 12px',background:'var(--gold-bg)',borderRadius:'7px',fontSize:'12px',color:'var(--gold)'}}>
                💡 e.g. ₱9,000 ÷ 80 hrs = <strong>₱112.50/hr</strong> — this rate will be used for all OT and holiday multipliers
              </div>
            </div>
          )}
        </div>

        {/* DTR Entries */}
        <div className="card" style={{animationDelay:'.1s'}}>
          <div className="card-head">
            <div className="card-icon gold">📋</div>
            <div><h2>Daily Time Record</h2><span>Enter each day's attendance and hours</span></div>
          </div>
          <div className="dtr-wrap">
            <table className="dtr-table">
              <thead>
                <tr>
                  <th style={{minWidth:'120px'}}>Date</th>
                  <th style={{minWidth:'190px'}}>Day type</th>
                  <th>Reg hrs</th>
                  <th>OT hrs</th>
                  <th style={{minWidth:'90px'}}>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={idx}>
                    <td><input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} style={{minWidth:'140px'}}/></td>
                    <td>
                      <select value={entry.type} onChange={e => updateEntry(idx, 'type', e.target.value)} style={{minWidth:'170px'}}>
                        {DAY_TYPES.map(dt => <option key={dt.v} value={dt.v}>{dt.l}</option>)}
                      </select>
                    </td>
                    <td className="num"><input type="number" value={entry.reg} onChange={e => updateEntry(idx, 'reg', e.target.value)} min="0" max="24" step="0.5"/></td>
                    <td className="num"><input type="number" value={entry.ot} onChange={e => updateEntry(idx, 'ot', e.target.value)} min="0" max="24" step="0.5"/></td>
                    <td>
                      <select value={entry.status} onChange={e => updateEntry(idx, 'status', e.target.value)} style={{minWidth:'88px'}}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '— normal —'}</option>)}
                      </select>
                    </td>
                    <td><button className="btn-del" onClick={() => removeRow(idx)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="btn-row">
            <button className="btn-add-row" onClick={() => addRow()}>＋ Add row</button>
            <button className="btn-add-row" onClick={loadSample}>Load sample</button>
            <button className="btn-add-row" style={{marginLeft:'8px',background:'var(--red-bg)',borderColor:'var(--red)',color:'var(--red)'}} onClick={clearAllRows}>Clear all</button>
          </div>
        </div>

        {/* Deductions */}
        <div className="card" style={{animationDelay:'.15s'}}>
          <div className="card-head">
            <div className="card-icon red">📉</div>
            <div><h2>Deductions</h2><span>Government contributions and other deductions</span></div>
          </div>
          <div className="fg fg-3">
            <div className="field"><label>SSS contribution (₱)</label><input type="number" value={deductions.sss} onChange={e => setDeductions({...deductions, sss: e.target.value})} min="0" placeholder="0.00"/></div>
            <div className="field"><label>PhilHealth (₱)</label><input type="number" value={deductions.philhealth} onChange={e => setDeductions({...deductions, philhealth: e.target.value})} min="0" placeholder="0.00"/></div>
            <div className="field"><label>Pag-IBIG (₱)</label><input type="number" value={deductions.pagibig} onChange={e => setDeductions({...deductions, pagibig: e.target.value})} min="0" placeholder="0.00"/></div>
          </div>
          <div className="fg fg-2" style={{marginTop:'12px'}}>
            <div className="field"><label>Withholding tax (₱)</label><input type="number" value={deductions.tax} onChange={e => setDeductions({...deductions, tax: e.target.value})} min="0" placeholder="0.00"/></div>
            <div className="field"><label>Other deductions (₱)</label><input type="number" value={deductions.other} onChange={e => setDeductions({...deductions, other: e.target.value})} min="0" placeholder="0.00"/></div>
          </div>
        </div>

        {/* Compute */}
        <button className="btn-compute" onClick={compute} disabled={loading}>
          {loading ? 'Computing…' : 'Compute salary'}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </button>

        {/* Results */}
        <div id="results">
          {/* Metrics row */}
          <div className="metrics" style={{marginTop:'1.5rem'}}>
            <div className="metric">
              <div className="m-label">Work days</div>
              <div className="m-val" id="mWorkDays">—</div>
              <div className="m-sub">days recorded</div>
            </div>
            <div className="metric">
              <div className="m-label">Hourly rate</div>
              <div className="m-val" id="mHourly">—</div>
              <div className="m-sub">per hour</div>
            </div>
            <div className="metric">
              <div className="m-label">Regular hours</div>
              <div className="m-val" id="mRegHrs">—</div>
              <div className="m-sub">total hours</div>
            </div>
            <div className="metric">
              <div className="m-label">OT hours</div>
              <div className="m-val" id="mOTHrs">—</div>
              <div className="m-sub">total hours</div>
            </div>
          </div>
          
          <div className="metrics" style={{marginTop:'1.5rem'}}>
            <div className="metric accent">
              <div className="m-label">Gross pay</div>
              <div className="m-val" id="mGross">—</div>
              <div className="m-sub">before deductions</div>
            </div>
            <div className="metric">
              <div className="m-label">Deductions</div>
              <div className="m-val" id="mDeduct" style={{color:'var(--red)'}}>—</div>
              <div className="m-sub">total withheld</div>
            </div>
            <div className="metric green">
              <div className="m-label">Net pay</div>
              <div className="m-val" id="mNet">—</div>
              <div className="m-sub">take-home amount</div>
            </div>
          </div>

          {/* Payslip */}
          <div id="payslip-card" className="card">
            <div className="payslip" id="payslipDoc">
              <div className="payslip-header">
                <div>
                  <div style={{fontSize:'10px',letterSpacing:'.1em',textTransform:'uppercase',color:'#6b7280',marginBottom:'4px'}}>Official Payslip</div>
                  <div className="emp-name" id="psName">—</div>
                  <div className="emp-meta" id="psMeta">—</div>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <div className="payslip-badge">
                    <div className="bd-label">Period</div>
                    <div className="bd-val" id="psPeriod">—</div>
                  </div>
                  <div className="payslip-badge">
                    <div className="bd-label">Monthly</div>
                    <div className="bd-val" id="psMonthly">—</div>
                  </div>
                </div>
              </div>

              <div className="ps-body">
                <div className="ps-section">
                  <div className="ps-section-title">Earnings</div>
                  <div id="psEarnings"></div>
                </div>
                <div className="ps-divider"></div>
                <div className="ps-total">
                  <span className="ps-label">Gross Pay</span>
                  <span className="ps-amt" id="psGross">—</span>
                </div>
                <div className="ps-section" style={{marginTop:'1rem'}}>
                  <div className="ps-section-title">Deductions</div>
                  <div id="psDeductions"></div>
                </div>
                <div className="ps-divider"></div>
                <div className="ps-total">
                  <span className="ps-label">Total Deductions</span>
                  <span className="ps-amt" style={{color:'var(--red)'}} id="psTotalDeduct">—</span>
                </div>
                <div className="ps-net">
                  <div>
                    <div className="label">NET PAY</div>
                    <div style={{fontSize:'11px',color:'#6b7280',marginTop:'1px'}} id="psNetLabel">—</div>
                  </div>
                  <div className="amount" id="psNet">—</div>
                </div>
              </div>
            </div>

            <div className="action-row">
              <button className="btn-action btn-print" onClick={printPayslip}>🖨 Print payslip</button>
              <button className="btn-action btn-download" onClick={downloadTxt}>⬇ Download .txt</button>
            </div>
          </div>
        </div>

        {/* Rate Reference */}
        <div className="card" style={{marginTop:'2rem',animationDelay:'.25s'}}>
          <div className="card-head">
            <div className="card-icon green">📖</div>
            <div><h2>DOLE Pay Rate Reference</h2><span>Multipliers used in this calculator</span></div>
          </div>
          <div className="rate-grid">
            <div className="rate-card">
              <div className="rc-type">Regular workday</div>
              <div className="rc-row"><span>Regular hours</span><span>×1.00</span></div>
              <div className="rc-row"><span>Overtime</span><span>×1.25</span></div>
            </div>
            <div className="rate-card">
              <div className="rc-type">Rest day (worked)</div>
              <div className="rc-row"><span>Regular hours</span><span>×1.30</span></div>
              <div className="rc-row"><span>Overtime</span><span>×1.69</span></div>
            </div>
            <div className="rate-card">
              <div className="rc-type">Special holiday</div>
              <div className="rc-row"><span>Regular hours</span><span>×1.30</span></div>
              <div className="rc-row"><span>Overtime</span><span>×1.69</span></div>
            </div>
            <div className="rate-card">
              <div className="rc-type">Special hol. (rest day)</div>
              <div className="rc-row"><span>Regular hours</span><span>×1.50</span></div>
              <div className="rc-row"><span>Overtime</span><span>×1.95</span></div>
            </div>
            <div className="rate-card">
              <div className="rc-type">Legal holiday (worked)</div>
              <div className="rc-row"><span>Regular hours</span><span>×2.00</span></div>
              <div className="rc-row"><span>Overtime</span><span>×2.60</span></div>
            </div>
            <div className="rate-card">
              <div className="rc-type">Legal hol. (rest day)</div>
              <div className="rc-row"><span>Regular hours</span><span>×2.60</span></div>
              <div className="rc-row"><span>Overtime</span><span>×3.38</span></div>
            </div>
            <div className="rate-card">
              <div className="rc-type">Legal hol. (unworked)</div>
              <div className="rc-row"><span>Still receives</span><span>Full day</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="footer-logo-mark">₱</div>
              <div>
                <div className="footer-logo-name">PaySlip PH</div>
                <div className="footer-logo-sub">DOLE-compliant payroll calculator</div>
              </div>
            </div>
            <div className="footer-links">
              <a href="/" className="footer-link">Home</a>
              <span className="footer-dot">·</span>
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); setShowTerms(true) }}>Terms of Use</a>
              <span className="footer-dot">·</span>
              <span className="footer-copy">© 2026 PaySlip PH</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Terms of Use Modal */}
      {showTerms && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTerms(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Terms of Use</h3>
              <button className="modal-close" onClick={() => setShowTerms(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <h4>1. Purpose</h4>
              <p>PaySlip PH is a payroll calculation tool designed to assist Philippine employers in computing employee salaries in accordance with Department of Labor and Employment (DOLE) labor standards.</p>
              <h4>2. Accuracy Disclaimer</h4>
              <p>While every effort has been made to ensure that calculations reflect current DOLE multipliers and Philippine labor regulations, PaySlip PH does not guarantee the accuracy, completeness, or timeliness of its computations.</p>
              <h4>3. No Legal Advice</h4>
              <p>This software is provided for informational purposes only and does not constitute legal, tax, or professional advice.</p>
              <h4>4. Data Privacy</h4>
              <p>All calculations are performed locally. No personal data is stored or transmitted.</p>
              <p style={{color:'var(--ink3)',marginTop:'1.5rem',fontSize:'13px'}}><em>Last updated: May 2026</em></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
