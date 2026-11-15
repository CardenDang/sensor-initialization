import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
export default function TopNav() {
  const [panel,setPanel] = useState(null);
  const { user, loading, logout } = useAuth();
  const [signingOut,setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    try { await logout(); } catch(error) { setPanel(error.message); }
    finally { setSigningOut(false); }
  }
  return <><header className="top-nav">
    <div className="top-links"><Link to="/data">Check Box</Link><Link to="/" className="monitoring">Monitoring</Link><button onClick={()=>setPanel('Support')}>Support</button><Link className="round-button" aria-label="Search sleep records" to="/data"><Search size={17}/></Link></div>
    <div className="top-controls">
      <span className="filter">DATE: <strong>Now</strong></span>
      <span className="filter product-filter">PRODUCT: <strong>All</strong></span>
      <span className="filter profile-filter">PROFILE: <strong>{user?.name.split(' ')[0] || 'Demo'}</strong></span>
      <button className="round-button" aria-label="Display settings" onClick={()=>setPanel('Display settings')}><SlidersHorizontal size={17}/></button>
      <div className="user-info"><strong>{user?.name || 'Guest preview'}</strong><span>{user ? 'Personal account' : 'Sample sleep data'}</span></div>
      {loading ? <span role="status">Loadingâ€¦</span> : user ? <><span className="avatar" aria-label={user.name}>{user.name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</span><button className="account-nav" onClick={signOut} disabled={signingOut}>{signingOut?'Signing outâ€¦':'Sign out'}</button></> : <><Link className="account-nav" to="/login">Sign in</Link><Link className="account-nav" to="/register">Create account</Link></>}
    </div>
  </header>{panel && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="panel-title" className="info-panel"><button autoFocus aria-label="Close" className="close-panel" onClick={()=>setPanel(null)}><X size={19}/></button><h2 id="panel-title">{panel}</h2><p>{panel==='Support'?'Explore your sleep overview, search and sort recorded sessions, or review model performance using the sidebar.':'Overview and ML charts use sample data. Sign in to view and save your personal sleep records on the Data page.'}</p><button onClick={()=>setPanel(null)}>Done</button></section></div>}</>;
}

