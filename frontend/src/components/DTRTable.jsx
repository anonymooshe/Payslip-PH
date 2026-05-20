import { DAY_TYPES, STATUS_OPTIONS } from '../utils/constants'

export default function DTRTable({ entries, onUpdateEntry, onRemoveRow, onAddRow, onLoadSample, onClearAll }) {
  return (
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
                <td><input type="date" value={entry.date} onChange={e => onUpdateEntry(idx, 'date', e.target.value)} style={{minWidth:'140px'}}/></td>
                <td>
                  <select value={entry.type} onChange={e => onUpdateEntry(idx, 'type', e.target.value)} style={{minWidth:'170px'}}>
                    {DAY_TYPES.map(dt => <option key={dt.v} value={dt.v}>{dt.l}</option>)}
                  </select>
                </td>
                <td className="num"><input type="number" value={entry.reg} onChange={e => onUpdateEntry(idx, 'reg', e.target.value)} min="0" max="24" step="0.5"/></td>
                <td className="num"><input type="number" value={entry.ot} onChange={e => onUpdateEntry(idx, 'ot', e.target.value)} min="0" max="24" step="0.5"/></td>
                <td>
                  <select value={entry.status} onChange={e => onUpdateEntry(idx, 'status', e.target.value)} style={{minWidth:'88px'}}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '— normal —'}</option>)}
                  </select>
                </td>
                <td><button className="btn-del" onClick={() => onRemoveRow(idx)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="btn-row">
        <button className="btn-add-row" onClick={onAddRow}>＋ Add row</button>
        <button className="btn-add-row" onClick={onLoadSample}>Load sample</button>
        <button className="btn-add-row" style={{marginLeft:'8px',background:'var(--red-bg)',borderColor:'var(--red)',color:'var(--red)'}} onClick={onClearAll}>Clear all</button>
      </div>
    </div>
  )
}
