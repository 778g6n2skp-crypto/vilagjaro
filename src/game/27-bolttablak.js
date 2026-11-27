/* ---------- valós bolttáblák (OSM POI-név): egyetlen, fix méretű atlasz a kocsihoz legközelebbi 256 táblának ---------- */
let SHOPNIGHT=0;const SHOPMATS=new Set();
const SP=(()=>{const N=256,cv=document.createElement('canvas');cv.width=2048;cv.height=1024;const g=cv.getContext('2d'),tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const pos=new Float32Array(N*12),nor=new Float32Array(N*12),uv=new Float32Array(N*8),idx=[];for(let i=0;i<N;i++){const c=i%8,r=(i/8)|0,u0=c/8,u1=(c+1)/8,v1=1-r/32,v0=1-(r+1)/32+1/1024;uv.set([u0,v0,u1,v0,u1,v1,u0,v1],i*8);idx.push(i*4,i*4+1,i*4+2,i*4,i*4+2,i*4+3);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.setIndex(idx);geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e7);
 const mat=new THREE.MeshStandardMaterial({map:tex,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.12,roughness:.6,polygonOffset:true,polygonOffsetFactor:-2});SHOPMATS.add(mat);
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;scene.add(mesh);return {N,cv,g,tex,geo,pos,nor,mesh,slot:new Map(),free:[...Array(N).keys()].reverse(),t:0};})();
function spDraw(i,name,cl){const g=SP.g,X0=(i%8)*256,Y0=((i/8)|0)*32,hs=[...name].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7)>>>0;
 const BGS=[['#1f2b4d','#5a2a2a','#21463a','#3b3b46','#6a4b1f','#2d3f55'],['#6d1f24','#3a2418','#7a3b12','#4a1c3a'],['#1f4d3a','#22324d','#383838'],['#0f7a3a','#127045'],['#f4f4f2']][cl]||['#333'];
 g.clearRect(X0,Y0,256,32);g.fillStyle=BGS[hs%BGS.length];g.fillRect(X0+1,Y0+1,254,30);g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;g.strokeRect(X0+3,Y0+3,250,26);
 let fs=21;g.font=`bold ${fs}px system-ui,Arial,sans-serif`;const tw=g.measureText(name).width;if(tw>238){fs=Math.max(10,fs*238/tw);g.font=`bold ${fs}px system-ui,Arial,sans-serif`;}
 g.fillStyle=cl===4?'#1a1a1a':'#f6f1e6';g.textAlign='center';g.textBaseline='middle';g.fillText(name,X0+128,Y0+17);
 if(cl===3){g.fillStyle='#fff';g.fillRect(X0+8,Y0+13,12,5);g.fillRect(X0+11.5,Y0+9.5,5,12);}}
function updShopSigns(dt){if((SP.t-=dt)>0)return;SP.t=.6;const cand=[];
 for(const ch of chunks.values()){if(ch.state!=='ready'||!ch.shs||!ch.shs.length||rectD(ch.rect,car.x,car.z)>190)continue;const S=ch.shs;for(let k=0;k<S.length;k+=9){const d=Math.hypot(S[k]-car.x,S[k+2]-car.z);if(d<190)cand.push([d,ch,k]);}}
 cand.sort((a,b)=>a[0]-b[0]);if(cand.length>SP.N)cand.length=SP.N;const want=new Map();for(const c of cand)want.set(c[1].key+':'+c[2],c);
 for(const [key,i] of SP.slot)if(!want.has(key)){SP.slot.delete(key);SP.free.push(i);SP.pos.fill(0,i*12,i*12+12);}
 let drew=false;for(const [key,c] of want){if(SP.slot.has(key))continue;const i=SP.free.pop();if(i===undefined)break;SP.slot.set(key,i);const S=c[1].shs,k=c[2],name=(c[1].shn||[])[S[k+8]]||'';spDraw(i,name,S[k+7]);drew=true;
  const x=S[k],y=S[k+1],z=S[k+2],nx=S[k+3],nz=S[k+4],w=S[k+5],h=S[k+6],rx=nz,rz=-nx;SP.pos.set([x-rx*w/2,y-h/2,z-rz*w/2, x+rx*w/2,y-h/2,z+rz*w/2, x+rx*w/2,y+h/2,z+rz*w/2, x-rx*w/2,y+h/2,z-rz*w/2],i*12);for(let j=0;j<4;j++)SP.nor.set([nx,0,nz],i*12+j*3);}
 if(drew)SP.tex.needsUpdate=true;SP.geo.attributes.position.needsUpdate=true;SP.geo.attributes.normal.needsUpdate=true;}
