import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowDownUp } from 'lucide-react';
import { sessions } from '@/lib/demoData';
import { useAuth } from '@/hooks/use-auth';
import { listSleepRecords, addSleepRecord, sleepRow } from '@/api/sleepRecords';
import SleepRecordForm from '@/components/SleepRecordForm';
const columns=['Date','Bedtime','Wake Time','Duration (h)','Deep (h)','REM (h)','Light (h)','Awake (h)','HR Avg','HR Min','Score'];
export default function Data() {
  const {user,loading}=useAuth();
  if(loading) return <div className="page" role="status">Checking your account…</div>;
  return <SleepData key={user?.id || 'guest'} user={user}/>;
}
function SleepData({user}) {
  const [records,setRecords]=useState([]);
  const [loading,setLoading]=useState(Boolean(user));
  const [error,setError]=useState('');
  const [adding,setAdding]=useState(false);
  const [notice,setNotice]=useState('');
  const [reload,setReload]=useState(0);
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState({index:0,ascending:false});
  useEffect(()=>{
    if(!user) return;
    let active=true;
    setLoading(true);setError('');
    listSleepRecords().then(data=>{if(active) setRecords(data);}).catch(err=>{if(active) setError(err.message);}).finally(()=>{if(active) setLoading(false);});
    return ()=>{active=false;};
  },[user,reload]);
  async function save(values) {
    const record=await addSleepRecord(values);
    setRecords(current=>[record,...current]);setAdding(false);setNotice('Sleep record saved to your account.');
  }
  const rows=(user?records.map(sleepRow):sessions).filter(row=>row[0].includes(query.trim())).sort((a,b)=>{
    const result=typeof a[sort.index]==='number'?a[sort.index]-b[sort.index]:String(a[sort.index]).localeCompare(String(b[sort.index]));
    return sort.ascending?result:-result;
  });
  return <div className="page"><div className="page-heading data-heading"><div><h1>Raw Sleep Data</h1><p>{user?'Your personal sleep records':'Guest preview · sample data'} · {rows.length} sessions</p></div><div className="data-actions"><label className="table-search"><Search size={17}/><input aria-label="Search date" placeholder="Search date..." value={query} onChange={e=>setQuery(e.target.value)}/></label>{user?<button className="account-nav" disabled={loading||Boolean(error)} onClick={()=>{setAdding(true);setNotice('');}}>Add record</button>:<Link className="account-nav" to="/login">Sign in to save records</Link>}</div></div>
    {adding&&<SleepRecordForm onSave={save} onCancel={()=>setAdding(false)}/>}
    {notice&&<p className="account-notice" role="status">{notice}</p>}
    {loading?<p role="status" className="empty-state">Loading your sleep records…</p>:error?<div role="alert" className="empty-state account-error">Unable to load records: {error}<p>Check that the Supabase migration has been applied.</p><button className="account-nav" onClick={()=>setReload(value=>value+1)}>Retry</button></div>:<div className="table-wrap"><table><thead><tr>{columns.map((col,index)=><th key={col} aria-sort={sort.index===index?(sort.ascending?'ascending':'descending'):'none'}><button onClick={()=>setSort({index,ascending:sort.index===index?!sort.ascending:true})}>{col}<ArrowDownUp size={11}/></button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row[0]}>{row.map((value,index)=><td key={index} className={index===10?(value>=85?'score-good':value>=75?'score-fair':'score-low'):''}>{value}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="empty-state">{query?'No sessions match this date.':'No sleep records yet. Add your first record above.'}</p>}</div>}
    <p className="demo-note">{user?'Private records · stored in Supabase':'Sample data · sign in to view your own records'}</p>
  </div>;
}
