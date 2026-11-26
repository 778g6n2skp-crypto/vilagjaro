/* ---------- fizika = látvány: az autó pontosan azokon a háromszögeken gurul, amik a képernyőn látszanak ---------- */
const COLC=8;
function buildCol(srcs){const T=[],g=new Map();
 for(const [p,idx] of srcs){if(!p||!p.length)continue;const n=idx?idx.length:p.length/3;
  for(let t=0;t<n;t+=3){const ia=idx?idx[t]:t,ib=idx?idx[t+1]:t+1,ic=idx?idx[t+2]:t+2,ax=p[ia*3],ay=p[ia*3+1],az=p[ia*3+2],bx=p[ib*3],by=p[ib*3+1],bz=p[ib*3+2],cx=p[ic*3],cy=p[ic*3+1],cz=p[ic*3+2];
   const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,nl=Math.hypot(nx,ny,nz);if(nl<1e-6||Math.abs(ny)/nl<.3)continue;// függőleges felület nem talaj
   const id=T.length/9;T.push(ax,ay,az,bx,by,bz,cx,cy,cz);
   for(let a=Math.floor(Math.min(ax,bx,cx)/COLC);a<=Math.floor(Math.max(ax,bx,cx)/COLC);a++)for(let b=Math.floor(Math.min(az,bz,cz)/COLC);b<=Math.floor(Math.max(az,bz,cz)/COLC);b++){const k=a*100003+b;let l=g.get(k);if(!l)g.set(k,l=[]);l.push(id);}}}
 return {T:new Float32Array(T),g};}
function meshSurf(x,z,cy){let best=-1e9,low=1e9,any=false;const k=Math.floor(x/COLC)*100003+Math.floor(z/COLC);
 for(const ch of chunks.values()){if(!ch.col||ch.state!=='ready'||rectD(ch.rect,x,z)>14)continue;const l=ch.col.g.get(k);if(!l)continue;const T=ch.col.T;
  for(const id of l){const o=id*9,ax=T[o],az=T[o+2],bx=T[o+3],bz=T[o+5],cx=T[o+6],cz=T[o+8],d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-9)continue;
   const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w3=1-w1-w2;if(w1<-1e-4||w2<-1e-4||w3<-1e-4)continue;
   const y=w1*T[o+1]+w2*T[o+4]+w3*T[o+7];any=true;if(y<=cy+.6&&y>best)best=y;if(y<low)low=y;}}
 if(!any)return null;return best>-1e9?best:low;}
function surfaceAt(x,z,cy){const ms=meshSurf(x,z,cy);if(ms!==null)return ms;let h=terrainH(x,z);if(isNaN(h))h=cy;let deck=-1e9,road=null,rd=1e9;
 forSegs(x,z,12,0,(a,k)=>{const r=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]),dy=a[k+2]+(a[k+5]-a[k+2])*r.t;
  if(a[k+7]){if(r.d<=a[k+6]+.4&&dy>h-.3&&dy<=cy+1.3&&dy>deck)deck=dy;return;}
  if(a[k+9]>1)return;const e=r.d-a[k+6];if(e<=.8&&dy>h-2.5&&dy<=Math.max(h+2.5,cy+1.3)&&(e<rd-.05||(e<rd+.05&&dy>road))){rd=e;road=dy;}});
 forSegs(x,z,6,2,(a,k)=>{const r=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]);if(r.d>2)return;const dy=a[k+2]+(a[k+5]-a[k+2])*r.t;if(dy>h+1&&dy<=cy+1.3&&dy>deck)deck=dy;});
 let sf=h;if(road!=null)sf=rd<=0?road:road+(h-road)*Math.min(1,rd/.8);return Math.max(sf,deck);}
function roadInfo(x,z){let best=null,named=null;forSegs(x,z,14,0,(a,k,ch)=>{const d=proj(x,z,a[k],a[k+1],a[k+3],a[k+4]).d-a[k+6],nm=ch.names[a[k+8]];
 if(!best||d<best.d)best={d,cls:a[k+9],name:nm,spd:a[k+12]};if(nm&&d<1.5&&a[k+9]<2&&(!named||d<named.d))named={d,name:nm};});if(best&&!best.name&&named)best.name=named.name;return best;}
