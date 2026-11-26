/* ---------- játékos autók (garázs) ---------- */
const CARS=[
 {id:'kis',gears:5,n:'Kisautó',d:'Fürge városi kisautó, szűk utcákba',ph:{m:1150,P:70e3,T:175,red:6200,gr:[3.62,1.95,1.28,.97,.78],fd:4.17,rw:.3,drv:'F',CdA:.64,L:2.56,cgF:.61,h:.52,mu:1,offMu:.62,lock:.62,esc:.6},vmax:52,t100:10.8,acc:9.5,grip:1.05,off:.72,steer:.7,brake:16,len:3.7,wid:1.72,wheel:.36,prof:'hatch',snd:['sawtooth',42,150]},
 {id:'szedan',gears:6,n:'Szedán',d:'Kiegyensúlyozott, kényelmes túraautó',ph:{m:1360,P:110e3,T:250,red:6200,gr:[3.77,2.12,1.36,1.03,.86,.69],fd:3.9,rw:.316,drv:'F',CdA:.6,L:2.69,cgF:.6,h:.53,mu:1,offMu:.62,lock:.58,esc:.55},vmax:64,t100:8.2,acc:11.5,grip:1,off:.72,steer:.62,brake:17,len:4.5,wid:1.82,wheel:.38,prof:'sedan',snd:['sawtooth',34,130]},
 {id:'sport',gears:6,n:'Sportkocsi',d:'Gyors, alacsony, hátsókerék-hajtás',ph:{m:1505,P:283e3,T:450,red:7400,gr:[3.91,2.29,1.58,1.18,.94,.79],fd:3.44,rw:.345,drv:'R',CdA:.78,L:2.45,cgF:.39,h:.45,mu:1.15,offMu:.55,lock:.56,esc:.5},vmax:81,t100:4.2,acc:16,grip:1.2,off:.55,steer:.6,brake:21,len:4.4,wid:1.92,wheel:.38,prof:'sport',snd:['sawtooth',30,175]},
 {id:'suv',gears:5,n:'Terepjáró',d:'Magas, összkerékhajtású, a földúton is otthon van',ph:{m:1750,P:129e3,T:255,red:6000,gr:[3.6,2.1,1.4,1,.8],fd:4.1,rw:.36,drv:'A',CdA:1,vlim:50,L:2.69,cgF:.58,h:.66,mu:.95,offMu:.85,lock:.6,esc:.7},vmax:50,t100:9.5,acc:10.5,grip:.95,off:1,steer:.6,brake:16,len:4.6,wid:1.96,wheel:.46,prof:'suv',snd:['square',28,110]},
 {id:'trabi',gears:4,n:'Trabant',d:'26 lóerő, kétütemű, imádnivaló',ph:{m:615,P:19.4e3,T:54,red:4200,gr:[4.08,2.32,1.52,1.03],fd:4.33,rw:.29,drv:'F',CdA:.65,L:2.02,cgF:.56,h:.5,mu:.85,offMu:.6,lock:.6,esc:.4},vmax:30,t100:21,acc:5.6,grip:.9,off:.7,steer:.7,brake:12,len:3.55,wid:1.52,wheel:.33,prof:'trabi',snd:['square',58,190]}];
const PROF={
 sedan:{lo:[[1,.32],[1.02,.62],[.9,.76],[.52,.86],[-.82,.9],[-.98,.84],[-1.01,.42],[-.93,.28],[.92,.28]],cab:[[.5,.85],[.16,1.42],[-.45,1.44],[-.8,.88]]},
 hatch:{lo:[[1,.32],[1.02,.64],[.88,.78],[.5,.88],[-.9,.92],[-1,.86],[-1.01,.42],[-.93,.28],[.92,.28]],cab:[[.48,.86],[.12,1.46],[-.86,1.44],[-.97,.9]]},
 sport:{lo:[[1,.26],[1.03,.48],[.85,.62],[.3,.7],[-.85,.76],[-1,.7],[-1.02,.36],[-.92,.22],[.92,.22]],cab:[[.3,.68],[-.02,1.08],[-.45,1.1],[-.86,.74]]},
 suv:{lo:[[1,.42],[1.02,.86],[.88,1.0],[.5,1.06],[-.95,1.08],[-1,1.0],[-1.01,.5],[-.93,.36],[.92,.36]],cab:[[.48,1.04],[.28,1.72],[-.94,1.74],[-.98,1.06]]},
 trabi:{lo:[[1,.34],[1.02,.64],[.95,.72],[.46,.8],[-.9,.84],[-1,.78],[-1.02,.42],[-.95,.3],[.94,.3]],cab:[[.46,.78],[.24,1.36],[-.62,1.38],[-.84,.82]]}};
