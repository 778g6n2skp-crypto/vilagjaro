/* ---------- fő ciklus ---------- */
let last=performance.now(),acc=0,frame=0,streamT=0;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;frame++;readInput(dt);
 streamT-=dt;if(streamT<=0){streamT=.25;streaming();}trySpawn();
 if(car.spawned){if(started){acc+=dt;while(acc>=1/120){physics(1/120);acc-=1/120;}}
  if(car.impact>2.5)thud(car.impact);const ri=updateCar(dt);updateCam(dt);updSignals(dt);updTrees(dt);updPolice(dt);updMission(dt);checkViolations(dt);updMly(dt);updPhotos(dt);updShopSigns(dt);if(window.__fc){camera.position.set(...window.__fc[0]);if(window.__fc[2])camera.up.set(...window.__fc[2]);camera.lookAt(...window.__fc[1]);camera.up.set(0,1,0);if(window.__fc[3]){camera.fov=window.__fc[3];camera.aspect=window.__fc[4];camera.updateProjectionMatrix();}}updTraffic(dt);updTrams(dt);updRoute(dt);updPlace(dt);setWhere(ri&&ri.d<15?ri.name:'');}
 else{camH+=dt*.12;const g=terrainH(0,0),y=isNaN(g)?100:g;camera.position.set(Math.sin(camH)*90,y+55,Math.cos(camH)*90);camera.lookAt(0,y,0);}
 applyTime(dt);sky.position.copy(camera.position);
 for(const ch of chunks.values()){if(ch.state!=='ready'||!ch.rise)continue;const f=Math.min(1,(now-ch.t0)/900);if(f<1||ch.rise.scale.y!==1){const e=1-(1-f)**3;ch.rise.scale.y=Math.max(.001,e);ch.rise.position.y=ch.baseY*(1-e);}}
 texWater.offset.set(now*.00002,now*.000012);
 sun.position.set(car.x+sunDir.x*400,car.y+Math.max(.2,sunDir.y)*400,car.z+sunDir.z*400);sun.target.position.set(car.x,car.y,car.z);
 $('kmh').textContent=Math.round(Math.abs(car.vF)*3.6);if(frame%10===0)hudLimit();$('cruise').textContent=cruise!=null?'Tempomat '+Math.round(cruise*3.6)+' km/h':'';
 if(frame%4===0)drawMini();updAudio();
 if(mapOpen&&meMk&&frame%10===0){const [la,lo]=toLL(car.x,car.z);meMk.setLngLat([lo,la]).setRotation(bearing());}
 if(statusT&&now>statusT){statusT=0;statusEl.textContent='';}
 if(!statusT)statusEl.textContent=car.spawned?'':'A város épül… ('+[...chunks.values()].filter(c=>c.state==='ready').length+' rész kész)';
 if(quality===0){bloom.strength=.06+tCur.night*.38;bloom.threshold=.94-tCur.night*.14;composer.render();}else renderer.render(scene,camera);
 perfTick(dt);}
applyCfg();let autoT=0;setInterval(()=>{if(CFG.autoTime){const k=autoTimeIdx();if(k!==tIdx){tIdx=(k+TIMES.length-1)%TIMES.length;nextTime();}}},5000);
requestAnimationFrame(loop);
window.__vj={memdbg:()=>wk.postMessage({t:'memdbg'}),surfDbg,colTop,meshSurf,TST,surfaceAt,SP,mly,THREE_TL:THREE.TextureLoader,THREE_Basic:THREE.MeshBasicMaterial,scene,camera,renderer,terrainH,PH,phProject,PHS,phRebuild,car,chunks,inp,keys,traffic,trams,status:()=>statusEl.textContent,sim:t=>{for(let k=0;k<t*120;k++){physics(1/120);if(k%2===0){updateCar(1/60);updSignals(1/60);updPolice(1/60);updTraffic(1/60);updTrams(1/60);}}updateCam(1);},
 time:k=>{tIdx=k;tK=1;Object.assign(tCur,pack(TIMES[k]));applyTime(0);},setRoute,toggleMap,get route(){return route;},crime:(n,m)=>crime(n,m),police,physics,GB,setCar:i=>setCar(i,carCol),jump:(a,b)=>jump(a,b,"teszt"),startMission,get wanted(){return wanted;},lightState,toLL,toXZ};
try{$('ver').textContent='Világjáró '+VERSION;}catch(e){}