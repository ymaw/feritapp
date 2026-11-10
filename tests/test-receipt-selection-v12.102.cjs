const assert = require('node:assert/strict');
function startOfWeek(d, weekStartDay=1){ const date=new Date(d); const diff=(date.getDay()-weekStartDay+7)%7; date.setDate(date.getDate()-diff); date.setHours(0,0,0,0); return date; }
function weekKey(d){ const s=startOfWeek(d); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`; }
function previousWeekKey(ref){ const d=startOfWeek(ref); d.setDate(d.getDate()-7); return weekKey(d); }
function selectReceipt(sales, client, now){
 const current=weekKey(now), previous=previousWeekKey(now);
 const clientSales=sales.filter(x=>(x.cliente||'').trim().toLocaleLowerCase('es')===client.trim().toLocaleLowerCase('es'));
 const isPaid=x=>x.pagado===true||x.pagado===1||['true','1','t','yes','si','sí'].includes(String(x.pagado==null?'':x.pagado).trim().toLowerCase());
 const inWeek=(x,key)=>x.fecha&&weekKey(new Date(x.fecha))===key;
 return clientSales.filter(x=>inWeek(x,current)||(inWeek(x,previous)&&!isPaid(x))).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
}
const now=new Date(2026,9,23,12); // Friday 23 October 2026
const current=new Date(now); current.setDate(current.getDate()-1);
const previous=new Date(now); previous.setDate(previous.getDate()-7);
const older=new Date(now); older.setDate(older.getDate()-21);
// Reproduces the reported class of failure: $48,000 historical/paid, $7,800 this week.
const data=[
 {id:'current',cliente:'Cliente A',fecha:current.toISOString(),precio:7800,pagado:false},
 {id:'previous-paid',cliente:'Cliente A',fecha:previous.toISOString(),precio:40200,pagado:true},
 {id:'older-paid',cliente:'Cliente A',fecha:older.toISOString(),precio:10000,pagado:true},
 {id:'other-client',cliente:'Cliente B',fecha:current.toISOString(),precio:5000,pagado:false}
];
let selected=selectReceipt(data,'Cliente A',now);
assert.deepEqual(selected.map(x=>x.id),['current']);
assert.equal(selected.reduce((sum,x)=>sum+x.precio,0),7800);
// An actually unpaid item from the previous week is carried over, but a paid one is not.
data.push({id:'previous-unpaid',cliente:'Cliente A',fecha:previous.toISOString(),precio:2500,pagado:false});
selected=selectReceipt(data,'Cliente A',now);
assert.deepEqual(selected.map(x=>x.id),['previous-unpaid','current']);
assert.equal(selected.reduce((sum,x)=>sum+x.precio,0),10300);
assert.equal(selected.some(x=>x.id==='older-paid'),false);
assert.equal(selected.some(x=>x.id==='other-client'),false);
console.log('OK V12.102: ventas actuales + solo ventas impagas de la semana anterior; excluye previas pagadas, antiguas y otros clientes.');