function spDropChunk(key){for(const [k2,i] of SP.slot)if(k2.startsWith(key+':')){SP.slot.delete(k2);SP.free.push(i);SP.pos.fill(0,i*12,i*12+12);}SP.geo.attributes.position.needsUpdate=true;}
function onChunk(m){if(m.gen!==gen)return;const key=m.tx+','+m.ty,ch=chunks.get(key);if(!ch)return;let swap=false;
 if(ch.state==='loading')inflight--;else if(ch.state==='ready'&&ch.rebuilding&&m.rebuild){swap=true;ch.rebuilding=false;}else return;
 const oldGrp=ch.grp;
 const grp=new THREE.Group(),rise=new THREE.Group();grp.add(rise);
 const Gd=m.ground;ch.col=buildCol([[Gd.p,Gd.i],...m.roads.map(r=>[r.p,r.i]),[m.walk.p,m.walk.i],[m.bed.p,m.bed.i]]);// a sínágy is szilárd felület (különálló villamospályán ez az egyetlen burkolat)
 const snap=(x,y,z)=>{const v=colTop(ch.col,x,z,y+2.6);return v==null?y:v;};// fák, lámpák, táblák pontosan a látható felületen
 const gm=mesh(geo({position:[Gd.p,3],color:[Gd.c,3],uv:[Gd.u,2]},Gd.i),MAT.ground);gm.geometry.computeVertexNormals();{const nn=gm.geometry.attributes.normal.array;for(let q=Gd.nV*3;q<nn.length;q+=3){nn[q]=0;nn[q+1]=1;nn[q+2]=0;}}grp.add(gm);
 const rib=(b,mat,ro,uv=true)=>{if(!b.p.length)return;const at={position:[b.p,3],normal:[upN(b.p),3]};if(uv&&b.u)at.uv=[b.u,2];grp.add(mesh(geo(at,b.i),mat,{ro}));};
 rib(m.walk,MAT.walk,1);if(m.ms.p.length)rib(m.ms,MAT.mark,6,false);if(m.md.p.length)rib(m.md,MAT.markD,6);m.roads.forEach((r,k)=>rib(r,MAT.road[k],[4,3,2][k]));rib(m.bed,MAT.bed,2,false);rib(m.rail,MAT.rail,5,false);
 if(m.water.p.length){const p=m.water.p,uv=new Float32Array(p.length/3*2);for(let q=0,v=0;q<p.length;q+=3,v+=2){uv[v]=p[q]/14;uv[v+1]=p[q+2]/14;}grp.add(mesh(geo({position:[p,3],uv:[uv,2],normal:[upN(p),3]},m.water.i),MAT.water));}
 if(m.bridge.p.length)grp.add(mesh(geo({position:[m.bridge.p,3],normal:[m.bridge.n,3]}),MAT.bridge,{cast:1}));
 if(m.signs&&m.signs.length){const S=m.signs,by=new Map();for(let k=0;k<S.length;k+=5){const c=S[k+4];if(!by.has(c))by.set(c,[]);by.get(c).push(k);}
  const np=S.length/5,pole=new THREE.InstancedMesh(signPole,MAT.pole,np),back=new THREE.InstancedMesh(signBack,signBackMat,np);let j=0;
  for(const [code,ks] of by){const face=new THREE.InstancedMesh(signGeo,signMat(code),ks.length);ks.forEach((k,i)=>{S[k+1]=snap(S[k],S[k+1],S[k+2]);dummy.position.set(S[k],S[k+1],S[k+2]);dummy.rotation.set(0,S[k+3],0);dummy.scale.set(1,1,1);dummy.updateMatrix();face.setMatrixAt(i,dummy.matrix);pole.setMatrixAt(j,dummy.matrix);back.setMatrixAt(j++,dummy.matrix);});face.computeBoundingSphere();grp.add(face);}
  pole.computeBoundingSphere();back.computeBoundingSphere();grp.add(pole,back);}
 const wallM={};if(m.wu.p.length){wallM[0]=mesh(geo({position:[m.wu.p,3],normal:[m.wu.n,3],uv:[m.wu.u,2],color:[m.wu.c,3]}),MAT.wu,{cast:1});rise.add(wallM[0]);}
 if(m.wg.p.length)rise.add(mesh(geo({position:[m.wg.p,3],normal:[m.wg.n,3],uv:[m.wg.u,2]}),MAT.wg,{cast:1}));
 if(m.wmo.p.length)rise.add(mesh(geo({position:[m.wmo.p,3],normal:[m.wmo.n,3],uv:[m.wmo.u,2]}),MAT.wmo,{cast:1}));
 if(m.wbr&&m.wbr.p.length){wallM[3]=mesh(geo({position:[m.wbr.p,3],normal:[m.wbr.n,3],uv:[m.wbr.u,2],color:[m.wbr.c,3]}),MAT.wbr,{cast:1});rise.add(wallM[3]);}
 if(m.wpa.p.length){wallM[2]=mesh(geo({position:[m.wpa.p,3],normal:[m.wpa.n,3],uv:[m.wpa.u,2],color:[m.wpa.c,3]}),MAT.wpa,{cast:1});rise.add(wallM[2]);}
 if(m.bx.p.length)rise.add(mesh(geo({position:[m.bx.p,3],normal:[m.bx.n,3],color:[m.bx.c,3]}),MAT.bx,{cast:1}));
 if(m.roofs.p.length)rise.add(mesh(geo({position:[m.roofs.p,3],normal:[m.roofs.n,3],color:[m.roofs.c,3]}),MAT.roof,{cast:1}));
 const T=m.trees,nt=T.length/5;let trees=null;
 if(nt){trees={n:nt,M:new Float32Array(nt*16),C:new Float32Array(nt*3),K:new Uint8Array(nt),P:new Float32Array(nt*4)};
  for(let q=0;q<nt;q++){const s=T[q*5+3];T[q*5+1]=snap(T[q*5],T[q*5+1],T[q*5+2]);dummy.position.set(T[q*5],T[q*5+1]-.15,T[q*5+2]);dummy.rotation.set(0,Math.random()*6.28,0);dummy.scale.set(s,s*(.85+Math.random()*.3),s);dummy.updateMatrix();dummy.matrix.toArray(trees.M,q*16);
   trees.K[q]=T[q*5+4]?1:0;if(T[q*5+4])tcol.setHSL(.38+Math.random()*.05,.35,.26+Math.random()*.06);else tcol.setHSL(.22+Math.random()*.08,.42+Math.random()*.15,.36+Math.random()*.1);tcol.toArray(trees.C,q*3);
   trees.P[q*4]=T[q*5];trees.P[q*4+1]=T[q*5+1];trees.P[q*4+2]=T[q*5+2];trees.P[q*4+3]=s;}
  {const cells=new Map();for(let q=0;q<nt;q++){const k=Math.floor(trees.P[q*4]/64)*100003+Math.floor(trees.P[q*4+2]/64);let l=cells.get(k);if(!l)cells.set(k,l=[]);l.push(q);}
   trees.cells=[...cells.values()].map(l=>{let x=0,y=0,z=0;for(const q of l){x+=trees.P[q*4];y+=trees.P[q*4+1];z+=trees.P[q*4+2];}return{x:x/l.length,y:y/l.length,z:z/l.length,idx:Int32Array.from(l)};});}}TREE.dirty=true;
 const L=m.lamps,nl=L.length/4;
 if(nl){const pl=new THREE.InstancedMesh(GEO.pole,MAT.pole,nl),he=new THREE.InstancedMesh(GEO.head,MAT.lampHead,nl),pool=new THREE.InstancedMesh(GEO.pool,MAT.pool,nl);
  for(let q=0;q<nl;q++){L[q*4+1]=snap(L[q*4],L[q*4+1],L[q*4+2]);dummy.position.set(L[q*4],L[q*4+1],L[q*4+2]);dummy.rotation.set(0,L[q*4+3],0);dummy.scale.set(1,1,1);dummy.updateMatrix();pl.setMatrixAt(q,dummy.matrix);he.setMatrixAt(q,dummy.matrix);
   dummy.position.set(L[q*4]+Math.sin(L[q*4+3])*1.5,L[q*4+1]+.25,L[q*4+2]+Math.cos(L[q*4+3])*1.5);dummy.updateMatrix();pool.setMatrixAt(q,dummy.matrix);}
  pl.castShadow=true;for(const im of [pl,he,pool])im.computeBoundingSphere();rise.add(pl,he);grp.add(pool);}
 const SG=m.sig,ns=SG.length/5;if(ns){const a=new THREE.InstancedMesh(GEO.sig,MAT.sigPole,ns),b=new THREE.InstancedMesh(GEO.sigBox,MAT.sigLamp,ns);
  const lamps=[0,1].map(g=>GEO.sigLamp.map((lg,ci)=>{const im=new THREE.InstancedMesh(lg,MAT.sigL[g][ci],ns);im.count=0;return im;}));
  for(let q=0;q<ns;q++){SG[q*5+1]=snap(SG[q*5],SG[q*5+1],SG[q*5+2]);dummy.position.set(SG[q*5],SG[q*5+1],SG[q*5+2]);dummy.rotation.set(0,SG[q*5+3],0);dummy.scale.set(1,1,1);dummy.updateMatrix();a.setMatrixAt(q,dummy.matrix);b.setMatrixAt(q,dummy.matrix);
   for(const im of lamps[SG[q*5+4]|0]){im.setMatrixAt(im.count++,dummy.matrix);}}
  a.castShadow=true;a.computeBoundingSphere();b.computeBoundingSphere();rise.add(a,b);for(const g of lamps)for(const im of g)if(im.count){im.computeBoundingSphere();rise.add(im);}}
 scene.add(grp);
 if(swap&&oldGrp){scene.remove(oldGrp);oldGrp.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();if(o.isInstancedMesh)o.dispose();});}
 if(route)routeDirty=true;
 if(swap)spDropChunk(key);
 Object.assign(ch,{demdec:m.demdec,baseCol:null,bunk:m.bunk,shs:m.shs,shn:m.shn,fdbg:m.fdbg,state:'ready',grp,rise,trees,fac:m.fac,bver:(ch.bver||0)+1,marks:m.marks,sigN:m.sigN,style:m.style,bidx:m.bidx,wallM,mly:0,h:m.h,rseg:m.rseg,tseg:m.tseg,cseg:m.cseg,names:m.names,wm:m.wm,baseY:m.baseY,t0:swap?-1e9:performance.now(),
  rh:mkHash(m.rseg,RS,3,-1),chh:mkHash(m.cseg,6,2,0),th:mkHash(m.tseg,6,3,2),rst:new Uint32Array(m.rseg.length/RS),cst:new Uint32Array(m.cseg.length/6),tst:new Uint32Array(m.tseg.length/6)});
 if(swap)resnap(ch);mlyApply(ch);phDropChunk(ch.key);}
