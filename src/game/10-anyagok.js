/* ---------- anyagok ---------- */
function colored(geo,hex){const c=new THREE.Color(hex),n=geo.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;}
const grad=(()=>{const d=new Uint8Array([90,165,225,255]);const t=new THREE.DataTexture(d,4,1,THREE.RedFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t;})();
const toon=o=>new THREE.MeshStandardMaterial({roughness:.86,metalness:0,...o});
function cv(w,h,f,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
const rnd=(()=>{let a=1234567;return()=>{a=(a*16807)%2147483647;return a/2147483647;};})();
const speck=(g,w,h,n,cols,sz=2)=>{for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.fillRect(rnd()*w,rnd()*h,sz*(.5+rnd()),sz*(.5+rnd()));}};
const texRoad=[0,1,2].map(k=>cv(256,1024,(g,w,h)=>{g.fillStyle=k===2?'#d8cdb8':'#4d5058';g.fillRect(0,0,w,h);
 if(k<2){for(let i=0;i<40;i++){g.fillStyle=`rgba(${rnd()<.5?'30,30,35':'95,95,100'},${.05+rnd()*.06})`;g.beginPath();g.ellipse(rnd()*w,rnd()*h,10+rnd()*40,20+rnd()*90,0,0,6.3);g.fill();}
  speck(g,w,h,9000,['rgba(140,140,145,.35)','rgba(25,25,30,.4)','rgba(110,105,100,.3)'],2);
  const tg=g.createLinearGradient(0,0,w,0);for(const [u,a] of [[0,0],[.2,.09],[.3,0],[.7,0],[.8,.09],[1,0]])tg.addColorStop(u,`rgba(20,20,25,${a})`);g.fillStyle=tg;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(20,20,22,.35)';g.lineWidth=1.2;for(let i=0;i<6;i++){let x=rnd()*w,y=rnd()*h;g.beginPath();g.moveTo(x,y);for(let j=0;j<8;j++){x+=(rnd()-.5)*18;y+=rnd()*14;g.lineTo(x,y);}g.stroke();}}
 else speck(g,w,h,3000,['rgba(120,100,80,.25)','rgba(250,245,235,.3)'],2);}));
const texWalk=cv(128,128,(g,w,h)=>{g.fillStyle='#bdbab3';g.fillRect(0,0,w,h);for(let y=0;y<2;y++)for(let x=0;x<2;x++){const v=180+Math.floor(rnd()*22);g.fillStyle=`rgb(${v},${v-3},${v-9})`;g.fillRect(x*64+1,y*64+1,62,62);}
 speck(g,w,h,1800,['rgba(90,85,80,.25)','rgba(255,255,255,.25)'],1.5);g.fillStyle='rgba(60,55,50,.45)';for(const q of [0,64])g.fillRect(q,0,1.5,h),g.fillRect(0,q,w,1.5);g.fillStyle='#8f8b84';g.fillRect(0,0,7,h);g.fillRect(w-7,0,7,h);},true);
const lit=[...Array(16)].map(()=>Math.random()<.4);
// mode 0 = szín, 1 = éjszakai fény, 2 = érdesség(G)/fém(B)
const RM=(g,r,m)=>{g.fillStyle=`rgb(0,${Math.round(r*255)},${Math.round(m*255)})`;};
const facade=mode=>cv(512,512,(g,w,h)=>{
 if(mode===1){g.fillStyle='#000';g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(lit[r*4+c]){const x=c*128+36,y=r*128+20;g.fillStyle=(r+c)%2?'#ffcf7a':'#ffe7b8';g.fillRect(x+3,y+3,50,70);}return;}
 if(mode===2){RM(g,.92,0);g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++){const x=c*128+36,y=r*128+20;RM(g,.55,0);g.fillRect(x-8,y-8,72,92);RM(g,.08,.05);g.fillRect(x+3,y+3,50,70);}return;}
 g.fillStyle='#f4f1ec';g.fillRect(0,0,w,h);speck(g,w,h,14000,['rgba(120,110,100,.07)','rgba(255,255,255,.18)','rgba(90,80,70,.05)'],3);
 for(let y=0;y<4;y++){g.fillStyle='rgba(70,60,55,.16)';g.fillRect(0,y*128+118,w,3);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,y*128+112,w,6);}
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){const x=c*128+36,y=r*128+20;
  g.fillStyle='rgba(60,50,45,.18)';g.fillRect(x-11,y-11,78,100);g.fillStyle='#fbf8f2';g.fillRect(x-8,y-8,72,92);
  g.fillStyle='#e8e2d7';g.fillRect(x-3,y-3,62,82);
  const gr=g.createLinearGradient(x,y,x+56,y+76);gr.addColorStop(0,'#5a6f86');gr.addColorStop(.55,'#2c3a4b');gr.addColorStop(1,'#3d5168');g.fillStyle=gr;g.fillRect(x+3,y+3,50,70);
  g.fillStyle='#ece6db';g.fillRect(x+26,y+3,4,70);g.fillRect(x+3,y+26,50,3);
  g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+5,y+5,10,30);
  g.fillStyle='#fffdf8';g.fillRect(x-12,y+80,80,7);g.fillStyle='rgba(50,40,35,.25)';g.fillRect(x-10,y+87,76,3);
  if(r%2===0){g.fillStyle='#fffdf8';g.beginPath();g.moveTo(x-12,y-10);g.lineTo(x+28,y-22);g.lineTo(x+68,y-10);g.closePath();g.fill();g.fillStyle='rgba(50,40,35,.18)';g.fillRect(x-12,y-10,80,2);}}},mode!==2);
