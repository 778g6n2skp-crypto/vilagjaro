/* ---------- csempe-adat gyorsítótár ---------- */
const lcache=new Map();
function layersOf(x,y){const k=x+','+y;let p=lcache.get(k);if(!p){p=getTile(x,y).then(b=>b.byteLength?readMVT(b):{});lcache.set(k,p);p.catch(()=>lcache.delete(k));if(lcache.size>(LOWMEM?20:48))lcache.delete(lcache.keys().next().value);}return p;}
function polyGroups(R){const out=[];let sign=0,cur=null;for(let r of R){if(r.length>1&&r[0][0]===r[r.length-1][0]&&r[0][1]===r[r.length-1][1])r=r.slice(0,-1);if(r.length<3)continue;
 const A=area(r);if(Math.abs(A)<1)continue;if(!sign)sign=Math.sign(A);if(Math.sign(A)===sign){cur={o:r,h:[]};out.push(cur);}else if(cur)cur.h.push(r);}return out;}
