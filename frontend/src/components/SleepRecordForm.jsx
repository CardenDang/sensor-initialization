import { useState } from 'react';
const numericFields=[['air_quality','Air quality (raw ADC)',0],['lux','Light (lux)',0],['temperature_c','Temperature (°C)',undefined],['humidity_pct','Humidity (%)',0,100],['sound_level','Sound level (raw)',0]];
export default function SleepRecordForm({onSave,onCancel}) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(event) {
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);setError('');
    try {await onSave(values);} catch(err) {setError(err.message);} finally {setBusy(false);}
  }
  return <section className="sleep-entry"><h2>Add a sensor reading</h2><p className="demo-note">Timestamp uses your local time. Leave a sensor blank if its reading is unavailable.</p><form onSubmit={submit}><div className="sleep-fields"><label>Timestamp<input required type="datetime-local" step="1" name="timestamp"/></label>{numericFields.map(([name,label,min,max])=><label key={name}>{label}<input type="number" name={name} min={min} max={max} step="any"/></label>)}</div>{error&&<p role="alert" className="account-error">{error}</p>}<div className="entry-actions"><button className="account-primary" disabled={busy}>{busy?'Saving…':'Save reading'}</button><button type="button" className="account-nav" disabled={busy} onClick={onCancel}>Cancel</button></div></form></section>;
}