const brickT=mode=>cv(512,512,(g,w,h)=>{
 if(mode===1){g.fillStyle='#000';g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(lit[(r*4+c+5)%16]){g.fillStyle='#ffd590';g.fillRect(c*128+40,r*128+18,46,76);}return;}
 if(mode===2){RM(g,.93,0);g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<4;c++){RM(g,.6,0);g.fillRect(c*128+34,r*128+12,58,88);RM(g,.08,.05);g.fillRect(c*128+40,r*128+18,46,76);}return;}
 g.fillStyle='#c9c1b4';g.fillRect(0,0,w,h);const BW=24,BH=8;
 for(let y=0;y<h;y+=BH)for(let x=-(y/BH%2)*BW/2;x<w;x+=BW){const v=rnd(),tone=v<.15?[96,52,38]:v<.3?[128,64,46]:[112+rnd()*25,56+rnd()*14,40+rnd()*10];g.fillStyle=`rgb(${tone[0]|0},${tone[1]|0},${tone[2]|0})`;g.fillRect(x+1,y+1,BW-2,BH-2);}
 speck(g,w,h,5000,['rgba(20,10,5,.12)','rgba(255,230,210,.08)'],2);
 for(let r=0;r<4;r++){g.fillStyle='rgba(235,228,215,.9)';if(r===0)g.fillRect(0,122,w,6);
  for(let c=0;c<4;c++){const x=c*128+34,y=r*128+12;g.fillStyle='#e9e3d8';g.fillRect(x-4,y-8,66,8);g.fillRect(x-4,y+88,66,6);g.fillStyle='#f4f1ea';g.fillRect(x,y,58,88);
   const gr=g.createLinearGradient(x,y,x+58,y+88);gr.addColorStop(0,'#55697e');gr.addColorStop(1,'#26313d');g.fillStyle=gr;g.fillRect(x+6,y+6,46,76);
   g.fillStyle='#f4f1ea';g.fillRect(x+6,y+42,46,4);g.fillRect(x+27,y+6,3,76);g.fillRect(x+6,y+24,46,2);g.fillRect(x+6,y+62,46,2);}}},mode!==2);
const modernT=mode=>cv(256,256,(g,w,h)=>{
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){const x=c*64,y=r*64;
  if(mode===1){if(r===0&&c===0){g.fillStyle='#000';g.fillRect(0,0,w,h);}if(Math.random()<.45){g.fillStyle='#ffe6b8';g.fillRect(x+3,y+3,58,50);}continue;}
  if(mode===2){RM(g,.35,.85);g.fillRect(x,y,64,64);RM(g,.04,.55);g.fillRect(x+3,y+3,58,50);continue;}
  g.fillStyle='#6f7a84';g.fillRect(x,y,64,64);const gr=g.createLinearGradient(x,y,x+20,y+64);gr.addColorStop(0,'#9fb4c6');gr.addColorStop(.6,'#4d6276');gr.addColorStop(1,'#6b8296');g.fillStyle=gr;g.fillRect(x+3,y+3,58,50);
  g.fillStyle='#3b444d';g.fillRect(x,y+53,64,11);}},mode!==2);
