import { useState } from 'react'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
import './App.css'

const DAY_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'rest_day', label: 'Rest Day' },
  { value: 'special', label: 'Special Holiday' },
  { value: 'special_rest', label: 'Special on Rest' },
  { value: 'legal', label: 'Legal Holiday' },
  { value: 'legal_rest', label: 'Legal on Rest' },
  { value: 'absent', label: 'Absent' },
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

  const showToast = (msg) => {
    Toastify({
      text: msg,
      duration: 2500,
      gravity: 'top',
      position: 'right',
      style: { background: '#1a1a2e', borderRadius: '8px' }
    }).showToast()
  }

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
    if (entries.length > 0 && !window.confirm('Replace all entries?')) return
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
    setLoading(true)
    try {
      const payload = {
        rateMode,
        monthlySalary: rateMode === 'monthly' ? monthlySalary : undefined,
        fixedHourly: rateMode === 'hourly' ? fixedHourly : undefined,
        stHours: rateMode === 'straight' ? stHours : undefined,
        stPay: rateMode === 'straight' ? stPay : undefined,
        dtrEntries: entries.map(e => ({
          date: e.date,
          type: e.type,
          reg: parseFloat(e.reg) || 0,
          ot: parseFloat(e.ot) || 0,
          status: e.status
        })),
        period,
        empName: empName || 'Employee',
        sss: parseFloat(deductions.sss) || 0,
        philhealth: parseFloat(deductions.philhealth) || 0,
        pagibig: parseFloat(deductions.pagibig) || 0,
        tax: parseFloat(deductions.tax) || 0,
        otherDeductions: parseFloat(deductions.other) || 0,
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
    fetch('/api/print-payslip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    })
    .then(r => r.text())
    .then(html => {
      const pw = window.open('', '_blank')
      pw.document.write(html)
      pw.document.close()
    })
    .catch(e => showToast('⚠ Error: ' + e.message))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>PaySlip PH</h1>
        <p>Philippine Payroll System</p>
      </header>

      <div className="container">
        {/* Rate Section */}
        <div className="card">
          <h2>Salary Rate</h2>
          <div className="pills">
            {['monthly', 'hourly', 'straight'].map(m => (
              <button key={m} className={rateMode === m ? 'pill active' : 'pill'} onClick={() => setRateMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          {rateMode === 'monthly' && <input type="number" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="Monthly Salary" />}
          {rateMode === 'hourly' && <input type="number" value={fixedHourly} onChange={e => setFixedHourly(e.target.value)} placeholder="Hourly Rate" />}
          {rateMode === 'straight' && (
            <div>
              <input type="number" value={stHours} onChange={e => setStHours(e.target.value)} placeholder="Hours" />
              <input type="number" value={stPay} onChange={e => setStPay(e.target.value)} placeholder="Pay" />
            </div>
          )}
        </div>

        {/* DTR Entries */}
        <div className="card">
          <h2>DTR Entries</h2>
          <table className="dtr-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reg Hrs</th>
                <th>OT Hrs</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx}>
                  <td><input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} /></td>
                  <td>
                    <select value={entry.type} onChange={e => updateEntry(idx, 'type', e.target.value)}>
                      {DAY_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={entry.reg} onChange={e => updateEntry(idx, 'reg', e.target.value)} min="0" max="24" step="0.5" /></td>
                  <td><input type="number" value={entry.ot} onChange={e => updateEntry(idx, 'ot', e.target.value)} min="0" max="24" step="0.5" /></td>
                  <td>
                    <select value={entry.status} onChange={e => updateEntry(idx, 'status', e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '—'}</option>)}
                    </select>
                  </td>
                  <td><button className="btn-del" onClick={() => removeRow(idx)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="btn-row">
            <button className="btn-add" onClick={() => addRow()}>＋ Add row</button>
            <button className="btn-add" onClick={loadSample}>Load sample</button>
            <button className="btn-add btn-clear" onClick={clearAllRows}>Clear all</button>
          </div>
        </div>

        {/* Deductions */}
        <div className="card">
          <h2>Deductions</h2>
          <input type="number" placeholder="SSS" value={deductions.sss} onChange={e => setDeductions({...deductions, sss: e.target.value})} />
          <input type="number" placeholder="PhilHealth" value={deductions.philhealth} onChange={e => setDeductions({...deductions, philhealth: e.target.value})} />
          <input type="number" placeholder="Pag-IBIG" value={deductions.pagibig} onChange={e => setDeductions({...deductions, pagibig: e.target.value})} />
          <input type="number" placeholder="Withholding Tax" value={deductions.tax} onChange={e => setDeductions({...deductions, tax: e.target.value})} />
          <input type="number" placeholder="Other" value={deductions.other} onChange={e => setDeductions({...deductions, other: e.target.value})} />
        </div>

        {/* Employee & Period */}
        <div className="card">
          <input type="text" placeholder="Employee Name" value={empName} onChange={e => setEmpName(e.target.value)} />
          <div className="pills">
            {['1-15', '16-30'].map(p => (
              <button key={p} className={period === p ? 'pill active' : 'pill'} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* Compute Button */}
        <button className="btn-compute" onClick={compute} disabled={loading}>
          {loading ? 'Computing…' : 'Compute Salary'}
        </button>

        {/* Results */}
        {result && (
          <div className="card results">
            <h2>Results</h2>
            <div className="metrics">
              <div><span>Work Days</span>{result.workDays}</div>
              <div><span>Reg Hrs</span>{result.totalRegHrs.toFixed(2)}</div>
              <div><span>OT Hrs</span>{result.totalOTHrs.toFixed(2)}</div>
              <div><span>Hourly Rate</span>₱{result.hourlyRate.toFixed(2)}</div>
              <div><span>Gross Pay</span>₱{result.grossPay.toFixed(2)}</div>
              <div><span>Net Pay</span>₱{result.netPay.toFixed(2)}</div>
            </div>
            <div className="btn-row">
              <button className="btn-print" onClick={printPayslip}>🖨 Print payslip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
