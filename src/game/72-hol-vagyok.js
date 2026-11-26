/* ---------- hol vagyok ---------- */
let placeT=0,placeAt=null,district='';
async function updPlace(dt){placeT-=dt;if(placeT>0||!car.spawned)return;const [la,lo]=toLL(car.x,car.z);
 if(placeAt&&Math.hypot(placeAt[0]-car.x,placeAt[1]-car.z)<350){placeT=5;return;}placeT=15;placeAt=[car.x,car.z];
 try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&accept-language=hu&lat='+la.toFixed(5)+'&lon='+lo.toFixed(5));const j=await r.json(),a=j.address||{};
  district=[a.city_district||a.suburb||a.quarter||a.village||a.town,a.city||a.town||a.village||a.county].filter((v,i,s)=>v&&s.indexOf(v)===i).join(', ');}catch(e){}}
let whereTxt='';function setWhere(street){const t=street+'|'+district;if(t===whereTxt)return;whereTxt=t;const el=$('where');el.textContent='';if(!street&&!district)return;
 el.append(street||district);if(street&&district){const s=document.createElement('small');s.textContent=district;el.appendChild(s);}}
