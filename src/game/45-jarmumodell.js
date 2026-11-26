/* ---- járműmodell: kétkerék-modell, csúszásszög alapú gumierők, terhelésátadás, valós motor- és váltóadatok ---- */
const G0=9.81;
function engT(rpm){const S=CAR.ph,w=Math.max(80,rpm*Math.PI/30),base=S.T*(.72+.28*Math.min(1,Math.max(0,(rpm-900)/(.38*S.red))));return rpm>S.red*1.01?0:Math.min(base,S.P/w);}
const gearRpm=(v,g)=>Math.abs(v)/CAR.ph.rw*(g>0?CAR.ph.gr[g-1]:3.4)*CAR.ph.fd*30/Math.PI;
let cruise=null;
function physics(dt){const S=CAR.ph,L=S.L,a=L*(1-S.cgF),b=L*S.cgF,m=S.m,Iz=m*(a*a+b*b)*.5;
 let fx=Math.sin(car.h),fz=Math.cos(car.h),rx=-fz,rz=fx;let vx=car.vx*fx+car.vz*fz,vL=-(car.vx*rx+car.vz*rz),w=car.w||0;
 GB.shift=Math.max(0,GB.shift-dt);const mu=(car.onRoad?S.mu:S.offMu)*(car.wet?.4:1);let thr=inp.thr,brk=inp.brk;
 if(cruise!=null){if(brk>0)cruise=null;else if(thr>0)cruise=Math.max(cruise,vx);else thr=Math.max(0,Math.min(1,(cruise-vx)*.6));}
 // menetirány-váltás: álló helyzetben a fék hátramenet, hátramenetben a gáz fékez
 let rev=GB.g<0;if(!rev&&brk>0&&!thr&&vx<.6){GB.g=-1;rev=true;}else if(rev&&thr>0&&vx>-.6){GB.g=1;rev=false;}
 let drive=0,brake=0;if(rev){drive=-brk;brake=thr;}else{drive=thr;brake=brk;}
 // automata váltó
 let g=GB.g,rpm;if(g>0){rpm=gearRpm(vx,g);if(GB.shift<=0){if(g<S.gr.length&&rpm>S.red*(drive>.6?.96:.6)&&!(drive<.1&&rpm<S.red*.75)){GB.g=++g;GB.shift=.26;}else if(g>1&&(gearRpm(vx,g-1)<S.red*(drive>.85?.86:.42)&&rpm<S.red*(drive>.85?.6:.3))){GB.g=--g;GB.shift=.2;}}rpm=gearRpm(vx,g);}else rpm=gearRpm(vx,-1);
 const ratio=(g>0?S.gr[g-1]:3.4)*S.fd,clutch=rpm<1500;let eRpm=Math.max(rpm,clutch?1200+drive*2600:900);car.rpm=Math.min(1,eRpm/S.red);
 let Fdrive=0;if(drive!==0&&GB.shift<=0)Fdrive=engT(eRpm)*ratio*.9/S.rw*drive;
 if(rev&&vx<-9)Fdrive=0;if(S.vlim&&vx>S.vlim)Fdrive=Math.min(Fdrive,0);if(!drive&&g>0&&vx>1&&GB.shift<=0)Fdrive=-Math.sign(vx)*40*(rpm/S.red)*ratio/S.rw;
 // terhelés és tapadás
 const ax=car.ax||0,Fzf=Math.max(.15*m*G0,m*G0*S.cgF-m*ax*S.h/L),Fzr=Math.max(.15*m*G0,m*G0*(1-S.cgF)+m*ax*S.h/L);
 const Dfz=S.drv==='F'?Fzf:S.drv==='R'?Fzr:Fzf+Fzr,Fyp=S.drv==='F'?(car.fyf||0):S.drv==='R'?(car.fyr||0):Math.abs(car.fyf||0)+Math.abs(car.fyr||0),avail=Math.sqrt(Math.max(0,(mu*Dfz)**2-Fyp*Fyp)),trac=Math.min(mu*Dfz*(S.drv==='R'?1.02:.95),Math.max(mu*Dfz*.12,avail*(inp.hb?1.6:1+(1-S.esc)*.5)));let spin=0;if(Math.abs(Fdrive)>trac){spin=Math.abs(Fdrive)/trac-1;Fdrive=Math.sign(Fdrive)*trac;}
 let Fb=0;if(brake>0&&Math.abs(vx)>.25)Fb=brake*mu*m*G0*.98;const Fbf=Fb*.66,Fbr=Fb*.34+(inp.hb&&Math.abs(vx)>.5?mu*Fzr*.55:0);
 const Fxf=(S.drv==='F'?Fdrive:S.drv==='A'?Fdrive*.45:0)-Math.sign(vx)*Fbf,Fxr=(S.drv==='R'?Fdrive:S.drv==='A'?Fdrive*.55:0)-Math.sign(vx)*Fbr;
 // kormányzás: nagy sebességnél a tapadási határhoz igazított legnagyobb szög
 const sp=Math.abs(vx),dmax=Math.min(S.lock,1.12*mu*G0*L/Math.max(sp*sp,1)+.04),dT=inp.steer*dmax,dr=Math.abs(dT)<Math.abs(car.steer)?3.6:2.4;car.steer+=Math.max(-dr*dt,Math.min(dr*dt,dT-car.steer));const d=car.steer;
 let Fyf=0,Fyr=0;
 if(car.ground){const vxs=Math.max(sp,.5),af=Math.atan2(vL+a*w,vxs)-d*Math.sign(vx||1),ar=Math.atan2(vL-b*w,vxs);
  const tire=(al,Fz,Fx,k,Bc)=>{const D0=mu*Fz*k,D=Math.sqrt(Math.max(D0*D0*.04,D0*D0-Fx*Fx)),B=Bc/(1.3*mu);return-D*Math.sin(1.3*Math.atan(B*al));};
  Fyf=tire(af,Fzf,Fxf,1,18);Fyr=tire(ar,Fzr,Fxr+(spin&&S.drv!=='F'?Math.sign(Fdrive)*trac*.4:0),inp.hb?.38:1.06,30);
  const Fdrag=.6*S.CdA*vx*Math.abs(vx),Froll=(car.onRoad?.012:.06)*m*G0*Math.sign(vx)*Math.min(1,sp*2);
  let dvx=(Fxf*Math.cos(d)+Fxr-Fyf*Math.sin(d)-Fdrag-Froll)/m+vL*w-G0*car.slope,dvL=(Fyf*Math.cos(d)+Fxf*Math.sin(d)+Fyr)/m-vx*w,dw=(a*(Fyf*Math.cos(d)+Fxf*Math.sin(d))-b*Fyr)/Iz;
  if(!inp.hb&&sp>3){const lim=mu*G0*1.08/sp,wk=vx*Math.tan(d)/L;let ex=0;if(Math.abs(w)>lim)ex=w-Math.sign(w)*lim;if(Math.abs(vL)>.1*sp+.4)ex+=(w-wk)*.5;dw-=ex*S.esc*9;}
  car.ax=dvx;car.fyf=Fyf;car.fyr=Fyr;vx+=dvx*dt;vL+=dvL*dt;w+=dw*dt;
  const k=Math.max(0,Math.min(1,(sp-1.5)/3.5));if(k<1){const wk=vx*Math.tan(d)/L;w=w*k+wk*(1-k);vL*=k+(1-k)*.85;}
  if(Fb>0&&Math.abs(vx)<Fb/m*dt*1.2)vx=0;if(!drive&&!brake&&sp<.25&&Math.abs(car.slope)<.08)vx*=.8;}
 else{w*=Math.exp(-dt*.5);car.ax=0;}
 car.h+=w*dt;car.w=w;car.pow=spin>0&&S.drv==='R';car.spin=spin;
 fx=Math.sin(car.h);fz=Math.cos(car.h);rx=-fz;rz=fx;const vR=-vL;
 car.slip=Math.abs(vL)+(spin>0?6*Math.min(1,spin):0)+(Fb>0&&Math.abs(vx)>3&&brake>.9?2:0);car.vF=vx;car.vx=fx*vx+rx*vR;car.vz=fz*vx+rz*vR;car.x+=car.vx*dt;car.z+=car.vz*dt;
 const imp0=car.impact;if(!window.__lab)collide();if(car.impact>imp0+1)car.w*=.6;
 const surf=window.__lab?0:surfaceAt(car.x,car.z,car.y);
 if(car.ground){if(car.y-surf>1.1){car.ground=false;}else{const K=420,Cd=2*Math.sqrt(K)*.92;car.vy+=(K*(surf-car.y)-Cd*car.vy)*dt;car.y+=car.vy*dt;if(car.y<surf-.12){car.y=surf-.12;if(car.vy<0)car.vy=0;}}}
 else{car.vy-=G0*dt;car.y+=car.vy*dt;if(car.y<=surf){if(car.vy<-6)car.impact=Math.max(car.impact,-car.vy*.5);car.ground=true;}}
 if(car.y<surf-2){car.y=surf;car.vy=0;}}
