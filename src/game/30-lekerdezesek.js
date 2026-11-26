/* ---------- lekérdezések ---------- */
function terrainH(x,z){const [la,lo]=toLL(x,z),gx=lon2fx(lo)*G,gy=lat2fy(la)*G,a=Math.floor(gx),b=Math.floor(gy),tx=Math.floor(a/G),ty=Math.floor(b/G);
 const ch=chunks.get(tx+','+ty);if(!ch||!ch.h)return NaN;const W=G+1,c=a-tx*G,r=b-ty*G,u=gx-a,v=gy-b,h=ch.h;
 return(h[r*W+c]*(1-u)+h[r*W+c+1]*u)*(1-v)+(h[(r+1)*W+c]*(1-u)+h[(r+1)*W+c+1]*u)*v;}
let qid=1;
function forSegs(x,z,r,kind,fn){qid++;const a=tileOf(x-r-140,z-r-140),b=tileOf(x+r+140,z+r+140);
 for(let tx=a[0];tx<=b[0];tx++)for(let ty=a[1];ty<=b[1];ty++){const ch=chunks.get(tx+','+ty);if(!ch||ch.state!=='ready')continue;
  const hs=kind===0?ch.rh:kind===1?ch.chh:ch.th,st=kind===0?ch.rst:kind===1?ch.cst:ch.tst,arr=kind===0?ch.rseg:kind===1?ch.cseg:ch.tseg,S=kind===0?RS:6;
  for(let cx=Math.floor((x-r)/CELL);cx<=Math.floor((x+r)/CELL);cx++)for(let cz=Math.floor((z-r)/CELL);cz<=Math.floor((z+r)/CELL);cz++){const l=hs.get((cx+60000)*131072+cz+60000);if(!l)continue;
   for(const q of l){if(st[q]===qid)continue;st[q]=qid;fn(arr,q*S,ch);}}}}
function proj(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;let t=l?((x-ax)*dx+(z-az)*dz)/l:0;t=Math.max(0,Math.min(1,t));const px=ax+dx*t,pz=az+dz*t;return{t,px,pz,d:Math.hypot(x-px,z-pz)};}