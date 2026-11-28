/* ---------- hidak: a szomszéd csempékből összefűzött teljes híd, egyenletes pályaprofil ---------- */
const isEdge=(q,E)=>q[0]<=1||q[0]>=E-1||q[1]<=1||q[1]>=E-1;
const bpCache=new Map();
function bridgeProfileC(tx,ty,E,R,pr,off){const k=tx+','+ty+':'+R[0][0]+','+R[0][1]+':'+R[R.length-1][0]+','+R[R.length-1][1]+':'+pr.class+':'+off;let p=bpCache.get(k);if(!p){p=bridgeProfile(tx,ty,E,R,pr,off);bpCache.set(k,p);p.catch(()=>bpCache.delete(k));if(bpCache.size>400)bpCache.delete(bpCache.keys().next().value);}return p;}
async function bridgeProfile(tx,ty,E,R,pr,off){
 const toLL=(x,y,E2)=>q=>[fx2lon(x+q[0]/E2),fy2lat(y+q[1]/E2)];
 const own=R.map(toLL(tx,ty,E));let full=own.slice(),pre=0;
 const ky=110574,kx=111320*Math.cos(own[0][1]*Math.PI/180),dm=(a,b)=>Math.hypot((a[0]-b[0])*kx,(a[1]-b[1])*ky);
 const sd=(p,a,b)=>{const ax=(a[0]-p[0])*kx,ay=(a[1]-p[1])*ky,bx=(b[0]-p[0])*kx,by=(b[1]-p[1])*ky,dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?-(ax*dx+ay*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(ax+dx*t,ay+dy*t);};
 for(const side of [0,1]){let tile=[tx,ty],px=side?R[R.length-1]:R[0],Ec=E;
  for(let hop=0;hop<6&&isEdge(px,Ec);hop++){
   const end=side?full[full.length-1]:full[0],nb=side?full[full.length-2]:full[1],dE=dm(end,nb);
   const dx=px[0]<=1?-1:px[0]>=Ec-1?1:0,dy=px[1]<=1?-1:px[1]>=Ec-1?1:0;let found=null;
   for(const [ax,ay] of [[dx,0],[0,dy],[dx,dy]]){if((!ax&&!ay)||found)continue;const nt=[tile[0]+ax,tile[1]+ay];let L2;try{L2=await layersOf(nt[0],nt[1]);}catch(e){continue;}const T2=L2.transportation;if(!T2)continue;
    for(const F of T2.feats){if(found)break;if(F.type!==2)continue;const p2=props(T2,F);if(p2.brunnel!=='bridge'||p2.class!==pr.class)continue;
     for(const Q of rings(F.geom)){if(Q.length<2)continue;const ql=Q.map(toLL(nt[0],nt[1],T2.extent));let bd=1e9;for(let j=0;j<ql.length-1;j++)bd=Math.min(bd,sd(end,ql[j],ql[j+1]));if(bd>3)continue;
      const fwd=dm(ql[ql.length-1],nb)>dm(ql[0],nb),seq=fwd?ql:ql.slice().reverse(),ext=seq.filter(q=>dm(q,nb)>dE+.5);if(!ext.length)continue;
      found={ext,tile:nt,px:fwd?Q[Q.length-1]:Q[0],E:T2.extent};break;}}}
   if(!found)break;
   if(side)full=full.concat(found.ext);else{full=found.ext.slice().reverse().concat(full);pre+=found.ext.length;}
   tile=found.tile;px=found.px;Ec=found.E;}}
 for(const e of [full[0],full[full.length-1]]){try{await correctTile(Math.floor(lon2fx(e[0])),Math.floor(lat2fy(e[1])));}catch(err){}}
 let la0=90,la1=-90,lo0=180,lo1=-180;for(const q of full){la0=Math.min(la0,q[1]);la1=Math.max(la1,q[1]);lo0=Math.min(lo0,q[0]);lo1=Math.max(lo1,q[0]);}
 await demBox(la0-.003,la1+.003,lo0-.004,lo1+.004);
 const S=[0];for(let k=1;k<full.length;k++)S.push(S[k-1]+dm(full[k],full[k-1]));const L=Math.max(S[S.length-1],.1),s0=S[pre];
 /* általános hídprofil: a pálya annyira emelkedik, amennyit az alatta lévő víz, út, vasút megkövetel, és nem meredekebb a megengedettnél; a végek lehetnek a terep fölött */
 const cl0=pr.class,grade=/rail|transit/.test(cl0)?.035:/^(motorway|trunk|primary|secondary)$/.test(cl0)?.045:cl0==='path'?.3:.06;
 const N=Math.max(2,Math.ceil(L/4)),ds=L/N,P=[],req=new Float32Array(N+1),ter=new Float32Array(N+1),wat=new Uint8Array(N+1),wl=new Float32Array(N+1);
 let k=0;for(let i=0;i<=N;i++){const s=i*ds;while(k<S.length-2&&S[k+1]<s)k++;const f=Math.min(1,(s-S[k])/((S[k+1]-S[k])||1));P.push([full[k][0]+(full[k+1][0]-full[k][0])*f,full[k][1]+(full[k+1][1]-full[k][1])*f]);}
 for(let i=0;i<=N;i++){const [lon,lat]=P[i];ter[i]=sAt(lat,lon);const fx=lon2fx(lon),fy=lat2fy(lat),t2=[Math.floor(fx),Math.floor(fy)];let ct=null;try{ct=await correctTile(t2[0],t2[1]);}catch(e){}
  if(ct&&ct.wm){const c=Math.round((fx-t2[0])*G),r=Math.round((fy-t2[1])*G);if(ct.wm[r*(G+1)+c]){wat[i]=1;wl[i]=waterLvl(lat,lon);}}req[i]=Math.max(ter[i],rawAt(lat,lon)-.5);}
 // víz: a folyó szélességéhez igazodó űrszelvény
 for(let i=0;i<=N;){if(!wat[i]){i++;continue;}let j=i;while(j<=N&&wat[j])j++;const run=(j-i)*ds,c=run>200?11:run>80?7:run>25?4:2.2;for(let q=i;q<j;q++)req[q]=Math.max(req[q],wl[q]+c);i=j;}
 // a híd alatt keresztező utak és sínek
 const tiles=new Set();for(const q of P)tiles.add(Math.floor(lon2fx(q[0]))+','+Math.floor(lat2fy(q[1])));
 const o0=P[0],xm=q=>[(q[0]-o0[0])*kx,(q[1]-o0[1])*ky],BP=P.map(xm);
 const MB=[1e9,-1e9,1e9,-1e9];for(const q of BP){MB[0]=Math.min(MB[0],q[0]);MB[1]=Math.max(MB[1],q[0]);MB[2]=Math.min(MB[2],q[1]);MB[3]=Math.max(MB[3],q[1]);}MB[0]-=15;MB[1]+=15;MB[2]-=15;MB[3]+=15;
 const LB=[1e9,-1e9,1e9,-1e9];for(const q of P){LB[0]=Math.min(LB[0],q[0]);LB[1]=Math.max(LB[1],q[0]);LB[2]=Math.min(LB[2],q[1]);LB[3]=Math.max(LB[3],q[1]);}{const ex=.0003;LB[0]-=ex;LB[1]+=ex;LB[2]-=ex;LB[3]+=ex;}
 for(const tk of tiles){const [ax,ay]=tk.split(',').map(Number);let L3;try{L3=await layersOf(ax,ay);}catch(e){continue;}const T3=L3.transportation;if(!T3)continue;
  for(const F of T3.feats){if(F.type!==2)continue;const p3=props(T3,F);if(p3.brunnel==='bridge'||p3.brunnel==='tunnel'||/_construction|ferry|aerialway|pier/.test(p3.class||''))continue;
   const c3=p3.class,clr=/rail/.test(c3)?6.2:c3==='transit'?5.6:c3==='path'?3:4.9,wid=/^(motorway|trunk|primary)$/.test(c3)?9:/rail|transit/.test(c3)?4:c3==='path'?2:6;
   if(!F._ll)F._ll=rings(F.geom).map(Q=>Q.map(toLL(ax,ay,T3.extent)));// csempénként egyszer dekódolva (eddig minden híd újra dekódolta)
   let fb=F._bb;if(!fb){fb=[1e9,-1e9,1e9,-1e9];for(const Q of F._ll)for(const q of Q){fb[0]=Math.min(fb[0],q[0]);fb[1]=Math.max(fb[1],q[0]);fb[2]=Math.min(fb[2],q[1]);fb[3]=Math.max(fb[3],q[1]);}F._bb=fb;}
   if(fb[1]<LB[0]||fb[0]>LB[1]||fb[3]<LB[2]||fb[2]>LB[3])continue;
   for(const Q0 of F._ll){const ql=Q0.map(xm);
    for(let a=0;a<ql.length-1;a++){const A=ql[a],B=ql[a+1];if(Math.max(A[0],B[0])<MB[0]||Math.min(A[0],B[0])>MB[1]||Math.max(A[1],B[1])<MB[2]||Math.min(A[1],B[1])>MB[3])continue;
     for(let b=0;b<BP.length-1;b++){const C=BP[b],D=BP[b+1],r1=[B[0]-A[0],B[1]-A[1]],r2=[D[0]-C[0],D[1]-C[1]],den=r1[0]*r2[1]-r1[1]*r2[0];if(Math.abs(den)<1e-6)continue;
      const t=((C[0]-A[0])*r2[1]-(C[1]-A[1])*r2[0])/den,u=((C[0]-A[0])*r1[1]-(C[1]-A[1])*r1[0])/den;if(t<0||t>1||u<0||u>1)continue;
      const sc=(b+u)*ds;if(sc<.5||sc>L-.5)continue;const sn=Math.abs(den)/(Math.hypot(...r1)*Math.hypot(...r2)||1),half=wid/2/Math.max(.35,sn)+1.5,ix=A[0]+r1[0]*t,iz=A[1]+r1[1]*t,lon=o0[0]+ix/kx,lat=o0[1]+iz/ky,need=sAt(lat,lon)+clr;
      for(let q=Math.max(0,Math.floor((sc-half)/ds));q<=Math.min(N,Math.ceil((sc+half)/ds));q++)req[q]=Math.max(req[q],need);}}}}}
 // emelkedési korlát: a legalacsonyabb pálya, ami minden követelményt teljesít
 const ys=new Float32Array(N+1);for(let i=0;i<=N;i++)ys[i]=req[i]+off;
 // lejtős terepen (domboldal, kanyargó felüljáró) a két vég közti szintkülönbséget a pálya követi: a korlát legalább ennyi, különben a magasabb végtől induló burkoló a mélyebb vég fölé emelné a pályát
 const eG=Math.abs((ter[N]+ter[Math.max(0,N-1)])/2-(ter[0]+ter[Math.min(N,1)])/2)/L,gr=Math.min(1,Math.max(grade,eG*1.15+.01));
 const env=()=>{for(let i=1;i<=N;i++)ys[i]=Math.max(ys[i],ys[i-1]-gr*ds);for(let i=N-1;i>=0;i--)ys[i]=Math.max(ys[i],ys[i+1]-gr*ds);};env();
 for(let it=0;it<2;it++){const c=ys.slice();const w=Math.max(1,Math.round(12/ds));for(let i=0;i<=N;i++){let a=0,n=0;for(let j=Math.max(0,i-w);j<=Math.min(N,i+w);j++){a+=c[j];n++;}ys[i]=Math.max(req[i]+off,a/n);}env();}
 const grd=gr;return{s0,full,S,L,grade:grd,ter0:ter[0],ter1:ter[N],cls:pr.class,at:s=>{const x=Math.max(0,Math.min(N,s/L*N)),i=Math.min(N-1,Math.floor(x)),f=x-i;return ys[i]*(1-f)+ys[i+1]*f;}};}