const panelT=mode=>cv(256,256,(g,w,h)=>{g.fillStyle=mode===1?'#000':'#e9e4dc';if(mode===2)RM(g,.9,0);g.fillRect(0,0,w,h);
 if(mode===0)speck(g,w,h,3000,['rgba(100,95,85,.08)','rgba(255,255,255,.2)'],2);
 for(let r=0;r<8;r++)for(let c=0;c<6;c++){const x=c*42+8,y=r*32+6;if(mode===1){if(Math.random()<.35){g.fillStyle='#ffd99a';g.fillRect(x,y,24,18);}continue;}
  if(mode===2){RM(g,.1,.05);g.fillRect(x,y,24,18);continue;}
  g.fillStyle='rgba(90,85,80,.35)';g.fillRect(c*42,r*32+28,42,1.5);g.fillRect(c*42,r*32,1.5,32);g.fillStyle='#34414f';g.fillRect(x,y,24,18);g.fillStyle='#d9d4cb';g.fillRect(x+11,y,2,18);g.fillStyle='#fff';g.fillRect(x-2,y+18,28,3);}},mode!==2);
const AWN=['#b8423a','#2f6f6a','#c9973a','#3b5f8f','#a45a3a','#5d4f7a'];
const shopT=mode=>cv(512,128,(g,w,h)=>{g.fillStyle=mode===1?'#000':'#efe9df';if(mode===2)RM(g,.85,0);g.fillRect(0,0,w,h);
 for(let k=0;k<4;k++){const x=k*128,col=AWN[(k*5+1)%AWN.length];
  if(mode===1){g.fillStyle='#ffd58a';g.fillRect(x+14,46,74,70);continue;}
  if(mode===2){RM(g,.05,.1);g.fillRect(x+14,46,74,74);RM(g,.5,.6);g.fillRect(x+96,52,22,76);continue;}
  g.fillStyle='#2a2f36';g.fillRect(x+10,42,82,82);const gr=g.createLinearGradient(x,46,x+74,120);gr.addColorStop(0,'#6f8aa3');gr.addColorStop(1,'#26323f');g.fillStyle=gr;g.fillRect(x+14,46,74,74);
  g.fillStyle='#3a3135';g.fillRect(x+96,52,22,76);
  g.fillStyle='#45484e';g.fillRect(x,14,128,26);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x,14,128,2);// semleges portálpárkány: a valódi bolttábla erre kerül
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x,40,128,3);}},mode!==2);
const texWater=(()=>{const S=128,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.fillStyle='#2f6f86';g.fillRect(0,0,S,S);
 g.strokeStyle='rgba(200,230,240,.18)';g.lineWidth=2;g.lineCap='round';for(let k=0;k<9;k++){const x=Math.random()*S,y=Math.random()*S;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+8,y-4,x+16,y);g.stroke();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;})();
const poolTex=cv(128,128,(g,w)=>{const gr=g.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);gr.addColorStop(0,'#fff');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,w);});
const po=(f,u)=>({polygonOffset:true,polygonOffsetFactor:f,polygonOffsetUnits:u});
function pbrW(T,o){const rm=T(2);return toon({map:T(0),emissiveMap:T(1),emissive:0xffffff,emissiveIntensity:0,roughnessMap:rm,metalnessMap:rm,roughness:1,metalness:1,...o});}
function detail(mat,sc,amp){mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;float hn(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hn(i),hn(i+vec2(1,0)),f.x),mix(hn(i+vec2(0,1)),hn(i+vec2(1,1)),f.x),f.y);}')
 .replace('#include <color_fragment>','#include <color_fragment>\n{vec2 q=vWP.xz*'+sc.toFixed(3)+';float n=vn(q)*.5+vn(q*3.7)*.3+vn(q*13.)*.2;float big=vn(vWP.xz*.013);diffuseColor.rgb*=1.-'+amp.toFixed(3)+'+n*'+(2*amp).toFixed(3)+';diffuseColor.rgb*=.92+big*.16;}');};mat.customProgramCacheKey=()=>'det'+sc+amp;return mat;}
