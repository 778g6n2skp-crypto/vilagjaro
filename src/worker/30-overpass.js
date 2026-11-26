/* ---------- részletes OSM-réteg (Overpass) – háttérben, gyorsítótárazva ---------- */
const OPS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];let opi=0,opActive=0;
const dCache=new Map();
function detailOf(tx,ty){const k=tx+','+ty;let p=dCache.get(k);if(p)return p;
 p=(async()=>{const key='d3:'+k,c=await idbGet(key);if(c){try{return JSON.parse(c);}catch(e){}}
  const bb=[fy2lat(ty+1),fx2lon(tx),fy2lat(ty),fx2lon(tx+1)].map(v=>v.toFixed(6)).join(',');
  const q='[out:json][timeout:90][bbox:'+bb+'];(way["building"]["roof:shape"];way["building"]["building:colour"];way["building"]["roof:colour"];way["building"]["building:material"];way["building:part"];way["building"~"^(church|cathedral|chapel|basilica|mosque|synagogue|temple|shrine)$"];way["amenity"="place_of_worship"]["building"];way["building"]["name"];way["building"]["wikidata"];way["man_made"="tower"];way["historic"~"^(castle|fort|palace)$"];way["building"~"^(palace|government|civic|train_station|castle|fortress|tower|public|museum)$"];way["amenity"~"^(townhall|theatre)$"];relation["type"="multipolygon"]["building"];relation["type"="multipolygon"]["building:part"];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"];way["footway"="sidewalk"];node["natural"="tree"];way["natural"="tree_row"];node["highway"="traffic_signals"];);out tags geom qt;';
  for(let a=0;a<6;a++){while(opActive>=2)await sleep(300);opActive++;const url=OPS[opi++%OPS.length];
   try{const r=await fetch(url,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(!r.ok)throw new Error('HTTP '+r.status);
    const txt=await r.text(),js=JSON.parse(txt);if(js.remark&&/runtime error|timed out|rate_limited/i.test(js.remark))throw new Error('foglalt');idbPut(key,txt);return js;}
   catch(e){}finally{opActive--;}await sleep(Math.min(12000,1500*2**a));}
  return null;})();
 dCache.set(k,p);if(dCache.size>60)dCache.delete(dCache.keys().next().value);return p;}
const num=v=>{const f=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(f)?f:null;};
const CN={white:'#f4f2ee',black:'#3a3a40',grey:'#a9a9b0',gray:'#a9a9b0',silver:'#c8c8cc',red:'#c8553d',darkred:'#8e3b2e',brown:'#8a5a3c',tan:'#d2b48c',beige:'#e8dcc0',yellow:'#f2d16b',orange:'#e8915a',green:'#6f9f5a',darkgreen:'#3f6f45',blue:'#6f93c8',lightblue:'#a9cbe8',pink:'#eab0bf',purple:'#9b7fc0',cream:'#f3e7c9',maroon:'#7b3b3b',olive:'#8f8f4f',teal:'#4f9f9f',gold:'#d9b44a',ochre:'#d59b47',lightgrey:'#cfcfd4',lightgray:'#cfcfd4',darkgrey:'#6f6f78',darkgray:'#6f6f78',ivory:'#f6f0dc',khaki:'#cdbf86',salmon:'#ee9a84',coral:'#ee8070',turquoise:'#5fc7c0',navy:'#3a4a7a',lime:'#a7d36b',bronze:'#9c7444',copper:'#5fa58e'};
const MATC={brick:'#b86a4f',stone:'#cfc4ad',sandstone:'#dcc79a',limestone:'#e6ddc6',glass:'#8fb3cf',metal:'#9aa3ad',steel:'#9aa3ad',concrete:'#c9c6c0',wood:'#a7774f',copper:'#5fa58e',slate:'#5a6470',roof_tiles:'#b5563e',tiles:'#b5563e',tile:'#b5563e',tar_paper:'#55555c',zinc:'#a3a9b0',eternit:'#9b9ea3'};
function colOf(v,mat){v=String(v||'').toLowerCase().trim();if(/^#?[0-9a-f]{6}$/.test(v))return hx(v[0]==='#'?v:'#'+v);
 if(/^#[0-9a-f]{3}$/.test(v))return hx('#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3]);if(CN[v])return hx(CN[v]);mat=String(mat||'').toLowerCase();return MATC[mat]?hx(MATC[mat]):null;}
const lanesOf=t=>{const l=parseInt(t.lanes);return l>0&&l<12?l:0;};
const spdOf=t=>{const v=String(t.maxspeed||'');if(!v||/none|signals|walk/.test(v))return 0;const m=v.match(/\d+/);if(m){let x=+m[0];if(/mph/.test(v))x*=1.609;return x;}
 return({'HU:urban':50,'HU:rural':90,'HU:motorway':130,'HU:trunk':110,'HU:living_street':20,'DE:urban':50,'DE:rural':100,'AT:urban':50,'AT:rural':100,'SK:urban':50,'RO:urban':50,'FR:urban':50,'IT:urban':50,'GB:nsl_single':96})[v]||0;};
function sideOf(t){const yes=v=>v==='yes'||v==='both'||v==='left'||v==='right';let v=t.sidewalk;const b=t['sidewalk:both'];
 if(b)return yes(b)?[1,1]:[0,0];const L=t['sidewalk:left'],Rr=t['sidewalk:right'];if(L||Rr)return[L==='yes'?1:0,Rr==='yes'?1:0];
 if(v==='both')return[1,1];if(v==='left')return[1,0];if(v==='right')return[0,1];if(v==='no'||v==='none'||v==='separate')return[0,0];return null;}
