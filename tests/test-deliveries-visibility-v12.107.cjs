const assert = require('node:assert/strict');
function startOfWeek(d, weekStartDay=1){ const date=new Date(d); const diff=(date.getDay()-weekStartDay+7)%7; date.setDate(date.getDate()-diff); date.setHours(0,0,0,0); return date; }
function weekKey(d, weekStartDay=1){ const s=startOfWeek(d,weekStartDay); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-${String(s.getDate()).padStart(2,'0')}`; }
function parseDeliveryDate(value){
 if(!value) return null;
 if(value instanceof Date) return Number.isNaN(value.getTime())?null:new Date(value.getTime());
 const text=String(value); const m=text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(m){ const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])); return Number.isNaN(d.getTime())?null:d; }
 const d=new Date(text); return Number.isNaN(d.getTime())?null:d;
}
function visible(item, visibleKeys, currentKey, weekStartDay=1){
 if(!item||!item.fecha) return false;
 const itemWeekKey=weekKey(item.semana_asignada ? parseDeliveryDate(item.semana_asignada) : parseDeliveryDate(item.fecha),weekStartDay);
 if(!itemWeekKey||!visibleKeys.has(itemWeekKey)) return false;
 if(!item.entregado) return true;
 if(itemWeekKey!==currentKey) return false;
 const deliveredAt=parseDeliveryDate(item.entregado_en);
 return !!deliveredAt && weekKey(deliveredAt,weekStartDay)===currentKey;
}
const now=new Date(2026,9,24,12), current=weekKey(now), prev=new Date(now), older=new Date(now);
prev.setDate(prev.getDate()-7); older.setDate(older.getDate()-14);
const visibleKeys=new Set([current,weekKey(prev),weekKey(older)]);
const item=(id,fecha,entregado,entregado_en,semana_asignada=null)=>({id,fecha:fecha.toISOString(),entregado,entregado_en,semana_asignada});
const cases=[
 [item('pending-old',older,false,null),true,'pending from two weeks ago remains visible'],
 [item('delivered-current-week',now,true,now.toISOString()),true,'current-week sale marked delivered this week remains visible'],
 [item('delivered-previous-week',prev,true,prev.toISOString()),false,'delivery marked last week is hidden'],
 [item('old-delivered-reassigned-current',older,true,prev.toISOString(),current),false,'old delivered item reassigned to current week remains hidden'],
 [item('old-sale-marked-delivered-current-week',older,true,now.toISOString()),false,'old sale marked delivered this week stays hidden'],
 [item('current-sale-delivered-last-week',now,true,prev.toISOString()),false,'current sale with previous-week delivery timestamp is hidden'],
 [item('delivered-without-timestamp',now,true,null),false,'delivered record without timestamp is hidden']
];
for(const [record,expected,description] of cases) assert.equal(visible(record,visibleKeys,current),expected,description);
console.log('OK V12.108: pendientes dentro de 3 semanas; entregados visibles solo si la venta pertenece a la semana actual y entregado_en también cae en esa semana.');
