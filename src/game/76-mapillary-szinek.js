/* ---------- Mapillary: valódi homlokzatszínek utcafotókból ---------- */
const mly={done:new Map(),acc:new Map(),hacc:new Map(),busy:false,err:'',imgs:0,bld:0,seg:0,hset:0};
function mlyStatus(){if(!CFG.mly)return'Nincs token megadva.';if(!CFG.mlyOn)return'Kikapcsolva.';if(mly.err)return'Hiba: '+mly.err;return (mly.imgs?`Feldolgozott utcafotók: ${mly.imgs} (ebből szegmentált: ${mly.seg}), átszínezett épületek: ${mly.bld}, fotóból becsült magasság: ${mly.hset}`:'Kész, vezetés közben tölt.')+(CFG.photo?` · Fotóhomlokzatok: ${PH.mesh.size} kép, ${[...PH.byImg.values()].reduce((a,s2)=>a+s2.size,0)} falszakasz`+(PH.err?' ('+PH.err+')':''):'');}
function mlySample(img){const W=72,Hh=Math.max(24,Math.round(72*img.naturalHeight/Math.max(1,img.naturalWidth))),c=mlySample.c||(mlySample.c=document.createElement('canvas'));c.width=W;c.height=Hh;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,W,Hh);
 const d=g.getImageData(0,0,W,Hh).data,side=(x0,x1)=>{const px=[];for(let y=Math.floor(Hh*.3);y<Hh*.62;y++)for(let x=Math.floor(W*x0);x<W*x1;x++){const i=(y*W+x)*4,r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,l=.299*r+.587*gg+.114*b;
   if(l<.1||l>.96)continue;if(b>r+.06&&b>gg&&l>.5)continue;if(gg>r+.03&&gg>b+.05)continue;px.push([l,r,gg,b]);}
  if(px.length<25)return null;px.sort((a,b)=>a[0]-b[0]);const lo=Math.floor(px.length*.3),hi=Math.floor(px.length*.8);let R=0,G=0,B=0;for(let i=lo;i<hi;i++){R+=px[i][1];G+=px[i][2];B+=px[i][3];}const n=hi-lo;return[R/n,G/n,B/n];};
 return side;}
// Mapillary-szegmentálás: a kép "építmény" maszkja (vektoros, base64 MVT) – csak az épület képpontjai számítanak, fa/autó/ember/ég nem
function detDecode(b64){const B=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));let p=0;const vi=()=>{let r=0,s2=0,b;do{b=B[p++];r+=(b&127)*2**s2;s2+=7;}while(b&128);return r;};
 const out=[];let ext=4096;const skip=w=>{if(w===0)vi();else if(w===2){const l=vi();p+=l;}else if(w===5)p+=4;else if(w===1)p+=8;};
 while(p<B.length){const t=vi(),f=t>>3,w=t&7;if(f===3&&w===2){const le=vi(),end=p+le;while(p<end){const t2=vi(),f2=t2>>3,w2=t2&7;
   if(f2===5&&w2===0)ext=vi();else if(f2===2&&w2===2){const fl=vi(),fe=p+fl;while(p<fe){const t3=vi(),f3=t3>>3,w3=t3&7;if(f3===4&&w3===2){const gl=vi(),ge=p+gl,g=[];while(p<ge)g.push(vi());out.push(g);}else skip(w3);}}else skip(w2);}}else skip(w);}
 const R=[];for(const g of out){let x=0,y=0,i=0,cur=null;const zz=n=>(n>>>1)^-(n&1);while(i<g.length){const c=g[i++],id=c&7,n=c>>3;if(id===1){for(let k=0;k<n;k++){x+=zz(g[i++]);y+=zz(g[i++]);cur=[[x/ext,y/ext]];R.push(cur);}}else if(id===2){for(let k=0;k<n;k++){x+=zz(g[i++]);y+=zz(g[i++]);cur.push([x/ext,y/ext]);}}}}
 return R.filter(r=>r.length>=3);}
