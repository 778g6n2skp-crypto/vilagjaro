/* ---------- körözés, rendőrség ---------- */
let wanted=0,crashT=0,lastSigNode='',speedT=0,polSpawnT=0,bustT=0,escapeT=0,flashT=0;
const fmtFt=v=>Math.round(v).toLocaleString('hu-HU').replace(/,/g,' ')+' Ft';
function crime(n,msg){if(!CFG.police){status(msg,2.5);return;}const b=wanted;wanted=Math.min(3,wanted+n);escapeT=0;status(msg+(wanted>b?' – a rendőrség keres!':''),3.5);if(wanted>b)tone(880,0,.12,'square',.04);}
function checkViolations(dt){if(!started||!car.spawned)return;const sp=Math.abs(car.vF),fx=Math.sin(car.h),fz=Math.cos(car.h);
 for(const ch of chunks.values()){const S=ch.sigN;if(!S||ch.state!=='ready'||rectD(ch.rect,car.x,car.z)>20)continue;
  for(let k=0;k<S.length;k+=4){if(Math.hypot(S[k]-car.x,S[k+1]-car.z)>6||sp<5)continue;const key=ch.key+':'+k;if(lastSigNode===key)continue;lastSigNode=key;
   if(lightState(nodeGroup(S[k+2],S[k+3],fx,fz))===0)crime(1,'Áthajtottál a piroson!');}}
 if(curLimit&&sp*3.6>curLimit*1.45){speedT+=dt;if(speedT>4){speedT=-8;crime(1,'Gyorshajtás: '+Math.round(sp*3.6)+' km/h a '+curLimit+'-es zónában!');}}else speedT=Math.max(0,speedT-dt);
 const st=$('stars');st.classList.toggle('hide',!wanted);if(wanted)st.textContent='★'.repeat(wanted)+'☆'.repeat(3-wanted);}
const polDet=mergeGeometries([AITYPES[0].det,colored(box(1.87,.16,3.9,0,.72,0),'#1f4fd6')]);
MAT.polBody=toon({color:0xf4f4f0});MAT.polR=toon({color:0x550000,emissive:0xff2020,emissiveIntensity:2});MAT.polB=toon({color:0x000055,emissive:0x2a5cff,emissiveIntensity:2});
const police=[];
function mkPolice(){const g=new THREE.Group(),b=new THREE.Mesh(AITYPES[0].body,MAT.polBody);b.castShadow=true;g.add(b,new THREE.Mesh(polDet,MAT.aiDet),new THREE.Mesh(AITYPES[0].li,MAT.aiLight),
 new THREE.Mesh(box(.5,.18,.35,-.33,1.72,-.2),MAT.polR),new THREE.Mesh(box(.5,.18,.35,.33,1.72,-.2),MAT.polB));scene.add(g);return g;}
function spawnPolice(){const fx=Math.sin(car.h),fz=Math.cos(car.h);for(const ch of [...chunks.values()].filter(c=>c.state==='ready'&&rectD(c.rect,car.x,car.z)<300)){const a=ch.rseg,n=a.length/RS;
 for(let tries=0;tries<40;tries++){const k=Math.floor(Math.random()*n)*RS;if(a[k+9]>1||a[k+7])continue;const mx=(a[k]+a[k+3])/2,mz=(a[k+1]+a[k+4])/2,d=Math.hypot(mx-car.x,mz-car.z);
  if(d<110||d>260||(mx-car.x)*fx+(mz-car.z)*fz>40)continue;const p={ch,k,dir:Math.random()<.5?1:-1,t:Math.random(),v:10,lane:0,base:1,vmax:40,chase:true,mode:'route',turn:0,g:mkPolice()};
  place(p,RS);p.x=p.tx_;p.z=p.tz_;p.y=p.ty_;p.vh=Math.atan2(p.ux,p.uz);police.push(p);return true;}}return false;}
