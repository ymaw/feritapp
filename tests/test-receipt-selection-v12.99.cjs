const assert = require('node:assert/strict');
function startOfWeek(d, weekStartDay=1){ const date=new Date(d); const diff=(date.getDay()-weekStartDay+7)%7; date.setDate(date.getDate()-diff); date.setHours(0,0,0,0); return date; }
function weekKey(d){ const s=startOfWeek(d); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`; }
function previousWeekKey(ref){ const d=startOfWeek(ref); d.setDate(d.getDate()-7); return weekKey(d); }
function selectReceipt(sales, client, now){ const current=weekKey(now), previous=previousWeekKey(now); return sales.filter(item => (item.cliente||'').trim()===client.trim() && item.fecha && (weekKey(new Date(item.fecha))===current || weekKey(new Date(item.fecha))===previous)).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)); }
const now=new Date(2026,9,23,12); // Friday, Oct 23 2026 local
const current=weekKey(now), previous=previousWeekKey(now); const older=new Date(now); older.setDate(older.getDate()-15);
const data=[
 {id:'current',cliente:'Cliente A',fecha:now.toISOString(),semana_asignada:'1999-01-01',precio:100,pagado:true},
 {id:'previous',cliente:'Cliente A',fecha:(()=>{const d=new Date(now);d.setDate(d.getDate()-7);return d.toISOString()})(),semana_asignada:current,precio:200,pagado:false},
 {id:'old',cliente:'Cliente A',fecha:older.toISOString(),semana_asignada:current,precio:300,pagado:true},
 {id:'other',cliente:'Cliente B',fecha:now.toISOString(),precio:400,pagado:false},
];
const selected=selectReceipt(data,'Cliente A',now);
assert.deepEqual(selected.map(x=>x.id),['previous','current']);
assert.equal(selected.reduce((sum,x)=>sum+x.precio,0),300);
assert.equal(selected.some(x=>x.id==='old'),false);
assert.equal(selected.some(x=>x.id==='other'),false);
assert.equal(current,'2026-10-19'); assert.equal(previous,'2026-10-12');
console.log('OK V12.99: semana actual + anterior; excluye históricos y otros clientes; semana_asignada no afecta comprobante.');
