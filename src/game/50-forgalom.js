/* ---------- forgalom ---------- */
const traffic=[],trams=[];let aiSpawnT=0;const TST={flip:0,gone:0};// forgalom-statisztika a tesztekhez
function segDir(a,k,dir){const ax=dir>0?a[k]:a[k+3],az=dir>0?a[k+1]:a[k+4],bx=dir>0?a[k+3]:a[k],bz=dir>0?a[k+4]:a[k+1];return[ax,az,bx,bz];}
function place(c,S){const a=c.ch[S===RS?'rseg':'tseg'],k=c.k,[ax,az,bx,bz]=segDir(a,k,c.dir),ay=c.dir>0?a[k+2]:a[k+5],by=c.dir>0?a[k+5]:a[k+2];
 const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||.01,ux=dx/L,uz=dz/L;c.L=L;c.ux=ux;c.uz=uz;
 let off=0;if(S===RS){const hw=a[k+6],ow=a[k+10],L=a[k+11];if(L>=2||(ow&&hw>3.2)){const LL=L||2,lw=2*hw/LL;if(ow)off=hw-((c.lane%LL)+.5)*lw;else{const n=Math.max(1,Math.floor(LL/2));off=((c.lane%n)+.5)*lw;}}else off=ow?0:Math.min(hw*.48,2.3);}
 if(LHT)off=-off;c.tx_=ax+dx*c.t-uz*off;c.tz_=az+dz*c.t+ux*off;c.ty_=ay+(by-ay)*c.t;}
function nextSeg(c,S){const a=c.ch[S===RS?'rseg':'tseg'],k=c.k,[,,bx,bz]=segDir(a,k,c.dir),ux=c.ux,uz=c.uz,cands=[];
 forSegs(bx,bz,2.6,S===RS?0:2,(s,q,ch)=>{if(ch===c.ch&&q===k)return;if(S===RS&&s[q+9]>1)return;const ow=S===RS&&!c.chase?s[q+10]:0,opts=[];
  const d1=Math.hypot(s[q]-bx,s[q+1]-bz),d2=Math.hypot(s[q+3]-bx,s[q+4]-bz);
  if(d1<2.6&&ow>=0)opts.push([1,0]);if(d2<2.6&&ow<=0)opts.push([-1,0]);
  if(!opts.length){const r=proj(bx,bz,s[q],s[q+1],s[q+3],s[q+4]);if(r.d<1.8&&r.t>.01&&r.t<.99){const sx=s[q+3]-s[q],sz=s[q+4]-s[q+1],sl=Math.hypot(sx,sz)||1,dd=(sx*ux+sz*uz)/sl;
   if(dd>.8&&ow>=0)opts.push([1,r.t]);else if(dd<-.8&&ow<=0)opts.push([-1,1-r.t]);}}
  for(const o of opts){const dx=(s[q+3]-s[q])*o[0],dz=(s[q+4]-s[q+1])*o[0],l=Math.hypot(dx,dz)||1,dot=(dx*ux+dz*uz)/l;if(dot<-.2)continue;cands.push({ch,k:q,dir:o[0],t:o[1],dot});}});
 if(!cands.length)return false;cands.sort((p,q)=>q.dot-p.dot);
 let pick=cands[0];if(cands.length>1&&S===RS){const cr=a[k+13];let tot=0;const w=cands.map(q=>{const r=q.ch.rseg[q.k+13],st=Math.max(0,q.dot);let x=(.12+st*st*2.2)*(RW(r)+.04)/(RW(cr)+.04);if(r>cr+.9)x*=.35;if(q.ch.rseg[q.k+8]===a[k+8]&&a[k+8]>=0)x*=1.6;tot+=x;return x;});let rr=Math.random()*tot;for(let i=0;i<cands.length;i++){rr-=w[i];if(rr<=0){pick=cands[i];break;}}}
 else if(cands.length>1&&Math.random()>.65)pick=cands[1+Math.floor(Math.random()*(cands.length-1))];
 if(c.chase){const tx=car.x-bx,tz=car.z-bz,tl=Math.hypot(tx,tz)||1;const sc=q=>{const a2=q.ch[S===RS?'rseg':'tseg'],k2=q.k,dx=(a2[k2+3]-a2[k2])*q.dir,dz=(a2[k2+4]-a2[k2+1])*q.dir,l=Math.hypot(dx,dz)||1;return -(dx*tx+dz*tz)/(l*tl)-q.dot*.15;};pick=cands.reduce((b,q)=>sc(q)<sc(b)?q:b,cands[0]);}
 c.ch=pick.ch;c.k=pick.k;c.dir=pick.dir;c.t=pick.t;if(pick.dot<.75)c.turn=1.2;if(S===RS&&!c.chase){const sp=c.ch.rseg[c.k+12];c.vmax=c.base*(sp>0?sp/3.6:c.ch.rseg[c.k+9]===0?13.5:8.5);}return true;}
