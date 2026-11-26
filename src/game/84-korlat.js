/* ---------- sebességkorlát, közeli nevezetesség ---------- */
let curLimit=0,markT=0;
function hudLimit(){const ri=car.spawned?roadInfo(car.x,car.z):null,sp=ri&&ri.d<3?ri.spd:0;if(sp)curLimit=Math.round(sp);else if(!ri||ri.d>8)curLimit=0;
 const el=$('limit');el.classList.toggle('hide',!curLimit||!CFG.limit);if(curLimit)el.textContent=curLimit;$('speed').classList.toggle('over',!!curLimit&&Math.abs(car.vF)*3.6>curLimit*1.1);
 markT-=.16;if(markT>0)return;markT=1;let best=null,bd=160;for(const ch of chunks.values()){if(!ch.marks)continue;for(const mk of ch.marks){const d=Math.hypot(mk[0]-car.x,mk[1]-car.z);if(d<bd){bd=d;best=mk;}}}
 const me=$('mark');me.classList.toggle('hide',!best||!CFG.marks);if(best)me.textContent=(best[3]==='templom'?'⛪ ':'★ ')+best[2]+' · '+Math.round(bd/10)*10+' m';}