const PAINT=['#ff5d8f','#4d80e4','#f9b84a','#14b1ab','#9fd3c7','#ef476f','#fffaf0','#2b2540','#8a6fd8','#06d6a0'];
let carSel=1,carCol='#ff5d8f';try{const sv=JSON.parse(localStorage.getItem('vj_car')||'null');if(sv){carSel=Math.min(CARS.length-1,sv.i|0);carCol=sv.c||carCol;}}catch(e){}
let CAR=CARS[carSel];
const carParts={lights:[]};
function makeCar(def,col){const g=new THREE.Group(),body=new THREE.Group();g.add(body);const P=PROF[def.prof],hl=def.len/2;
 const paint=new THREE.MeshPhysicalMaterial({color:new THREE.Color(col),roughness:.32,metalness:.35,clearcoat:1,clearcoatRoughness:.08}),dark=toon({color:0x1e1d24,roughness:.6}),glass=toon({color:0x1c2a3a,roughness:.06,metalness:.7}),white=toon({color:0xf2f2ee,roughness:.4});
 const shp=pts=>{const sh=new THREE.Shape();sh.moveTo(pts[0][0]*hl,pts[0][1]);for(const q of pts.slice(1))sh.lineTo(q[0]*hl,q[1]);return sh;};
 const lower=new THREE.ExtrudeGeometry(shp(P.lo),{depth:def.wid-.28,bevelEnabled:true,bevelSize:.14,bevelThickness:.14,bevelSegments:3,curveSegments:2}).translate(0,0,-(def.wid-.28)/2).rotateY(-Math.PI/2);
 const m=new THREE.Mesh(lower,paint);m.castShadow=true;body.add(m);
 const cg=new THREE.ExtrudeGeometry(shp(P.cab),{depth:def.wid-.48,bevelEnabled:true,bevelSize:.1,bevelThickness:.1,bevelSegments:3}).translate(0,0,-(def.wid-.48)/2).rotateY(-Math.PI/2);
 const cm=new THREE.Mesh(cg,glass);cm.castShadow=true;body.add(cm);
 const z1=P.cab[1][0]*hl,z2=P.cab[2][0]*hl,ry=Math.max(P.cab[1][1],P.cab[2][1]);
 body.add(new THREE.Mesh(new THREE.BoxGeometry(def.wid-.3,.1,Math.abs(z1-z2)+.2).translate(0,ry+.1,(z1+z2)/2),def.prof==='trabi'?white:paint));
 if(def.prof==='sport'){body.add(new THREE.Mesh(new THREE.BoxGeometry(def.wid-.2,.08,.4).translate(0,1.0,-hl+.25),dark),new THREE.Mesh(new THREE.BoxGeometry(.1,.25,.1).translate(.6,.86,-hl+.3),dark),new THREE.Mesh(new THREE.BoxGeometry(.1,.25,.1).translate(-.6,.86,-hl+.3),dark));}
 if(def.prof==='suv')body.add(new THREE.Mesh(new THREE.BoxGeometry(def.wid-.4,.08,1.6).translate(0,1.86,-.6),dark));
 else body.add(new THREE.Mesh(new THREE.BoxGeometry(.36,.02,def.len-.4).translate(0,P.lo[3][1]+.13,0),white));
 const head=toon({color:0xffffff,emissive:0xfff1c9,emissiveIntensity:.3}),tail=toon({color:0x9b1030,emissive:0xff2d55,emissiveIntensity:.5});
 const fy=P.lo[1][1]-.02,ry2=P.lo[6][1]+.25;
 for(const s of [-1,1]){const h=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),head);h.position.set(s*(def.wid/2-.3),fy,hl+.04);body.add(h);
  const t=new THREE.Mesh(new THREE.BoxGeometry(.4,.14,.1),tail);t.position.set(s*(def.wid/2-.32),ry2,-hl-.04);body.add(t);}
 const tire=new THREE.CylinderGeometry(def.wheel,def.wheel,.3,16).rotateZ(Math.PI/2),rim=new THREE.CylinderGeometry(def.wheel*.55,def.wheel*.55,.32,10).rotateZ(Math.PI/2);
 const wheels=[],pivots=[],wz=hl*.64,wx=def.wid/2-.04;
 for(const [x,z] of [[wx,wz],[-wx,wz],[wx,-wz],[-wx,-wz]]){const pv=new THREE.Group();pv.position.set(x,def.wheel,z);g.add(pv);
  const wh=new THREE.Group(),t=new THREE.Mesh(tire,dark);t.castShadow=true;wh.add(t,new THREE.Mesh(rim,white));pv.add(wh);wheels.push(wh);if(z>0)pivots.push(pv);}
 const lights=[];for(const s of [-1,1]){const l=new THREE.SpotLight(0xfff1d8,0,70,.5,.45,1.2);l.position.set(s*.6,.7,hl);l.target.position.set(s*.9,0,16);g.add(l,l.target);lights.push(l);}
 // ---- belső tér (vezetőülés-nézet): műszerfal, kormány, oszlopok, tükrök, ülések; csak belső nézetben látszik ----
 // belső nézetben a karosszéria a műszerfal mögött le van vágva (clip plane), így elöl a motorháztető látszik, bent a kárpit
 const cock=new THREE.Group();cock.visible=false;body.add(cock);const C=P.cab,W2=def.wid/2,beltT=Math.max(P.lo[3][1],P.lo[4][1])+.04,roofY=Math.min(C[1][1],C[2][1]),eye=Math.min(roofY-.17,Math.max(roofY-.28,beltT+.3)),zF=C[0][0]*hl,zWT=C[1][0]*hl,zR=C[2][0]*hl,zB=C[3][0]*hl;
 const im=new THREE.MeshStandardMaterial({color:0x1b1c20,roughness:.85}),im2=new THREE.MeshStandardMaterial({color:0x34353c,roughness:.75}),seatM=new THREE.MeshStandardMaterial({color:0x2a2622,roughness:.95}),mir=new THREE.MeshStandardMaterial({color:0x8fa4b8,roughness:.05,metalness:1});
 const bx=(w,h,d,x,y,z,mt,rx)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);if(rx)m.rotation.x=rx;cock.add(m);return m;};
 const dTop=Math.min(beltT+.1,eye-.17),dashZ=zF-.3;
 bx(def.wid-.24,dTop-.25,.6,0,(dTop+.25)/2,dashZ,im);bx(def.wid-.26,.04,.62,0,dTop,dashZ+.04,im2,-.1);// műszerfal
 bx(def.wid-.3,.03,Math.abs(zWT-zR)+.3,0,roofY+.1,(zWT+zR)/2,im2);// tetőkárpit (a külső tető magasságában)
 bx(.34,.28,1.1,0,.5,dashZ-.85,im);// középkonzol
 bx(def.wid-.24,.04,Math.abs(zF-zB)+.3,0,.3,(zF+zB)/2,im);// padló
 for(const sd of [-1,1]){const x=sd*(W2-.2),a=new THREE.Vector3(x,beltT,zF),b=new THREE.Vector3(x*.97,roofY+.1,zWT),L=a.distanceTo(b);
  const pl=new THREE.Mesh(new THREE.BoxGeometry(.09,L,.12),im);pl.position.copy(a).add(b).multiplyScalar(.5);pl.lookAt(b);pl.rotateX(Math.PI/2);cock.add(pl);// A-oszlop
  const c2=new THREE.Vector3(x,beltT,zB),d2=new THREE.Vector3(x*.97,roofY+.1,zR),L2=c2.distanceTo(d2),pc=new THREE.Mesh(new THREE.BoxGeometry(.12,L2,.34),im);pc.position.copy(c2).add(d2).multiplyScalar(.5);pc.lookAt(d2);pc.rotateX(Math.PI/2);cock.add(pc);// C-oszlop
  bx(.05,beltT-.3,Math.abs(zF-zB)+.2,sd*(W2-.08),(beltT+.3)/2,(zF+zB)/2,im2);bx(.12,.04,Math.abs(zF-zB),sd*(W2-.12),beltT,(zF+zB)/2,im);// ajtókárpit + könyöklő
  const sm=new THREE.Group();sm.position.set(sd*(W2+.08),beltT+.1,zF-.1);cock.add(sm);sm.add(new THREE.Mesh(new THREE.BoxGeometry(.2,.13,.08),im));const sg=new THREE.Mesh(new THREE.PlaneGeometry(.17,.1),mir);sg.position.z=-.045;sg.rotation.y=Math.PI;sm.add(sg);}// oldaltükör
 bx(.26,.07,.03,0,roofY-.12,zWT-.12,im);const rvg=new THREE.Mesh(new THREE.PlaneGeometry(.23,.055),mir);rvg.position.set(0,roofY-.12,zWT-.137);rvg.rotation.y=Math.PI;cock.add(rvg);// belső tükör
 bx(def.wid-.3,.05,.5,0,beltT-.02,zB+.15,im);// hátsó kalaptartó
 const drvX=W2*.42,seatZ=dashZ-1.25;
 const seats=[];for(const sd of [-1,1]){const sg=new THREE.Group();sg.position.set(sd*drvX,0,seatZ);cock.add(sg);const cu=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.52),seatM);cu.position.set(0,.42,.05);sg.add(cu);
  const bk=new THREE.Mesh(new THREE.BoxGeometry(.5,.62,.12),seatM);bk.position.set(0,.76,-.24);bk.rotation.x=-.18;sg.add(bk);seats.push(sg);}// ülések (a vezetőé a kamera mögött)
 const wheel=new THREE.Group(),wr=new THREE.Group();wheel.add(wr);wr.add(new THREE.Mesh(new THREE.TorusGeometry(.185,.024,8,28),im));wr.add(new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.06,12).rotateX(Math.PI/2),im2));
 for(const a of [0,Math.PI*2/3,Math.PI*4/3]){const sp=new THREE.Mesh(new THREE.BoxGeometry(.17,.03,.02),im2);sp.position.set(Math.cos(a-Math.PI/2)*.09,Math.sin(a-Math.PI/2)*.09,0);sp.rotation.z=a-Math.PI/2;wr.add(sp);}
 wheel.position.set(drvX,dTop-.17,dashZ-.52);wheel.rotation.x=-.5;cock.add(wheel);
 const gcv=document.createElement('canvas');gcv.width=256;gcv.height=96;const gtx=new THREE.CanvasTexture(gcv);gtx.colorSpace=THREE.SRGBColorSpace;
 const gauge=new THREE.Mesh(new THREE.PlaneGeometry(.34,.13),new THREE.MeshBasicMaterial({map:gtx,toneMapped:false}));gauge.position.set(drvX,dTop+.03,dashZ-.36);gauge.rotation.set(.25,Math.PI,0);cock.add(gauge);bx(.42,.04,.2,drvX,dTop+.12,dashZ-.32,im).userData.dx=1;bx(.42,.14,.04,drvX,dTop+.04,dashZ-.24,im).userData.dx=1;// műszeregység + ernyő
 cock.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 const clip=new THREE.Plane(),clipM=[paint,white];
 Object.assign(carParts,{body,head,tail,wheels,pivots,lights,cock,cab:cm,cockWheel:wheel,cockWr:wr,gauge,gcv,gtx,eye,seatZ,drvX,seats,clip,clipM,clipZ:dashZ+.32});return g;}