function advance(c,ds,S){c.t+=ds/c.L;let n=0;while(c.t>=1&&n++<6){const over=(c.t-1)*c.L;if(!nextSeg(c,S))return false;place(c,S);c.t+=over/c.L;}place(c,S);return true;}
const RW=r=>r<1?1.45:r<2?1.3:r<3?1:r<4?.78:r<5?.5:r<5.5?.075:r<6.5?.025:0;
const todF=()=>[1,.85,.32,.55][tIdx]||1;
function spawnAI(){const cand=[...chunks.values()].filter(ch=>ch.state==='ready'&&rectD(ch.rect,car.x,car.z)<400&&ch.rseg.length);if(!cand.length)return;
 const ch=cand[Math.floor(Math.random()*cand.length)],a=ch.rseg,n=a.length/RS;
 for(let tries=0;tries<40;tries++){const k=Math.floor(Math.random()*n)*RS;if(a[k+9]>1||a[k+6]<2.2||a[k+7])continue;if(Math.random()*1.45>RW(a[k+13]))continue;const mx=(a[k]+a[k+3])/2,mz=(a[k+1]+a[k+4])/2,d=Math.hypot(mx-car.x,mz-car.z);
  if(d<70||d>340)continue;const vis=(mx-camera.position.x)*Math.sin(camH)+(mz-camera.position.z)*Math.cos(camH)>0;if(vis&&d<170)continue;
  if(traffic.some(o=>Math.abs(o.x-mx)<12&&Math.abs(o.z-mz)<12))continue;
  const ow=a[k+10],dir=ow?ow:(Math.random()<.5?1:-1),r=Math.random(),major=a[k+9]===0,sp=a[k+12];
  const type=major&&r<.1?3:r<.22?4:r<.27?5:r<.39?2:Math.random()<.5?1:0;
  const col=AIFIX[type]||(type===5?TRABICOL[Math.floor(Math.random()*TRABICOL.length)]:AICOL[Math.floor(Math.random()*AICOL.length)]);
  const base=(type===3?.75:type===5?.7:1)*(.88+Math.random()*.2);
  const c={id:++aiId,ch,k,dir,t:Math.random(),v:0,base,vmax:base*(sp>0?sp/3.6:major?13.5:8.5),type,lane:Math.floor(Math.random()*4),col:new THREE.Color(col),stop:0,turn:0};
  place(c,RS);c.x=c.tx_;c.z=c.tz_;c.y=c.ty_;c.vh=Math.atan2(c.ux,c.uz);c.v=c.vmax*.7;traffic.push(c);return;}}
let wantAI=10,wantT=0,aiId=0;
function trafficTarget(){let len=0;for(const ch of chunks.values()){if(ch.state!=='ready'||rectD(ch.rect,car.x,car.z)>350)continue;const a=ch.rseg;
 for(let k=0;k<a.length;k+=RS){if(a[k+9]>1||a[k+7])continue;if(Math.abs(a[k]-car.x)>350||Math.abs(a[k+1]-car.z)>350)continue;const L=Math.hypot(a[k+3]-a[k],a[k+4]-a[k+1]),ln=Math.max(1,a[k+11]||(a[k+6]>3?2:1));len+=L*ln*RW(a[k+13]);}}
 wantAI=Math.round(Math.max(3,Math.min(90,len/55*todF()))*CFG.traffic);}
