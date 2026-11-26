/* ---------- fotóhomlokzatok: Mapillary-utcafotók vetítése a házfalakra, a kamera valódi helyzetéből ---------- */
const PH={cells:new Map(),imgs:new Map(),grid:new Map(),done:new Map(),asg:new Map(),byImg:new Map(),mesh:new Map(),tex:new Map(),dirty:new Set(),t:0,busy:0,err:'',ok:0};
const PHC=.0016; // cellaméret fokban (~150 m)
const photoMat=(tex,im)=>new THREE.ShaderMaterial({uniforms:{map:{value:tex},R:{value:im.R},C:{value:im.C},K:{value:new THREE.Vector4(im.fu,im.fv,im.k1,im.k2)},pano:{value:im.pano?1:0},dim:{value:1},fogC:{value:new THREE.Color()},fogN:{value:200},fogF:{value:900}},
 vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:`uniform sampler2D map;uniform mat3 R;uniform vec3 C;uniform vec4 K;uniform float pano,dim,fogN,fogF;uniform vec3 fogC;varying vec3 vW;
void main(){vec3 d=R*(vW-C);vec2 uv;
 if(pano>.5){uv=vec2(atan(d.x,d.z)/6.2831853+.5,atan(-d.y,length(d.xz))/3.1415927+.5);}
 else{if(d.z<.5)discard;vec2 n=d.xy/d.z;float r2=dot(n,n);n*=1.+K.z*r2+K.w*r2*r2;uv=vec2(n.x*K.x+.5,1.-(n.y*K.y+.5));if(uv.x<.008||uv.x>.992||uv.y<.008||uv.y>.992)discard;}
 vec3 c=texture2D(map,uv).rgb*dim;c=mix(c,fogC,smoothstep(fogN,fogF,length(vW-cameraPosition)));gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
function rodrigues(r){const t=Math.hypot(r[0],r[1],r[2])||1e-9,k=[r[0]/t,r[1]/t,r[2]/t],c=Math.cos(t),s=Math.sin(t),v=1-c;
 return[[c+k[0]*k[0]*v,k[0]*k[1]*v-k[2]*s,k[0]*k[2]*v+k[1]*s],[k[1]*k[0]*v+k[2]*s,c+k[1]*k[1]*v,k[1]*k[2]*v-k[0]*s],[k[2]*k[0]*v-k[1]*s,k[2]*k[1]*v+k[0]*s,c+k[2]*k[2]*v]];}
function phImage(d){const g=d.computed_geometry||d.geometry;if(!g||!d.computed_rotation||!d.thumb_1024_url)return null;if(d.camera_type==='fisheye')return null;
 const pano=!!d.is_pano||/spherical|equirect/.test(d.camera_type||'');const [x,z]=toXZ(g.coordinates[1],g.coordinates[0]);const th=terrainH(x,z);if(isNaN(th))return null;
 const Re=rodrigues(d.computed_rotation),M=new THREE.Matrix3();// a mi koordinátánk (x kelet, y fel, z dél) -> ENU -> kamera
 M.set(Re[0][0],Re[0][2],-Re[0][1],Re[1][0],Re[1][2],-Re[1][1],Re[2][0],Re[2][2],-Re[2][1]);
 const cp=d.camera_parameters||[.85,0,0],w=d.width||4,h=d.height||3,mx=Math.max(w,h),f=cp[0]||.85;
 return{id:d.id,url:d.thumb_1024_url,x,z,C:new THREE.Vector3(x,th+2.2,z),R:M,pano,fu:f*mx/w,fv:f*mx/h,k1:cp[1]||0,k2:cp[2]||0,t:d.captured_at||0,res:pano?1024/6.283:1024*f*mx/w};}
function phProject(im,X,Y,Z){const e=im.R.elements,dx=X-im.C.x,dy=Y-im.C.y,dz=Z-im.C.z,cx=e[0]*dx+e[3]*dy+e[6]*dz,cy=e[1]*dx+e[4]*dy+e[7]*dz,cz=e[2]*dx+e[5]*dy+e[8]*dz;
 if(im.pano)return[Math.atan2(cx,cz)/6.2832+.5,1-(Math.atan2(-cy,Math.hypot(cx,cz))/3.1416+.5),1];if(cz<.8)return null;let nx=cx/cz,ny=cy/cz;const r2=nx*nx+ny*ny,k=1+im.k1*r2+im.k2*r2*r2;nx*=k;ny*=k;return[nx*im.fu+.5,ny*im.fv+.5,cz];}
async function phFetchCell(key,la,lo,lim=250){PH.cells.set(key,'busy');PH.busy++;
 try{const r=await fetch('https://graph.mapillary.com/images?access_token='+encodeURIComponent(CFG.mly)+'&fields=id,thumb_1024_url,computed_geometry,geometry,computed_rotation,camera_parameters,camera_type,captured_at,width,height,is_pano&bbox='+[lo,la,lo+PHC*1.4,la+PHC].map(v=>v.toFixed(6)).join(',')+'&limit='+lim);
  if(r.status===401||r.status===403){PH.err='a token érvénytelen';PH.cells.set(key,'err');return;}if(r.status>=500&&lim>60){PH.busy--;PH.cells.delete(key);return phFetchCell(key,la,lo,Math.floor(lim/2.5)).finally(()=>PH.busy++);}if(!r.ok)throw new Error('HTTP '+r.status);
  const js=await r.json();for(const d of js.data||[]){if(PH.imgs.has(d.id))continue;const im=phImage(d);if(!im)continue;PH.imgs.set(d.id,im);const gk=Math.floor(im.x/40)+','+Math.floor(im.z/40);let l=PH.grid.get(gk);if(!l)PH.grid.set(gk,l=[]);l.push(im);}
  PH.cells.set(key,'ok');}catch(e){PH.cells.set(key,'err');PH.err=String(e.message||e);}finally{PH.busy--;}}
function phBlocked(ax,az,bx,bz){let hit=false;forSegs((ax+bx)/2,(az+bz)/2,Math.hypot(bx-ax,bz-az)/2+2,1,(a,k)=>{if(hit)return;const x1=a[k],z1=a[k+1],x2=a[k+2],z2=a[k+3],r1x=bx-ax,r1z=bz-az,r2x=x2-x1,r2z=z2-z1,den=r1x*r2z-r1z*r2x;if(Math.abs(den)<1e-6)return;
  const t=((x1-ax)*r2z-(z1-az)*r2x)/den,u=((x1-ax)*r1z-(z1-az)*r1x)/den;if(t>.02&&t<.96&&u>=0&&u<=1)hit=true;});return hit;}
const PHS={near:0,face:0,frame:0,block:0,ok:0,none:0};
function phChoose(px,pz,qx,qz,y0,y1,nx,nz){const mx=(px+qx)/2,mz=(pz+qz)/2,gx=Math.floor(mx/40),gz=Math.floor(mz/40);let best=null,bs=0;const now=Date.now();
 for(let a=gx-1;a<=gx+1;a++)for(let b=gz-1;b<=gz+1;b++){const l=PH.grid.get(a+','+b);if(!l)continue;
  for(const im of l){const vx=im.x-mx,vz=im.z-mz,d=Math.hypot(vx,vz);if(d<4||d>45)continue;if(PH.tex.size>=(quality===2?20:40)&&!PH.tex.has(im.id))continue;PHS.near++;const face=(vx*nx+vz*nz)/d;if(face<.12){PHS.face++;continue;}
   const yt=Math.min(y1,y0+10),pts=[[mx,y0+2.5,mz],[px,y0+.6,pz],[qx,y0+.6,qz],[qx,yt,qz],[px,yt,pz]];let inside=0,midIn=false;for(let pi=0;pi<5;pi++){const P=pts[pi],q=phProject(im,P[0],P[1],P[2]);if(q&&q[0]>.01&&q[0]<.99&&q[1]>.01&&q[1]<.99){inside++;if(!pi)midIn=true;}}
   if(!midIn||inside<3){PHS.frame++;continue;}const age=(now-im.t)/3.15e10,sc=im.res/d*(face*face)*(inside/5)*(age<4?1:Math.max(.3,1-(age-4)*.12));if(sc<=bs)continue;
   const ox=nx*.3,oz=nz*.3;if(phBlocked(im.x,im.z,mx+ox,mz+oz)||phBlocked(im.x,im.z,px+(qx-px)*.15+ox,pz+(qz-pz)*.15+oz)||phBlocked(im.x,im.z,qx+(px-qx)*.15+ox,qz+(pz-qz)*.15+oz)){PHS.block++;continue;}bs=sc;best=im;}}
 if(best)PHS.ok++;else PHS.none++;return best;}
function phRebuild(id){const im=PH.imgs.get(id),list=PH.byImg.get(id),old=PH.mesh.get(id);if(old){scene.remove(old);old.geometry.dispose();PH.mesh.delete(id);}
 if(!im||!list||!list.size){if(old&&old.material)old.material.dispose();const tx=PH.tex.get(id);if(tx&&tx!=='load'&&tx!=='err'){tx.dispose();PH.tex.delete(id);}PH.byImg.delete(id);return;}
 let tx=PH.tex.get(id);if(!tx){PH.tex.set(id,'load');new THREE.TextureLoader().setCrossOrigin('anonymous').load(im.url,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;PH.tex.set(id,t);PH.ok++;PH.dirty.add(id);},undefined,()=>{PH.tex.set(id,'err');PH.err='a fotók nem tölthetők le (hálózat vagy CORS)';});return;}
 if(tx==='load'||tx==='err')return;const P=[];for(const pc of list){const o=.07,ax=pc[0]+pc[6]*o,az=pc[1]+pc[7]*o,bx=pc[2]+pc[6]*o,bz=pc[3]+pc[7]*o,y0=pc[4],y1=pc[5];P.push(ax,y0,az,bx,y0,bz,bx,y1,bz,ax,y0,az,bx,y1,bz,ax,y1,az);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeBoundingSphere();const m=new THREE.Mesh(g,old&&old.material?old.material:photoMat(tx,im));m.frustumCulled=true;scene.add(m);PH.mesh.set(id,m);}
function phDropChunk(ck){for(const [key,lst] of [...PH.asg]){if(!key.startsWith(ck+':'))continue;for(const [pk,id] of lst){const s2=PH.byImg.get(id);if(s2){for(const pc of [...s2])if(pc.key===pk)s2.delete(pc);PH.dirty.add(id);}}PH.asg.delete(key);PH.done.delete(key);}}
function updPhotos(dt){PH.t-=dt;PH.calls=(PH.calls||0)+1;
 if(!CFG.photo||!CFG.mlyOn||!CFG.mly||!started){if(PH.mesh.size||PH.asg.size){for(const id of [...PH.byImg.keys()]){PH.byImg.get(id).clear();phRebuild(id);}PH.asg.clear();PH.done.clear();}return;}
 const n=tCur.night,fog=scene.fog;for(const m of PH.mesh.values()){const u=m.material.uniforms;u.dim.value=1-n*.72;u.fogC.value.copy(fog.color);u.fogN.value=fog.near;u.fogF.value=fog.far;}
 const nowT=performance.now();if(nowT<(PH.next||0))return;if(PH.freeze){for(const id of PH.dirty)phRebuild(id);PH.dirty.clear();return;}PH.next=nowT+600;PH.ticks=(PH.ticks||0)+1;const [la,lo]=toLL(car.x,car.z);
 // 1) fotók letöltése a játékos körül
 while(PH.busy<5){let bestK=null,bd=1e9;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const cla=(Math.floor(la/PHC)+i)*PHC,clo=(Math.floor(lo/(PHC*1.4))+j)*PHC*1.4,k=cla.toFixed(4)+','+clo.toFixed(4);if(PH.cells.has(k))continue;const d=Math.hypot(i,j);if(d<bd){bd=d;bestK=[k,cla,clo];}}if(!bestK)break;phFetchCell(...bestK);}
 // 2) falszakaszok párosítása a legjobb fotóval
 let budget=260;for(const ch of chunks.values()){if(ch.state!=='ready'||!ch.fac||rectD(ch.rect,car.x,car.z)>170)continue;const F=ch.fac;
  for(let i=0;i<F.length&&budget>0;i+=8){const mx=(F[i]+F[i+2])/2,mz=(F[i+1]+F[i+3])/2,dd=Math.hypot(mx-car.x,mz-car.z),key=ch.key+':'+i;
   if(dd>160){if(PH.asg.has(key)){for(const [pk,id] of PH.asg.get(key)){const s2=PH.byImg.get(id);if(s2){for(const pc of [...s2])if(pc.key===pk)s2.delete(pc);PH.dirty.add(id);}}PH.asg.delete(key);PH.done.delete(key);}continue;}
   if(PH.done.get(key)===ch.bver)continue;
   const [cla,clo]=toLL(mx,mz);let ready=true;for(const [di,dj] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const k=((Math.floor(cla/PHC)+di)*PHC).toFixed(4)+','+((Math.floor(clo/(PHC*1.4))+dj)*PHC*1.4).toFixed(4);const st=PH.cells.get(k);if(st!=='ok'&&st!=='err'){ready=false;break;}}if(!ready)continue;
   budget--;PH.done.set(key,ch.bver);const L=Math.hypot(F[i+2]-F[i],F[i+3]-F[i+1]),np=Math.max(1,Math.ceil(L/6)),out=[];
   for(let s2=0;s2<np;s2++){const a0=s2/np,a1=(s2+1)/np,px=F[i]+(F[i+2]-F[i])*a0,pz=F[i+1]+(F[i+3]-F[i+1])*a0,qx=F[i]+(F[i+2]-F[i])*a1,qz=F[i+1]+(F[i+3]-F[i+1])*a1;
    const im=phChoose(px,pz,qx,qz,F[i+4],F[i+5],F[i+6],F[i+7]);if(!im)continue;const pk=key+'#'+s2,pc=[px,pz,qx,qz,F[i+4],Math.min(F[i+5],F[i+4]+26),F[i+6],F[i+7]];pc.key=pk;
    let set=PH.byImg.get(im.id);if(!set)PH.byImg.set(im.id,set=new Set());set.add(pc);PH.dirty.add(im.id);out.push([pk,im.id]);}
   if(out.length)PH.asg.set(key,out);}}
 PH.reach=(PH.reach||0)+1;for(const id of PH.dirty){phRebuild(id);}PH.dirty.clear();
 const el=$('mlystat');if(el&&setOpen)el.textContent=mlyStatus();}
