export const sensorFields=['air_quality','lux','temperature_c','humidity_pct','sound_level'];
export function sensorPayload(values) {
  const date=new Date(values.timestamp);
  if(!values.timestamp || Number.isNaN(date.getTime())) throw new Error('Enter a valid timestamp.');
  const record={timestamp:date.toISOString()};
  for(const field of sensorFields) {
    const raw=values[field];
    if(raw===undefined || raw===null || String(raw).trim()==='') {record[field]=null;continue;}
    const value=Number(raw);
    if(!Number.isFinite(value)) throw new Error(`Enter a valid number for ${field}.`);
    if(field!=='temperature_c' && value<0) throw new Error(`${field} cannot be negative.`);
    if(field==='humidity_pct' && value>100) throw new Error('Humidity must be between 0 and 100.');
    record[field]=value;
  }
  return record;
}
export function sensorRow(record) {
  return [record.timestamp,...sensorFields.map(field=>record[field]===null || record[field]===undefined?'—':Number(record[field]))];
}
