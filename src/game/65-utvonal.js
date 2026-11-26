/* ---------- útvonal (GPS) – sima, az úttestre simuló, animált nyilakkal ---------- */
let route=null,routeMesh=null,routeDirty=false,routeBuildT=0,rerouteT=0;
const MOD={left:'balra',right:'jobbra','slight left':'enyhén balra','slight right':'enyhén jobbra','sharp left':'élesen balra','sharp right':'élesen jobbra',straight:'egyenesen',uturn:'fordulj meg'};
const ARR={left:'⬅',right:'➡','slight left':'⬉','slight right':'⬈','sharp left':'↙','sharp right':'↘',straight:'⬆',uturn:'↩'};
const gpsMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-12,polygonOffsetUnits:-12,side:THREE.DoubleSide,
 uniforms:{carAl:{value:0},time:{value:0},col:{value:new THREE.Color(0xff5d8f)}},
 vertexShader:'attribute float al;attribute float sd;varying float vAl;varying float vSd;void main(){vAl=al;vSd=sd;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform float carAl,time;uniform vec3 col;varying float vAl;varying float vSd;void main(){if(vAl<carAl-1.)discard;float fade=smoothstep(carAl-1.,carAl+8.,vAl);float ch=fract((vAl-abs(vSd)*1.4)/6.-time*.8);vec3 c=mix(col,vec3(1.),step(.74,ch)*.9);float e=1.-smoothstep(.82,1.,abs(vSd));gl_FragColor=vec4(c,.9*fade*e);\n#include <colorspace_fragment>\n}'});
async function setRoute(lat,lon){const [la,lo]=toLL(car.x,car.z);status('Útvonaltervezés…',3);
 try{const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+lo.toFixed(6)+','+la.toFixed(6)+';'+lon.toFixed(6)+','+lat.toFixed(6)+'?overview=full&geometries=geojson&steps=true');
  const j=await r.json();if(!j.routes||!j.routes.length)throw 0;const rt=j.routes[0],steps=[];
  for(const lg of rt.legs||[])for(const st of lg.steps||[]){const m=st.maneuver||{};if(m.type==='depart')continue;steps.push({ll:[m.location[1],m.location[0]],type:m.type,mod:m.modifier||'straight',name:st.name||'',exit:m.exit});}
  route={ll:rt.geometry.coordinates.map(c=>[c[1],c[0]]),dest:[lat,lon],steps};routeLocal();
  if(mapObj&&mapObj.getSource('route'))mapObj.getSource('route').setData({type:'Feature',geometry:rt.geometry});status('Útvonal kész – kövesd a nyilakat!',3);}
 catch(e){route={ll:[[la,lo],[lat,lon]],dest:[lat,lon],steps:[],straight:1};routeLocal();status('Az útvonaltervező most nem elérhető – egyenes irányt mutatok.',4);}}
function chaikin(P,it){for(let k=0;k<it;k++){const Q=[P[0]];for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];Q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);}Q.push(P[P.length-1]);P=Q;}return P;}
function routeLocal(){if(!route)return;const raw=route.ll.map(p=>toXZ(p[0],p[1])),D=[raw[0]];
 for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));for(let q=1;q<=n;q++)D.push([a[0]+(b[0]-a[0])*q/n,a[1]+(b[1]-a[1])*q/n]);}
 const P=chaikin(D,2),al=[0];for(let i=1;i<P.length;i++)al.push(al[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
 route.xz=P;route.al=al;route.total=al[al.length-1];route.idx=0;route.carAl=0;
 for(const st of route.steps){const q=toXZ(st.ll[0],st.ll[1]);let bi=0,bd=1e18;for(let i=0;i<P.length;i+=2){const d=(P[i][0]-q[0])**2+(P[i][1]-q[1])**2;if(d<bd){bd=d;bi=i;}}st.al=al[bi];}
 routeDirty=true;}
function clearRoute(){route=null;if(routeMesh){scene.remove(routeMesh);routeMesh.geometry.dispose();routeMesh=null;}$('route').textContent='';if(mapObj&&mapObj.getSource('route'))mapObj.getSource('route').setData({type:'FeatureCollection',features:[]});if(destMk){destMk.remove();destMk=null;}}
function roadY(x,z){let best=null,bd=1e9;forSegs(x,z,8,0,(a,k)=>{if(a[k+9]>1)return;const r=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]);if(r.d<a[k+6]+1.5&&r.d<bd){bd=r.d;best=a[k+2]+(a[k+5]-a[k+2])*r.t;}});
 if(best!=null)return best;const h=terrainH(x,z);return isNaN(h)?null:h+.15;}