function mlySegSample(img,polys){const W=96,Hh=Math.max(32,Math.round(96*img.naturalHeight/Math.max(1,img.naturalWidth))),c=mlySegSample.c||(mlySegSample.c=document.createElement('canvas')),m=mlySegSample.m||(mlySegSample.m=document.createElement('canvas'));
 c.width=m.width=W;c.height=m.height=Hh;const g=c.getContext('2d',{willReadFrequently:true}),gm=m.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,W,Hh);const d=g.getImageData(0,0,W,Hh).data,res=[];
 for(const P of polys){gm.clearRect(0,0,W,Hh);gm.fillStyle='#fff';gm.beginPath();P.forEach((q,k)=>k?gm.lineTo(q[0]*W,q[1]*Hh):gm.moveTo(q[0]*W,q[1]*Hh));gm.closePath();gm.fill();const md=gm.getImageData(0,0,W,Hh).data,px=[];let sx=0,n=0,vmin=1,vmax=0;
  for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(md[i+3]<200)continue;sx+=x;n++;const v=y/Hh;if(v<vmin)vmin=v;if(v>vmax)vmax=v;const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,l=.299*r+.587*gg+.114*b;if(l<.08||l>.97)continue;px.push([l,r,gg,b]);}
  if(px.length<18)continue;px.sort((a,b)=>a[0]-b[0]);const lo=Math.floor(px.length*.35),hi=Math.floor(px.length*.85);let R2=0,G=0,B2=0;for(let i=lo;i<hi;i++){R2+=px[i][1];G+=px[i][2];B2+=px[i][3];}const k=hi-lo;
  let top=1;for(const q of P)top=Math.min(top,q[1]);res.push({col:[R2/k,G/k,B2/k],u:sx/n/W,top,bot:vmax,n:px.length,asp:W/Hh});}
 return res;}
const bKey=(ch,B,i)=>ch.key+':'+Math.round(B[i])+','+Math.round(B[i+1]);
function mlyAssign(cx,cz,dir,col,wgt,cone,elev){let best=null,bs=1e9;const cmin=cone||.72;for(const ch of chunks.values()){if(ch.state!=='ready'||!ch.bidx||rectD(ch.rect,cx,cz)>70)continue;const B=ch.bidx;
  for(let i=0;i<B.length;i+=6){const dx=B[i]-cx,dz=B[i+1]-cz,d=Math.hypot(dx,dz);if(d>70||d<2)continue;const cs=(dx*dir[0]+dz*dir[1])/d,need=Math.min(cmin,Math.cos(Math.min(1.2,Math.atan2(B[i+5]*.5,d)+.08)));if(cs<need)continue;const sc=Math.max(1,d-B[i+5]*.45)*(2.2-cs);if(sc<bs){bs=sc;best=[ch,i,d];}}}
 if(!best)return;const [ch,i,d]=best,B=ch.bidx,k=bKey(ch,B,i),a=mly.acc.get(k)||{r:0,g:0,b:0,n:0};a.r+=col[0]*wgt;a.g+=col[1]*wgt;a.b+=col[2]*wgt;a.n+=wgt;mly.acc.set(k,a);
 if(elev!=null&&ch.bunk&&ch.bunk[i/6*2]>0){const fd=Math.max(3,d-B[i+5]*.5),h=2.1+fd*Math.tan(elev);if(h>3&&h<80){const e=mly.hacc.get(k)||{s:0,n:0,x:B[i],z:B[i+1],ch:ch.key,cur:ch.bunk[i/6*2+1]};e.s+=h;e.q=(e.q||0)+h*h;e.n++;mly.hacc.set(k,e);}}}