function pushOff(cx,cz,ox,oz,R,vx,vz){const dx=cx-ox,dz=cz-oz,d=Math.hypot(dx,dz);if(d>=R||d<1e-4)return null;const nx=dx/d,nz=dz/d,pen=R-d;car.x+=nx*pen;car.z+=nz*pen;
 const vn=(car.vx-(vx||0))*nx+(car.vz-(vz||0))*nz;if(vn<0){car.vx-=nx*vn*1.08;car.vz-=nz*vn*1.08;car.vx*=.9;car.vz*=.9;car.impact=Math.max(car.impact,-vn);}return -vn;}
function collide(){const fx=Math.sin(car.h),fz=Math.cos(car.h);
 for(const off of [1.3,-1.3]){let cx=car.x+fx*off,cz=car.z+fz*off;const R=1.05;
  forSegs(cx,cz,R+.5,1,(a,k)=>{if(car.y+.6<a[k+4]||car.y>a[k+5])return;const r=proj(cx,cz,a[k],a[k+1],a[k+2],a[k+3]);if(r.d>=R)return;
   let nx,nz;if(r.d>1e-4){nx=(cx-r.px)/r.d;nz=(cz-r.pz)/r.d;}else{nx=-(a[k+3]-a[k+1]);nz=a[k+2]-a[k];const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;}
   const pen=R-r.d;car.x+=nx*pen;car.z+=nz*pen;cx+=nx*pen;cz+=nz*pen;const vn=car.vx*nx+car.vz*nz;
   if(vn<0){car.vx-=nx*vn*1.25;car.vz-=nz*vn*1.25;car.vx*=.985;car.vz*=.985;car.impact=Math.max(car.impact,-vn);}});
  for(const c of traffic){if(Math.abs(c.y-car.y)>2.5||Math.abs(c.x-cx)>8||Math.abs(c.z-cz)>8)continue;const L=AITYPES[c.type].len/2-.9,sx=Math.sin(c.vh),sz=Math.cos(c.vh);
   for(const o of [L,-L]){const hit=pushOff(cx,cz,c.x+sx*o,c.z+sz*o,2.0,sx*c.v,sz*c.v);if(hit!=null){cx=car.x+fx*off;cz=car.z+fz*off;if(hit>2){c.stop=2.5;if(Math.random()<.5)honk(0,c);}if(hit>7&&performance.now()>crashT){crashT=performance.now()+4000;crime(1,'Balesetet okoztál!');}}}}
  for(const pc of police){if(Math.abs(pc.y-car.y)>2.5||Math.abs(pc.x-cx)>8||Math.abs(pc.z-cz)>8)continue;const sx=Math.sin(pc.vh),sz=Math.cos(pc.vh);for(const o of [1.2,-1.2]){const hit=pushOff(cx,cz,pc.x+sx*o,pc.z+sz*o,2.0,sx*pc.v,sz*pc.v);if(hit!=null){cx=car.x+fx*off;cz=car.z+fz*off;if(hit>3&&Math.abs(car.vF)>5&&performance.now()>crashT){crashT=performance.now()+3000;crime(1,'Nekimentél a rendőrautónak!');}}}}
  for(const t of trams)for(const s of t.sec){if(Math.abs(s.x-cx)>12||Math.abs(s.z-cz)>12||Math.abs(s.y-car.y)>3)continue;
   for(const o of [-3.2,0,3.2]){const hit=pushOff(cx,cz,s.x+Math.sin(s.h)*o,s.z+Math.cos(s.h)*o,2.35,Math.sin(s.h)*t.v,Math.cos(s.h)*t.v);if(hit!=null){cx=car.x+fx*off;cz=car.z+fz*off;if(hit>1)bell();}}}}}