let carMesh=makeCar(CAR,carCol);scene.add(carMesh);carMesh.visible=false;$('cname').textContent='km/h · '+CAR.n;
function setCar(i,col){carSel=i;carCol=col;CAR=CARS[i];const vis=carMesh.visible;scene.remove(carMesh);carMesh.traverse(o=>{if(o.geometry)o.geometry.dispose();});carMesh=makeCar(CAR,col);carMesh.visible=vis;scene.add(carMesh);
 try{localStorage.setItem('vj_car',JSON.stringify({i,c:col}));}catch(e){}$('cname').textContent='km/h · '+CAR.n;if(au){au.o1.type=CAR.snd[0];}tN=-1;}
function garageUI(){const box=$('cars');box.textContent='';const mx={vmax:80,acc:16,grip:1.2,off:1};
 CARS.forEach((c,i)=>{const b=document.createElement('button');b.className='car'+(i===carSel?' on':'');const t=document.createElement('b');t.textContent=c.n;const d=document.createElement('small');d.textContent=c.d+' · 0–100: '+c.t100.toString().replace('.',',')+' s · max. '+Math.round(c.vmax*3.6)+' km/h · '+Math.round(c.ph.P/735.5)+' LE';b.append(t,d);
  for(const [lab,k] of [['Végsebesség','vmax'],['Gyorsulás','acc'],['Tapadás','grip'],['Terep','off']]){const r=document.createElement('div');r.className='bar';const sp=document.createElement('span');sp.textContent=lab;const iEl=document.createElement('i');iEl.style.setProperty('--w',Math.round(c[k]/mx[k]*100)+'%');r.append(sp,iEl);b.append(r);}
  b.onclick=()=>{setCar(i,carCol);garageUI();};box.appendChild(b);});
 const cb=$('cols');while(cb.children.length>1)cb.lastChild.remove();
 for(const c of PAINT){const s=document.createElement('button');s.className='sw'+(c===carCol?' on':'');s.style.background=c;s.setAttribute('aria-label','Szín '+c);s.onclick=()=>{setCar(carSel,c);garageUI();};cb.appendChild(s);}}
let garageOpen=false;function toggleGarage(){garageOpen=!garageOpen;$('garage').classList.toggle('hide',!garageOpen);keys.clear();if(garageOpen)garageUI();else $('c').focus();}