function resnap(ch){for(let i=traffic.length-1;i>=0;i--){const c=traffic[i];if(c.ch!==ch)continue;const a=ch.rseg;let best=-1,bd=4;
  for(let k=0;k<a.length;k+=RS){if(Math.abs(a[k]-c.x)>15||Math.abs(a[k+1]-c.z)>15)continue;const r=proj(c.x,c.z,a[k],a[k+1],a[k+3],a[k+4]);if(r.d>=bd+a[k+6])continue;
   const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],l=Math.hypot(dx,dz)||1;if(Math.abs((dx*c.ux+dz*c.uz)/l)<.7)continue;bd=r.d-a[k+6];best=k;c.dir=(dx*c.ux+dz*c.uz)>0?1:-1;c.t=c.dir>0?r.t:1-r.t;}
  if(best<0)traffic.splice(i,1);else{c.k=best;place(c,RS);}}
 for(let i=trams.length-1;i>=0;i--){const t=trams[i];if(t.ch===ch){scene.remove(t.grp);trams.splice(i,1);}}}
function dropTram(i){scene.remove(trams[i].grp);trams.splice(i,1);}
function dispose(ch){spDropChunk(ch.key);if(ch.grp){scene.remove(ch.grp);ch.grp.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();if(o.isInstancedMesh)o.dispose();});}chunks.delete(ch.key);if(ch.state==='loading')inflight--;ch.state='gone';}
function streaming(){const sp=Math.hypot(car.vx,car.vz),look=Math.min(6*sp,500),px=car.x+(sp>1?car.vx/sp*look:0),pz=car.z+(sp>1?car.vz/sp*look:0);
 const [tc,tr]=tileOf(car.x,car.z),want=[],now=performance.now();
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const tx=tc+dx,ty=tr+dy,key=tx+','+ty,ch=chunks.get(key);
  if(ch&&!(ch.state==='failed'&&now>ch.retry))continue;const r=tileRect(tx,ty),d1=rectD(r,car.x,car.z),d2=rectD(r,px,pz);
  if(d1<LOAD_R||d2<LOOK_R){if(ch)chunks.delete(key);want.push([Math.min(d1,d2*.8),tx,ty,key]);}}
 want.sort((a,b)=>a[0]-b[0]);for(const w of want){if(inflight>=MAXF)break;request(w[1],w[2],w[3]);}
 for(const ch of [...chunks.values()])if(rectD(ch.rect,car.x,car.z)>UNLOAD_R)dispose(ch);}
