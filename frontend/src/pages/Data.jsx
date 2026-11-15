import { useState } from 'react';
import { Search, ArrowDownUp } from 'lucide-react';
import { sessions } from '@/lib/demoData';
const columns = ['Date','Bedtime','Wake Time','Duration (h)','Deep (h)','REM (h)','Light (h)','Awake (h)','HR Avg','HR Min','Score'];
export default function Data() {
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState({index:0,ascending:false});
  const rows = sessions.filter(row=>row[0].includes(query.trim())).sort((a,b)=>{
    const result = typeof a[sort.index]==='number' ? a[sort.index]-b[sort.index] : String(a[sort.index]).localeCompare(String(b[sort.index]));
    return sort.ascending ? result : -result;
  });
  return <div className="page"><div className="page-heading data-heading"><div><h1>Raw Sleep Data</h1><p>{rows.length} recorded sessions · sortable &amp; searchable</p></div><label className="table-search"><Search size={17}/><input aria-label="Search date" placeholder="Search date..." value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <div className="table-wrap"><table><thead><tr>{columns.map((col,index)=><th key={col} aria-sort={sort.index===index?(sort.ascending?'ascending':'descending'):'none'}><button onClick={()=>setSort({index,ascending:sort.index===index?!sort.ascending:true})}>{col}<ArrowDownUp size={11}/></button></th>)}</tr></thead><tbody>{rows.map(row=><tr key={row[0]}>{row.map((value,index)=><td key={index} className={index===10?(value>=85?'score-good':value>=75?'score-fair':'score-low'):''}>{value}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="empty-state">No sessions match this date.</p>}</div>
    <p className="demo-note">Sample data · local preview</p>
  </div>;
}