const MAT={
 ground:detail(toon({vertexColors:true,roughness:.95}),.45,.16),
 road:texRoad.map((t,k)=>detail(toon({map:t,roughness:.82,...po(-2-k,-3-k)}),.08,.07)),
 walk:toon({map:texWalk,roughness:.9,...po(-1,-2)}),bed:toon({color:0x8d8394,...po(-1,-2)}),rail:toon({color:0xd8dce6,...po(-6,-8)}),
 bridge:toon({color:0xa9a59d,roughness:.85,side:THREE.DoubleSide}),
 wu:pbrW(facade,{vertexColors:true}),wg:pbrW(shopT,{}),
 roof:toon({vertexColors:true,roughness:.72}),
 wmo:pbrW(modernT,{}),wbr:pbrW(brickT,{vertexColors:true}),wpa:pbrW(panelT,{vertexColors:true}),
 bx:toon({vertexColors:true,side:THREE.DoubleSide,roughness:.75}),water:toon({map:texWater,roughness:.06,metalness:.1,envMapIntensity:1.4,...po(-1,-1)}),
 trunk:toon({color:0x5e4634,roughness:.95}),leaf:toon({vertexColors:true,roughness:.95}),pole:toon({color:0x3b3550}),
 lampHead:toon({color:0xfff1c9,emissive:0xffcf7a,emissiveIntensity:0}),
 pool:new THREE.MeshBasicMaterial({map:poolTex,color:0xffc46a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,...po(-10,-10)}),
 aiBody:toon({}),aiDet:toon({vertexColors:true}),aiLight:toon({vertexColors:true,emissive:0xffffff,emissiveIntensity:.2}),
 tram:toon({vertexColors:true}),tramWin:toon({color:0x3d587a,emissive:0xffd58a,emissiveIntensity:0}),
 mark:toon({color:0xfff6e0,...po(-8,-10)}),markD:toon({color:0xfff6e0,alphaTest:.5,...po(-8,-10),map:cv(8,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#fff';g.fillRect(0,0,w,h/2);})}),
 sigPole:toon({color:0x3b3550}),sigLamp:toon({vertexColors:true}),
 sigL:[0,1].map(()=>['#ff2a2a','#ffc21f','#2dff6a'].map(c=>toon({color:0x222222,emissive:new THREE.Color(c),emissiveIntensity:0}))),
 gps:new THREE.MeshBasicMaterial({color:0xff5d8f,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide,...po(-12,-12)})};
const GEO={trunk:new THREE.CylinderGeometry(.2,.3,2.6,6).translate(0,1.3,0),crown:(()=>{const parts=[[0,4.3,0,1.75],[.95,3.7,.35,1.25],[-.85,3.8,-.45,1.3],[.2,5.2,-.5,1.2],[-.3,3.6,.9,1.15],[.5,4.8,.8,1.05]].map(([x,y,z,r])=>{const g=new THREE.IcosahedronGeometry(r,1),P=g.attributes.position;
  for(let i=0;i<P.count;i++){const k=1+(Math.sin(P.getX(i)*7.1+P.getY(i)*3.3)*Math.cos(P.getZ(i)*5.7))*.12;P.setXYZ(i,P.getX(i)*k,P.getY(i)*k*.92,P.getZ(i)*k);}g.computeVertexNormals();return g.translate(x,y,z);});
  const m=mergeGeometries(parts),P=m.attributes.position,c=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const t=Math.max(0,Math.min(1,(P.getY(i)-2.4)/3.6)),v=.62+t*.5+(Math.random()-.5)*.08;c[i*3]=v*.95;c[i*3+1]=v;c[i*3+2]=v*.9;}m.setAttribute('color',new THREE.BufferAttribute(c,3));return m;})(),
 cone:(()=>{const parts=[0,1,2].map(i=>new THREE.ConeGeometry(2.1-i*.55,2.6,9).translate(0,2.9+i*1.45,0));const m=mergeGeometries(parts),P=m.attributes.position,c=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const v=.65+(P.getY(i)-1.6)/6*.45;c[i*3]=c[i*3+1]=c[i*3+2]=v;}m.setAttribute('color',new THREE.BufferAttribute(c,3));return m;})(),
 pole:mergeGeometries([new THREE.CylinderGeometry(.09,.12,6.4,6).translate(0,3.2,0),new THREE.BoxGeometry(.1,.1,1.4).translate(0,6.3,.65)]),
 sig:mergeGeometries([new THREE.CylinderGeometry(.1,.12,4.2,6).translate(0,2.1,0),new THREE.BoxGeometry(.12,.12,1.2).translate(0,4.1,.55)]),
 sigBox:colored(new THREE.BoxGeometry(.42,1.15,.32).translate(0,3.55,1.05),'#2b2540'),
 sigLamp:[3.9,3.55,3.2].map(y=>new THREE.SphereGeometry(.13,8,6).translate(0,y,1.23)),
 head:new THREE.SphereGeometry(.36,10,6).scale(1,.7,1).translate(0,6.15,1.35),pool:new THREE.CircleGeometry(6.5,20).rotateX(-Math.PI/2)};
/* valódi közlekedési táblák (Mapillary) */
const signTex=new Map();
function signMat(code){let m=signTex.get(code);if(m)return m;const t=cv(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);const c=w/2;
 if(code<1000){g.fillStyle='#fff';g.beginPath();g.arc(c,c,62,0,6.3);g.fill();g.strokeStyle='#d8121b';g.lineWidth=14;g.beginPath();g.arc(c,c,54,0,6.3);g.stroke();g.fillStyle='#111';g.font='900 '+(code>=100?44:54)+'px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(code,c,c+3);}
 else if(code===1001){g.fillStyle='#fff';g.beginPath();for(let i=0;i<8;i++){const a=(i+.5)/8*6.2832;g.lineTo(c+Math.cos(a)*63,c+Math.sin(a)*63);}g.fill();g.fillStyle='#c8101a';g.beginPath();for(let i=0;i<8;i++){const a=(i+.5)/8*6.2832;g.lineTo(c+Math.cos(a)*57,c+Math.sin(a)*57);}g.fill();g.fillStyle='#fff';g.font='900 34px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('STOP',c,c+2);}
 else if(code===1002){g.fillStyle='#c8101a';g.beginPath();g.moveTo(4,10);g.lineTo(124,10);g.lineTo(64,118);g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(26,23);g.lineTo(102,23);g.lineTo(64,92);g.fill();}
 else if(code===1003){g.fillStyle='#c8101a';g.beginPath();g.arc(c,c,62,0,6.3);g.fill();g.fillStyle='#fff';g.fillRect(18,54,92,20);}
 else if(code===1004){g.fillStyle='#1d4fa8';g.fillRect(4,4,120,120);g.fillStyle='#fff';g.beginPath();g.moveTo(64,14);g.lineTo(116,108);g.lineTo(12,108);g.fill();g.fillStyle='#111';g.beginPath();g.arc(66,46,7,0,6.3);g.fill();g.fillRect(60,54,10,26);g.fillRect(52,80,8,18);g.fillRect(70,80,8,18);for(let i=0;i<4;i++)g.fillRect(28+i*20,100,12,4);}
 else{g.save();g.translate(c,c);g.rotate(Math.PI/4);g.fillStyle='#fff';g.fillRect(-44,-44,88,88);g.fillStyle='#f2c418';g.fillRect(-34,-34,68,68);g.restore();}});
 m=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.4,roughness:.5,side:THREE.FrontSide});signTex.set(code,m);return m;}