function updTraffic(dt){wantT-=dt;if(wantT<=0){wantT=2;trafficTarget();}aiSpawnT-=dt;if(aiSpawnT<=0&&traffic.length<wantAI){aiSpawnT=.04;spawnAI();spawnAI();}
 for(let i=traffic.length-1;i>=0;i--){const c=traffic[i];
  if(c.ch.state!=='ready'||Math.hypot(c.x-car.x,c.z-car.z)>420){traffic.splice(i,1);continue;}
  const fx=Math.sin(c.vh),fz=Math.cos(c.vh);let tgt=c.turn>0?5:Math.min(c.vmax,c.ch.rseg[c.k+6]<2.6?5.5:c.vmax);
  const myL=AITYPES[c.type].len/2;const look=(ox,oz,len,oh,oid,ov)=>{const rx=ox-c.x,rz=oz-c.z,al=rx*fx+rz*fz,lt=Math.abs(rx*fz-rz*fx);
   if(oid!=null&&al>-.2&&al<myL+.3&&lt<1.9&&oh!=null&&fx*Math.sin(oh)+fz*Math.cos(oh)>.5&&c.id>oid){tgt=Math.min(tgt,Math.max(0,(ov||0)-2));return;}
   if(al<myL+.3||al>10+len+c.v*1.6)return;
   const ch2=oh==null?1:fx*Math.sin(oh)+fz*Math.cos(oh);if(ch2<-.3){if(lt<1&&al<14)tgt=Math.min(tgt,Math.max(1.2,(al-6)*.5));return;}if(lt<2.1)tgt=Math.min(tgt,Math.max(0,(al-3.2-len)/1.35));};
  const myR=c.ch.rseg[c.k+13];let yielding=false;
  for(const o of traffic){if(o===c||Math.abs(o.x-c.x)>34||Math.abs(o.z-c.z)>34)continue;const len=AITYPES[o.type].len/2-.5+AITYPES[c.type].len/2-2;look(o.x,o.z,len,o.vh,o.id,o.v);
   const ofx=Math.sin(o.vh),ofz=Math.cos(o.vh),cosA=fx*ofx+fz*ofz;if(Math.abs(cosA)>.72)continue;
   const rx=o.x-c.x,rz=o.z-c.z,vx=ofx*o.v-fx*c.v,vz=ofz*o.v-fz*c.v,vv=vx*vx+vz*vz,tc=vv>.01?Math.max(0,Math.min(3,-(rx*vx+rz*vz)/vv)):0,mx=rx+vx*tc,mz=rz+vz*tc;
   if(mx*mx+mz*mz>4.2*4.2||rx*fx+rz*fz<-2)continue;const oR=o.ch.rseg[o.k+13],onRight=(rx*-fz+rz*fx>0)!==LHT;
   const prio=oR<myR-.4||(Math.abs(oR-myR)<=.4&&onRight)||o.v>3&&c.v<1&&tc<1.2;if(prio&&!(c.wait>3.5&&!(o.wait>3.5&&o.id<c.id))){const den=fx*ofz-fz*ofx;let st=null;if(Math.abs(den)>.3)st=(rx*ofz-rz*ofx)/den;
    if(st!=null&&st<myL+.6)continue;yielding=true;tgt=Math.min(tgt,st!=null?Math.max(0,(st-myL-3.2)/1.4):Math.max(0,(Math.hypot(rx,rz)-7)/1.6));}}
  c.wait=yielding&&c.v<.6?(c.wait||0)+dt:0;if(c.wait>6)c.wait=0;
  c._why=(c.sigL!=null&&c.sigL<.5?'lámpa ':'')+(yielding?'elsőbbség ':'')+(tgt<.5&&!yielding&&!(c.sigL!=null&&c.sigL<.5)?'előtte autó ':'');
  look(car.x,car.z,1.5,Math.abs(car.vF)>.5?(car.vF>0?car.h:car.h+Math.PI):null);for(const t of trams)for(const s of t.sec)if(Math.abs(s.x-c.x)<30&&Math.abs(s.z-c.z)<30)look(s.x,s.z,4,s.h);
  c.sigT=(c.sigT||0)-dt;if(c.sigT<=0){c.sigT=.2+Math.random()*.1;c.sigL=sigLimit(c,fx,fz);}if(c.sigL!=null)tgt=Math.min(tgt,c.sigL);
  if(c.stop>0){c.stop-=dt;tgt=0;}c.turn=Math.max(0,c.turn-dt);
  c.v+=Math.max(-8.5*dt,Math.min((c.v<4?2.6:1.9)*dt,tgt-c.v));
  if(!advance(c,c.v*dt,RS)){if(!c.ch.rseg[c.k+10]){c.dir=-c.dir;c.t=0;place(c,RS);TST.flip++;}else{traffic.splice(i,1);TST.gone++;continue;}}
  const k=1-Math.exp(-dt*10);c.x+=(c.tx_-c.x)*k;c.z+=(c.tz_-c.z)*k;c.y+=(c.ty_-c.y)*k;c.vh+=wrap(Math.atan2(c.ux,c.uz)-c.vh)*Math.min(1,dt*6);}
 const cnt=AITYPES.map(()=>0);
 for(const c of traffic){const m=aiMeshes[c.type],i=cnt[c.type]++;if(i>=90)continue;dummy.position.set(c.x,c.y,c.z);dummy.rotation.set(0,c.vh,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
  m.b.setMatrixAt(i,dummy.matrix);m.d.setMatrixAt(i,dummy.matrix);m.l.setMatrixAt(i,dummy.matrix);m.b.setColorAt(i,c.col);}
 aiMeshes.forEach((m,t)=>{const n=Math.min(90,cnt[t]);for(const im of [m.b,m.d,m.l]){im.count=n;im.instanceMatrix.needsUpdate=true;}if(m.b.instanceColor)m.b.instanceColor.needsUpdate=true;});}
function spawnTram(){const cand=[...chunks.values()].filter(ch=>ch.state==='ready'&&ch.tseg.length&&rectD(ch.rect,car.x,car.z)<600);if(!cand.length)return;
 const ch=cand[Math.floor(Math.random()*cand.length)],a=ch.tseg,n=a.length/6;
 for(let tries=0;tries<20;tries++){const k=Math.floor(Math.random()*n)*6,mx=(a[k]+a[k+3])/2,mz=(a[k+1]+a[k+4])/2,d=Math.hypot(mx-car.x,mz-car.z);if(d<140||d>520)continue;
  if(trams.some(t=>Math.hypot(t.sec[0].x-mx,t.sec[0].z-mz)<120))continue;
  const t={ch,k,dir:Math.random()<.5?1:-1,t:Math.random(),v:8,trail:[],sec:[],grp:new THREE.Group()};place(t,6);
  for(let s=0;s<4;s++){const g=TRAMG[s===0||s===3?0:1],sg=new THREE.Group(),b=new THREE.Mesh(g.body,MAT.tram),w=new THREE.Mesh(g.win,MAT.tramWin);b.castShadow=true;sg.add(b,w);if(s===3)sg.rotation.order='YXZ';t.grp.add(sg);t.sec.push({g:sg,x:0,y:0,z:0,h:0});}
  scene.add(t.grp);for(let q=0;q<60;q++){if(!advance(t,1,6))break;t.trail.unshift([t.tx_,t.ty_,t.tz_]);}trams.push(t);layTram(t);return;}}
function layTram(t){let d=0,idx=0;for(let s=0;s<4;s++){const want=s*9.6+4.6;while(idx<t.trail.length-1){const a=t.trail[idx],b=t.trail[idx+1],l=Math.hypot(b[0]-a[0],b[2]-a[2]);if(d+l>=want)break;d+=l;idx++;}
  const a=t.trail[Math.min(idx,t.trail.length-1)],b=t.trail[Math.min(idx+1,t.trail.length-1)],l=Math.hypot(b[0]-a[0],b[2]-a[2])||1,f=Math.min(1,(want-d)/l);
  const x=a[0]+(b[0]-a[0])*f,z=a[2]+(b[2]-a[2])*f,y=a[1]+(b[1]-a[1])*f,h=Math.atan2(a[0]-b[0],a[2]-b[2]);const S=t.sec[s];Object.assign(S,{x,y,z,h});
  S.g.position.set(x,y,z);S.g.rotation.set(0,s===3?h+Math.PI:h,0);}}
let tramT=0;
function updTrams(dt){if(!CFG.trams){while(trams.length)dropTram(0);return;}tramT-=dt;if(tramT<=0&&trams.length<4){tramT=1.5;spawnTram();}
 for(let i=trams.length-1;i>=0;i--){const t=trams[i];if(t.ch.state!=='ready'||Math.hypot(t.sec[0].x-car.x,t.sec[0].z-car.z)>650){scene.remove(t.grp);trams.splice(i,1);continue;}
  const h=t.sec[0],fx=Math.sin(h.h),fz=Math.cos(h.h),rx=car.x-h.x,rz=car.z-h.z,al=rx*fx+rz*fz,lt=Math.abs(rx*fz-rz*fx);let tgt=9;
  if(al>0&&al<26&&lt<2.8){tgt=Math.max(0,(al-8)*.8);if(al<20&&!t.rang){bell();t.rang=4;}}t.rang=Math.max(0,(t.rang||0)-dt);
  for(const c of traffic){const qx=c.x-h.x,qz=c.z-h.z,a2=qx*fx+qz*fz;if(a2>0&&a2<22&&Math.abs(qx*fz-qz*fx)<2.4)tgt=Math.min(tgt,Math.max(0,(a2-8)*.8));}
  t.v+=Math.max(-5*dt,Math.min(1.4*dt,tgt-t.v));
  if(!advance(t,t.v*dt,6)){t.dir=-t.dir;t.t=0;place(t,6);t.trail.length=0;t.trail.push([t.tx_,t.ty_,t.tz_]);}
  const hd=t.trail[0];if(!hd||Math.hypot(hd[0]-t.tx_,hd[2]-t.tz_)>.8){t.trail.unshift([t.tx_,t.ty_,t.tz_]);if(t.trail.length>70)t.trail.pop();}
  if(t.trail.length>3)layTram(t);}}
