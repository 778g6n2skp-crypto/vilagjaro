/* ---------- domborzat ---------- */
let DEMDEC='';const DZ=14,tilesP=new Map(),tileD=new Map();let fb=null,fbS=0,fbN=0,demMiss=false;
function dxy(lat,lon){const n=1<<DZ;return[lon2fx(lon)/NT*n,lat2fy(lat)/NT*n];}
// saját PNG-dekóder a domborzati csempékhez: bájtpontos, böngészőtől és színkezeléstől független (iPhone-on is)
async function pngRGB(B){if(typeof DecompressionStream==='undefined')return null;const dv=new DataView(B.buffer,B.byteOffset,B.byteLength);if(dv.getUint32(0)!==0x89504e47)return null;
 let p=8,W=0,Hh=0,ct=0,bd=0,il=0;const parts=[];while(p<B.length){const len=dv.getUint32(p),ty=String.fromCharCode(B[p+4],B[p+5],B[p+6],B[p+7]);
  if(ty==='IHDR'){W=dv.getUint32(p+8);Hh=dv.getUint32(p+12);bd=B[p+16];ct=B[p+17];il=B[p+20];}else if(ty==='IDAT')parts.push(B.subarray(p+8,p+8+len));else if(ty==='IEND')break;p+=12+len;}
 if(bd!==8||il!==0||(ct!==2&&ct!==6)||W!==256||Hh!==256)return null;const bpp=ct===6?4:3;
 const raw=new Uint8Array(await new Response(new Blob(parts).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
 const st=W*bpp,out=new Uint8Array(W*Hh*3),prev=new Uint8Array(st),cur=new Uint8Array(st);let o=0;
 for(let y=0;y<Hh;y++){const f=raw[o++];for(let x=0;x<st;x++){const a=x>=bpp?cur[x-bpp]:0,b=prev[x],c=x>=bpp?prev[x-bpp]:0,v=raw[o++];let r;
   if(f===0)r=v;else if(f===1)r=v+a;else if(f===2)r=v+b;else if(f===3)r=v+((a+b)>>1);else{const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);r=v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}cur[x]=r&255;}
  for(let x=0;x<W;x++){out[(y*W+x)*3]=cur[x*bpp];out[(y*W+x)*3+1]=cur[x*bpp+1];out[(y*W+x)*3+2]=cur[x*bpp+2];}prev.set(cur);}
 return out;}
// adathibák (üres foltok, -8000 m-es tüskék) kiszűrése: a pont jóval többet tér el a 9×9-es keret mediánjától, mint amennyit a környék meredeksége indokol → keret-medián (foltoknál kívülről befelé, több körben)
function despike(h){const RX=new Int8Array(32),RY=new Int8Array(32);let nr=0;for(let d=-4;d<=4;d++){RX[nr]=d;RY[nr++]=-4;RX[nr]=d;RY[nr++]=4;if(d>-4&&d<4){RX[nr]=-4;RY[nr++]=d;RX[nr]=4;RY[nr++]=d;}}
 const v=new Float32Array(nr),w=new Float32Array(nr),P8=new Float32Array(8);let tot=0;
 for(let it=0;it<6;it++){const fix=[];
  for(let y=0;y<256;y++){const y0=y<4?0:y-4,y1=y>251?255:y+4;for(let x=0;x<256;x++){const c=h[y*256+x],x0=x<4?0:x-4,x1=x>251?255:x+4;
   const X0=x<8?0:x-8,X1=x>247?255:x+8,Y0=y<8?0:y-8,Y1=y>247?255:y+8;P8[0]=h[y*256+x0];P8[1]=h[y*256+x1];P8[2]=h[y0*256+x];P8[3]=h[y1*256+x];P8[4]=h[y*256+X0];P8[5]=h[y*256+X1];P8[6]=h[Y0*256+x];P8[7]=h[Y1*256+x];P8.sort();if(c>P8[2]-60&&c<P8[5]+60)continue;
   for(let k=0;k<nr;k++){let xx=x+RX[k],yy=y+RY[k];xx=xx<0?0:xx>255?255:xx;yy=yy<0?0:yy>255?255:yy;v[k]=h[yy*256+xx];}
   v.sort();const m=v[nr>>1];if(Math.abs(c-m)<60)continue;for(let k=0;k<nr;k++)w[k]=Math.abs(v[k]-m);w.sort();const mad=w[nr>>1];if(Math.abs(c-m)>Math.max(60,4*mad+40))fix.push(y*256+x,m);}}
  for(let k=0;k<fix.length;k+=2)h[fix[k]]=fix[k+1];tot+=fix.length/2;if(!fix.length)break;}
 return tot;}
function loadDem(x,y){const k=x+'/'+y;let p=tilesP.get(k);if(p)return p;
 p=(async()=>{for(let a=0;a<3;a++){try{
  const r=await fetch('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/'+DZ+'/'+x+'/'+y+'.png');if(!r.ok)throw 0;
  const buf=new Uint8Array(await r.arrayBuffer());let px=null;try{px=await pngRGB(buf);}catch(e){px=null;}DEMDEC=px?'saját PNG-dekóder':'vászon';
  if(!px){// tartalék: vászon, színkezelés nélkül (Safari különben „szépíti” a színeket, és elcsúsznak a magasságok)
   const bm=await createImageBitmap(new Blob([buf],{type:'image/png'}),{colorSpaceConversion:'none',premultiplyAlpha:'none'}),c=new OffscreenCanvas(256,256),g=c.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
   g.drawImage(bm,0,0);const d=g.getImageData(0,0,256,256).data;px=new Uint8Array(65536*3);for(let i=0;i<65536;i++){px[i*3]=d[i*4];px[i*3+1]=d[i*4+1];px[i*3+2]=d[i*4+2];}}
  const h=new Float32Array(65536);let s=0;
  for(let i=0;i<65536;i++){h[i]=px[i*3]*256+px[i*3+1]+px[i*3+2]/256-32768;s+=h[i];}
  despike(h);s=0;for(let i=0;i<65536;i++)s+=h[i];
  fbS+=s/65536;fbN++;fb=fbS/fbN;tileD.set(k,h);if(tileD.size>120){const k0=tileD.keys().next().value;tileD.delete(k0);tilesP.delete(k0);}return h;}catch(e){await sleep(600*(a+1));}}tileD.set(k,null);return null;})();
 tilesP.set(k,p);return p;}
function dem(lat,lon){const f=dxy(lat,lon),tx=Math.floor(f[0]),ty=Math.floor(f[1]),k=tx+'/'+ty;
 if(!tileD.has(k)){demMiss=true;return fb==null?0:fb;}const h=tileD.get(k);if(!h)return fb==null?0:fb;
 let x=(f[0]-tx)*256-.5,y=(f[1]-ty)*256-.5;x=Math.min(Math.max(x,0),254.999);y=Math.min(Math.max(y,0),254.999);
 const x0=x|0,y0=y|0,u=x-x0,v=y-y0,i=y0*256+x0;return(h[i]*(1-u)+h[i+1]*u)*(1-v)+(h[i+256]*(1-u)+h[i+257]*u)*v;}
const rmemo=new Map(),memo=new Map();
function rawL(a,b){const k=a*4e7+b;let v=rmemo.get(k);if(v!==undefined)return v;
 const lon=fx2lon(a/G),lat=fy2lat(b/G);demMiss=false;
 v=(dem(lat,lon)*4+dem(lat+5e-5,lon)+dem(lat-5e-5,lon)+dem(lat,lon+7e-5)+dem(lat,lon-7e-5))/8;
 if(!demMiss){if(rmemo.size>400000)rmemo.clear();rmemo.set(k,v);}return v;}
const CTG=new Map();
function latH(a,b){const tx=Math.floor(a/G),ty=Math.floor(b/G),h=CTG.get(tx*100000+ty);if(h){const c=a-tx*G,r=b-ty*G;return h[r*(G+1)+c];}return rawL(a,b);}
const bil=(f,lat,lon)=>{const gx=lon2fx(lon)*G,gy=lat2fy(lat)*G,a=Math.floor(gx),b=Math.floor(gy),u=gx-a,v=gy-b;return(f(a,b)*(1-u)+f(a+1,b)*u)*(1-v)+(f(a,b+1)*(1-u)+f(a+1,b+1)*u)*v;};
const hAt=(lat,lon)=>bil(latH,lat,lon),rawAt=(lat,lon)=>bil(rawL,lat,lon);
/* folyók/tavak egységes, varratmentes vízszintje: durva rács, minden csomópont a környék legalacsonyabb pontja */
const vmemo=new Map();
function vNode(A,B){const k=A*4e6+B;let v=vmemo.get(k);if(v!==undefined)return v;v=1e9;let miss=false;if(vmemo.size>200000)vmemo.clear();
 for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){demMiss=false;const h=rawL(A*16+i*4,B*16+j*4);if(demMiss)miss=true;v=Math.min(v,h);}
 if(!miss)vmemo.set(k,v);return v;}