function mlyApply(ch){if(!ch.bidx||!ch.wallM)return 0;let n=0;const B=ch.bidx;const touched=new Set();
 for(let i=0;i<B.length;i+=6){const a=mly.acc.get(bKey(ch,B,i));if(!a||a.n<.5)continue;const m=ch.wallM[B[i+2]];if(!m)continue;const C=m.geometry.attributes.color,s0=B[i+3],s1=B[i+4];if(s1<=s0)continue;
  let r=a.r/a.n,g=a.g/a.n,b=a.b/a.n;const l=.299*r+.587*g+.114*b,tl=Math.min(.82,Math.max(.32,l*1.3+.08)),k=tl/Math.max(.05,l);r=Math.min(1,r*k);g=Math.min(1,g*k);b=Math.min(1,b*k);
  const lin=[r**2.2,g**2.2,b**2.2],o=ch.baseCol?.[i]||(ch.baseCol=ch.baseCol||{},ch.baseCol[i]=[C.getX(s0),C.getY(s0),C.getZ(s0)]),f=B[i+2]===3?.45:.85,cc=[o[0]+(lin[0]-o[0])*f,o[1]+(lin[1]-o[1])*f,o[2]+(lin[2]-o[2])*f];
  for(let v=s0;v<s1;v++)C.setXYZ(v,cc[0],cc[1],cc[2]);touched.add(C);n++;}
 for(const C of touched)C.needsUpdate=true;return n;}
// becsült magasságok a workernek: csak ahol az OSM-ben nincs magasság, és legalább 3 fotóból ±15%-on belül egyezik (a bélyegképekből ez ritka – a zajos becslést inkább eldobjuk)
function mlyHeights(){const L=[],re=new Set();for(const e of mly.hacc.values()){if(e.n<3||e.sent)continue;const h=e.s/e.n,sd=Math.sqrt(Math.max(0,e.q/e.n-h*h));if(sd>h*.15)continue;if(Math.abs(h-e.cur)<2.5){e.sent=1;continue;}L.push(e.x,e.z,+h.toFixed(1));e.sent=1;re.add(e.ch);}
 if(!L.length)return;wk.postMessage({t:'hov',list:L});mly.hset+=L.length/3;for(const k of re){const ch=chunks.get(k);if(ch&&ch.state==='ready'&&!ch.rebuilding){ch.rebuilding=true;wk.postMessage({t:'chunk',tx:ch.tx,ty:ch.ty,gen,rebuild:1});}}}