function buildRouteMesh(){const P=route.xz,al=route.al,n=P.length,ys=new Float32Array(n),ok=new Uint8Array(n);
 for(let i=0;i<n;i++){const y=roadY(P[i][0],P[i][1]);if(y!=null){ys[i]=y;ok[i]=1;}}
 const sm=ys.slice();for(let i=1;i<n-1;i++)if(ok[i-1]&&ok[i]&&ok[i+1])sm[i]=(ys[i-1]+ys[i]*2+ys[i+1])/4;
 const pos=[],A=[],SD=[],idx=[];let prevOK=false;
 for(let i=0;i<n;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const w=.95,y=sm[i]+.3;
  pos.push(P[i][0]-tz*w,y,P[i][1]+tx*w,P[i][0]+tz*w,y,P[i][1]-tx*w);A.push(al[i],al[i]);SD.push(-1,1);
  if(i>0&&ok[i]&&ok[i-1]){const v=i*2;idx.push(v-2,v-1,v,v-1,v+1,v);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('al',new THREE.Float32BufferAttribute(A,1));g.setAttribute('sd',new THREE.Float32BufferAttribute(SD,1));g.setIndex(idx);g.computeBoundingSphere();
 if(routeMesh){scene.remove(routeMesh);routeMesh.geometry.dispose();}routeMesh=new THREE.Mesh(g,gpsMat);routeMesh.renderOrder=8;routeMesh.frustumCulled=false;scene.add(routeMesh);}
function fmtD(d){return d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.max(10,Math.round(d/10)*10)+' m';}
function updRoute(dt){if(!route||!car.spawned||!route.xz)return;const P=route.xz;
 let bi=route.idx,bd=1e18;for(let i=Math.max(0,route.idx-40);i<Math.min(P.length,route.idx+400);i++){const d=(P[i][0]-car.x)**2+(P[i][1]-car.z)**2;if(d<bd){bd=d;bi=i;}}
 if(Math.sqrt(bd)>120){for(let i=0;i<P.length;i++){const d=(P[i][0]-car.x)**2+(P[i][1]-car.z)**2;if(d<bd){bd=d;bi=i;}}}
 route.idx=bi;route.carAl+=(route.al[bi]-route.carAl)*Math.min(1,dt*6);gpsMat.uniforms.carAl.value=route.carAl;gpsMat.uniforms.time.value=performance.now()/1000;
 const rem=route.total-route.al[bi],off=Math.sqrt(bd);
 if(rem<25){clearRoute();if(mission){const bonus=Math.round(Math.max(0,mission.limit-mission.t)*20/100)*100;addMoney(mission.reward+bonus);status('📦 Kézbesítve! +'+fmtFt(mission.reward+bonus),4);mission=null;}else status('Megérkeztél! 🎉',4);tone(660,0,.15,'sine',.08);tone(880,.15,.25,'sine',.08);return;}
 rerouteT-=dt;if(off>60&&rerouteT<=0&&!route.straight){rerouteT=8;setRoute(route.dest[0],route.dest[1]);}
 routeBuildT-=dt;if(routeDirty&&routeBuildT<=0){routeDirty=false;routeBuildT=.6;buildRouteMesh();}
 const nx=route.steps.find(st=>st.al>route.carAl+6);const el=$('route');let html='';
 if(nx){const d=nx.al-route.carAl,mod=nx.mod;let txt=nx.type==='arrive'?'Cél':nx.type==='roundabout'||nx.type==='rotary'?'Körforgalom, '+(nx.exit||1)+'. kijárat':nx.type==='continue'||nx.type==='new name'?'Egyenesen':(MOD[mod]||'tovább');
  if(txt.length)txt=txt[0].toUpperCase()+txt.slice(1);const key=(nx.type==='arrive'?'⚑':ARR[mod]||'⬆')+'|'+fmtD(d)+' · '+txt+(nx.name?' – '+nx.name:'')+'|Cél: '+fmtD(rem);
  if(el.dataset.k!==key){el.dataset.k=key;const [ic,a,b]=key.split('|');el.textContent='';const B=document.createElement('b');B.textContent=ic;const sm=document.createElement('small');sm.textContent=b;el.append(B,a,sm);}}
 else{const key='⚑|Cél: '+fmtD(rem);if(el.dataset.k!==key){el.dataset.k=key;el.textContent='';const B=document.createElement('b');B.textContent='⚑';el.append(B,'Cél: '+fmtD(rem));}}}
