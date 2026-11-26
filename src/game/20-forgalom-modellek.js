/* ---------- forgalom-modellek ---------- */
const box=(w,h,l,x,y,z)=>new THREE.BoxGeometry(w,h,l).translate(x,y,z);
function aiType(len,cabL,cabH,cabZ,tall){const body=mergeGeometries([box(1.84,.72,len,0,.62,0),box(1.6,cabH,cabL,0,.98+cabH/2,cabZ)]);
 const wheels=[];for(const [x,z] of [[.86,len/2-.8],[-.86,len/2-.8],[.86,-len/2+.8],[-.86,-len/2+.8]])wheels.push(new THREE.CylinderGeometry(.36,.36,.28,10).rotateZ(Math.PI/2).translate(x,.36,z));
 const det=mergeGeometries([...wheels.map(w=>colored(w,'#2b2540')),colored(box(1.64,cabH*.62,cabL-.2,0,.98+cabH*.55,cabZ),'#3d587a'),colored(box(1.86,.1,.08,0,.5,len/2+.01),'#2b2540')]);
 const li=mergeGeometries([colored(box(.34,.14,.06,.6,.78,len/2+.02),'#fff6d0'),colored(box(.34,.14,.06,-.6,.78,len/2+.02),'#fff6d0'),colored(box(.36,.14,.06,.6,.8,-len/2-.02),'#ff2d55'),colored(box(.36,.14,.06,-.6,.8,-len/2-.02),'#ff2d55')]);
 return{body,det,li,len};}
function busType(){const len=11.6,body=mergeGeometries([box(2.5,2.6,len,0,1.75,0),box(2.3,.2,len-.6,0,3.12,0)]);
 const w=[];for(const [x,z] of [[1.15,3.9],[-1.15,3.9],[1.15,-3.4],[-1.15,-3.4]])w.push(colored(new THREE.CylinderGeometry(.5,.5,.32,12).rotateZ(Math.PI/2).translate(x,.5,z),'#2b2540'));
 const det=mergeGeometries([...w,colored(box(2.52,.95,len-1.2,0,2.25,-.2),'#3d587a'),colored(box(2.3,1.3,.06,0,2.2,len/2+.01),'#3d587a'),colored(box(2.52,.18,len+.02,0,1.2,0),'#fffaf0'),colored(box(1.4,.3,.08,0,2.95,len/2+.02),'#ffd166')]);
 const li=mergeGeometries([colored(box(.4,.18,.06,.85,.85,len/2+.03),'#fff6d0'),colored(box(.4,.18,.06,-.85,.85,len/2+.03),'#fff6d0'),colored(box(.4,.2,.06,.9,.9,-len/2-.03),'#ff2d55'),colored(box(.4,.2,.06,-.9,.9,-len/2-.03),'#ff2d55')]);
 return{body,det,li,len};}
function taxiType(){const t=aiType(4.3,2,.62,-.2);t.det=mergeGeometries([t.det,colored(box(.7,.22,.35,0,1.74,-.2),'#fffaf0'),colored(box(.72,.08,.37,0,1.6,-.2),'#2b2540')]);return t;}
const AITYPES=[aiType(4.1,2,.62,-.2),aiType(3.6,1.9,.66,-.35),aiType(4.6,3.3,1.05,-.4),busType(),taxiType(),aiType(3.5,1.7,.6,-.3)];
const AIFIX={3:'#1f63c6',4:'#ffd000'},TRABICOL=['#9fd3c7','#f4efe6','#a7c4e5','#e6d2a8','#cfe3a8'];
const AICOL=['#ffd166','#06d6a0','#118ab2','#ef476f','#f78c6b','#ffffff','#8a6fd8','#9be564','#f4a259','#5bc0eb','#fffaf0','#e4572e'];
const aiMeshes=AITYPES.map(t=>{const mk=(g,m)=>{const im=new THREE.InstancedMesh(g,m,90);im.count=0;im.castShadow=true;im.frustumCulled=false;scene.add(im);return im;};
 const b=mk(t.body,MAT.aiBody);b.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(270),3);return{b,d:mk(t.det,MAT.aiDet),l:mk(t.li,MAT.aiLight)};});
function tramSection(front){const parts=[colored(box(2.4,1.0,9.2,0,.95,0),'#f6c21c'),colored(box(2.42,.22,9.22,0,1.55,0),'#fffaf0'),colored(box(2.4,.5,9.2,0,3.0,0),'#f6c21c'),colored(box(2.2,.18,8.8,0,3.34,0),'#e9e4dc'),colored(box(2.3,.3,9,0,.3,0),'#3b3550')];
 if(front)parts.push(colored(box(.6,.12,1.6,0,3.6,1.5),'#2b2540'),colored(box(.06,.7,.06,0,3.95,1.5),'#2b2540'));
 return{body:mergeGeometries(parts),win:box(2.44,.95,8.6,0,2.2,0)};}
const TRAMG=[tramSection(true),tramSection(false)];
