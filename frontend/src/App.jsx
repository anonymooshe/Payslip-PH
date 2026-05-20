import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
import { buildPrintHtml } from './utils/helpers'
import SimpleMode from './components/SimpleMode'
import DTRTable from './components/DTRTable'
import DeductionsForm from './components/DeductionsForm'
import Results from './components/Results'
import PrintModal from './components/PrintModal'
import TermsModal from './components/TermsModal'
import RateReference from './components/RateReference'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [rateMode, setRateMode] = useState('monthly')
  const [monthlySalary, setMonthlySalary] = useState(20800)
  const [fixedHourly, setFixedHourly] = useState(100)
  const [stHours, setStHours] = useState(80)
  const [stPay, setStPay] = useState(8000)
  const [period, setPeriod] = useState('1-15')
  const [simpleCats, setSimpleCats] = useState({ reg: 80, rest: 0, special: 0, specialRest: 0, legal: 0, legalRest: 0, legalUnworked: 0 })
  const [empName, setEmpName] = useState('')
  const [empPosition, setEmpPosition] = useState('')
  const [deductions, setDeductions] = useState({ sss: 0, philhealth: 0, pagibig: 0, tax: 0, other: 0 })
  const [entries, setEntries] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printHtml, setPrintHtml] = useState('')
  const printFrameRef = useRef(null)

  const navigate = useNavigate()
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowScrollBtn(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    if (rateMode === 'straight') return (stPay / stHours)
    return fixedHourly  // simple
  }

  const updateRateInfo = () => {
    const h = getHourlyRate()
    const d = h * 8
    if (rateMode === 'monthly') {
      document.getElementById('dailyDisplay').textContent = '₱' + (d).toLocaleString('en-PH',{minimumFractionDigits:2})
      document.getElementById('hourlyDisplay').textContent = '₱' + (h).toLocaleString('en-PH',{minimumFractionDigits:2})
    } else if (rateMode === 'hourly') {
      document.getElementById('dailyDisplayH').textContent = '₱' + (d).toLocaleString('en-PH',{minimumFractionDigits:2})
      document.getElementById('monthlyDisplayH').textContent = '₱' + (d * 26).toLocaleString('en-PH',{minimumFractionDigits:2})
    } else if (rateMode === 'straight') {
      document.getElementById('stHourlyDisplay').textContent = '₱' + (h).toLocaleString('en-PH',{minimumFractionDigits:2})
      document.getElementById('stDailyDisplay').textContent = '₱' + (d).toLocaleString('en-PH',{minimumFractionDigits:2})
    }
  }

  useEffect(() => {
    updateRateInfo()
  })

  const addRow = () => {
    setEntries([...entries, { date: '', type: 'regular', reg: 8, ot: 0, status: '' }])
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

  const goHome = (e) => {
    if (e) e.preventDefault()
    navigate('/')
  }

  const loadSample = () => {
    if (entries.length > 0 && !window.confirm('This will replace all current entries. Continue?')) return
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const isFirst = period === '1-15'
    const start = isFirst ? 1 : 16
    const end = isFirst ? 15 : new Date(year, now.getMonth() + 1, 0).getDate()
    const pad = (n) => String(n).padStart(2, '0')
    const sample = []
    for (let d = start; d <= end; d++) {
      const dow = new Date(year, now.getMonth(), d).getDay()
      const isWeekend = dow === 0 || dow === 6
      const isWFH = !isWeekend && d % 4 === 0
      const hasOT = !isWeekend && d === end - 2
      sample.push({
        date: `${year}-${month}-${pad(d)}`,
        type: isWeekend ? 'rest_day' : 'regular',
        reg: isWeekend ? 0 : 8,
        ot: hasOT ? 1 : 0,
        status: isWFH ? 'WFH' : '',
      })
    }
    setEntries(sample)
    showToast(`✓ Sample data loaded (${period})`)
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
          date: e.date, type: e.type,
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
      if (rateMode === 'simple') {
        payload.fixedHourly = Number(fixedHourly)
        payload.simpleRegHours = Number(simpleCats.reg) || 0
        payload.simpleRestHours = Number(simpleCats.rest) || 0
        payload.simpleSpecialHours = Number(simpleCats.special) || 0
        payload.simpleSpecialRestHours = Number(simpleCats.specialRest) || 0
        payload.simpleLegalHours = Number(simpleCats.legal) || 0
        payload.simpleLegalRestHours = Number(simpleCats.legalRest) || 0
        payload.simpleLegalUnworked = Number(simpleCats.legalUnworked) || 0
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
    } catch (e) {
      showToast('⚠ Connection error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const printPayslip = () => {
    if (!result) return
    setPrintHtml(buildPrintHtml(result, empPosition))
    setShowPrintModal(true)
  }

  const handlePrintFrame = () => {
    const frame = printFrameRef.current
    if (frame) frame.contentWindow.print()
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
        <a href="#" onClick={goHome}
           style={{display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',color:'#fff',marginRight:'14px',fontSize:'13px',fontWeight:'500',padding:'6px 12px',borderRadius:'6px',background:'rgba(255,255,255,0.08)',transition:'background 0.15s'}}>
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
              <input value={empPosition} onChange={e => setEmpPosition(e.target.value)} placeholder="e.g. Clerk · Accounting"/>
            </div>
          </div>

          {/* Rate mode toggle */}
          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'11px',fontWeight:'500',letterSpacing:'.06em',textTransform:'uppercase',color:'var(--ink3)',marginBottom:'8px'}}>Rate input mode</div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button className={`rate-mode-btn ${rateMode === 'monthly' ? 'active' : ''}`} onClick={() => { setRateMode('monthly'); updateRateInfo() }} data-tip="Enter monthly salary; hourly &amp; daily rates computed automatically">📅 Monthly salary</button>
              <button className={`rate-mode-btn ${rateMode === 'hourly' ? 'active' : ''}`} onClick={() => { setRateMode('hourly'); updateRateInfo() }} data-tip="Set a fixed hourly rate directly">⏱ Fixed hourly rate</button>
              <button className={`rate-mode-btn ${rateMode === 'straight' ? 'active' : ''}`} onClick={() => { setRateMode('straight'); updateRateInfo() }} data-tip="Enter total hours &amp; pay to derive hourly rate">📋 Straight time (hrs ÷ pay)</button>
              <button className={`rate-mode-btn ${rateMode === 'simple' ? 'active' : ''}`} onClick={() => { setRateMode('simple'); updateRateInfo() }} data-tip="Enter totals per day type; DOLE multipliers applied">⚡ Simple (hours × rate)</button>
            </div>
          </div>

          {/* Monthly mode */}
          {rateMode === 'monthly' && (
            <div>
              <div className="fg fg-2">
                <div className="field">
                  <label>Monthly basic salary (₱)</label>
                  <input type="number" value={monthlySalary} onChange={e => { setMonthlySalary(e.target.value); updateRateInfo() }} min="0" step="100"/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px'}}>
                  <div style={{padding:'10px 14px',background:'#f0f7ff',borderRadius:'8px',fontSize:'12px',color:'var(--ink3)',display:'flex',gap:'1.5rem',flexWrap:'wrap',width:'100%'}}>
                    <span>📊 Daily: <strong id="dailyDisplay" style={{color:'var(--ink)'}}>₱800.00</strong></span>
                    <span>⏱ Hourly: <strong id="hourlyDisplay" style={{color:'var(--ink)'}}>₱100.00</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hourly mode */}
          {rateMode === 'hourly' && (
            <div>
              <div className="fg fg-2">
                <div className="field">
                  <label>Fixed hourly rate (₱)</label>
                  <input type="number" value={fixedHourly} onChange={e => { setFixedHourly(e.target.value); updateRateInfo() }} min="0" step="0.01"/>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'2px'}}>
                  <div style={{padding:'10px 14px',background:'#f0f7ff',borderRadius:'8px',fontSize:'12px',color:'var(--ink3)',display:'flex',gap:'1.5rem',flexWrap:'wrap',width:'100%'}}>
                    <span>📊 Daily (×8): <strong id="dailyDisplayH" style={{color:'var(--ink)'}}>₱800.00</strong></span>
                    <span>📅 Monthly equiv: <strong id="monthlyDisplayH" style={{color:'var(--ink)'}}>₱20,800.00</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Straight time mode */}
          {rateMode === 'straight' && (
            <div>
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
                    <div>⏱ Computed hourly: <strong id="stHourlyDisplay" style={{color:'var(--green)'}}>₱100.00</strong></div>
                    <div style={{marginTop:'3px'}}>📊 Daily (×8): <strong id="stDailyDisplay" style={{color:'var(--green)'}}>₱800.00</strong></div>
                  </div>
                </div>
              </div>
              <div style={{marginTop:'8px',padding:'8px 12px',background:'var(--gold-bg)',borderRadius:'7px',fontSize:'12px',color:'var(--gold)'}}>
                💡 e.g. ₱8,000 ÷ 80 hrs = <strong>₱100.00/hr</strong> — this rate will be used for all OT and holiday multipliers
              </div>
            </div>
          )}
        </div>

        {/* DTR or Simple mode */}
        {rateMode === 'simple' ? (
          <SimpleMode
            simpleCats={simpleCats}
            fixedHourly={fixedHourly}
            onCatChange={(key, val) => setSimpleCats({ ...simpleCats, [key]: val })}
            onFixedHourlyChange={e => setFixedHourly(e.target.value)}
          />
        ) : (
          <DTRTable
            entries={entries}
            onUpdateEntry={updateEntry}
            onRemoveRow={removeRow}
            onAddRow={addRow}
            onLoadSample={loadSample}
            onClearAll={clearAllRows}
          />
        )}

        <DeductionsForm deductions={deductions} onChange={setDeductions} />

        <button className="btn-compute" onClick={compute} disabled={loading}>
          {loading ? 'Computing…' : 'Compute salary'}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </button>

        <Results result={result} empPosition={empPosition} onPrint={printPayslip} onDownload={downloadTxt} />

        <RateReference />
        <Footer onShowTerms={() => setShowTerms(true)} onHome={goHome} />
      </div>

      {showScrollBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--accent)', color: '#fff', border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity .2s'
          }}
          aria-label="Scroll to top">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" width="18" height="18">
            <path d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"/>
          </svg>
        </button>
      )}

      <PrintModal
        ref={printFrameRef}
        show={showPrintModal}
        printHtml={printHtml}
        onClose={() => setShowPrintModal(false)}
        onPrint={handlePrintFrame}
      />

      <TermsModal show={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  )
}

export default App
