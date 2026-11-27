/* ---------- fizika = látvány: az autó pontosan azokon a háromszögeken gurul, amik a képernyőn látszanak ---------- */
const COLC=8;
function buildCol(srcs){const T=[],g=new Map(),SRC=[];let si=-1;
 for(const [p,idx] of srcs){si++;if(!p||!p.length)continue;const n=idx?idx.length:p.length/3;
  for(let t=0;t<n;t+=3){const ia=idx?idx[t]:t,ib=idx?idx[t+1]:t+1,ic=idx?idx[t+2]:t+2,ax=p[ia*3],ay=p[ia*3+1],az=p[ia*3+2],bx=p[ib*3],by=p[ib*3+1],bz=p[ib*3+2],cx=p[ic*3],cy=p[ic*3+1],cz=p[ic*3+2];
   const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,nl=Math.hypot(nx,ny,nz);if(nl<1e-6||Math.abs(ny)/nl<.3)continue;// függőleges felület nem talaj
   const id=T.length/9;T.push(ax,ay,az,bx,by,bz,cx,cy,cz);SRC.push(si);
   for(let a=Math.floor(Math.min(ax,bx,cx)/COLC);a<=Math.floor(Math.max(ax,bx,cx)/COLC);a++)for(let b=Math.floor(Math.min(az,bz,cz)/COLC);b<=Math.floor(Math.max(az,bz,cz)/COLC);b++){const k=a*100003+b;let l=g.get(k);if(!l)g.set(k,l=[]);l.push(id);}}}
 return {T:new Float32Array(T),g,S:Uint8Array.from(SRC)};}
// hibakereséshez: egy pont alatti összes talaj-háromszög magassága és forrása (0 terep, 1-3 út, 4 járda, 5 sínágy)
function surfDbg(x,z){const o=[],k=Math.floor(x/COLC)*100003+Math.floor(z/COLC);for(const ch of chunks.values()){if(!ch.col)continue;const l=ch.col.g.get(k);if(!l)continue;const T=ch.col.T;for(const id of l){const q=id*9,ax=T[q],az=T[q+2],bx=T[q+3],bz=T[q+5],cx=T[q+6],cz=T[q+8],d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-9)continue;const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w3=1-w1-w2;if(w1<-1e-4||w2<-1e-4||w3<-1e-4)continue;o.push([+(w1*T[q+1]+w2*T[q+4]+w3*T[q+7]).toFixed(2),ch.col.S[id],ch.key]);}}return o;}
// talajmagasság: ha úttest van a kerék alatt, az autó a saját magasságához legközelebbi úttesten marad (az egymásba lógó út- és járdadarabok nem dobálják);
// úttest nélkül a legmagasabb elérhető felület (terep, járda, padka)
function meshSurf(x,z,cy,top){let best=-1e9,low=1e9,any=false,rb=null,pb=null;const k=Math.floor(x/COLC)*100003+Math.floor(z/COLC);
 for(const ch of chunks.values()){if(!ch.col||ch.state!=='ready'||rectD(ch.rect,x,z)>14)continue;const l=ch.col.g.get(k);if(!l)continue;const T=ch.col.T,S=ch.col.S;
  for(const id of l){const o=id*9,ax=T[o],az=T[o+2],bx=T[o+3],bz=T[o+5],cx=T[o+6],cz=T[o+8],d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-9)continue;
   const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w3=1-w1-w2;if(w1<-1e-4||w2<-1e-4||w3<-1e-4)continue;
   const y=w1*T[o+1]+w2*T[o+4]+w3*T[o+7];any=true;if(y<low)low=y;if(y>cy+.6)continue;if(y>best)best=y;
   const sr=S?S[id]:0;if(!top&&((sr>=1&&sr<=3)||sr===5)&&Math.abs(y-cy+.05)<.45){if(sr<=2||sr===5){if(rb==null||y>rb)rb=y;}else if(pb==null||y>pb)pb=y;}}}
 if(!any)return null;if(rb!=null)return rb;if(pb!=null)return pb;return best>-1e9?best:low;}
function colTop(col,x,z,cy){const l=col.g.get(Math.floor(x/COLC)*100003+Math.floor(z/COLC));if(!l)return null;const T=col.T;let best=null;for(const id of l){const o=id*9,ax=T[o],az=T[o+2],bx=T[o+3],bz=T[o+5],cx=T[o+6],cz=T[o+8],d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-9)continue;const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w3=1-w1-w2;if(w1<-1e-4||w2<-1e-4||w3<-1e-4)continue;const y=w1*T[o+1]+w2*T[o+4]+w3*T[o+7];if(y<=cy&&(best==null||y>best))best=y;}return best;}
function topSurf(x,z,cy){return meshSurf(x,z,cy,true);}// tárgyak (fa, lámpa, tábla) a látható legfelső felületre
function surfaceAt(x,z,cy){const ms=meshSurf(x,z,cy);if(ms!==null)return ms;let h=terrainH(x,z);if(isNaN(h))h=cy;let deck=-1e9,road=null,rd=1e9;
 forSegs(x,z,12,0,(a,k)=>{const r=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]),dy=a[k+2]+(a[k+5]-a[k+2])*r.t;
  if(a[k+7]){if(r.d<=a[k+6]+.4&&dy>h-.3&&dy<=cy+1.3&&dy>deck)deck=dy;return;}
  if(a[k+9]>1)return;const e=r.d-a[k+6];if(e<=.8&&dy>h-2.5&&dy<=Math.max(h+2.5,cy+1.3)&&(e<rd-.05||(e<rd+.05&&dy>road))){rd=e;road=dy;}});
 forSegs(x,z,6,2,(a,k)=>{const r=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]);if(r.d>2)return;const dy=a[k+2]+(a[k+5]-a[k+2])*r.t;if(dy>h+1&&dy<=cy+1.3&&dy>deck)deck=dy;});
 let sf=h;if(road!=null)sf=rd<=0?road:road+(h-road)*Math.min(1,rd/.8);return Math.max(sf,deck);}
function roadInfo(x,z){let best=null,named=null;forSegs(x,z,14,0,(a,k,ch)=>{const d=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]).d-a[k+6],nm=ch.names[a[k+8]];
 if(!best||d<best.d)best={d,cls:a[k+9],name:nm,spd:a[k+12]};if(nm&&d<1.5&&a[k+9]<2&&(!named||d<named.d))named={d,name:nm};});if(best&&!best.name&&named)best.name=named.name;return best;}
