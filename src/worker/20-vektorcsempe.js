/* ---------- vektorcsempe ---------- */
let dbp=null;
function db(){if(!dbp)dbp=new Promise(res=>{try{const r=indexedDB.open('vilagjaro2',1);r.onupgradeneeded=()=>r.result.createObjectStore('t');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);}catch(e){res(null);}});return dbp;}
async function idbGet(k){const d=await db();if(!d)return null;return new Promise(res=>{try{const q=d.transaction('t').objectStore('t').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null);}catch(e){res(null);}});}
async function idbPut(k,v){const d=await db();if(!d)return;try{d.transaction('t','readwrite').objectStore('t').put(v,k);}catch(e){}}
async function tilejson(){for(let a=0;!tileURL;a++){try{const r=await fetch('https://tiles.openfreemap.org/planet');const j=await r.json();tileURL=j.tiles[0];}
 catch(e){say('A térképszolgáltatás nem érhető el, újrapróbálom…');await sleep(Math.min(8000,1000*2**a));}}return tileURL;}
async function getTile(x,y){const url=(await tilejson()).replace('{z}',TZ).replace('{x}',x).replace('{y}',y);
 const c=await idbGet(url);if(c)return c;
 for(let a=0;a<6;a++){try{const r=await fetch(url);if(r.status===204||r.status===404)return new ArrayBuffer(0);if(!r.ok)throw new Error('HTTP '+r.status);
  const b=await r.arrayBuffer();idbPut(url,b);return b;}catch(e){say('Térképrész újrapróbálása… ('+(e.message||e)+')');await sleep(800*2**a);}}
 throw new Error('A térképrész nem töltődött be');}
const td=new TextDecoder();
function readMVT(buf){const b=new Uint8Array(buf);let p=0;const layers={};
 const vi=()=>{let r=0,s=1,c;do{c=b[p++];r+=(c&127)*s;s*=128;}while(c&128);return r;};
 const skip=t=>{if(t===0)vi();else if(t===1)p+=8;else if(t===2){const l=vi();p+=l;}else if(t===5)p+=4;};
 const str=()=>{const l=vi(),s=td.decode(b.subarray(p,p+l));p+=l;return s;};
 const val=end=>{let v=null;while(p<end){const k=vi(),f=k>>3,t=k&7;
  if(f===1)v=str();else if(f===2){v=new DataView(b.buffer,b.byteOffset+p,4).getFloat32(0,true);p+=4;}
  else if(f===3){v=new DataView(b.buffer,b.byteOffset+p,8).getFloat64(0,true);p+=8;}
  else if(f===4||f===5)v=vi();else if(f===6){const z=vi();v=z%2?-(z+1)/2:z/2;}else if(f===7)v=!!vi();else skip(t);}return v;};
 const feat=end=>{const F={id:0,tags:[],type:0,geom:[]};while(p<end){const k=vi(),f=k>>3,t=k&7;
  if(f===1)F.id=vi();else if(f===2){const e=vi()+p;while(p<e)F.tags.push(vi());}else if(f===3)F.type=vi();
  else if(f===4){const e=vi()+p;while(p<e)F.geom.push(vi());}else skip(t);}return F;};
 while(p<b.length){const k=vi(),f=k>>3,t=k&7;
  if(f===3&&t===2){const end=vi()+p,L={name:'',extent:4096,keys:[],vals:[],feats:[]};
   while(p<end){const k2=vi(),f2=k2>>3,t2=k2&7;
    if(f2===1)L.name=str();else if(f2===2){const e=vi()+p;L.feats.push(feat(e));p=e;}
    else if(f2===3)L.keys.push(str());else if(f2===4){const e=vi()+p;L.vals.push(val(e));p=e;}else if(f2===5)L.extent=vi();else skip(t2);}
   p=end;layers[L.name]=L;}else skip(t);}
 return layers;}
function rings(g){const R=[];let x=0,y=0,i=0,cur=null;const zz=n=>(n>>>1)^-(n&1);
 while(i<g.length){const c=g[i++],id=c&7,n=c>>3;
  if(id===1){for(let k=0;k<n;k++){x+=zz(g[i++]);y+=zz(g[i++]);cur=[[x,y]];R.push(cur);}}
  else if(id===2){for(let k=0;k<n;k++){x+=zz(g[i++]);y+=zz(g[i++]);cur.push([x,y]);}}}
 return R;}
function props(L,F){const o={};for(let k=0;k<F.tags.length;k+=2)o[L.keys[F.tags[k]]]=L.vals[F.tags[k+1]];return o;}
function clipRing(R,E){let out=R;for(const [ax,s] of [[0,1],[0,-1],[1,1],[1,-1]]){const lim=s>0?0:E,inp=out;out=[];if(!inp.length)break;
 const ins=q=>s>0?q[ax]>=lim:q[ax]<=lim;
 for(let k=0;k<inp.length;k++){const A=inp[k],B=inp[(k+1)%inp.length],ia=ins(A),ib=ins(B);
  if(ia)out.push(A);if(ia!==ib){const t=(lim-A[ax])/(B[ax]-A[ax]);out.push([A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]);}}}
 return out;}
const area=R=>{let a=0;for(let k=0;k<R.length;k++){const p=R[k],q=R[(k+1)%R.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;};