// cellánként (~150 m) a kocsi körül: kicsi, gyors kérések; sűrű városban sem fut 500-ba
const MLC=.0016;
async function mlyCell(ci,cj){const k=ci+','+cj;mly.done.set(k,'busy');const S=ci*MLC,W=cj*MLC,N=S+MLC,E=W+MLC;
 try{let r=await fetch('https://graph.mapillary.com/images?access_token='+encodeURIComponent(CFG.mly)+'&fields=id,thumb_256_url,computed_geometry,geometry,compass_angle,computed_compass_angle,is_pano,camera_type,camera_parameters&bbox='+[W,S,E,N].map(v=>v.toFixed(6)).join(',')+'&limit=30');
  if(r.status===401||r.status===403){mly.err='a token érvénytelen vagy nincs jogosultsága';mly.done.set(k,'err');return;}
  if(r.status>=500)r=await fetch('https://graph.mapillary.com/images?access_token='+encodeURIComponent(CFG.mly)+'&fields=id,thumb_256_url,computed_geometry,geometry,compass_angle,computed_compass_angle,is_pano,camera_type,camera_parameters&bbox='+[W+MLC*.3,S+MLC*.3,E-MLC*.3,N-MLC*.3].map(v=>v.toFixed(6)).join(',')+'&limit=15');
  if(!r.ok)throw new Error('HTTP '+r.status);
  const js=await r.json(),cells=new Map();for(const im of js.data||[]){const g=im.computed_geometry||im.geometry;if(!g||!im.thumb_256_url)continue;const [x,z]=toXZ(g.coordinates[1],g.coordinates[0]),ck=Math.round(x/25)+','+Math.round(z/25),prev=cells.get(ck);if(!prev||(prev.is_pano&&!im.is_pano))cells.set(ck,{...im,x,z});}
  const list=[...cells.values()].slice(0,TOUCH_EARLY?6:12);// telefonon kevesebb kép: kíméli a mobilnetet
  await Promise.all(list.map(async im=>{try{
    const dq=fetch('https://graph.mapillary.com/'+im.id+'/detections?access_token='+encodeURIComponent(CFG.mly)+'&fields=value,geometry').then(r2=>r2.ok?r2.json():null).catch(()=>null);
    const img=new Image();img.crossOrigin='anonymous';img.src=im.thumb_256_url;await img.decode();const dj=await dq,ca=(im.computed_compass_angle??im.compass_angle??0)*Math.PI/180,pano=im.is_pano||im.camera_type==='spherical'||im.camera_type==='equirectangular';
    const polys=[];for(const dt of (dj&&dj.data)||[])if(dt.value==='construction--structure--building'&&dt.geometry){try{polys.push(...detDecode(dt.geometry));}catch(e2){}}
    if(polys.length){mly.seg++;const f=(im.camera_parameters&&im.camera_parameters[0])||.85;
     for(const o of mlySegSample(img,polys)){const asp=o.asp,dxu=(o.u-.5)*(asp>=1?1:asp),off=pano?(o.u-.5)*2*Math.PI:Math.atan(dxu/f),ang=ca+off,
       el=o.top<.02?null:pano?(.5-o.top)*Math.PI:Math.atan((.5-o.top)*(asp>=1?1/asp:1)/f);mlyAssign(im.x,im.z,[Math.sin(ang),-Math.cos(ang)],o.col,Math.min(2,o.n/60)*(pano?1:.9),pano?.985:.97,el!=null&&el>.05&&el<1.3?el:null);}}
    else{const side=mlySample(img);const segs=pano?[[.2,.3,-1],[.7,.8,1]]:[[0,.22,-1],[.78,1,1]];for(const [a,b,sd] of segs){const col=side(a,b);if(!col)continue;const ang=ca+sd*Math.PI/2;mlyAssign(im.x,im.z,[Math.sin(ang),-Math.cos(ang)],col,.35);}}
    mly.imgs++;}
   catch(e){if(/insecure|tainted|cross-origin/i.test(String(e&&e.message)))mly.err='a fotók nem olvashatók (CORS)';}}));
  mly.done.set(k,'ok');const [cx,cz]=toXZ(S+MLC/2,W+MLC/2);let tot=0;for(const c2 of chunks.values())if(c2.state==='ready'&&rectD(c2.rect,cx,cz)<200)tot+=mlyApply(c2);mly.bld+=0;mly.bld=Math.max(mly.bld,mly.acc.size);if(tot)$('attrib').classList.remove('hide');mlyHeights();}
 catch(e){mly.done.set(k,'err');mly.err=/Failed to fetch|NetworkError/i.test(String(e))?'a Mapillary nem érhető el (hálózat)':String(e.message||e);}
 const el=$('mlystat');if(el)el.textContent=mlyStatus();}
let mlyT=0;function updMly(dt){mlyT-=dt;if(mlyT>0||mly.busy>=2||!CFG.mlyOn||!CFG.mly||!started||!car.spawned)return;mlyT=.5;const [la,lo]=toLL(car.x,car.z),ci0=Math.floor(la/MLC),cj0=Math.floor(lo/MLC);let best=null,bd=1e9;
 for(let a=-2;a<=2;a++)for(let b=-3;b<=3;b++){const k=(ci0+a)+','+(cj0+b);if(mly.done.has(k))continue;const [x,z]=toXZ((ci0+a+.5)*MLC,(cj0+b+.5)*MLC),d=Math.hypot(x-car.x,z-car.z)-(car.vx*(x-car.x)+car.vz*(z-car.z))/Math.max(1,Math.hypot(car.vx,car.vz))*.5;if(d<bd&&d<360){bd=d;best=[ci0+a,cj0+b];}}
 if(best){mly.busy=(mly.busy|0)+1;mlyCell(...best).finally(()=>{mly.busy--;});}}
