export default function RateReference() {
  return (
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
  )
}
