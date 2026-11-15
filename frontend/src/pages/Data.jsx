import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowDownUp } from 'lucide-react';
import { sensorReadings } from '@/lib/sensorDemoData';
import { useAuth } from '@/hooks/use-auth';
import { listSleepRecords, addSleepRecord, sleepRow } from '@/api/sleepRecords';
import SleepRecordForm from '@/components/SleepRecordForm';
const columns=['Timestamp','Air quality','Lux','Temperature (°C)','Humidity (%)','Sound level'];
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
    let timer;
    setLoading(true);setError('');
    async function refresh() {
      try {const data=await listSleepRecords();if(active) {setRecords(data);setError('');}}
      catch(err) {if(active) setError(err.message);}
      finally {if(active) {setLoading(false);timer=setTimeout(refresh,5000);}}
    }
    refresh();
    return ()=>{active=false;clearTimeout(timer);};
  },[user,reload]);
  async function save(values) {
    const record=await addSleepRecord(values);
    setRecords(current=>[record,...current]);setAdding(false);setNotice('Sensor reading saved to your account.');
  }
  const rows=(user?records:sensorReadings).map(record=>({id:record.id,values:sleepRow(record)})).filter(row=>row.values[0].includes(query.trim())).sort((a,b)=>{
    const result=sort.index===0?Date.parse(a.values[0])-Date.parse(b.values[0]):typeof a.values[sort.index]==='number'&&typeof b.values[sort.index]==='number'?a.values[sort.index]-b.values[sort.index]:String(a.values[sort.index]).localeCompare(String(b.values[sort.index]));
    return sort.ascending?result:-result;
  });
  return <div className="page"><div className="page-heading data-heading"><div><h1>Raw Sensor Data</h1><p>{user?'Your personal sensor readings':'Guest preview · sample data'} · {rows.length} readings</p></div><div className="data-actions"><label className="table-search"><Search size={17}/><input aria-label="Search timestamp" placeholder="Search timestamp..." value={query} onChange={e=>setQuery(e.target.value)}/></label>{user?<button className="account-nav" disabled={loading||Boolean(error)} onClick={()=>{setAdding(true);setNotice('');}}>Add record</button>:<Link className="account-nav" to="/login">Sign in to save records</Link>}</div></div>
    {adding&&<SleepRecordForm onSave={save} onCancel={()=>setAdding(false)}/>}
    {notice&&<p className="account-notice" role="status">{notice}</p>}
    {loading?<p role="status" className="empty-state">Loading your sensor readings…</p>:error?<div role="alert" className="empty-state account-error">Unable to load records: {error}<p>Check that the Supabase migration has been applied.</p><button className="account-nav" onClick={()=>setReload(value=>value+1)}>Retry</button></div>:<div className="table-wrap"><table><thead><tr>{columns.map((col,index)=><th key={col} aria-sort={sort.index===index?(sort.ascending?'ascending':'descending'):'none'}><button onClick={()=>setSort({index,ascending:sort.index===index?!sort.ascending:true})}>{col}<ArrowDownUp size={11}/></button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{row.values.map((value,index)=><td key={index}>{value}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="empty-state">{query?'No readings match this date.':'No sensor readings yet. Add your first record above.'}</p>}</div>}
    <p className="demo-note">{user?'Latest 500 private readings · refreshes every 5 seconds':'Sample data · sign in to view your own records'}</p>
  </div>;
}

