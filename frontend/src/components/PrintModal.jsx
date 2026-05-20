import { forwardRef } from 'react'

const PrintModal = forwardRef(({ show, printHtml, onClose, onPrint }, ref) => {
  if (!show) return null
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="print-modal" onClick={e => e.stopPropagation()}>
        <div className="print-modal-hdr">
          <h3>Payslip</h3>
          <div style={{display:'flex',gap:'8px'}}>
            <button className="btn-action btn-print" onClick={onPrint}>🖨 Print</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="print-modal-body">
          <iframe ref={ref} srcDoc={printHtml} title="Payslip" />
        </div>
      </div>
    </div>
  )
})

export default PrintModal
