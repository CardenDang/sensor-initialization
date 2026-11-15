import test from 'node:test';
import assert from 'node:assert/strict';
import { sensorPayload, sensorRow } from '../src/utils/sensorRecords.js';
test('sensor payload preserves zero and negative temperature, excludes ownership and old fields',()=>{
  assert.deepEqual(sensorPayload({timestamp:'2026-11-15T21:00:00Z',air_quality:'0',lux:'1.25',temperature_c:'-2.5',humidity_pct:'100',sound_level:'25',user_id:'other',score:90}),{timestamp:'2026-11-15T21:00:00.000Z',air_quality:0,lux:1.25,temperature_c:-2.5,humidity_pct:100,sound_level:25});
});
test('missing sensor readings stay null rather than becoming zero',()=>{
  const record=sensorPayload({timestamp:'2026-11-15T21:00:00Z',lux:'',air_quality:' '});
  assert.equal(record.lux,null);assert.equal(record.air_quality,null);
  assert.deepEqual(sensorRow(record),['2026-11-15T21:00:00.000Z','—','—','—','—','—']);
});
test('invalid timestamps, humidity, and numeric values are rejected',()=>{
  for(const values of [{timestamp:''},{timestamp:'invalid'},{timestamp:'2026-11-15',humidity_pct:101},{timestamp:'2026-11-15',lux:-1},{timestamp:'2026-11-15',sound_level:'NaN'},{timestamp:'2026-11-15',air_quality:'Infinity'}]) assert.throws(()=>sensorPayload(values));
});
