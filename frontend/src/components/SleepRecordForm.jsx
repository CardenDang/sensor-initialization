import { useState } from 'react';
const numericFields=[['duration_hours','Duration (h)',0.1,24,0.1],['deep_hours','Deep sleep (h)',0,24,0.1],['rem_hours','REM (h)',0,24,0.1],['light_hours','Light sleep (h)',0,24,0.1],['awake_hours','Awake (h)',0,24,0.1],['heart_rate_avg','Average heart rate',20,250,1],['heart_rate_min','Minimum heart rate',20,250,1],['score','Sleep score',0,100,1]];
export default function SleepRecordForm({onSave,onCancel}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(event) {
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget));
    if(Number(values.heart_rate_min)>Number(values.heart_rate_avg)) {setError('Minimum heart rate cannot exceed average heart rate.');return;}
    setBusy(true);setError('');
    try {await onSave(values);} catch(err) {setError(err.message);} finally {setBusy(false);}
  }
  return <section className="sleep-entry"><h2>Add a sleep record</h2><form onSubmit={submit}><div className="sleep-fields"><label>Sleep date<input required type="date" name="sleep_date"/></label><label>Bedtime<input required type="time" name="bedtime"/></label><label>Wake time<input required type="time" name="wake_time"/></label>{numericFields.map(([name,label,min,max,step])=><label key={name}>{label}<input required type="number" name={name} min={min} max={max} step={step}/></label>)}</div>{error&&<p role="alert" className="account-error">{error}</p>}<div className="entry-actions"><button className="account-primary" disabled={busy}>{busy?'Saving…':'Save record'}</button><button type="button" className="account-nav" disabled={busy} onClick={onCancel}>Cancel</button></div></form></section>;
}