function resetCar(atOrigin){const x0=atOrigin?0:car.x,z0=atOrigin?0:car.z;let best=null,bd=1e9;
 forSegs(x0,z0,350,0,(a,k)=>{if(a[k+9]>1||a[k+7])return;const r=proj(x0,z0,a[k],a[k+1],a[k+3],a[k+4]),sc=r.d-(a[k+9]===0?20:0);if(sc<bd){bd=sc;best=[r.px,r.pz,a[k+3]-a[k],a[k+4]-a[k+1],a[k+6]];}});
 if(!best){if(atOrigin&&!isNaN(terrainH(0,0)))best=[0,0,0,1,0];else{status('Nincs út a közelben – még épül a város.',3);return;}}
 let hd=Math.atan2(best[2],best[3]);if(!atOrigin&&Math.abs(wrap(hd-car.h))>Math.PI/2)hd+=Math.PI;
 const off=Math.min(best[4]*.45,2.2);car.x=best[0]-Math.cos(hd)*off;car.z=best[1]+Math.sin(hd)*off;car.h=hd;
 car.vx=car.vz=car.vF=car.vy=0;car.w=0;car.ax=0;car.steer=0;car.wet=0;GB.g=1;car.y=surfaceAt(car.x,car.z,1e4);if(isNaN(car.y))car.y=0;car.ground=true;
 if(atOrigin){car.spawned=true;carMesh.visible=true;camH=car.h;cam.pos.set(car.x-Math.sin(car.h)*9,car.y+4,car.z-Math.cos(car.h)*9);$('go').disabled=false;$('go').textContent='Indulás!';}}
function trySpawn(){if(car.spawned)return;const t=tileOf(0,0),ch=chunks.get(t[0]+','+t[1]);if(ch&&ch.state==='ready')resetCar(true);}
