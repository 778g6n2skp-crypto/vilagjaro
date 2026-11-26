/* ---------- kamera, vizuál ---------- */
let camH=0,camYaw=0,camPit=0,camZoom=1,dragging=false,dragT=0,lastPX=0,lastPY=0;
$('c').addEventListener('pointerdown',e=>{dragging=true;lastPX=e.clientX;lastPY=e.clientY;$('c').setPointerCapture(e.pointerId);});
addEventListener('pointerup',()=>{dragging=false;dragT=performance.now();});
addEventListener('pointermove',e=>{if(!dragging)return;camYaw-=(e.clientX-lastPX)*.006;camPit=Math.max(-.3,Math.min(.9,camPit+(e.clientY-lastPY)*.004));lastPX=e.clientX;lastPY=e.clientY;});
$('c').addEventListener('wheel',e=>{camZoom=Math.max(.6,Math.min(2.2,camZoom*(e.deltaY>0?1.08:.93)));e.preventDefault();},{passive:false});
const cam={pos:new THREE.Vector3(0,5,-10),look:new THREE.Vector3(),shake:0};
function updateCar(dt){const fx=Math.sin(car.h),fz=Math.cos(car.h),px=Math.cos(car.h),pz=-Math.sin(car.h);
 const hf=surfaceAt(car.x+fx*1.4,car.z+fz*1.4,car.y),hb=surfaceAt(car.x-fx*1.4,car.z-fz*1.4,car.y),hl=surfaceAt(car.x+px*.8,car.z+pz*.8,car.y),hr=surfaceAt(car.x-px*.8,car.z-pz*.8,car.y);
 car.slope=Math.max(-.5,Math.min(.5,(hf-hb)/2.8));const tp=car.ground?Math.atan2(hf-hb,2.8):car.pitch*.98,tr=car.ground?Math.atan2(hl-hr,1.6):car.roll;
 car.pitch+=(tp-car.pitch)*Math.min(1,dt*12);car.roll+=(tr-car.roll)*Math.min(1,dt*12);
 const lat=car.vF*car.vF*Math.tan(car.steer)/(CAR.len*.6);car.lean+=(Math.max(-.07,Math.min(.07,-lat*.005))-car.lean)*Math.min(1,dt*6);
 const acc=inp.brk&&car.vF>1?.04:inp.thr?-.022:0;car.dip+=(acc-car.dip)*Math.min(1,dt*5);
 carMesh.position.set(car.x,car.y,car.z);carMesh.rotation.set(-car.pitch,car.h,car.roll,'YXZ');carParts.body.rotation.set(car.dip,0,car.lean);
 for(const w of carParts.wheels)w.rotation.x+=car.vF*dt/.4;for(const p of carParts.pivots)p.rotation.y=car.steer;
 carParts.tail.emissiveIntensity=inp.brk&&car.vF>0?3:.5+tCur.night*1.5;
 const ri=roadInfo(car.x,car.z);car.onRoad=!!(ri&&ri.d<.6&&ri.cls<2)||!!(ri&&ri.d<.3);
 const th=terrainH(car.x,car.z),inW=!isNaN(th)&&car.ground&&car.y<th+.05&&waterAt();
 if(inW){car.wet+=dt;if(car.wet>1.2){status('Csobbanás! Vissza az útra…',2.5);resetCar(false);}}else car.wet=0;
 return ri;}
function waterAt(){const t=tileOf(car.x,car.z),ch=chunks.get(t[0]+','+t[1]);if(!ch||!ch.wm)return false;const [la,lo]=toLL(car.x,car.z);
 const c=Math.round(lon2fx(lo)*G-t[0]*G),r=Math.round(lat2fy(la)*G-t[1]*G);return !!ch.wm[r*(G+1)+c];}
