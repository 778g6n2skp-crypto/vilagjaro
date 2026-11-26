/* ---------- csempék ---------- */
const chunks=new Map();let inflight=0;
const wk=new Worker(URL.createObjectURL(new Blob([$('wsrc').textContent],{type:'text/javascript'})));
wk.onerror=e=>{console.error('worker',e.message,e.lineno);status('Hiba a térképfeldolgozásban: '+e.message,8);};
wk.postMessage({t:'init',lat0,lon0});
wk.onmessage=e=>{const m=e.data;
 if(m.t==='status'){status(m.msg,5);return;}
 if(m.t==='fail'){if(m.gen!==gen)return;const ch=chunks.get(m.tx+','+m.ty);if(ch&&ch.state==='loading'){inflight--;ch.state='failed';ch.retry=performance.now()+6000;status('Egy térképrész nem töltött be, újrapróbálom.',4);}return;}
 if(m.t==='detail'){if(m.gen!==gen)return;const ch=chunks.get(m.tx+','+m.ty);if(ch&&ch.state==='ready'&&!ch.rebuilding){ch.rebuilding=true;wk.postMessage({t:'chunk',tx:m.tx,ty:m.ty,gen,rebuild:1});}return;}
 if(m.t==='chunk')onChunk(m);};
function tileRect(tx,ty){const a=toXZ(fy2lat(ty),fx2lon(tx)),b=toXZ(fy2lat(ty+1),fx2lon(tx+1));return[a[0],a[1],b[0],b[1]];}
const rectD=(r,x,z)=>Math.hypot(Math.max(r[0]-x,0,x-r[2]),Math.max(r[1]-z,0,z-r[3]));
function tileOf(x,z){const [la,lo]=toLL(x,z);return[Math.floor(lon2fx(lo)),Math.floor(lat2fy(la))];}
function request(tx,ty,key){chunks.set(key,{tx,ty,key,state:'loading',rect:tileRect(tx,ty)});inflight++;wk.postMessage({t:'chunk',tx,ty,gen});}
function geo(at,ix){const g=new THREE.BufferGeometry();for(const k in at)g.setAttribute(k,new THREE.BufferAttribute(at[k][0],at[k][1]));if(ix)g.setIndex(new THREE.BufferAttribute(ix,1));g.computeBoundingSphere();return g;}
const upN=p=>{const n=new Float32Array(p.length);for(let q=1;q<n.length;q+=3)n[q]=1;return n;};
function mkHash(a,st,o,pad){const h=new Map();for(let k=0,q=0;k<a.length;k+=st,q++){const p=pad<0?a[k+6]:pad,x1=a[k],z1=a[k+1],x2=a[k+o],z2=a[k+o+1];
 for(let cx=Math.floor((Math.min(x1,x2)-p)/CELL);cx<=Math.floor((Math.max(x1,x2)+p)/CELL);cx++)for(let cz=Math.floor((Math.min(z1,z2)-p)/CELL);cz<=Math.floor((Math.max(z1,z2)+p)/CELL);cz++){const key=(cx+60000)*131072+cz+60000;let l=h.get(key);if(!l)h.set(key,l=[]);l.push(q);}}return h;}
const dummy=new THREE.Object3D(),tcol=new THREE.Color();
function mesh(g,m,o={}){const ms=new THREE.Mesh(g,m);ms.castShadow=!!o.cast;ms.receiveShadow=o.recv!==false;if(o.ro)ms.renderOrder=o.ro;return ms;}