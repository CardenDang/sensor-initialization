// Sample data for the local preview, matching the supplied reference.
export const sessions = [
  ['2026-09-07','23:12','06:48',7.6,1.5,1.9,4.1,0.3,55,50,85],
  ['2026-09-06','00:05','08:10',8.1,1.9,2.2,4.5,0.2,53,49,92],
  ['2026-09-05','23:40','06:30',6.8,1.2,1.7,3.9,0.5,57,52,79],
  ['2026-09-04','22:55','06:35',7.7,1.7,2,4.2,0.3,54,50,88],
  ['2026-09-03','00:30','07:05',6.6,0.9,1.3,3.5,0.7,59,53,68],
  ['2026-09-02','23:20','06:40',7.3,1.4,1.8,4,0.2,55,51,81],
  ['2026-09-01','23:05','06:25',7.3,1.1,1.6,3.8,0.4,56,51,74],
  ['2026-08-31','23:50','07:15',7.4,1.5,1.9,4,0.3,54,50,83],
  ['2026-08-30','00:15','07:50',7.6,1.6,2,4.1,0.3,55,50,86],
  ['2026-08-29','23:30','06:20',6.8,1,1.5,3.6,0.6,58,52,71],
];
export const nightly = [...sessions.slice(0,7)].reverse().map((s,i) => ({day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],score:s[10],deep:s[4],rem:s[5],light:s[6],awake:s[7]}));
export const heartRate = [58,60,54,55,56,52,50,51,52,53,54,55,58,60,62,64].map((bpm,i)=>({hour:i*7/15,bpm}));
export const modelMetrics = {accuracy:0.914,f1:0.896,r2:0.873,rmse:4.21,precision:0.912,recall:0.881,trainingSamples:12480,validationSamples:3120,lastTrained:'2026-09-06 14:32'};
export const predictionsVsActual = [...sessions.slice(0,7)].reverse().map((s,i)=>({date:s[0].slice(5),actual:s[10],predicted:s[10]+[-1,-1,2,-1,2,-2,-1][i]}));
export const featureImportance = ['Deep Sleep Duration','Sleep Efficiency','REM Duration','Heart Rate Variability','Bedtime Consistency','Awake Count','Room Temperature','Caffeine Intake'].map((feature,i)=>({feature,importance:[0.92,0.85,0.78,0.71,0.64,0.52,0.38,0.31][i]}));
export const qualityClassification = [{label:'Good',count:64,color:'#baff43'},{label:'Fair',count:27,color:'#818cf8'},{label:'Poor',count:9,color:'#ff9a33'}];
export const trainingLoss = Array.from({length:30},(_,i)=>({epoch:i+1,loss:0.82*Math.exp(-i/8)+0.06,valLoss:0.86*Math.exp(-i/9)+0.09}));