function updateCam(dt){const sp=Math.hypot(car.vx,car.vz);let dx=Math.sin(car.h),dz=Math.cos(car.h);
 if(sp>4&&car.vF>0){dx=dx*.6+car.vx/sp*.4;dz=dz*.6+car.vz/sp*.4;}
 camH+=wrap(Math.atan2(dx,dz)-camH)*Math.min(1,dt*(camMode===2?20:4.2));cam.shake=Math.max(cam.shake*Math.exp(-dt*5),car.impact*.03);car.impact=0;
 const s=Math.min(sp,60);
 const inC=camMode===2,cp=carParts;if(cp.cock){cp.cock.visible=inC;cp.cab.visible=!inC;const sx=LHT?-1:1;cp.cockWheel.position.x=cp.drvX*sx;cp.gauge.position.x=cp.drvX*sx;for(const o of cp.cock.children)if(o.userData.dx)o.position.x=cp.drvX*sx;cp.seats[0].visible=sx>0;cp.seats[1].visible=sx<0;if(inC){carMesh.updateMatrixWorld(true);const o=new THREE.Vector3(0,0,cp.clipZ),n=new THREE.Vector3(0,0,1);cp.body.localToWorld(o);n.transformDirection(cp.body.matrixWorld);cp.clip.setFromNormalAndCoplanarPoint(n,o);if(!cp.clipOn){cp.clipOn=true;for(const m of cp.clipM){m.clippingPlanes=[cp.clip];m.needsUpdate=true;}}}else if(cp.clipOn){cp.clipOn=false;for(const m of cp.clipM){m.clippingPlanes=[];m.needsUpdate=true;}}cp.cockWr.rotation.z=-car.steer*7.5;
  if(inC&&(cp.gT=(cp.gT||0)+dt)>.1){cp.gT=0;const g=cp.gcv.getContext('2d'),kmh=Math.round(sp*3.6),rpm=car.rpm||0;g.fillStyle='#07080b';g.fillRect(0,0,256,96);
   g.fillStyle='#1d2230';g.fillRect(14,66,228,12);const fr=Math.min(1,rpm);g.fillStyle=fr>.9?'#ff4b4b':'#ffb347';g.fillRect(14,66,228*fr,12);g.fillStyle='#e9edf3';g.font='bold 44px system-ui,sans-serif';g.textAlign='center';g.fillText(kmh,100,54);
   g.font='15px system-ui,sans-serif';g.fillStyle='#9aa3b2';g.fillText('km/h',100,92-4);g.font='bold 30px system-ui,sans-serif';g.fillStyle='#7fd1ff';g.fillText(GB.g<0?'R':String(GB.g),205,50);cp.gtx.needsUpdate=true;}}
 camera.near=inC?.06:.3;
 if(inC){carMesh.updateMatrixWorld(true);const sx=LHT?-1:1,yw=camYaw,pt=camPit*.6;if(!dragging&&performance.now()-dragT>1600){camYaw*=Math.exp(-dt*2.2);camPit*=Math.exp(-dt*2.2);}
  const e=new THREE.Vector3(cp.drvX*sx,cp.eye,cp.seatZ),f=new THREE.Vector3(cp.drvX*sx+Math.sin(yw)*30,cp.eye-.9-pt*20,Math.cos(yw)*30+cp.seatZ);cp.body.localToWorld(e);cp.body.localToWorld(f);
  cam.pos.copy(e);cam.look.copy(f);camera.position.copy(e);camera.lookAt(f);camera.fov=68+s*.12;camera.updateProjectionMatrix();return;}
 if(car.spawned)carMesh.visible=camMode!==3;// lökhárító-kamera: a saját autó nem lóg bele a képbe
 if(camMode===3){const hl2=(CAR.len||4.4)/2;cam.pos.set(car.x+Math.sin(car.h)*hl2*.9,car.y+1.05,car.z+Math.cos(car.h)*hl2*.9);cam.look.set(car.x+Math.sin(car.h)*30,car.y+1+Math.sin(car.pitch)*30,car.z+Math.cos(car.h)*30);camera.position.copy(cam.pos);}
 else{if(!dragging&&performance.now()-dragT>1600){camYaw*=Math.exp(-dt*2.2);camPit*=Math.exp(-dt*2.2);}const ch2=camH+camYaw;
  let [d,h]=camMode===0?[7.2+s*.035,2.7+s*.01]:[14+s*.05,6.5];d*=camZoom;h=h*camZoom+camPit*d;const tx=car.x-Math.sin(ch2)*d,tz=car.z-Math.cos(ch2)*d;let ty=car.y+h;const g=terrainH(tx,tz);if(!isNaN(g))ty=Math.max(ty,g+1.2);
  const k=1-Math.exp(-dt*9);cam.pos.x+=(tx-cam.pos.x)*k;cam.pos.z+=(tz-cam.pos.z)*k;cam.pos.y+=(ty-cam.pos.y)*(1-Math.exp(-dt*5));
  cam.look.set(car.x+Math.sin(ch2)*4,car.y+1.2,car.z+Math.cos(ch2)*4);camera.position.copy(cam.pos);}
 const sk=CFG.shake?cam.shake+(s>30?(s-30)*.0008:0):0;camera.position.x+=(Math.random()-.5)*sk;camera.position.y+=(Math.random()-.5)*sk;
 camera.lookAt(cam.look);camera.fov=58+s*.33;camera.updateProjectionMatrix();}