function waterLvl(lat,lon){const gx=lon2fx(lon)*G/16,gy=lat2fy(lat)*G/16,a=Math.floor(gx),b=Math.floor(gy),u=gx-a,v=gy-b;
 return(vNode(a,b)*(1-u)+vNode(a+1,b)*u)*(1-v)+(vNode(a,b+1)*(1-u)+vNode(a+1,b+1)*u)*v+.35;}
/* út-magasság: a valódi terep zajmentes, egyenletes változata (nyírt átlag 5x5 rácspontból) – minden csempében ugyanaz */
const smemo=new Map();
function sL(a,b){const k=a*4e7+b;let v=smemo.get(k);if(v!==undefined)return v;const vals=[];let miss=false;
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){demMiss=false;vals.push(rawL(a+i,b+j));if(demMiss)miss=true;}
 vals.sort((x,y)=>x-y);let t=0;for(let i=3;i<18;i++)t+=vals[i];v=t/15;
 if(!miss){if(smemo.size>400000)smemo.clear();smemo.set(k,v);}return v;}
const sAt=(lat,lon)=>bil(sL,lat,lon);
function demBox(s,n,w,e){const a=dxy(n,w),b=dxy(s,e),p=[];for(let x=Math.floor(a[0]);x<=Math.floor(b[0]);x++)for(let y=Math.floor(a[1]);y<=Math.floor(b[1]);y++)p.push(loadDem(x,y));return Promise.all(p);}