function dropPolice(i){const p=police[i];scene.remove(p.g);police.splice(i,1);}
function busted(){const fine=5000*wanted;addMoney(-fine);status('🚓 Elkaptak! Bírság: '+fmtFt(fine),5);wanted=0;while(police.length)dropPolice(0);car.vx=car.vz=car.vF=0;tone(220,0,.5,'sawtooth',.05);}
function updPolice(dt){if(!started)return;flashT+=dt;const fl=Math.floor(flashT*6)%2;MAT.polR.emissiveIntensity=fl?3:.2;MAT.polB.emissiveIntensity=fl?.2:3;
 if(wanted>0){polSpawnT-=dt;if(polSpawnT<=0&&police.length<Math.min(2,wanted)){polSpawnT=spawnPolice()?4:.4;}}
 let nearest=1e9;
 for(let i=police.length-1;i>=0;i--){const p=police[i],dist=Math.hypot(car.x-p.x,car.z-p.z);if(!wanted||dist>480||(p.mode==='route'&&p.ch.state!=='ready')){dropPolice(i);continue;}nearest=Math.min(nearest,dist);
  const ps=Math.abs(car.vF);
  if(p.mode==='route'){p.turn=Math.max(0,p.turn-dt);let tgt=dist>60?31:Math.max(9,ps+4);if(p.turn>0)tgt=Math.min(tgt,13);p.v+=Math.max(-12*dt,Math.min(7*dt,tgt-p.v));
   if(!advance(p,p.v*dt,RS)){p.dir=-p.dir;p.t=0;place(p,RS);}const k=1-Math.exp(-dt*10);p.x+=(p.tx_-p.x)*k;p.z+=(p.tz_-p.z)*k;p.y+=(p.ty_-p.y)*k;p.vh+=wrap(Math.atan2(p.ux,p.uz)-p.vh)*Math.min(1,dt*6);
   p.ut=(p.ut||0)-dt;if(p.ut<=0&&dist>70&&p.turn<=0){p.ut=2.5;if(Math.sin(p.vh)*(car.x-p.x)+Math.cos(p.vh)*(car.z-p.z)<-.45*dist){p.dir=-p.dir;p.t=1-p.t;place(p,RS);p.v*=.3;p.turn=1.5;}}
   if(dist<45)p.mode='direct';}
  else{const want=Math.atan2(car.x-p.x,car.z-p.z);p.vh+=wrap(want-p.vh)*Math.min(1,dt*2.6);const tgt=dist<11?Math.max(0,Math.min(ps+3,(dist-5.8)*1.5)):Math.min(33,ps+5);p.v+=Math.max(-14*dt,Math.min(8*dt,tgt-p.v));
   p.x+=Math.sin(p.vh)*p.v*dt;p.z+=Math.cos(p.vh)*p.v*dt;const sy=surfaceAt(p.x,p.z,p.y+2);p.y+=(sy-p.y)*Math.min(1,dt*8);
   forSegs(p.x,p.z,2,1,(a,k)=>{if(p.y+.6<a[k+4]||p.y>a[k+5])return;const r=proj(p.x,p.z,a[k],a[k+1],a[k+2],a[k+3]);if(r.d<1.4&&r.d>1e-4){p.x+=(p.x-r.px)/r.d*(1.4-r.d);p.z+=(p.z-r.pz)/r.d*(1.4-r.d);p.v*=.97;}});
   if(dist>75){let best=null,bd=25;forSegs(p.x,p.z,25,0,(a,k,ch)=>{if(a[k+9]>1||a[k+7])return;const r=proj(p.x,p.z,a[k],a[k+1],a[k+3],a[k+4]);if(r.d<bd){bd=r.d;best={ch,k,t:r.t,dx:a[k+3]-a[k],dz:a[k+4]-a[k+1]};}});
    if(best){p.ch=best.ch;p.k=best.k;p.dir=(best.dx*Math.sin(p.vh)+best.dz*Math.cos(p.vh))>0?1:-1;p.t=p.dir>0?best.t:1-best.t;place(p,RS);p.mode='route';}}}
  p.g.position.set(p.x,p.y,p.z);p.g.rotation.set(0,p.vh,0);
  if(dist<7.5&&ps<2.2)bustT+=dt;}
 if(!police.some(p=>Math.hypot(car.x-p.x,car.z-p.z)<7.5))bustT=Math.max(0,bustT-dt*.5);if(bustT>2.6){bustT=0;busted();}
 if(wanted>0){if(nearest>150)escapeT+=dt;else escapeT=Math.max(0,escapeT-dt*2);if(escapeT>9){escapeT=0;wanted--;status(wanted?'Csökkent a körözés.':'Leráztad a rendőröket! 😎',3);if(!wanted)while(police.length)dropPolice(0);}}
 if(au){const t=au.c.currentTime,on=!muted&&nearest<220;au.sg.gain.setTargetAtTime(on?.014*(1-nearest/220)**1.5:0,t,.2);au.s1.frequency.setTargetAtTime(760+260*Math.sin(flashT*2.1),t,.05);}}
