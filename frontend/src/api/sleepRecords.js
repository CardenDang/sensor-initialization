import { supabase } from './supabase';
const fields='id,sleep_date,bedtime,wake_time,duration_hours,deep_hours,rem_hours,light_hours,awake_hours,heart_rate_avg,heart_rate_min,score';
export function sleepRow(record) {
  return [record.sleep_date,record.bedtime.slice(0,5),record.wake_time.slice(0,5),Number(record.duration_hours),Number(record.deep_hours),Number(record.rem_hours),Number(record.light_hours),Number(record.awake_hours),record.heart_rate_avg,record.heart_rate_min,record.score];
}
export async function listSleepRecords() {
  if(!supabase) throw new Error('Connect Supabase to load your records.');
  const {data,error}=await supabase.from('sleep_records').select(fields).order('sleep_date',{ascending:false});
  if(error) throw error;
  return data;
}
export async function addSleepRecord(values) {
  if(!supabase) throw new Error('Connect Supabase to save your records.');
  // Whitelist fields. Ownership comes from auth.uid() and is enforced by RLS.
  const record={sleep_date:values.sleep_date,bedtime:values.bedtime,wake_time:values.wake_time};
  for(const field of ['duration_hours','deep_hours','rem_hours','light_hours','awake_hours','heart_rate_avg','heart_rate_min','score']) record[field]=Number(values[field]);
  const {data,error}=await supabase.from('sleep_records').insert(record).select(fields).single();
  if(error) throw new Error(error.code==='23505'?'You already have a sleep record for this date.':error.message);
  return data;
}
