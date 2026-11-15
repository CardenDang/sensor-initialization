import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
export default function TopNav() {
  const [panel,setPanel] = useState(null);
  return <><header className="top-nav">
    <div className="top-links"><Link to="/data">Check Box</Link><Link to="/" className="monitoring">Monitoring</Link><button onClick={()=>setPanel('Support')}>Support</button><Link className="round-button" aria-label="Search sleep records" to="/data"><Search size={17}/></Link></div>
    <div className="top-controls">
      <span className="filter">DATE: <strong>Now</strong></span>
      <span className="filter product-filter">PRODUCT: <strong>All</strong></span>
      <span className="filter profile-filter">PROFILE: <strong>Bogdan</strong></span>
      <button className="round-button" aria-label="Display settings" onClick={()=>setPanel('Display settings')}><SlidersHorizontal size={17}/></button>
      <div className="user-info"><strong>Bogdan Nikitin</strong><span>Sleep Analyst</span></div><span className="avatar">BN<i/></span>
    </div>
  </header>{panel && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="panel-title" className="info-panel"><button autoFocus aria-label="Close" className="close-panel" onClick={()=>setPanel(null)}><X size={19}/></button><h2 id="panel-title">{panel}</h2><p>{panel==='Support'?'Explore your sleep overview, search and sort recorded sessions, or review model performance using the sidebar.':'This preview uses sample data and the dark appearance from your reference. Live sensor and account connections are not configured.'}</p><button onClick={()=>setPanel(null)}>Done</button></section></div>}</>;
}