const signGeo=new THREE.PlaneGeometry(.75,.75).translate(0,2.35,.07),signBack=new THREE.CircleGeometry(.36,16).rotateY(Math.PI).translate(0,2.35,.05),signPole=new THREE.CylinderGeometry(.04,.04,2.4,6).translate(0,1.2,0);
signGeo.userData.shared=signBack.userData.shared=signPole.userData.shared=true;const signBackMat=new THREE.MeshStandardMaterial({color:0x9a9ea4,roughness:.6});
/* fák: globális, távolságfüggő részletesség (közel lombos, középen egyszerű, távol nagyon egyszerű, látómezőn kívül semmi) */
const shadeGeo=(g,y0,y1)=>{g=g.index?g.toNonIndexed():g;g.computeVertexNormals();const P=g.attributes.position,c=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const v=.62+Math.max(0,Math.min(1,(P.getY(i)-y0)/(y1-y0)))*.5;c[i*3]=v*.95;c[i*3+1]=v;c[i*3+2]=v*.9;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;};
const TGEO={midC:shadeGeo(new THREE.IcosahedronGeometry(2.25,1).scale(1,1.12,1).translate(0,4.3,0),2.2,6.6),farC:shadeGeo(new THREE.IcosahedronGeometry(2.3,0).scale(1,1.15,1).translate(0,4.2,0),2.2,6.6),
 midK:shadeGeo(new THREE.ConeGeometry(2.05,6.2,8).translate(0,4.4,0),1.4,7.6),farK:shadeGeo(new THREE.ConeGeometry(2,6,5).translate(0,4.4,0),1.4,7.6)};
