import { supabase } from './supabase';
import { sensorPayload, sensorRow } from '../utils/sensorRecords';
const fields='id,timestamp,air_quality,lux,temperature_c,humidity_pct,sound_level';
export const sleepRow=sensorRow;
export async function listSleepRecords() {
  if(!supabase) throw new Error('Connect Supabase to load your records.');
  const {data,error}=await supabase.from('sleep_records').select(fields).order('timestamp',{ascending:false}).limit(500);
  if(error) throw error;
  return data;
}
export async function addSleepRecord(values) {
  if(!supabase) throw new Error('Connect Supabase to save your records.');
  // Ownership is assigned by auth.uid() and independently enforced by RLS.
  const {data,error}=await supabase.from('sleep_records').insert(sensorPayload(values)).select(fields).single();
  if(error) throw error;
  return data;
}