const TREE={dirty:true,t:0,cx:1e9,cz:1e9,cy:9,lists:null};
{const mk=(geo,mat,cap,sh,col=true)=>{const m=new THREE.InstancedMesh(geo,mat,cap);m.count=0;m.castShadow=sh;m.frustumCulled=false;if(col){m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);}scene.add(m);return m;};
 TREE.lists=[[mk(GEO.crown,MAT.leaf,6000,true),mk(GEO.cone,MAT.leaf,6000,true)],[mk(TGEO.midC,MAT.leaf,24000,false),mk(TGEO.midK,MAT.leaf,24000,false)],[mk(TGEO.farC,MAT.leaf,60000,false),mk(TGEO.farK,MAT.leaf,60000,false)]];
 TREE.trunk=mk(GEO.trunk,MAT.trunk,30000,true,false);}
const _fr=new THREE.Frustum(),_pm=new THREE.Matrix4(),_sp=new THREE.Sphere();
function updTrees(dt){TREE.t-=dt;const cp=camera.position,fw=Math.atan2(camera.matrixWorld.elements[8],camera.matrixWorld.elements[10]);
 if(!TREE.dirty&&TREE.t>0&&Math.hypot(cp.x-TREE.cx,cp.z-TREE.cz)<10&&Math.abs(wrap(fw-TREE.cy))<.12)return;TREE.dirty=false;TREE.t=.4;TREE.cx=cp.x;TREE.cz=cp.z;TREE.cy=fw;
 const D=[[140,380,900],[95,260,600],[60,160,320]][quality],d0=D[0]*D[0],d1=D[1]*D[1],d2=D[2]*D[2];
 camera.updateMatrixWorld();_pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_fr.setFromProjectionMatrix(_pm);
 const L=TREE.lists,cnt=[[0,0],[0,0],[0,0]];let tc=0;const tm=TREE.trunk.instanceMatrix.array;
 for(const ch of chunks.values()){const T=ch.trees;if(ch.state!=='ready'||!T||rectD(ch.rect,cp.x,cp.z)>D[2])continue;
  for(const cell of T.cells){const cdx=cell.x-cp.x,cdz=cell.z-cp.z,cd=Math.hypot(cdx,cdz);if(cd-60>D[2])continue;_sp.center.set(cell.x,cell.y+4,cell.z);_sp.radius=62;if(!_fr.intersectsSphere(_sp))continue;
  for(const q of cell.idx){const x=T.P[q*4],y=T.P[q*4+1],z=T.P[q*4+2],dx=x-cp.x,dz=z-cp.z,dd=dx*dx+dz*dz;if(dd>d2)continue;
   const lv=dd<d0?0:dd<d1?1:2,k=T.K[q],im=L[lv][k],i=cnt[lv][k];if(i>=im.instanceMatrix.count)continue;cnt[lv][k]++;
   im.instanceMatrix.array.set(T.M.subarray(q*16,q*16+16),i*16);im.instanceColor.array.set(T.C.subarray(q*3,q*3+3),i*3);
   if(lv<2&&tc<TREE.trunk.instanceMatrix.count){tm.set(T.M.subarray(q*16,q*16+16),tc*16);tc++;}}}}
 for(let lv=0;lv<3;lv++)for(let k=0;k<2;k++){const im=L[lv][k];im.count=cnt[lv][k];im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;}
 TREE.trunk.count=tc;TREE.trunk.instanceMatrix.needsUpdate=true;}
for(const k in GEO){if(Array.isArray(GEO[k]))GEO[k].forEach(g=>g.userData.shared=true);else GEO[k].userData.shared=true;}
