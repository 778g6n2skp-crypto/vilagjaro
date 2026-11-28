/* ---------- csempe felépítése ---------- */
const HOV=new Map();// utcafotóból becsült épületmagasságok (centroid -> m), csak ahol az OSM-ben nincs magasság
async function build(tx,ty,g,rebuild){
 const LA=lat0,LO=lon0,ML=mlon;
 const X=lon=>(lon-LO)*ML,Zf=lat=>-(lat-LA)*MLAT;
 const lonW=fx2lon(tx),lonE=fx2lon(tx+1),latN=fy2lat(ty),latS=fy2lat(ty+1);
 const ST=STY[styleAt((latN+latS)/2,(lonW+lonE)/2)];WALL=ST.W;
 const ct=await correctTile(tx,ty),Ls=await layersOf(tx,ty);
 const cx0=X(lonW),cx1=X(lonE),cz0=Zf(latN),cz1=Zf(latS);
 const inC=(x,z)=>x>=cx0&&x<cx1&&z>=cz0&&z<cz1,inE=(x,z,m)=>x>=cx0-m&&x<cx1+m&&z>=cz0-m&&z<cz1+m;
 const H=(x,z)=>hAt(LA-z/MLAT,LO+x/ML);
 const rnd=rng(tx*73856093^ty*19349663);
 const toL=(E)=>q=>[X(fx2lon(tx+q[0]/E)),Zf(fy2lat(ty+q[1]/E))];
 const polysOf=(L,F,clip)=>{const E=L.extent,R=rings(F.geom),out=[];let sign=0,cur=null;
  for(let r of R){if(r.length>1&&r[0][0]===r[r.length-1][0]&&r[0][1]===r[r.length-1][1])r=r.slice(0,-1);if(r.length<3)continue;
   const A=area(r);if(Math.abs(A)<1)continue;if(!sign)sign=Math.sign(A);
   const rr=clip?clipRing(r,E):r;if(rr.length<3)continue;
   const loc=rr.map(toL(E)),edge=rr.map(q=>q[0]<=0||q[0]>=E||q[1]<=0||q[1]>=E);
   if(Math.sign(A)===sign){cur={o:loc,oe:edge,h:[],he:[]};out.push(cur);}else if(cur){cur.h.push(loc);cur.he.push(edge);}}
  for(const P of out){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of P.o){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);}P.b=[x0,z0,x1,z1];}
  return out;};

 /* részletes réteg (ha 4,5 mp alatt megjön; különben később újraépítjük) */
 let D=null;{const dp=detailOf(tx,ty),r0=await Promise.race([dp,sleep(rebuild?90000:250).then(()=>'late')]);
  if(r0==='late')dp.then(d=>{if(d)postMessage({t:'detail',tx,ty,gen:g});});else D=r0;}
 const HS=(x,z)=>sAt(LA-z/MLAT,LO+x/ML);
 const VEH=/^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$/;
 const dB=[],dHw=[],dSide=[],dTr=[],dRows=[],dSig=[];
 function addB(t,O,id){if(O.length<3)return;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,cx=0,cz=0;for(const q of O){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);cx+=q[0];cz+=q[1];}
  dB.push({t,O,b:[x0,z0,x1,z1],c:[cx/O.length,cz/O.length],id:id||1,part:!!t['building:part']&&!t.building});}
 function joinRings(W){const out=[],segs=W.filter(w=>w.length>1).map(w=>w.slice());const eq=(a,b)=>Math.abs(a[0]-b[0])<.05&&Math.abs(a[1]-b[1])<.05;
  while(segs.length){let cur=segs.shift();for(let guard=0;guard<500&&!eq(cur[0],cur[cur.length-1]);guard++){const i=segs.findIndex(w=>eq(w[0],cur[cur.length-1])||eq(w[w.length-1],cur[cur.length-1]));if(i<0)break;const w=segs.splice(i,1)[0];cur=cur.concat(eq(w[0],cur[cur.length-1])?w.slice(1):w.slice(0,-1).reverse());}
   if(eq(cur[0],cur[cur.length-1])&&cur.length>=4)out.push(cur.slice(0,-1));}return out;}
 for(const el of (D&&D.elements)||[]){const t=el.tags||{};
  if(el.type==='node'){const x=X(el.lon),z=Zf(el.lat);if(t.natural==='tree')dTr.push([x,z]);else if(t.highway==='traffic_signals')dSig.push([x,z]);continue;}
  if(el.type==='relation'){if(!(t.building||t['building:part'])||!el.members)continue;for(const O of joinRings(el.members.filter(m=>m.type==='way'&&m.role!=='inner'&&m.geometry).map(m=>m.geometry.filter(Boolean).map(q=>[X(q.lon),Zf(q.lat)]))))addB(t,O,el.id);continue;}
  if(!el.geometry)continue;const gm=el.geometry.filter(Boolean).map(q=>[X(q.lon),Zf(q.lat)]);if(gm.length<2)continue;
  const f0=gm[0],f1=gm[gm.length-1],closed=Math.abs(f0[0]-f1[0])<.05&&Math.abs(f0[1]-f1[1])<.05;
  if((t.building||t['building:part']||t.man_made==='tower')&&closed&&gm.length>=4){addB(t,gm.slice(0,-1),el.id);continue;}
  if(t.footway==='sidewalk'){dSide.push(gm);continue;}
  if(t.natural==='tree_row'){dRows.push(gm);continue;}
  if(t.highway&&VEH.test(t.highway))dHw.push({t,g:gm});}
 const dParts=dB.filter(b=>b.part);for(const b of dB)if(!b.part)b.hasParts=dParts.some(q=>q.c[0]>=b.b[0]&&q.c[0]<=b.b[2]&&q.c[1]>=b.b[1]&&q.c[1]<=b.b[3]&&pipR(q.c[0],q.c[1],b.O));
 const grid=(C2)=>{const m=new Map();return{add(x0,z0,x1,z1,v){for(let a=Math.floor(x0/C2);a<=Math.floor(x1/C2);a++)for(let b=Math.floor(z0/C2);b<=Math.floor(z1/C2);b++){const k=a*100003+b;let l=m.get(k);if(!l)m.set(k,l=[]);l.push(v);}},get(x,z){return m.get(Math.floor(x/C2)*100003+Math.floor(z/C2));}};};
 const dGrid=grid(40);for(const b of dB)dGrid.add(b.b[0],b.b[1],b.b[2],b.b[3],b);
 const inDetail=(x,z)=>{const l=dGrid.get(x,z);if(!l)return false;for(const b of l)if(x>=b.b[0]&&x<=b.b[2]&&z>=b.b[1]&&z<=b.b[3]&&pipR(x,z,b.O))return true;return false;};
 const hwGrid=grid(20);for(const w of dHw)for(let k=1;k<w.g.length;k++){const a=w.g[k-1],b=w.g[k];hwGrid.add(Math.min(a[0],b[0])-5,Math.min(a[1],b[1])-5,Math.max(a[0],b[0])+5,Math.max(a[1],b[1])+5,[a[0],a[1],b[0],b[1],w]);}
 const swGrid=grid(20);for(const g2 of dSide)for(let k=1;k<g2.length;k++){const a=g2[k-1],b=g2[k];swGrid.add(Math.min(a[0],b[0])-5,Math.min(a[1],b[1])-5,Math.max(a[0],b[0])+5,Math.max(a[1],b[1])+5,[a[0],a[1],b[0],b[1]]);}
 const nearSW=(x,z,r)=>{const l=swGrid.get(x,z);if(!l)return false;for(const e of l)if(segD(x,z,e[0],e[1],e[2],e[3])<r)return true;return false;};
 const trGrid=grid(20);for(const q of dTr)trGrid.add(q[0],q[1],q[0],q[1],q);for(const g2 of dRows)for(const q of g2)trGrid.add(q[0],q[1],q[0],q[1],q);
 const nearTree=(x,z,r)=>{for(const dx of [-20,0,20])for(const dz of [-20,0,20]){const l=trGrid.get(x+dx,z+dz);if(l)for(const q of l)if(Math.hypot(q[0]-x,q[1]-z)<r)return true;}return false;};
 function matchOSM(P){const Dd=cum(P),tot=Dd[Dd.length-1],votes=new Map();
  for(const f of [.2,.5,.8]){const sv=tot*f;let k=0;while(k<Dd.length-2&&Dd[k+1]<sv)k++;const a=P[k],b=P[k+1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,t2=(sv-Dd[k]),x=a[0]+ux*t2,z=a[1]+uz*t2;
   const l=hwGrid.get(x,z);if(!l)continue;let bd=5,bw=null,bdot=0;
   for(const e of l){const d=segD(x,z,e[0],e[1],e[2],e[3]);if(d>=bd)continue;const ex=e[2]-e[0],ez=e[3]-e[1],el=Math.hypot(ex,ez)||1,dot=(ex*ux+ez*uz)/el;if(Math.abs(dot)<.75)continue;bd=d;bw=e[4];bdot=dot;}
   if(bw){const v=votes.get(bw)||{n:0,d:0};v.n++;v.d+=bdot;votes.set(bw,v);}}
  let best=null,bn=0;for(const [w,v] of votes)if(v.n>bn){bn=v.n;best={t:w.t,rev:v.d<0};}return best;}
 const marks=[];

 /* területek */
 const polys=[];
 for(const ln of ['landuse','landcover','park','water','transportation']){const L=Ls[ln];if(!L)continue;
  for(const F of L.feats){if(F.type!==3)continue;const p=props(L,F);if(ln==='transportation'&&p.brunnel)continue;const k=landClass(ln,p);if(!k)continue;
   for(const P of polysOf(L,F,true)){P.k=k;polys.push(P);}}}
 polys.sort((a,b)=>b.k.p-a.k.p);
 const waters=polys.filter(p=>p.k.water);
 for(const w of waters){w.big=w.b[2]-w.b[0]>260||w.b[3]-w.b[1]>260;if(!w.big){let mn=1e9;for(const q of w.o)mn=Math.min(mn,rawAt(LA-q[1]/MLAT,LO+q[0]/ML));w.lvl=mn+.3;}}

 /* rács: magasság + vízmeder (előre kiszámolva, javítva) */
 const W=G+1,hg=ct.h.slice(),wm=ct.wm.slice();

 /* építő segédek */
 const tri=(B,a,b,c,ref,col,uv)=>{const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)return;nx/=l;ny/=l;nz/=l;
  let B2=b,C2=c,ib=1,ic=2;if(nx*ref[0]+ny*ref[1]+nz*ref[2]<0){B2=c;C2=b;ib=2;ic=1;nx=-nx;ny=-ny;nz=-nz;}
  B.p.push(a[0],a[1],a[2],B2[0],B2[1],B2[2],C2[0],C2[1],C2[2]);B.n.push(nx,ny,nz,nx,ny,nz,nx,ny,nz);
  if(B.c){const q=col||[1,1,1];B.c.push(q[0],q[1],q[2],q[0],q[1],q[2],q[0],q[1],q[2]);}
  if(B.u){const q=uv||[[0,0],[0,0],[0,0]];B.u.push(q[0][0],q[0][1],q[ib][0],q[ib][1],q[ic][0],q[ic][1]);}};
 const quad=(B,a,b,c,d,ref,col,uv)=>{tri(B,a,b,c,ref,col,uv&&[uv[0],uv[1],uv[2]]);tri(B,a,c,d,ref,col,uv&&[uv[0],uv[2],uv[3]]);};
 const rib=()=>({p:[],u:[],i:[]});
 function ribbon(buf,run,hw,yAt,off,vs,keep){const base=buf.p.length/3,m=run.length;const E=[];off=off||0;vs=vs||10;
  for(let k=0;k<m;k++){const p=run[k],a=run[Math.max(0,k-1)],b=run[Math.min(m-1,k+1)];
   let tx2=b[0]-a[0],tz2=b[1]-a[1];const tl=Math.hypot(tx2,tz2)||1;tx2/=tl;tz2/=tl;const nx=-tz2,nz=tx2;let sc=1;
   if(k>0&&k<m-1){let ax=p[0]-a[0],az=p[1]-a[1];const al=Math.hypot(ax,az)||1;ax/=al;az/=al;sc=1/Math.max(.5,-az*nx+ax*nz);}
   const y=yAt(p);if(!keep)p[3]=y;const cx=p[0]+nx*off*sc,cz=p[1]+nz*off*sc,lx=cx+nx*hw*sc,lz=cz+nz*hw*sc,rx=cx-nx*hw*sc,rz=cz-nz*hw*sc;
   buf.p.push(lx,y,lz,rx,y,rz);if(buf.u)buf.u.push(0,p[2]/vs,1,p[2]/vs);E.push([lx,lz,rx,rz,y]);
   if(k>0){const v=base+k*2;buf.i.push(v-2,v,v-1,v-1,v,v+1);}}
  return E;}
 const cum=P=>{const D=[0];for(let k=1;k<P.length;k++)D.push(D[k-1]+Math.hypot(P[k][0]-P[k-1][0],P[k][1]-P[k-1][1]));return D;};
 function runs(P,D,m,step,cb){const Q=[];
  for(let k=0;k<P.length-1;k++){const L=D[k+1]-D[k],st=Math.max(1,Math.ceil(L/step));
   for(let q=0;q<st;q++){const f=q/st;Q.push([P[k][0]+(P[k+1][0]-P[k][0])*f,P[k][1]+(P[k+1][1]-P[k][1])*f,D[k]+L*f]);}}
  const l=P[P.length-1];Q.push([l[0],l[1],D[D.length-1]]);
  let run=[];for(const p of Q){if(inE(p[0],p[1],m))run.push(p);else{if(run.length>1)cb(run);run=[];}}if(run.length>1)cb(run);}

 /* épület-index a fák/lámpák kizárásához */
 const bh=new Map(),BC=24;
 const bAdd=P=>{for(let a=Math.floor(P.b[0]/BC);a<=Math.floor(P.b[2]/BC);a++)for(let b=Math.floor(P.b[1]/BC);b<=Math.floor(P.b[3]/BC);b++){const k=a*100003+b;let l=bh.get(k);if(!l)bh.set(k,l=[]);l.push(P);}};
 const inBld=(x,z)=>{const l=bh.get(Math.floor(x/BC)*100003+Math.floor(z/BC));if(!l)return false;for(const P of l)if(x>=P.b[0]&&x<=P.b[2]&&z>=P.b[1]&&z<=P.b[3]&&pipR(x,z,P.o))return true;return false;};

 /* épületek */
 const WU={p:[],n:[],u:[],c:[]},WG={p:[],n:[],u:[],c:[]},RF={p:[],n:[],c:[]},cseg=[],BX={p:[],n:[],c:[]},WM={p:[],n:[],u:[],c:[]},WP={p:[],n:[],u:[],c:[]},WK={p:[],n:[],u:[],c:[]},bIdx=[],BU=[],FAC=[],decorated=new Set();
 const BL=Ls.building;
 /* nevezetességek: horgonypont + a valódi alaprajzra illesztett befoglaló téglalap (PCA) */
 const lms=LMK.map(l=>({...l,x:X(l.lon),z:Zf(l.lat),pts:[]})).filter(l=>inE(l.x,l.z,500));
 const inLM=(x,z)=>{for(const l of lms)if(Math.hypot(x-l.x,z-l.z)<l.r)return true;return false;};
 if(lms.length&&BL)for(const F of BL.feats){if(F.type!==3)continue;for(const P of polysOf(BL,F,true)){let qx=0,qz=0;for(const q of P.o){qx+=q[0];qz+=q[1];}qx/=P.o.length;qz/=P.o.length;
  for(const l of lms)if(Math.hypot(qx-l.x,qz-l.z)<l.r)l.pts.push(...P.o);}}
 // korai útrács: épületfal, ami úton megy át (hídpillér, kapualj) – áthajtható nyílást kap
 const ERG=new Map(),TL0=Ls.transportation,rW0=pr=>{const c=(pr.class||'').replace('_construction','');if(c==='path')return 0;return RW[c]||0;};if(TL0)for(const F of TL0.feats){if(F.type!==2)continue;const pr=props(TL0,F);if(pr.brunnel==='tunnel'||/_construction$|ferry|pier|aerialway|rail|transit/.test(pr.class||''))continue;const w2=rW0(pr)/2;if(!w2)continue;
  for(const Rr of rings(F.geom)){const P=Rr.map(toL(TL0.extent));for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];for(let gx=Math.floor((Math.min(a[0],b[0])-w2)/24);gx<=Math.floor((Math.max(a[0],b[0])+w2)/24);gx++)for(let gz=Math.floor((Math.min(a[1],b[1])-w2)/24);gz<=Math.floor((Math.max(a[1],b[1])+w2)/24);gz++){const kk=gx*100003+gz;let l=ERG.get(kk);if(!l)ERG.set(kk,l=[]);l.push([a[0],a[1],b[0],b[1],w2]);}}}}
 const crossRoad=(p,q)=>{const mx=(p[0]+q[0])/2,mz=(p[1]+q[1])/2,l=ERG.get(Math.floor(mx/24)*100003+Math.floor(mz/24));if(!l)return false;for(const r of l){if(segD(mx,mz,r[0],r[1],r[2],r[3])<r[4]-.3)return true;
   const r1x=q[0]-p[0],r1z=q[1]-p[1],r2x=r[2]-r[0],r2z=r[3]-r[1],den=r1x*r2z-r1z*r2x;if(Math.abs(den)<1e-6)continue;const t=((r[0]-p[0])*r2z-(r[1]-p[1])*r2x)/den,u=((r[0]-p[0])*r1z-(r[1]-p[1])*r1x)/den;if(t>.05&&t<.95&&u>=0&&u<=1)return true;}return false;};
 // ---- valós boltok és benzinkutak az OSM POI-rétegből: kirakat csak ott, ahol tényleg bolt/vendéglátóhely van ----
 const SHOPC=new Set(['shop','grocery','clothing_store','restaurant','cafe','fast_food','bar','beer','pub','bakery','hairdresser','bank','pharmacy','post','ice_cream','butcher','florist','jewelry','shoe','shoes','optician','laundry','books','mobile_phone','alcohol_shop','hardware','furniture','car','art_gallery','music','gift','pet','toys','sports','beauty','doctors','dentist','cinema','theatre','chemist','stationery','electronics','travel_agent','convenience','supermarket','deli','confectionery','tobacco','kiosk','marketplace','bicycle','car_repair','dry_cleaning','photo','video','wine','tea','coffee','nightclub','casino','pastry','greengrocer','seafood','fuel_shop','department_store','mall','veterinary','clinic','pharmacy','computer','perfumery','cosmetics','garden_centre','paint','outdoor','fabric','hifi','frame','copyshop','tailor','second_hand','variety_store','money_lender','bureau_de_change','lottery','betting','ticket','tattoo','massage','fitness','fitness_centre','sports_centre','biergarten','food_court','community_centre','attraction','museum']);
 const PSH=new Map(),FUELP=[],SHS=[],SHN=[],SHI=new Map(),shName=n=>{let i=SHI.get(n);if(i===undefined){i=SHN.length;SHN.push(n);SHI.set(n,i);}return i;},SCLS=['shop','food','service','health','fuel'];
 const sCls=c=>/restaurant|cafe|fast_food|bar|beer|pub|bakery|ice_cream|pastry|food_court|biergarten|nightclub|confectionery|deli|wine|tea|coffee/.test(c)?1:/bank|post|travel|bureau|lottery|betting|ticket|copyshop|laundry|dry_clean|hairdresser|beauty|tattoo|massage|car_repair|fitness|sports_centre|cinema|theatre|museum|attraction|art_gallery|community/.test(c)?2:/pharmacy|chemist|doctors|dentist|clinic|optician|veterinary/.test(c)?3:0;
 {const PL=Ls.poi;if(PL){const tl=toL(PL.extent);for(const F of PL.feats){if(F.type!==1)continue;const pr=props(PL,F),c=pr.class||'';if((+pr.level||0)>0)continue;
   for(const Rr of rings(F.geom)){const q=tl(Rr[0]);
    if(c==='fuel'){if(pr.subclass==='fuel')FUELP.push({x:q[0],z:q[1],n:String(pr.name||pr.brand||'Benzinkút'),used:false});continue;}
    if(!SHOPC.has(c)&&!SHOPC.has(pr.subclass))continue;const k=Math.floor(q[0]/16)*100003+Math.floor(q[1]/16);let l=PSH.get(k);if(!l)PSH.set(k,l=[]);l.push({x:q[0],z:q[1],c:sCls(pr.subclass||c),n:String(pr.name||''),best:null});}}}}
 const poisFor=P=>{const out=[],b=P.b;for(let a=Math.floor((b[0]-8)/16);a<=Math.floor((b[2]+8)/16);a++)for(let c=Math.floor((b[1]-8)/16);c<=Math.floor((b[3]+8)/16);c++){const l=PSH.get(a*100003+c);if(!l)continue;
   for(const o of l){if(o.best!==null&&o.best.done)continue;if(o.x<b[0]-8||o.x>b[2]+8||o.z<b[1]-8||o.z>b[3]+8)continue;let d=pipR(o.x,o.z,P.o)?0:1e9;if(d)for(let k=0;k<P.o.length;k++){const p=P.o[k],q=P.o[(k+1)%P.o.length];d=Math.min(d,segD(o.x,o.z,p[0],p[1],q[0],q[1]));}if(d<7){o.din=d;out.push(o);}}}return out;};
 const brandCol=n=>/\bmol\b/i.test(n)?[.05,.5,.25]:/omv/i.test(n)?[.05,.3,.62]:/shell/i.test(n)?[.98,.78,.08]:/lukoil/i.test(n)?[.78,.08,.14]:/orlen/i.test(n)?[.85,.1,.1]:/avia/i.test(n)?[.1,.25,.65]:/total/i.test(n)?[.92,.35,.1]:/\bbp\b/i.test(n)?[.05,.6,.25]:/esso|exxon/i.test(n)?[.1,.2,.7]:/agip|eni/i.test(n)?[.95,.8,.1]:/aral/i.test(n)?[.05,.35,.8]:/jet\b/i.test(n)?[.95,.75,.05]:[.8,.12,.12];
 function canopy(cx,cz,u,L,W,g,ht,name){const col=brandCol(name),v=[-u[1],u[0]],P=(a,b)=>[cx+u[0]*a+v[0]*b,cz+u[1]*a+v[1]*b];
  obox(BX,cx,cz,u,L,W,g+ht,g+ht+.85,col);const c0=P(-L/2,-W/2),c1=P(L/2,-W/2),c2=P(L/2,W/2),c3=P(-L/2,W/2);quad(BX,[c0[0],g+ht-.01,c0[1]],[c1[0],g+ht-.01,c1[1]],[c2[0],g+ht-.01,c2[1]],[c3[0],g+ht-.01,c3[1]],[0,-1,0],[1.6,1.6,1.55]);// világos alsó lap
  for(const a of [-L*.3,L*.3])for(const b of [-W*.22,W*.22]){const q=P(a,b);obox(BX,q[0],q[1],u,.45,.45,g,g+ht,[.75,.75,.76]);const h2=.23;cseg.push(q[0]-h2,q[1]-h2,q[0]+h2,q[1]-h2,g,g+ht,q[0]+h2,q[1]-h2,q[0]+h2,q[1]+h2,g,g+ht,q[0]+h2,q[1]+h2,q[0]-h2,q[1]+h2,g,g+ht,q[0]-h2,q[1]+h2,q[0]-h2,q[1]-h2,g,g+ht);}
  for(const b of [-W*.22,W*.22]){const q=P(0,b);obox(BX,q[0],q[1],u,L*.5,1.1,g,g+.18,[.6,.6,.6]);for(const a of [-L*.12,L*.12]){const r2=P(a,b);obox(BX,r2[0],r2[1],u,.7,.5,g+.18,g+1.75,[.93,.93,.92]);obox(BX,r2[0],r2[1],u,.72,.52,g+1.75,g+1.95,col);}
   const e0=P(-L*.25,b-.55),e1=P(L*.25,b-.55),e2=P(L*.25,b+.55),e3=P(-L*.25,b+.55);cseg.push(e0[0],e0[1],e1[0],e1[1],g,g+1.9,e1[0],e1[1],e2[0],e2[1],g,g+1.9,e2[0],e2[1],e3[0],e3[1],g,g+1.9,e3[0],e3[1],e0[0],e0[1],g,g+1.9);}
  const sw=Math.min(L*.6,Math.max(2.4,name.length*.42+1));for(const sd of [-1,1]){const q=P(0,sd*(W/2+.03));SHS.push(q[0],g+ht+.42,q[1],v[0]*sd,v[1]*sd,sw,.62,4,shName(name));}
  bAdd({b:[Math.min(c0[0],c1[0],c2[0],c3[0]),Math.min(c0[1],c1[1],c2[1],c3[1]),Math.max(c0[0],c1[0],c2[0],c3[0]),Math.max(c0[1],c1[1],c2[1],c3[1])],o:[c0,c1,c2,c3],h:[]});}
 // egy közös felület: minden épület geometriájának helye a pufferekben + alapmagassága; a végső terep elkészülte után az épület a terep szintjére tolódik
 const BTR=[],BBUF=[WU,WG,RF,BX,WM,WP,WK];let bCur=null;const bMark=()=>({l:BBUF.map(b=>b.p.length),s:SHS.length,f:FAC.length,c:cseg.length});
 const bClose=()=>{if(bCur){bCur.e=bMark();BTR.push(bCur);bCur=null;}},bOpen=(O,mn)=>{bClose();bCur={m:bMark(),O,mn};};
 // OMT: az épületrészekre bontott épületek körvonala rejtett (hide_3d); ha a részek z14-en hiányoznak, a körvonal maga épül meg (különben üres telek marad, pl. Operaház)
 const SHOWH=new Set();if(BL){const vis=[];for(const F of BL.feats){if(F.type!==3)continue;const pr=props(BL,F);if(pr.hide_3d)continue;for(const P of polysOf(BL,F,true)){const O=P.o;let A=0,cx=0,cz=0;for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length];A+=p[0]*q[1]-q[0]*p[1];cx+=p[0];cz+=p[1];}vis.push([cx/O.length,cz/O.length,Math.abs(A/2)]);}}
  for(const F of BL.feats){if(F.type!==3)continue;const pr=props(BL,F);if(!pr.hide_3d)continue;for(const P of polysOf(BL,F,true)){const O=P.o;let A=0;for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length];A+=p[0]*q[1]-q[0]*p[1];}A=Math.abs(A/2);if(A<20||A>12000)continue;{let lo=1e9,hi=-1e9;for(const q of O){const h=H(q[0],q[1]);lo=Math.min(lo,h);hi=Math.max(hi,h);}if(hi-lo>5)continue;}let cov=0;
    for(const v of vis)if(v[0]>=P.b[0]&&v[0]<=P.b[2]&&v[1]>=P.b[1]&&v[1]<=P.b[3]&&pipR(v[0],v[1],O))cov+=v[2];if(cov<A*.5)SHOWH.add(F);}}}
 if(BL)for(const F of BL.feats){if(F.type!==3)continue;const pr=props(BL,F);const hid=pr.hide_3d&&!SHOWH.has(F);if(hid&&!FUELP.length)continue;
  for(const P of polysOf(BL,F,true)){if(!hid)bAdd(P);
   const O=P.o;let ar=0;for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length];ar+=p[0]*q[1]-q[0]*p[1];}ar=Math.abs(ar/2);if(ar<5)continue;
   {let qx=0,qz=0;for(const q of O){qx+=q[0];qz+=q[1];}qx/=O.length;qz/=O.length;if((dB.length&&inDetail(qx,qz))||(lms.length&&inLM(qx,qz)))continue;}
   const id=F.id||Math.round(O[0][0]*13+O[0][1]*7),r=hash(id);
   let ht=+pr.render_height||0,mh=+pr.render_min_height||0;const hUnk=ht<=5.1&&mh===0;let hq=0,hz=0;for(const q of O){hq+=q[0];hz+=q[1];}hq/=O.length;hz/=O.length;const hov=hUnk?HOV.get(Math.round(hq)+','+Math.round(hz)):undefined;
   if(ht<=5.1){const L0=ST.lvl[0],L1=ST.lvl[1];let lv=ar<45?1:ar<110?Math.min(2,L1):L0+(r%(L1-L0+1));if(ar<600&&FUELP.some(f=>Math.abs(f.x-O[0][0])<45&&Math.abs(f.z-O[0][1])<45))lv=1;ht=lv*3.25+(lv>2?.6:0);if(hov)ht=Math.max(3,Math.min(80,hov));}
   let mn=1e9;for(const q of O)mn=Math.min(mn,H(q[0],q[1]));bOpen(O,mn);
   if(SHOWH.has(F))ht=Math.min(ht,30);
   let vt=ht>=22?(ST.tall||r%3===0?1:2):(ar>2500&&ht<16?1:0);if(SHOWH.has(F))vt=ST.brick?3:0;if(vt===0&&ST.brick&&((r>>>3)%100)/100<ST.brick)vt=3;const WB=vt===0?WU:vt===1?WM:vt===2?WP:WK;
   for(const f of FUELP)if(f.x>=P.b[0]&&f.x<=P.b[2]&&f.z>=P.b[1]&&f.z<=P.b[3]&&pipR(f.x,f.z,O))f.dbgB=[Math.round(ar),ht,mh];
   if(FUELP.length&&ar<1500&&(+pr.render_height||0)<=9){const fp=FUELP.find(f=>!f.used&&f.x>=P.b[0]-3&&f.x<=P.b[2]+3&&f.z>=P.b[1]-3&&f.z<=P.b[3]+3&&(pipR(f.x,f.z,O)||O.some((p,k)=>segD(f.x,f.z,p[0],p[1],O[(k+1)%O.length][0],O[(k+1)%O.length][1])<3)));
    if(fp&&ar>60){fp.used=true;fp.mode=1;const fr=frameOf(O);canopy(fr.cx,fr.cz,fr.u,fr.L,fr.W,mn,Math.max(4.6,Math.min(6,(+pr.render_height||5)-.6)),fp.n);continue;}}
   if(hid)continue;
   const bp=mh===0?poisFor(P):[];
   const base=mh>0?mn+mh:mn-.8,top=mn+Math.max(ht,mh+2),shop=bp.length>0&&ar>20,split=Math.min(mn+4.2,top-.4);
   let wc=vt===3?[.9+(r%7)*.015,.88+(r%5)*.02,.86+(r%3)*.02]:WALL[r%WALL.length];if(vt!==3&&typeof pr.colour==='string'&&/^#[0-9a-f]{6}$/i.test(pr.colour)){const q=hx(pr.colour);wc=[q[0]*.6+wc[0]*.4,q[1]*.6+wc[1]*.4,q[2]*.6+wc[2]*.4];}
   const rc=FLAT[(r>>>5)%FLAT.length],prc=ST.R[(r>>>7)%ST.R.length];
   const oldS=(vt===0||vt===3)&&ar>40,mans=oldS&&ht>9&&ST.mans&&((r>>>11)%100)/100<ST.mans,pitched=oldS&&!mans&&ST.pitch&&((r>>>11)%100)/100<ST.pitch;
   const gable=O.length===4&&!P.h.length&&ar<230&&ht<9&&!P.oe.some(Boolean);
   const ringsAll=[[O,P.oe,false],...P.h.map((h,i)=>[h,P.he[i],true])],vS=WB.p.length/3;
   for(const [R,E,hole] of ringsAll){let A=0;for(let k=0;k<R.length;k++){const p=R[k],q=R[(k+1)%R.length];A+=p[0]*q[1]-q[0]*p[1];}
    let per=(r%5)*3;
    for(let k=0;k<R.length;k++){const p=R[k],q=R[(k+1)%R.length];if(E[k]&&E[(k+1)%R.length])continue;
     const dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);if(len<.05)continue;
     let on=A>0?[dz/len,0,-dx/len]:[-dz/len,0,dx/len];if(hole)on=[-on[0],0,-on[2]];
     const P0=y=>[p[0],y,p[1]],Q0=y=>[q[0],y,q[1]],pas=!hole&&crossRoad(p,q);
     if(pas){const b2=Math.max(base,top-Math.max(3,(top-base)*.35)),v0=(b2-mn)/13.2,v1=(top-mn)/13.2,w0=per/16,w1=(per+len)/16;quad(WB,P0(b2),Q0(b2),Q0(top),P0(top),on,wc,[[w0,v0],[w1,v0],[w1,v1],[w0,v1]]);quad(RF,P0(b2),Q0(b2),[q[0]-on[0]*1.5,b2,q[1]-on[2]*1.5],[p[0]-on[0]*1.5,b2,p[1]-on[2]*1.5],[0,-1,0],[wc[0]*.7,wc[1]*.7,wc[2]*.7]);per+=len;continue;}
     if(!hole&&len>=3&&inC((p[0]+q[0])/2,(p[1]+q[1])/2))FAC.push(p[0],p[1],q[0],q[1],base,top,on[0],on[2]);
     let sf=false;if(shop&&!hole&&len>=2.5)for(const o of bp){const d=segD(o.x,o.z,p[0],p[1],q[0],q[1]);if(d<(o.din>0?4:12)){sf=true;if(!o.best||d<o.best.d)o.best={d,p,q,on,mn,top,len};}}
     if(sf){const u0=per/24,u1=(per+len)/24;quad(WG,P0(base),Q0(base),Q0(split),P0(split),on,wc,[[u0,0],[u1,0],[u1,1],[u0,1]]);
      const v1=(top-split)/13.2,w0=per/16,w1=(per+len)/16;quad(WB,P0(split),Q0(split),Q0(top),P0(top),on,wc,[[w0,0],[w1,0],[w1,v1],[w0,v1]]);}
     else{const v0=(base-mn)/13.2,v1=(top-mn)/13.2,w0=per/16,w1=(per+len)/16;quad(WB,P0(base),Q0(base),Q0(top),P0(top),on,wc,[[w0,v0],[w1,v0],[w1,v1],[w0,v1]]);}
     if(ST.balc&&vt===0&&ht>12&&!hole&&len>3&&!sf)for(const fl of [2,5]){const yb=mn+fl*3.25+.15;if(yb>top-2)continue;const o2=.55,ox=on[0]*o2,oz=on[2]*o2,dk=[.05,.05,.06];
      quad(RF,[p[0],yb,p[1]],[q[0],yb,q[1]],[q[0]+ox,yb,q[1]+oz],[p[0]+ox,yb,p[1]+oz],[0,1,0],[wc[0]*.85,wc[1]*.85,wc[2]*.85]);quad(BX,[p[0]+ox,yb,p[1]+oz],[q[0]+ox,yb,q[1]+oz],[q[0]+ox,yb+.95,q[1]+oz],[p[0]+ox,yb+.95,p[1]+oz],on,dk);}
     if(vt===0&&ht>8&&!gable&&!hole&&ST.orn>=.5){const cc=[wc[0]*.8,wc[1]*.8,wc[2]*.8],o2=.45,ox=on[0]*o2,oz=on[2]*o2,ty2=top-.55;
      quad(RF,[p[0],top,p[1]],[q[0],top,q[1]],[q[0]+ox,top,q[1]+oz],[p[0]+ox,top,p[1]+oz],[0,1,0],cc);quad(RF,[p[0]+ox,ty2,p[1]+oz],[q[0]+ox,ty2,q[1]+oz],[q[0]+ox,top,q[1]+oz],[p[0]+ox,top,p[1]+oz],on,cc);}
     cseg.push(p[0],p[1],q[0],q[1],base,top+(gable?3:0));per+=len;}}
   for(const o of bp){const b=o.best;if(!b||b.done)continue;b.done=true;if(!o.n)continue;const dx=b.q[0]-b.p[0],dz=b.q[1]-b.p[1],l2=dx*dx+dz*dz||1,t=Math.max(.1,Math.min(.9,((o.x-b.p[0])*dx+(o.z-b.p[1])*dz)/l2));
    const w=Math.min(b.len*.85,Math.max(1.6,o.n.length*.34+.8)),y=Math.min(b.mn+3.15,b.top-.5);if(y<b.mn+2.4)continue;SHS.push(b.p[0]+dx*t+b.on[0]*.08,y,b.p[1]+dz*t+b.on[2]*.08,b.on[0],b.on[2],w,.62,o.c,shName(o.n.slice(0,28)));}
   if(vt!==1&&inC(O[0][0],O[0][1])){let qx=0,qz=0;for(const q of O){qx+=q[0];qz+=q[1];}bIdx.push(qx/O.length,qz/O.length,vt,vS,WB.p.length/3,Math.sqrt(ar));BU.push(hUnk?(hov?2:1):0,ht);}
   if(!gable&&(mans||pitched)){slopeRoof(O,P,top,ar,mans,prc,wc,r);}
   else if(gable){const e0=Math.hypot(O[1][0]-O[0][0],O[1][1]-O[0][1]),e1=Math.hypot(O[2][0]-O[1][0],O[2][1]-O[1][1]);
    const o=e0>=e1?0:1,p0=O[o],p1=O[(o+1)%4],p2=O[(o+2)%4],p3=O[(o+3)%4],cx=(p0[0]+p2[0])/2,cz=(p0[1]+p2[1])/2;
    const rh=top+Math.min(e0,e1)*.45,ra=[(p0[0]+p3[0])/2,rh,(p0[1]+p3[1])/2],rb=[(p1[0]+p2[0])/2,rh,(p1[1]+p2[1])/2],v=a=>[a[0],top,a[1]];
    const gc=ST.pitch?prc:rc;quad(RF,v(p0),v(p1),rb,ra,[0,1,0],gc);quad(RF,v(p2),v(p3),ra,rb,[0,1,0],gc);
    tri(WU,v(p1),v(p2),rb,[rb[0]-cx,0,rb[2]-cz],wc,[[0,0],[.1,0],[.05,.1]]);tri(WU,v(p3),v(p0),ra,[ra[0]-cx,0,ra[2]-cz],wc,[[0,0],[.1,0],[.05,.1]]);}
   else{const fl=[],holes=[];for(const q of O)fl.push(q[0],q[1]);for(const h of P.h){holes.push(fl.length/2);for(const q of h)fl.push(q[0],q[1]);}
    const all=[...O,...P.h.flat()],t=earcut(fl,holes.length?holes:null);
    const rc2=[rc[0]*.85+.03,rc[1]*.85+.03,rc[2]*.85+.03];
    for(let k=0;k<t.length;k+=3)tri(RF,[all[t[k]][0],top,all[t[k]][1]],[all[t[k+1]][0],top,all[t[k+1]][1]],[all[t[k+2]][0],top,all[t[k+2]][1]],[0,1,0],ar>300?rc2:rc);}}}

 bClose();
 /* ferde tetőszél / manzárdtető tetszőleges (udvaros) alaprajzra: befelé tolt kontúr */
 function sArea(Rr){let A=0;for(let k=0;k<Rr.length;k++){const p=Rr[k],q=Rr[(k+1)%Rr.length];A+=p[0]*q[1]-q[0]*p[1];}return A/2;}
 function insetRing(Rr,d){const A=sArea(Rr),n=Rr.length,s=A>0?1:-1,N=[];for(let k=0;k<n;k++){const p=Rr[k],q=Rr[(k+1)%n],ex=q[0]-p[0],ez=q[1]-p[1],l=Math.hypot(ex,ez)||1;N.push([-ez/l*s,ex/l*s]);}
  const out=[];for(let k=0;k<n;k++){const n1=N[(k+n-1)%n],n2=N[k];let mx=n1[0]+n2[0],mz=n1[1]+n2[1];const ml=Math.hypot(mx,mz);if(ml<1e-3){mx=n2[0];mz=n2[1];}else{mx/=ml;mz/=ml;}const sc=d/Math.max(.45,mx*n1[0]+mz*n1[1]);out.push([Rr[k][0]+mx*sc,Rr[k][1]+mz*sc]);}
  for(let k=0;k<n;k++){const a=Rr[k],b=Rr[(k+1)%n],c=out[k],e=out[(k+1)%n];if((b[0]-a[0])*(e[0]-c[0])+(b[1]-a[1])*(e[1]-c[1])<=0)return null;}
  const A2=sArea(out);if(A2*A<=0||Math.abs(A2)<Math.abs(A)*.12)return null;return out;}
 function slopeRoof(O,P,top,ar,mans,col,wc,r){let per=0;for(const Rr of [O,...P.h])for(let k=0;k<Rr.length;k++){const a=Rr[k],b=Rr[(k+1)%Rr.length];per+=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  let d=Math.min(mans?1.6:4.2,.36*ar/(per/2)),I=null,H2=[];for(let t=0;t<2&&!I;t++,d*=.55){if(d<.7)break;I=insetRing(O,d);H2=[];if(I)for(const h of P.h){const hi=insetRing(h,-d);if(!hi){I=null;break;}H2.push(hi);}}
  if(!I){const fl=[];for(const q of O)fl.push(q[0],q[1]);const t=earcut(fl);for(let k=0;k<t.length;k+=3)tri(RF,[O[t[k]][0],top,O[t[k]][1]],[O[t[k+1]][0],top,O[t[k+1]][1]],[O[t[k+2]][0],top,O[t[k+2]][1]],[0,1,0],FLAT[r%FLAT.length]);return;}
  const rise=mans?3.3:d*.9,yT=top+rise;
  const band=(A,B)=>{for(let k=0;k<A.length;k++){const a=A[k],b=A[(k+1)%A.length],c=B[(k+1)%A.length],e=B[k];quad(RF,[a[0],top,a[1]],[b[0],top,b[1]],[c[0],yT,c[1]],[e[0],yT,e[1]],[(e[0]-a[0])*-1,d*.8,(e[1]-a[1])*-1],col);}};
  band(O,I);P.h.forEach((h,i)=>band(h,H2[i]));
  const fl=[],holes=[];for(const q of I)fl.push(q[0],q[1]);for(const h of H2){holes.push(fl.length/2);for(const q of h)fl.push(q[0],q[1]);}const all=[...I,...H2.flat()],t=earcut(fl,holes.length?holes:null);
  const tc=mans?[col[0]*.8,col[1]*.8,col[2]*.8]:col;for(let k=0;k<t.length;k+=3)tri(RF,[all[t[k]][0],yT,all[t[k]][1]],[all[t[k+1]][0],yT,all[t[k+1]][1]],[all[t[k+2]][0],yT,all[t[k+2]][1]],[0,1,0],tc);
  if(mans){const dk=[.03,.035,.045];for(let k=0;k<O.length;k++){const a=O[k],b=O[(k+1)%O.length],e0=I[k],e1=I[(k+1)%O.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<4)continue;const u=[(b[0]-a[0])/L,(b[1]-a[1])/L],nx=(e0[0]+e1[0])/2-(a[0]+b[0])/2,nz=(e0[1]+e1[1])/2-(a[1]+b[1])/2,nl=Math.hypot(nx,nz)||1,inw=[nx/nl,nz/nl];
   for(let s2=2;s2<L-1.5;s2+=3.6){const fx=a[0]+u[0]*s2+inw[0]*.5,fz=a[1]+u[1]*s2+inw[1]*.5;obox(BX,fx+inw[0]*.55,fz+inw[1]*.55,u,1.25,1.1,top+.3,top+2.15,wc);
    const w0=[fx-u[0]*.38-inw[0]*.02,fz-u[1]*.38-inw[1]*.02],w1=[fx+u[0]*.38-inw[0]*.02,fz+u[1]*.38-inw[1]*.02];quad(BX,[w0[0],top+.55,w0[1]],[w1[0],top+.55,w1[1]],[w1[0],top+1.85,w1[1]],[w0[0],top+1.85,w0[1]],[-inw[0],0,-inw[1]],dk);}}}}
 /* részletes 3D-épületek (OSM: épületrészek, tetőformák, színek) + templomsablon */
 const boxAt=(B,x,y,z,sx,sy,sz,col)=>{const c=[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>[x+q[0]*sx/2,z+q[1]*sz/2]);
  for(let k=0;k<4;k++){const a=c[k],b=c[(k+1)%4];quad(B,[a[0],y-sy/2,a[1]],[b[0],y-sy/2,b[1]],[b[0],y+sy/2,b[1]],[a[0],y+sy/2,a[1]],[(a[0]+b[0])/2-x,0,(a[1]+b[1])/2-z],col);}
  quad(B,[c[0][0],y+sy/2,c[0][1]],[c[1][0],y+sy/2,c[1][1]],[c[2][0],y+sy/2,c[2][1]],[c[3][0],y+sy/2,c[3][1]],[0,1,0],col);};
 function walls(O,base,top,wc,mn,vs,BUF){vs=vs||1;BUF=BUF||WU;let A=0;for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length];A+=p[0]*q[1]-q[0]*p[1];}let per=0;
  for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);if(len<.05)continue;const on=A>0?[dz/len,0,-dx/len]:[-dz/len,0,dx/len];
   if(len>=3&&top-base>4&&inC((p[0]+q[0])/2,(p[1]+q[1])/2))FAC.push(p[0],p[1],q[0],q[1],Math.max(base,mn),top,on[0],on[2]);
   const v0=(base-mn)/13.2/vs,v1=(top-mn)/13.2/vs,w0=per/16/Math.sqrt(vs),w1=(per+len)/16/Math.sqrt(vs);quad(BUF,[p[0],base,p[1]],[q[0],base,q[1]],[q[0],top,q[1]],[p[0],top,p[1]],on,wc,[[w0,v0],[w1,v0],[w1,v1],[w0,v1]]);
   cseg.push(p[0],p[1],q[0],q[1],base,top);per+=len;}}
 function roofGen(O,y0,y1,shape,rc,wc){const rh=y1-y0,L=O.length;let cx=0,cz=0;for(const q of O){cx+=q[0];cz+=q[1];}cx/=L;cz/=L;
  const flat=()=>{const fl=[];for(const q of O)fl.push(q[0],q[1]);const t=earcut(fl);for(let k=0;k<t.length;k+=3)tri(RF,[O[t[k]][0],y0,O[t[k]][1]],[O[t[k+1]][0],y0,O[t[k+1]][1]],[O[t[k+2]][0],y0,O[t[k+2]][1]],[0,1,0],rc);};
  if(rh<.3||shape==='flat'){flat();return;}
  let S=/^(pyramidal|cone|conical|spire)$/.test(shape)?'pyr':/^(dome|round)$/.test(shape)?'dome':shape==='onion'?'onion':/^(gabled|gabled_height_moved|saltbox)$/.test(shape)?'gab':/^(skillion|lean_to)$/.test(shape)?'skil':'hip';
  if((S==='gab'||S==='hip')&&L!==4)S='pyr';
  if(S==='pyr'){for(let k=0;k<L;k++){const p=O[k],q=O[(k+1)%L];tri(RF,[p[0],y0,p[1]],[q[0],y0,q[1]],[cx,y1,cz],[(p[0]+q[0])/2-cx,rh*.4+.01,(p[1]+q[1])/2-cz],rc);}return;}
  if(S==='dome'||S==='onion'){const K=8;let prev=O.map(q=>[q[0],y0,q[1]]);
   for(let k=1;k<=K;k++){const t=k/K;let sc,yy;if(S==='dome'){sc=Math.cos(t*Math.PI/2);yy=Math.sin(t*Math.PI/2);}else{sc=(1+.42*Math.sin(Math.min(1,t*1.5)*Math.PI))*Math.pow(1-t,.85);yy=t;}
    const cur=O.map(q=>[cx+(q[0]-cx)*sc,y0+yy*rh,cz+(q[1]-cz)*sc]);
    for(let i=0;i<L;i++){const a=prev[i],b=prev[(i+1)%L],c=cur[(i+1)%L],d=cur[i];quad(RF,a,b,c,d,[(a[0]+b[0])/2-cx,.6,(a[2]+b[2])/2-cz],rc);}prev=cur;}
   if(S==='onion')boxAt(RF,cx,y1+rh*.12,cz,.25,rh*.25,.25,rc);return;}
  if(S==='skil'){let li=0,ll=0;for(let k=0;k<L;k++){const l=Math.hypot(O[(k+1)%L][0]-O[k][0],O[(k+1)%L][1]-O[k][1]);if(l>ll){ll=l;li=k;}}
   const a=O[li],b=O[(li+1)%L],nx=-(b[1]-a[1])/ll,nz=(b[0]-a[0])/ll;let s0=1e9,s1=-1e9;const pr=O.map(q=>{const v=(q[0]-cx)*nx+(q[1]-cz)*nz;s0=Math.min(s0,v);s1=Math.max(s1,v);return v;});
   const yv=pr.map(v=>y0+rh*(s1-v)/((s1-s0)||1)),fl=[];for(const q of O)fl.push(q[0],q[1]);const t=earcut(fl);
   for(let k=0;k<t.length;k+=3)tri(RF,[O[t[k]][0],yv[t[k]],O[t[k]][1]],[O[t[k+1]][0],yv[t[k+1]],O[t[k+1]][1]],[O[t[k+2]][0],yv[t[k+2]],O[t[k+2]][1]],[0,1,0],rc);
   for(let k=0;k<L;k++){const p=O[k],q=O[(k+1)%L],k2=(k+1)%L;if(yv[k]-y0<.05&&yv[k2]-y0<.05)continue;quad(WU,[p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],yv[k2],q[1]],[p[0],yv[k],p[1]],[(p[0]+q[0])/2-cx,0,(p[1]+q[1])/2-cz],wc,[[0,0],[.1,0],[.1,.1],[0,.1]]);}return;}
  const e0=Math.hypot(O[1][0]-O[0][0],O[1][1]-O[0][1]),e1=Math.hypot(O[2][0]-O[1][0],O[2][1]-O[1][1]),o=e0>=e1?0:1,p0=O[o],p1=O[(o+1)%4],p2=O[(o+2)%4],p3=O[(o+3)%4],v=a=>[a[0],y0,a[1]];
  let ra=[(p0[0]+p3[0])/2,y1,(p0[1]+p3[1])/2],rb=[(p1[0]+p2[0])/2,y1,(p1[1]+p2[1])/2];
  if(S==='hip'){const lx=rb[0]-ra[0],lz=rb[2]-ra[2],ln=Math.hypot(lx,lz)||1,ins=Math.min(Math.min(e0,e1)/2,ln*.45);ra=[ra[0]+lx/ln*ins,y1,ra[2]+lz/ln*ins];rb=[rb[0]-lx/ln*ins,y1,rb[2]-lz/ln*ins];}
  quad(RF,v(p0),v(p1),rb,ra,[0,1,0],rc);quad(RF,v(p2),v(p3),ra,rb,[0,1,0],rc);
  if(S==='hip'){tri(RF,v(p1),v(p2),rb,[rb[0]-cx,.5,rb[2]-cz],rc);tri(RF,v(p3),v(p0),ra,[ra[0]-cx,.5,ra[2]-cz],rc);}
  else{tri(WU,v(p1),v(p2),rb,[rb[0]-cx,0,rb[2]-cz],wc,[[0,0],[.1,0],[.05,.1]]);tri(WU,v(p3),v(p0),ra,[ra[0]-cx,0,ra[2]-cz],wc,[[0,0],[.1,0],[.05,.1]]);}}
 const cyl=(B,cx,cz,r,y0,y1,n,col,r1)=>{r1=r1==null?r:r1;for(let k=0;k<n;k++){const a=k/n*6.2832,b=(k+1)/n*6.2832;
  quad(B,[cx+Math.cos(a)*r,y0,cz+Math.sin(a)*r],[cx+Math.cos(b)*r,y0,cz+Math.sin(b)*r],[cx+Math.cos(b)*r1,y1,cz+Math.sin(b)*r1],[cx+Math.cos(a)*r1,y1,cz+Math.sin(a)*r1],[Math.cos((a+b)/2),0,Math.sin((a+b)/2)],col);
  if(r1>.01)tri(B,[cx,y1,cz],[cx+Math.cos(a)*r1,y1,cz+Math.sin(a)*r1],[cx+Math.cos(b)*r1,y1,cz+Math.sin(b)*r1],[0,1,0],col);}};
 const ring=(n,cx,cz,r)=>{const o=[];for(let k=0;k<n;k++){const a=k/n*6.2832;o.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r]);}return o;};
 const rectR=(cx,cz,u,lu,lv)=>{const v=[-u[1],u[0]];return[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>[cx+u[0]*q[0]*lu/2+v[0]*q[1]*lv/2,cz+u[1]*q[0]*lu/2+v[1]*q[1]*lv/2]);};
 const domeOn=(cx,cz,r,y0,h,col,n=16)=>roofGen(ring(n,cx,cz,r),y0,y0+h,'dome',col,col);
 const pinn=(x,z,y,col,s=1)=>{tri(RF,[x-.7*s,y,z-.7*s],[x+.7*s,y,z-.7*s],[x,y+5*s,z],[0,.2,-1],col);tri(RF,[x+.7*s,y,z-.7*s],[x+.7*s,y,z+.7*s],[x,y+5*s,z],[1,.2,0],col);tri(RF,[x+.7*s,y,z+.7*s],[x-.7*s,y,z+.7*s],[x,y+5*s,z],[0,.2,1],col);tri(RF,[x-.7*s,y,z+.7*s],[x-.7*s,y,z-.7*s],[x,y+5*s,z],[-1,.2,0],col);};
 const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
 const TERRA=['#b5563e','#a14a36','#8c4f3c'].map(hx),SPIRE=['#4f8f7d','#5a6470','#3f4a5a'].map(hx),GOLD=hx('#e2b74a');
 for(const b of dB){if(!inC(b.c[0],b.c[1])||(lms.length&&inLM(b.c[0],b.c[1])))continue;const t=b.t,O=b.O;if(b.hasParts){if(t.name)marks.push([b.c[0],b.c[1],t.name,/church|cathedral|chapel|basilica/.test(t.building)?'templom':'nevezetesség']);continue;}let A=0;for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length];A+=p[0]*q[1]-q[0]*p[1];}const ar=Math.abs(A/2);if(ar<4)continue;
  const r=hash(b.id),church=!b.part&&(/^(church|cathedral|chapel|basilica)$/.test(t.building)||(t.amenity==='place_of_worship'&&(!t.religion||t.religion==='christian')));
  let mn=1e9;for(const q of O)mn=Math.min(mn,H(q[0],q[1]));bOpen(O,mn);
  let h=num(t.height),mh=num(t.min_height),lv=num(t['building:levels']),ml=num(t['building:min_level']),rl=num(t['roof:levels']),rh=num(t['roof:height']);if(mh==null)mh=ml!=null?ml*3.2:0;
  const shape=String(t['roof:shape']||'flat').toLowerCase(),rad=Math.sqrt(ar/Math.PI);
  if(rh==null)rh=rl?rl*2.8:shape==='flat'?0:/dome|round/.test(shape)?rad:shape==='onion'?rad*1.7:/pyramidal|cone|conical|spire/.test(shape)?rad*(shape==='pyramidal'?1.1:2.6):/skillion|lean_to/.test(shape)?Math.min(4,rad*.4):Math.min(8,rad*.7);
  if(h==null)h=lv!=null?lv*3.2+rh:(church?16:ar<120?7:ar<400?11:15)+rh;
  if(h-rh<mh+1)rh=Math.max(0,(h-mh)*.5);
  let wc=colOf(t['building:colour'],t['building:material'])||WALL[r%WALL.length];const rc=colOf(t['roof:colour'],t['roof:material'])||(shape==='flat'?ROOF[(r>>>5)%ROOF.length]:TERRA[r%3]);
  const nm=t.name||'';if(nm&&(church||t.tourism||t.historic||t.wikidata))marks.push([b.c[0],b.c[1],nm,church?'templom':'nevezetesség']);
  const K=lmKind(t,church,ar,h,nm);
  if(K){const hT=num(t.height),wcT=colOf(t['building:colour'],t['building:material']),rcT=colOf(t['roof:colour'],t['roof:material']);
   if(K==='church'||K==='cath'||K==='basil'){churchT(b,O,mn,wc,rc,hT,r,K,/orthodox/i.test(t.denomination||''));continue;}
   const fr=frameOf(O);if(fr.L<6||fr.W<4){walls(O,mn-.8,mn+h,wc,mn);roofGen(O,mn+h,mn+h,'flat',rc,wc);continue;}
   if(K==='mosque'){mosqueT(O,fr,mn,wcT||hx('#ece6d8'),rcT||hx('#8a9aa6'),hT,r,num(t.minarets));continue;}
   if(K==='syn'){synT(O,fr,mn,wcT||hx('#c9a27a'),rcT||hx('#b88a3a'),hT,r);continue;}
   if(K==='castle'){castleT(O,fr,mn,wcT||hx('#c9bfae'),rcT||hx('#7a4a3a'),hT,r);continue;}
   if(K==='station'){stationT(O,fr,mn,wc,rcT||hx('#8a959e'),hT,ar);continue;}
   if(K==='tower'){towerT(O,fr,mn,wcT,hT||h,t);continue;}
   if(K==='sky'){skyT(O,fr,mn,h,r,ar);continue;}
   palaceT(O,fr,mn,wcT||wc,rcT||ST.R[r%ST.R.length],hT,r,ar,K);continue;}
  const base=mh>0?mn+mh:mn-.8,eave=mn+h-rh;walls(O,base,eave,wc,mn);roofGen(O,eave,mn+h,shape,rc,wc);}
 function churchT(b,O,mn,wc,rc,hTag,r,K,orth){let li=0,ll=0;for(let k=0;k<O.length;k++){const l=Math.hypot(O[(k+1)%O.length][0]-O[k][0],O[(k+1)%O.length][1]-O[k][1]);if(l>ll){ll=l;li=k;}}
  const a=O[li],bq=O[(li+1)%O.length],u=[(bq[0]-a[0])/ll,(bq[1]-a[1])/ll],v=[-u[1],u[0]];let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
  for(const q of O){const pu=q[0]*u[0]+q[1]*u[1],pv=q[0]*v[0]+q[1]*v[1];u0=Math.min(u0,pu);u1=Math.max(u1,pu);v0=Math.min(v0,pv);v1=Math.max(v1,pv);}
  const P2=(x,y)=>[u[0]*x+v[0]*y,u[1]*x+v[1]*y],Lh=u1-u0,Wd=v1-v0;
  if(Lh<6||Wd<4){walls(O,mn-.8,mn+10,wc,mn);roofGen(O,mn+10,mn+14,'pyramidal',rc,wc);return;}
  const naveH=Math.min(18,Math.max(9,Wd*.8)),eave=mn+naveH;walls(O,mn-.8,eave,wc,mn,2.6);
  roofGen([P2(u0,v0),P2(u1,v0),P2(u1,v1),P2(u0,v1)],eave,eave+Math.min(Wd*.45,9),'gabled',rc,wc);
  const twin=K==='cath'||K==='basil',ts=Math.min(Wd*(twin?.3:.42),twin?12:10),west=P2(u0,0)[0]<P2(u1,0)[0],ue=west?u0:u1,du=west?1:-1,tc=ue+du*ts/2,hf=ts/2;
  const tH=hTag&&hTag>naveH*1.4?hTag:naveH*(twin?2.9:2.3)+ts*.5,spH=Math.max(ts*1.8,tH*.3),tE=mn+tH-spH,shape=orth?'onion':r%3===0&&!twin?'onion':'pyramidal',sc=orth?hx('#c9a23a'):SPIRE[r%3];
  for(const vc of twin?[v0+hf,v1-hf]:[(v0+v1)/2]){const T4=[P2(tc-hf,vc-hf),P2(tc+hf,vc-hf),P2(tc+hf,vc+hf),P2(tc-hf,vc+hf)];
   walls(T4,mn-.8,tE,wc,mn,1.8);roofGen(T4,tE,mn+tH,shape,sc,wc);const c=P2(tc,vc);boxAt(RF,c[0],mn+tH+1.3,c[1],.28,2.6,.28,GOLD);boxAt(RF,c[0],mn+tH+1.8,c[1],1.5,.26,.26,GOLD);}
  if(K==='basil'||orth){const c=P2((u0+u1)/2+du*Lh*.08,(v0+v1)/2),dr=Math.min(Wd*.3,16);cyl(BX,c[0],c[1],dr,eave,eave+dr*.9,16,wc,dr);roofGen(ring(16,c[0],c[1],dr),eave+dr*.9,eave+dr*1.9,orth?'onion':'dome',orth?hx('#c9a23a'):hx('#4f8f7d'),wc);boxAt(RF,c[0],eave+dr*2.1,c[1],.3,2.4,.3,GOLD);}
  if(K==='cath'&&Lh>40){const c=P2(u1-du*Lh*.3,(v0+v1)/2);obox(BX,c[0],c[1],u,6,6,eave,eave+9,wc);pinn(c[0],c[1],eave+9,SPIRE[0],2);}}
 /* ---- általános nevezetesség-nyelvtan: OSM-címkékből felismert épülettípusok ---- */
 function lmKind(t,church,ar,h,nm){if(t['roof:shape'])return null;const n=(nm||'').toLowerCase(),bt=t.building||'';
  if(church)return(bt==='cathedral'||/katedr|cathedral|cathédrale|kathedrale|duomo|\bdom\b|székesegyház|catedral|cattedrale|münster/.test(n))?'cath':(/bazilika|basilica|basilique|basílica/.test(n)&&ar>1200)?'basil':'church';
  if(bt==='mosque'||t.religion==='muslim'&&t.amenity==='place_of_worship')return'mosque';
  if(bt==='synagogue'||t.religion==='jewish'&&t.amenity==='place_of_worship')return'syn';
  if(/^(castle|fort|fortress)$/.test(t.historic||'')||bt==='castle'||bt==='fortress')return'castle';
  if(bt==='train_station'||(t.railway==='station'&&ar>800))return'station';
  if(t.man_made==='tower'||(bt==='tower'&&h>25))return'tower';
  if(h>90&&!t['building:part'])return'sky';
  if(/parlament|parliament|capitol|capitole|reichstag|országház|bundestag|kongress/.test(n)&&ar>2500)return'dome';
  if(bt==='palace'||t.historic==='palace'||t.amenity==='townhall'||(bt==='government'||bt==='civic'||t.office==='government')&&ar>1500||/palota|palace|palais|palazzo|schloss|kastély|városháza|rathaus|hôtel de ville/.test(n)&&ar>700)return'palace';
  if(t.amenity==='theatre'||t.tourism==='museum'&&ar>900||/operaház|opéra|opera house|színház|theatre|theater|múzeum|museum|musée|museo/.test(n)&&ar>900)return'portico';
  if((t.wikidata||t.heritage||t.historic)&&ar>1500&&!t['building:part'])return'palace';return null;}
 function frameOf(O){let best=null;for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length],l=Math.hypot(q[0]-p[0],q[1]-p[1]);if(l<1)continue;const u=[(q[0]-p[0])/l,(q[1]-p[1])/l];let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;
   for(const r of O){const a=r[0]*u[0]+r[1]*u[1],b=-r[0]*u[1]+r[1]*u[0];a0=Math.min(a0,a);a1=Math.max(a1,a);b0=Math.min(b0,b);b1=Math.max(b1,b);}const ar=(a1-a0)*(b1-b0);if(!best||ar<best.ar)best={ar,u,a0,a1,b0,b1};}
  let {u,a0,a1,b0,b1}=best;if(b1-b0>a1-a0){u=[-u[1],u[0]];[a0,a1,b0,b1]=[b0,b1,-a1,-a0];}const ca=(a0+a1)/2,cb=(b0+b1)/2,cx=u[0]*ca-u[1]*cb,cz=u[1]*ca+u[0]*cb;
  return{cx,cz,u,v:[-u[1],u[0]],L:a1-a0,W:b1-b0,P:(a,b)=>[cx+u[0]*a-u[1]*b,cz+u[1]*a+u[0]*b]};}
 function pediment(fr,a,b,hw,y,depth,col,colR){const c=fr.P(a,b),u=fr.u,v=fr.v,s=Math.sign(b)||1,ph=hw*.32;
  const p0=[c[0]-u[0]*hw+v[0]*s*depth,c[1]-u[1]*hw+v[1]*s*depth],p1=[c[0]+u[0]*hw+v[0]*s*depth,c[1]+u[1]*hw+v[1]*s*depth],pt=[c[0]+v[0]*s*depth,c[1]+v[1]*s*depth];
  tri(BX,[p0[0],y,p0[1]],[p1[0],y,p1[1]],[pt[0],y+ph,pt[1]],[v[0]*s,0,v[1]*s],col);
  const q0=[c[0]-u[0]*hw,c[1]-u[1]*hw],q1=[c[0]+u[0]*hw,c[1]+u[1]*hw];quad(RF,[p0[0],y,p0[1]],[pt[0],y+ph,pt[1]],[c[0],y+ph,c[1]],[q0[0],y,q0[1]],[0,1,0],colR);quad(RF,[pt[0],y+ph,pt[1]],[p1[0],y,p1[1]],[q1[0],y,q1[1]],[c[0],y+ph,c[1]],[0,1,0],colR);}
 function portico(fr,side,mn,eave,wc,rc,wid){const b=side*fr.W/2,hw=Math.min(wid/2,fr.L*.3),depth=Math.min(7,fr.W*.25),c=fr.P(0,b+side*depth*.5),n=Math.max(4,Math.round(hw/2.4)*2);
  obox(BX,c[0],c[1],fr.u,hw*2+1,depth+.6,mn-.6,mn+1.4,wc);obox(BX,c[0],c[1],fr.u,hw*2+.6,depth,eave-2.2,eave,wc);
  for(let i=0;i<n;i++){const a=-hw+.8+i*(2*hw-1.6)/(n-1),q=fr.P(a,b+side*(depth-.8));cyl(BX,q[0],q[1],.55,mn+1.4,eave-2.2,10,wc,.48);}
  pediment(fr,0,b,hw,eave,depth,wc,rc);}
 function palaceT(O,fr,mn,wc,rc,hT,r,ar,K){const h=hT||Math.max(K==='portico'?16:14,Math.min(K==='dome'?26:24,Math.sqrt(ar)*.45)),eave=mn+h;
  walls(O,mn-.8,eave,wc,mn,1.25);const cc=[wc[0]*.82,wc[1]*.82,wc[2]*.82];
  for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(len<2)continue;const on=[(q[1]-p[1])/len,-(q[0]-p[0])/len],sg=sArea(O)>0?1:-1,ox=on[0]*.6*sg,oz=on[1]*.6*sg;
   for(const yy of [eave-.6,mn+4.4])quad(BX,[p[0]+ox,yy,p[1]+oz],[q[0]+ox,yy,q[1]+oz],[q[0]+ox,yy+.6,q[1]+oz],[p[0]+ox,yy+.6,p[1]+oz],[on[0]*sg,0,on[1]*sg],cc);}
  slopeRoof(O,{h:[]},eave,ar,false,rc,wc,r);
  if(K==='portico'){portico(fr,1,mn,eave,wc,rc,fr.L*.45);return;}
  for(const side of [-1,1]){const c=fr.P(0,side*(fr.W/2+.9)),rw=Math.min(fr.L*.22,30);obox(BX,c[0],c[1],fr.u,rw,1.8,mn-.6,eave+2.5,wc);pediment(fr,0,side*(fr.W/2+.9),rw/2,eave+2.5,.9,wc,rc);
   const n=6;for(let i=0;i<n;i++){const a=-rw/2+1.5+i*(rw-3)/(n-1),q=fr.P(a,side*(fr.W/2+2.2));cyl(BX,q[0],q[1],.45,mn+4.8,eave+1.8,8,wc,.4);}}
  if(fr.L>45)for(const e of [-1,1])for(const g of [-1,1]){const c=fr.P(e*(fr.L/2-5),g*(fr.W/2-5));obox(BX,c[0],c[1],fr.u,10,10,mn-.6,eave+3,wc);roofGen(ring(4,c[0],c[1],7.5).map((q,i)=>{const a=Math.atan2(fr.u[1],fr.u[0])+Math.PI/4+i*Math.PI/2;return[c[0]+Math.cos(a)*7.4,c[1]+Math.sin(a)*7.4];}),eave+3,eave+8,'pyramidal',rc,wc);}
  if(K==='dome'){const c0=fr.P(0,0),dr=Math.min(fr.W*.2,18);cyl(BX,c0[0],c0[1],dr,eave,eave+dr*.9,20,wc,dr);cyl(BX,c0[0],c0[1],dr+.6,eave+dr*.9,eave+dr*.9+1,20,wc,dr+.6);for(let k=0;k<12;k++){const a=k/12*6.2832;cyl(BX,c0[0]+Math.cos(a)*(dr+.9),c0[1]+Math.sin(a)*(dr+.9),.45,eave+1,eave+dr*.9,6,wc,.4);}
   domeOn(c0[0],c0[1],dr,eave+dr*.9+1,dr*.95,rc,20);cyl(BX,c0[0],c0[1],dr*.15,eave+dr*1.85+1,eave+dr*1.85+5,8,wc,dr*.15);domeOn(c0[0],c0[1],dr*.17,eave+dr*1.85+5,2.5,rc,8);}}
 function mosqueT(O,fr,mn,wc,rc,hT,r,nm){const eave=mn+Math.min(14,Math.max(8,fr.W*.35));walls(O,mn-.8,eave,wc,mn,1.4);roofGen(O,eave,eave,'flat',hx('#bdb7ab'),wc);
  const c0=fr.P(0,0),dr=Math.min(fr.W,fr.L)*.32;cyl(BX,c0[0],c0[1],dr,eave,eave+dr*.35,16,wc,dr);domeOn(c0[0],c0[1],dr,eave+dr*.35,dr*.95,rc,16);boxAt(RF,c0[0],eave+dr*1.4,c0[1],.3,2.2,.3,GOLD);
  for(const e of [-1,1])for(const g of [-1,1]){const c=fr.P(e*fr.L*.3,g*fr.W*.3);domeOn(c[0],c[1],dr*.35,eave,dr*.3,rc,10);}
  const n=nm||(fr.L*fr.W>3000?4:2),mh=Math.max(30,dr*4.2),spots=n>=4?[[-1,-1],[1,-1],[1,1],[-1,1]]:[[-1,-1],[-1,1]];
  for(const [e,g] of spots.slice(0,n)){const c=fr.P(e*(fr.L/2+2.5),g*(fr.W/2+2.5));cyl(BX,c[0],c[1],1.7,mn-.6,mn+mh,12,wc,1.4);cyl(BX,c[0],c[1],2.3,mn+mh*.72,mn+mh*.72+.8,12,wc,2.3);cyl(BX,c[0],c[1],1.45,mn+mh,mn+mh+6,12,rc,0);}}
 function synT(O,fr,mn,wc,rc,hT,r){const h=hT||Math.min(22,Math.max(14,fr.W*.6)),eave=mn+h,band=[wc[0]*1.15,wc[1]*1.05,wc[2]*.85];walls(O,mn-.8,eave,wc,mn,1.3);
  for(const yy of [mn+4,mn+9,mn+14])if(yy<eave-1)for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(len<2)continue;const sg=sArea(O)>0?1:-1,on=[(q[1]-p[1])/len*sg,-(q[0]-p[0])/len*sg];
   quad(BX,[p[0]+on[0]*.12,yy,p[1]+on[1]*.12],[q[0]+on[0]*.12,yy,q[1]+on[1]*.12],[q[0]+on[0]*.12,yy+.7,q[1]+on[1]*.12],[p[0]+on[0]*.12,yy+.7,p[1]+on[1]*.12],[on[0],0,on[1]],band);}
  slopeRoof(O,{h:[]},eave,fr.L*fr.W,false,hx('#5d6168'),wc,r);
  for(const g of [-1,1]){const c=fr.P(-fr.L/2+4,g*(fr.W/2-4)),tH=h+20;obox(BX,c[0],c[1],fr.u,7,7,mn-.6,mn+tH,wc);cyl(BX,c[0],c[1],3,mn+tH,mn+tH+3,12,wc,3);roofGen(ring(12,c[0],c[1],3.3),mn+tH+3,mn+tH+10,'onion',rc,wc);}}
 function castleT(O,fr,mn,wc,rc,hT,r){const h=hT||Math.min(18,Math.max(9,fr.W*.35)),eave=mn+h;walls(O,mn-.8,eave,wc,mn,1.6);roofGen(O,eave,eave,'flat',hx('#8a857c'),wc);
  for(let k=0;k<O.length;k++){const p=O[k],q=O[(k+1)%O.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(len<1.5)continue;const u=[(q[0]-p[0])/len,(q[1]-p[1])/len];
   for(let s2=1;s2<len-.5;s2+=2.2)obox(BX,p[0]+u[0]*s2,p[1]+u[1]*s2,u,1.1,.9,eave,eave+1.3,wc);
   const pr=O[(k+O.length-1)%O.length],a1=Math.atan2(p[1]-pr[1],p[0]-pr[0]),a2=Math.atan2(q[1]-p[1],q[0]-p[0]);if(Math.abs(wrapA(a2-a1))>.6&&len>6){const tr=Math.min(4.5,Math.max(2.5,fr.W*.08));cyl(BX,p[0],p[1],tr,mn-.6,eave+6,12,wc,tr);roofGen(ring(12,p[0],p[1],tr+.4),eave+6,eave+6+tr*2.2,'pyramidal',rc,wc);}}}
 function stationT(O,fr,mn,wc,rc,hT,ar){const eave=mn+(hT?Math.min(hT,14):12);walls(O,mn-.8,eave,wc,mn,1.3);const R0=fr.W/2*.92,n=10,st=6;
  for(let a=-fr.L/2;a<fr.L/2-1e-3;a+=st){const a2=Math.min(fr.L/2,a+st);for(let i=0;i<n;i++){const t0=i/n*Math.PI,t1=(i+1)/n*Math.PI,b0=-Math.cos(t0)*R0,b1=-Math.cos(t1)*R0,y0=eave+Math.sin(t0)*R0*.62,y1=eave+Math.sin(t1)*R0*.62;
   const A0=fr.P(a,b0),A1=fr.P(a,b1),B0=fr.P(a2,b0),B1=fr.P(a2,b1);quad(RF,[A0[0],y0,A0[1]],[B0[0],y0,B0[1]],[B1[0],y1,B1[1]],[A1[0],y1,A1[1]],[0,1,0],i%2?rc:[rc[0]*.85,rc[1]*.85,rc[2]*.9]);}}
  for(const e of [-1,1]){const C3=[];for(let i=0;i<=n;i++){const t0=i/n*Math.PI;const q=fr.P(e*fr.L/2,-Math.cos(t0)*R0);C3.push([q[0],eave+Math.sin(t0)*R0*.62,q[1]]);}for(let i=0;i<n;i++){const c=fr.P(e*fr.L/2,0);tri(BX,C3[i],C3[i+1],[c[0],eave,c[1]],[fr.u[0]*e,0,fr.u[1]*e],[.75,.8,.85]);}}}
 function towerT(O,fr,mn,wc,h,t){const lat=/lattice/.test(t['tower:construction']||'')||/eiffel/i.test(t.name||''),c0=[fr.cx,fr.cz];h=Math.max(h||40,20);
  if(lat){const col=wc||hx('#6e5a44'),base=Math.max(Math.min(fr.W,fr.L)/2*.95,h*.16),leg=(z,s2)=>{const w=base*Math.pow(1-z,2.2)+base*.06;return[c0[0]+(fr.u[0]*s2[0]-fr.u[1]*s2[1])*w,c0[1]+(fr.u[1]*s2[0]+fr.u[0]*s2[1])*w];};
   const C=[[-1,-1],[1,-1],[1,1],[-1,1]],N=24;for(let i=0;i<N;i++){const z0=i/N,z1=(i+1)/N,y0=mn+z0*h,y1=mn+z1*h;for(const s2 of C){const a=leg(z0,s2),b=leg(z1,s2),aw=Math.max(.5,base*.12*(1-z0)),dir=[fr.u[0]*s2[0],fr.u[1]*s2[0]];
     obox(BX,(a[0]+b[0])/2,(a[1]+b[1])/2,fr.u,aw,aw,y0,y1,col,false);}
    if(i%3===0)for(let k=0;k<4;k++){const a=leg(z0,C[k]),b=leg(z0,C[(k+1)%4]);quad(BX,[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y0+Math.max(.6,h/N*.25),b[1]],[a[0],y0+Math.max(.6,h/N*.25),a[1]],[0,0,1],col);}}
   for(const z of [.18,.37]){const w=base*Math.pow(1-z,2.2)+base*.06+2;obox(BX,c0[0],c0[1],fr.u,w*2,w*2,mn+z*h,mn+z*h+2.5,col);}
   for(const s2 of C){const a=leg(0,s2),b=leg(.18,s2),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];}cyl(BX,c0[0],c0[1],1.2,mn+h,mn+h+h*.06,8,col,.3);return;}
  const col=wc||hx('#d9d6cf'),r0=Math.max(2.5,Math.min(fr.W,fr.L)/2);cyl(BX,c0[0],c0[1],r0,mn-.6,mn+h*.8,16,col,r0*.6);cyl(BX,c0[0],c0[1],r0*1.5,mn+h*.8,mn+h*.86,16,hx('#3d4a57'),r0*1.5);cyl(BX,c0[0],c0[1],r0*.5,mn+h*.86,mn+h,10,col,r0*.25);}
 function skyT(O,fr,mn,h,r,ar){const steps=h>180?3:2;let cur=O,y=mn-.8;for(let i=0;i<steps;i++){const top=mn+h*(i===steps-1?1:[.62,.84][i]);walls(cur,y,top,[1,1,1],mn,1,WM);
   if(i<steps-1){const nx=insetRing(cur,Math.min(fr.W*.12,5));if(!nx){y=top;break;}const fl=[];for(const q of cur)fl.push(q[0],q[1]);const tt=earcut(fl);for(let k=0;k<tt.length;k+=3)tri(RF,[cur[tt[k]][0],top,cur[tt[k]][1]],[cur[tt[k+1]][0],top,cur[tt[k+1]][1]],[cur[tt[k+2]][0],top,cur[tt[k+2]][1]],[0,1,0],hx('#5f6266'));cur=nx;}y=top;}
  const fl=[];for(const q of cur)fl.push(q[0],q[1]);const tt=earcut(fl);for(let k=0;k<tt.length;k+=3)tri(RF,[cur[tt[k]][0],y,cur[tt[k]][1]],[cur[tt[k+1]][0],y,cur[tt[k+1]][1]],[cur[tt[k+2]][0],y,cur[tt[k+2]][1]],[0,1,0],hx('#5f6266'));
  if(h>150)cyl(BX,fr.cx,fr.cz,.6,y,y+h*.12,6,hx('#c8c8cc'),.15);}

 function obox(B,cx,cz,u,lu,lv,y0,y1,col,top=true){const v=[-u[1],u[0]],c=[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>[cx+u[0]*q[0]*lu/2+v[0]*q[1]*lv/2,cz+u[1]*q[0]*lu/2+v[1]*q[1]*lv/2]);
  for(let k=0;k<4;k++){const a=c[k],b=c[(k+1)%4];quad(B,[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],[(a[0]+b[0])/2-cx,0,(a[1]+b[1])/2-cz],col);}
  if(top)quad(B,[c[0][0],y1,c[0][1]],[c[1][0],y1,c[1][1]],[c[2][0],y1,c[2][1]],[c[3][0],y1,c[3][1]],[0,1,0],col);}
 function pca(pts,defAng,defL,defW,cx0,cz0){if(pts.length<8)return{cx:cx0,cz:cz0,u:[Math.sin(defAng),-Math.cos(defAng)],L:defL,W:defW};
  let mx=0,mz=0;for(const q of pts){mx+=q[0];mz+=q[1];}mx/=pts.length;mz/=pts.length;let sxx=0,szz=0,sxz=0;for(const q of pts){const dx=q[0]-mx,dz=q[1]-mz;sxx+=dx*dx;szz+=dz*dz;sxz+=dx*dz;}
  const a=.5*Math.atan2(2*sxz,sxx-szz),u=[Math.cos(a),Math.sin(a)],v=[-u[1],u[0]];let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
  for(const q of pts){const pu=(q[0]-mx)*u[0]+(q[1]-mz)*u[1],pv=(q[0]-mx)*v[0]+(q[1]-mz)*v[1];u0=Math.min(u0,pu);u1=Math.max(u1,pu);v0=Math.min(v0,pv);v1=Math.max(v1,pv);}
  const cu=(u0+u1)/2,cv=(v0+v1)/2;return{cx:mx+u[0]*cu+v[0]*cv,cz:mz+u[1]*cu+v[1]*cv,u,L:u1-u0,W:v1-v0};}
 for(const l of lms){if(!inC(l.x,l.z))continue;marks.push([l.x,l.z,l.n,'nevezetesség']);const mn=H(l.x,l.z);bOpen(ring(8,l.x,l.z,Math.min(l.r,40)*.6),mn);
  if(l.k==='parlament'){const f=pca(l.pts,.21,268,118,l.x,l.z),u=f.L>=f.W?f.u:[-f.u[1],f.u[0]],L=Math.max(f.L,f.W),Wd=Math.min(f.L,f.W),v=[-u[1],u[0]],sv=v[0]>0?-1:1;
   const P=(a,b)=>[f.cx+u[0]*a+v[0]*b,f.cz+u[1]*a+v[1]*b],cream=hx('#efe6cf'),red=hx('#9c4639'),dome=hx('#a85a4a'),gold=hx('#e2b74a');
   const blk=(a,b,lu,lv,hw,hr,shape)=>{const c=P(a,b),O=rectR(c[0],c[1],u,lu,lv);walls(O,mn-.8,mn+hw,cream,mn,1.5);roofGen(O,mn+hw,mn+hw+hr,shape||'hipped',red,cream);return O;};
   for(const a of [-L*.3,L*.3])blk(a,0,L*.3,Wd*.5,20,13,'gabled');blk(0,0,L*.3,Wd*.5,22,14);blk(0,sv*Wd*.34,L,Wd*.2,16,10);blk(0,-sv*Wd*.3,L*.62,Wd*.22,18,11);
   for(let a=-L*.44;a<=L*.44;a+=L*.11){if(Math.abs(a)<L*.07)continue;const c=P(a,sv*Wd*.44);obox(BX,c[0],c[1],u,3.2,3.2,mn,mn+24,cream);pinn(c[0],c[1],mn+24,red,1.1);}
   for(const e of [-1,1]){blk(e*L*.45,0,L*.09,Wd*.9,22,12,'pyramidal');const c=P(e*L*.45,0);boxAt(RF,c[0],mn+35.5,c[1],.3,3,.3,gold);}
   for(const e of [-1,1])for(const g of [-1,1]){const c=P(e*L*.17,g*Wd*.22);obox(BX,c[0],c[1],u,5.5,5.5,mn,mn+38,cream);obox(BX,c[0],c[1],u,6.5,6.5,mn+36,mn+38.5,cream);pinn(c[0],c[1],mn+38.5,red,2.4);
    for(const q of [[-1,-1],[1,-1],[1,1],[-1,1]]){const cc=[c[0]+u[0]*q[0]*3+v[0]*q[1]*3,c[1]+u[1]*q[0]*3+v[1]*q[1]*3];pinn(cc[0],cc[1],mn+38.5,cream,.6);}}
   const c0=P(0,0),dr=Math.min(21,Wd*.15);cyl(BX,c0[0],c0[1],dr+2,mn+20,mn+30,16,cream,dr+2);cyl(BX,c0[0],c0[1],dr,mn+30,mn+52,16,cream,dr);cyl(BX,c0[0],c0[1],dr+1.2,mn+51,mn+53,16,cream,dr+1.2);
   const prof=[[0,1],[.2,.985],[.4,.93],[.58,.84],[.74,.7],[.87,.52],[.96,.3],[1,.14]],dh=30;
   for(let i=0;i<prof.length-1;i++)cyl(BX,c0[0],c0[1],dr*prof[i][1],mn+53+dh*prof[i][0],mn+53+dh*prof[i+1][0],16,i%2?dome:hx('#b5634f'),dr*prof[i+1][1]);
   for(let k=0;k<16;k++){const a=k/16*6.2832,sa=Math.sin(a),ca=Math.cos(a);for(let i=0;i<prof.length-1;i++){const r0=dr*prof[i][1]+.25,r1=dr*prof[i+1][1]+.25;obox(BX,c0[0]+sa*(r0+r1)/2,c0[1]+ca*(r0+r1)/2,[ca,-sa],.5,.5,mn+53+dh*prof[i][0],mn+53+dh*prof[i+1][0],cream);}}
   for(let k=0;k<8;k++){const a=k/8*6.2832;pinn(c0[0]+Math.sin(a)*(dr+1.6),c0[1]+Math.cos(a)*(dr+1.6),mn+53,cream,.9);}
   cyl(BX,c0[0],c0[1],dr*.16,mn+83,mn+88,8,cream,dr*.13);cyl(BX,c0[0],c0[1],dr*.13,mn+88,mn+96,8,dome,0);boxAt(RF,c0[0],mn+96.5,c0[1],.3,1.6,.3,gold);
   for(const [b0,hl,lim,in0] of [[sv*Wd*.44+sv*.5,16,L*.5,0],[-sv*Wd*.41-sv*.5,18,L*.31,0],[-sv*Wd*.25-sv*.5,20,L*.45,L*.33]])for(let a=-lim+2;a<=lim-2;a+=5.5){if(Math.abs(a)<in0)continue;const c=P(a,b0);obox(BX,c[0],c[1],u,1,1.2,mn-.5,mn+hl+2.5,cream);pinn(c[0],c[1],mn+hl+2.5,cream,.55);}
   for(let a=-L*.46;a<=L*.46;a+=5.5)for(const b of [-Wd*.25,Wd*.25,sv*Wd*.44]){if(Math.abs(a)<dr+4&&Math.abs(b)<dr+6)continue;const c=P(a,b);pinn(c[0],c[1],mn+(b===sv*Wd*.44?16:20),cream,.75);}
   for(let a=-L*.48;a<=L*.48;a+=10){const c=P(a,sv*Wd*.44);pinn(c[0],c[1],mn+16,cream,.7);}}
  else if(l.k==='bazilika'){const f=pca(l.pts,Math.PI/2,87,55,l.x,l.z),u=f.L>=f.W?f.u:[-f.u[1],f.u[0]],L=Math.max(f.L,f.W),Wd=Math.min(f.L,f.W),v=[-u[1],u[0]],eu=(u[0]>0?1:-1);
   const P=(a,b)=>[f.cx+u[0]*a+v[0]*b,f.cz+u[1]*a+v[1]*b],cream=hx('#e6d6b2'),slate=hx('#566170'),green=hx('#5f9f87'),gold=hx('#e2b74a');
   for(const [lu,lv] of [[L*.95,Wd*.42],[L*.36,Wd*.95]]){const O=rectR(f.cx,f.cz,u,lu,lv);walls(O,mn-.8,mn+24,cream,mn,1.6);roofGen(O,mn+24,mn+30,'hipped',slate,cream);}
   const dr=Math.min(L,Wd)*.18;cyl(BX,f.cx,f.cz,dr,mn+24,mn+44,16,cream,dr);cyl(BX,f.cx,f.cz,dr+.8,mn+43,mn+45,16,cream,dr+.8);domeOn(f.cx,f.cz,dr,mn+45,19,green);
   cyl(BX,f.cx,f.cz,2.6,mn+62,mn+71,8,cream,2.6);domeOn(f.cx,f.cz,2.8,mn+71,3,green,8);boxAt(RF,f.cx,mn+76.5,f.cz,.3,3.4,.3,gold);boxAt(RF,f.cx,mn+77.2,f.cz,1.6,.3,.3,gold);
   for(const g of [-1,1]){const c=P(eu*L*.4,g*Wd*.34);obox(BX,c[0],c[1],u,9,9,mn,mn+44,cream);cyl(BX,c[0],c[1],3.6,mn+44,mn+50,10,cream,3.6);domeOn(c[0],c[1],3.8,mn+50,5,green,10);boxAt(RF,c[0],mn+57,c[1],.25,2.2,.25,gold);}}
  else if(l.k==='hosok'){const b=52*Math.PI/180,d=[Math.sin(b),-Math.cos(b)],pp=[-d[1],d[0]],stone=hx('#d8cfbd'),gold=hx('#d9a93a'),bronze=hx('#6f8f6a');
   obox(BX,l.x,l.z,d,14,14,mn-.5,mn+2.5,stone);obox(BX,l.x,l.z,d,7,7,mn+2.5,mn+7,stone);cyl(BX,l.x,l.z,1.1,mn+7,mn+35,12,stone,.95);obox(BX,l.x,l.z,d,2.6,2.6,mn+35,mn+36.4,stone);
   cyl(BX,l.x,l.z,.7,mn+36.4,mn+40.5,8,gold,.15);obox(BX,l.x,l.z,pp,3.4,.25,mn+38.5,mn+39.6,gold);
   for(const k of [-1,1])obox(BX,l.x+pp[0]*k*4.5,l.z+pp[1]*k*4.5,d,3,2,mn+2.5,mn+5,bronze);
   const C=[l.x+d[0]*12,l.z+d[1]*12],Rr=36;
   for(const sg of [-1,1]){let prev=null;for(let th=35;th<=105;th+=6){const t=th*Math.PI/180*sg,x=C[0]+Rr*(d[0]*Math.cos(t)+pp[0]*Math.sin(t)),z=C[1]+Rr*(d[1]*Math.cos(t)+pp[1]*Math.sin(t));
     cyl(BX,x,z,.55,mn,mn+11,8,stone,.5);if(prev){const mx=(x+prev[0])/2,mz=(z+prev[1])/2,du=[x-prev[0],z-prev[1]],dl=Math.hypot(du[0],du[1]);obox(BX,mx,mz,[du[0]/dl,du[1]/dl],dl+.2,2.2,mn+11,mn+12.8,stone);}prev=[x,z];}
    obox(BX,prev[0],prev[1],d,7,7,mn,mn+15,stone);obox(BX,prev[0],prev[1],d,3,4,mn+15,mn+17.5,bronze);}}}

 bClose();
 /* utcanevek */
 const names=[''],nmap=new Map([['',0]]),nh=new Map(),NC=30;
 const NL=Ls.transportation_name;
 if(NL)for(const F of NL.feats){const pr=props(NL,F),nm=pr['name:hu']||pr.name||pr.ref||'';if(!nm)continue;let ni=nmap.get(nm);if(ni===undefined){ni=names.length;names.push(nm);nmap.set(nm,ni);}
  for(const R of rings(F.geom)){const L=R.map(toL(NL.extent));for(let k=1;k<L.length;k++){const a=L[k-1],b=L[k];
   for(let x=Math.floor(Math.min(a[0],b[0])/NC);x<=Math.floor(Math.max(a[0],b[0])/NC);x++)for(let z=Math.floor(Math.min(a[1],b[1])/NC);z<=Math.floor(Math.max(a[1],b[1])/NC);z++){const kk=x*100003+z;let l=nh.get(kk);if(!l)nh.set(kk,l=[]);l.push([a[0],a[1],b[0],b[1],ni]);}}}}
 const nameAt=(x,z)=>{const l=nh.get(Math.floor(x/NC)*100003+Math.floor(z/NC));if(!l)return 0;let bd=6,bi=0;for(const s of l){const d=segD(x,z,s[0],s[1],s[2],s[3]);if(d<bd){bd=d;bi=s[4];}}return bi;};

 /* utak, járdák, villamos, vasút */
 const MS={p:[],i:[]},MD=rib(),SG=[],sigN=[];
 const R=[rib(),rib(),rib()],SW=rib(),BED={p:[],i:[]},RAIL={p:[],i:[]},BR={p:[],n:[]},WA={p:[],i:[]};
 const rseg=[],tseg=[],lamps=[],sTrees=[],th=new Map();
 const thAdd=(x1,z1,x2,z2,hw)=>{for(let a=Math.floor((Math.min(x1,x2)-hw)/16);a<=Math.floor((Math.max(x1,x2)+hw)/16);a++)for(let b=Math.floor((Math.min(z1,z2)-hw)/16);b<=Math.floor((Math.max(z1,z2)+hw)/16);b++){const k=a*100003+b;let l=th.get(k);if(!l)th.set(k,l=[]);l.push([x1,z1,x2,z2,hw]);}};
 const onRoad=(x,z,m)=>{const l=th.get(Math.floor(x/16)*100003+Math.floor(z/16));if(!l)return false;for(const s of l)if(segD(x,z,s[0],s[1],s[2],s[3])<s[4]+m)return true;return false;};
 const TL=Ls.transportation,lines=[];
 // ---- úthálózat egyben: a saját és a 8 szomszéd csempe vonalai, mindegyik a saját csempéjére vágva (nincs átfedő puffer-másolat), a csempehatáron szétvágott darabok összefűzve ----
 {const MARG=150,bx0=cx0-MARG,bx1=cx1+MARG,bz0=cz0-MARG,bz1=cz1+MARG;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let T;if(!dx&&!dy)T=TL;else{try{T=(await layersOf(tx+dx,ty+dy)).transportation;}catch(e){T=null;}}if(!T)continue;
   const E=T.extent,ttx=tx+dx,tty=ty+dy,toLn=q=>[X(fx2lon(ttx+q[0]/E)),Zf(fy2lat(tty+q[1]/E))];
   for(const F of T.feats){if(F.type!==2)continue;const pr=props(T,F);
    for(const Rr of rings(F.geom)){if(Rr.length<2)continue;const RL=Rr.map(toLn);const DR=cum(RL);
     // Liang–Barsky vágás a csempe [0,E] négyzetére (csempekoordinátában), a darab kezdetének távolságával az eredeti vonal mentén
     let cur=null,curO=0;const pieces=[];const inside=q=>q[0]>=0&&q[0]<=E&&q[1]>=0&&q[1]<=E;
     for(let i=1;i<Rr.length;i++){const a=Rr[i-1],b=Rr[i];let t0=0,t1=1;const ddx=b[0]-a[0],ddy=b[1]-a[1];let ok=true;
      for(const [p,q] of [[-ddx,a[0]],[ddx,E-a[0]],[-ddy,a[1]],[ddy,E-a[1]]]){if(p===0){if(q<0){ok=false;break;}}else{const r=q/p;if(p<0){if(r>t1){ok=false;break;}if(r>t0)t0=r;}else{if(r<t0){ok=false;break;}if(r<t1)t1=r;}}}
      if(!ok||t1-t0<1e-9){if(cur&&cur.length>1)pieces.push([cur,curO]);cur=null;continue;}
      const A=t0>0?[a[0]+ddx*t0,a[1]+ddy*t0]:a,B=t1<1?[a[0]+ddx*t1,a[1]+ddy*t1]:b,segL=DR[i]-DR[i-1];
      if(!cur||t0>0){if(cur&&cur.length>1)pieces.push([cur,curO]);cur=[A];curO=DR[i-1]+segL*t0;}
      cur.push(B);if(t1<1){pieces.push([cur,curO]);cur=null;}}
     if(cur&&cur.length>1)pieces.push([cur,curO]);
     for(const [pc,o0] of pieces){const L=pc.map(toLn);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of L){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1]);}
      if(x1<bx0||x0>bx1||z1<bz0||z0>bz1)continue;
      const onB=q=>q[0]<=1e-6||q[1]<=1e-6||q[0]>=E-1e-6||q[1]>=E-1e-6;
      lines.push({pr,L,R:Rr,E,tx:ttx,ty:tty,o0,cutA:onB(pc[0]),cutB:onB(pc[pc.length-1])});}}}}
  // összefűzés a csempehatáron: azonos fajtájú, nem hídi darabok, végpontjaik 1,5 m-en belül
  const keyOf=pr=>[pr.class,pr.subclass||'',pr.brunnel||'',pr.name||'',pr.oneway||0,pr.layer||0].join('|');
  for(let pass=0;pass<3;pass++){let merged=0;const ends=new Map();const gk=q=>Math.round(q[0]/3)*100003+Math.round(q[1]/3);
   lines.forEach((l,i)=>{if(l.dead||l.pr.brunnel==='bridge')return;for(const e of [0,1]){if(e?!l.cutB:!l.cutA)continue;const q=e?l.L[l.L.length-1]:l.L[0];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const k=(Math.round(q[0]/3)+a)*100003+Math.round(q[1]/3)+b;}const k=gk(q);let lst=ends.get(k);if(!lst)ends.set(k,lst=[]);lst.push([i,e]);}});
   for(const [i,l] of lines.entries()){if(l.dead||l.pr.brunnel==='bridge')continue;for(const e of [1,0]){if(e?!l.cutB:!l.cutA)continue;const q=e?l.L[l.L.length-1]:l.L[0];let found=null;
     for(let a=-1;a<=1&&!found;a++)for(let b=-1;b<=1&&!found;b++){const lst=ends.get((Math.round(q[0]/3)+a)*100003+Math.round(q[1]/3)+b);if(!lst)continue;for(const [j,f] of lst){if(j===i)continue;const m=lines[j];if(m.dead||m.tx===l.tx&&m.ty===l.ty)continue;
       const p=f?m.L[m.L.length-1]:m.L[0];if(Math.hypot(p[0]-q[0],p[1]-q[1])>1.5||keyOf(m.pr)!==keyOf(l.pr))continue;if(f?!m.cutB:!m.cutA)continue;found=[j,f];break;}}
     if(!found)continue;const [j,f]=found,m=lines[j];let A=e?l.L:l.L.slice().reverse(),B=f?m.L.slice().reverse():m.L;
     const cA=e?l.cutA:l.cutB,cB=f?m.cutA:m.cutB;l.L=A.concat(B.slice(1));l.cutA=cA;l.cutB=cB;l.R=null;m.dead=true;merged++;break;}}
   for(let i=lines.length-1;i>=0;i--)if(lines[i].dead)lines.splice(i,1);if(!merged)break;}
  // lógó végek bekötése: az a vonalvég, amely 3 m-en belül egy másik (azonos fajtájú) vonalhoz ér, de nem csatlakozik, rápattan (szükség esetén új közös ponttal) – villamos-váltók, T-csomópontok, hídvégek
  {const kind=pr=>{const c=(pr.class||'').replace('_construction','');return c==='rail'||c==='transit'?'r':c==='path'?'p':'d';};const sg=new Map(),SK=6;
   lines.forEach((l,li)=>{const P=l.L;for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];for(let gx=Math.floor((Math.min(a[0],b[0])-3)/SK);gx<=Math.floor((Math.max(a[0],b[0])+3)/SK);gx++)for(let gz=Math.floor((Math.min(a[1],b[1])-3)/SK);gz<=Math.floor((Math.max(a[1],b[1])+3)/SK);gz++){const k=gx*100003+gz;let q=sg.get(k);if(!q)sg.set(k,q=[]);q.push(li,i);}}});
   const vkey=q=>Math.round(q[0]*2)*1000003+Math.round(q[1]*2),vc=new Map();for(const l of lines)for(const q of l.L){const k=vkey(q);vc.set(k,(vc.get(k)||0)+1);}
   const ins=[];
   lines.forEach((l,li)=>{if(l.pr.brunnel==='bridge'||l.pr.brunnel==='tunnel')return;const kd=kind(l.pr);for(const e of [0,1]){const P=l.L,ei=e?P.length-1:0,q=P[ei];if((vc.get(vkey(q))||0)>1)continue;
     const lst=sg.get(Math.floor(q[0]/SK)*100003+Math.floor(q[1]/SK));if(!lst)continue;let best=null,bd=3;
     for(let k=0;k<lst.length;k+=2){const mj=lst[k],i=lst[k+1];if(mj===li)continue;const m=lines[mj];if(kind(m.pr)!==kd||(m.pr.layer||0)!==(l.pr.layer||0))continue;const mbt=m.pr.brunnel==='bridge'||m.pr.brunnel==='tunnel';if(mbt&&!(i===1||i===m.L.length-1))continue;const a=m.L[i-1],b=m.L[i],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dz)/l2)),px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(q[0]-px,q[1]-pz);
      if(mbt){const ea=i===1?a:null,eb=i===m.L.length-1?b:null;const de=Math.min(ea?Math.hypot(q[0]-ea[0],q[1]-ea[1]):1e9,eb?Math.hypot(q[0]-eb[0],q[1]-eb[1]):1e9);if(de>=bd)continue;}if(d<bd&&d>.02){bd=d;best={mj,i,t,px,pz,a,b,mbt};}}
     if(!best)continue;const {mj,i,t,a,b}=best;let tp;const da=Math.hypot(best.px-a[0],best.pz-a[1]),db=Math.hypot(best.px-b[0],best.pz-b[1]);
     if(best.mbt){const ea=i===1,eb=i===lines[mj].L.length-1;if(ea&&(!eb||Math.hypot(q[0]-a[0],q[1]-a[1])<Math.hypot(q[0]-b[0],q[1]-b[1])))tp=[a[0],a[1]];else tp=[b[0],b[1]];}else if(da<.8)tp=[a[0],a[1]];else if(db<.8)tp=[b[0],b[1]];else{tp=[best.px,best.pz];ins.push([mj,i,t,tp]);}
     P[ei]=tp;}});
   // a beszúrandó közös pontok (szegmensenként távolság szerint rendezve, hátulról előre, hogy az indexek ne csússzanak)
   ins.sort((A,B)=>A[0]-B[0]||B[1]-A[1]||B[2]-A[2]);for(const [mj,i,t,tp] of ins)lines[mj].L.splice(i,0,tp);}
  // íves vonalvezetés: a leegyszerűsített törtvonal töréspontjai lekerekítve (osztályonkénti ívsugár), a csomópontok és a végek helyben maradnak
  const RAD={motorway:180,trunk:120,primary:45,secondary:35,tertiary:25,minor:14,service:8,track:10,path:4,rail:220,transit:60,raceway:40,busway:25};
  const vk=q=>Math.round(q[0]*2)*1000003+Math.round(q[1]*2),cnt=new Map();for(const l of lines)l.L.forEach((q,i)=>{const k=vk(q);cnt.set(k,(cnt.get(k)||0)+((i===0||i===l.L.length-1)?2:1));});
  for(const l of lines){if(l.pr.brunnel==='bridge'||l.pr.brunnel==='tunnel'||l.L.length<3)continue;const cls=(l.pr.class||'').replace('_construction','');let R0=RAD[cls]||12;if(cls==='transit'&&l.pr.subclass==='tram')R0=25;
   const P=l.L,out=[P[0]];for(let i=1;i<P.length-1;i++){const a=P[i-1],v=P[i],b=P[i+1];if((cnt.get(vk(v))||0)>1){out.push(v);continue;}
    const l1=Math.hypot(v[0]-a[0],v[1]-a[1]),l2=Math.hypot(b[0]-v[0],b[1]-v[1]);if(l1<.5||l2<.5){out.push(v);continue;}const u1=[(v[0]-a[0])/l1,(v[1]-a[1])/l1],u2=[(b[0]-v[0])/l2,(b[1]-v[1])/l2];
    const th=Math.acos(Math.max(-1,Math.min(1,u1[0]*u2[0]+u1[1]*u2[1])));if(th<.05||th>2.6){out.push(v);continue;}const t=Math.min(R0*Math.tan(th/2),.45*l1,.45*l2,4/Math.max(.05,Math.sin(th/2)));if(t<.3||t/Math.tan(th/2)<(RW[cls]||(cls==='path'?2.2:6))/2+2){out.push(v);continue;}
    const p1=[v[0]-u1[0]*t,v[1]-u1[1]*t],p2=[v[0]+u2[0]*t,v[1]+u2[1]*t],n=Math.max(2,Math.ceil(th/.14));for(let k=0;k<=n;k++){const s2=k/n,w0=(1-s2)*(1-s2),w1=2*s2*(1-s2),w2=s2*s2;out.push([p1[0]*w0+v[0]*w1+p2[0]*w2,p1[1]*w0+v[1]*w1+p2[1]*w2]);}}
   out.push(P[P.length-1]);l.L=out;}}
 const roadW=pr=>{const c=(pr.class||'').replace('_construction','');if(c==='path')return pr.subclass==='pedestrian'?5:2.2;return RW[c]||0;};
 // ---- hidak és felhajtók: a saját és a szomszéd csempék hídjainak végpontjai (csempehatártól független rámpák) ----
 const isRailC=c=>c==='rail'||c==='transit',offOf=pr=>{const c=pr.class;if(isRailC(c))return pr.subclass==='tram'?.12:.1;return[.16,.14,.07][c==='path'?2:/^(motorway|trunk|primary|secondary|tertiary)$/.test(c)?0:1];};
 const bridgeOK=pr=>pr.brunnel==='bridge'&&!/_construction$/.test(pr.class)&&!/ferry|pier|aerialway/.test(pr.class)&&!(pr.level<0);
 const profs=[],seenB=new Set();
 const addProf=pf=>{if(!pf)return;const k=pf.full[0][0].toFixed(5)+pf.full[0][1].toFixed(5)+pf.full[pf.full.length-1][0].toFixed(5)+pf.full[pf.full.length-1][1].toFixed(5),k2=pf.full[pf.full.length-1][0].toFixed(5)+pf.full[pf.full.length-1][1].toFixed(5)+pf.full[0][0].toFixed(5)+pf.full[0][1].toFixed(5);if(seenB.has(k)||seenB.has(k2))return;seenB.add(k);profs.push(pf);};
 for(const ln of lines)if(bridgeOK(ln.pr)&&ln.R){try{addProf(await bridgeProfileC(ln.tx,ln.ty,ln.E,ln.R,ln.pr,offOf(ln.pr)));}catch(e){}}
 {const mg=.16;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;let L2;try{L2=await layersOf(tx+dx,ty+dy);}catch(e){continue;}const T2=L2&&L2.transportation;if(!T2)continue;
   for(const F of T2.feats){if(F.type!==2)continue;const p2=props(T2,F);if(!bridgeOK(p2))continue;for(const Q of rings(F.geom)){if(Q.length<2)continue;
    const near=Q.some(q=>{const fx=tx+dx+q[0]/T2.extent,fy=ty+dy+q[1]/T2.extent;return fx>tx-mg&&fx<tx+1+mg&&fy>ty-mg&&fy<ty+1+mg;});if(!near)continue;
    try{addProf(await bridgeProfileC(tx+dx,ty+dy,T2.extent,Q,p2,offOf(p2)));}catch(e){}}}}}
 const ENDS=[];for(const pf of profs){const F=pf.full.map(q=>[X(q[0]),Zf(q[1])]);for(const end of [0,1]){const e=end?F[F.length-1]:F[0];let j=end?F.length-2:1;
   while(j>0&&j<F.length-1&&Math.hypot(F[j][0]-e[0],F[j][1]-e[1])<10)j+=end?-1:1;const q=F[Math.max(0,Math.min(F.length-1,j))],dl=Math.hypot(e[0]-q[0],e[1]-q[1])||1,h=pf.at(end?pf.L:0),t=end?pf.ter1:pf.ter0;
   if(h-t>.45)ENDS.push({x:e[0],z:e[1],dx:(e[0]-q[0])/dl,dz:(e[1]-q[1])/dl,h,g:pf.grade,rail:isRailC(pf.cls),path:pf.cls==='path',len:(h-t)/pf.grade+15});}}
 function rampFor(P0,D0,rail,hw,isP){isP=!!isP;if(!ENDS.length)return null;const P=[],D=[];for(let i=0;i<P0.length;i++){if(i){const a=P0[i-1],b=P0[i],l=D0[i]-D0[i-1],m=Math.floor(l/6);for(let q=1;q<=m;q++){const f=q/(m+1);P.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);D.push(D0[i-1]+l*f);}}P.push(P0[i]);D.push(D0[i]);}
  const n=P.length,r=new Float64Array(n).fill(-1e9);let any=false,g=.05;
  // a rámpa csak arra az útra hat, amelyik ténylegesen a hídvégnél kezdődik/halad át (a híd tengelyében), és az út mentén mért távolsággal ereszkedik — a párhuzamos szomszéd utakat nem emeli meg
  for(const e of ENDS){if(e.rail!==rail||(!rail&&!!e.path!==isP))continue;let bi=-1,bd=hw+4;
   for(let i=0;i<n;i++){const d=Math.hypot(P[i][0]-e.x,P[i][1]-e.z);if(d>=bd)continue;const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];let tx2=b[0]-a[0],tz2=b[1]-a[1];const tl=Math.hypot(tx2,tz2)||1;if(Math.abs((tx2*e.dx+tz2*e.dz)/tl)<.8)continue;bd=d;bi=i;}
   if(bi<0)continue;for(let i=0;i<n;i++){const sv=Math.abs(D[i]-D[bi]);if(sv>e.len)continue;const v=e.h-e.g*sv;if(v>r[i]){r[i]=v;any=true;g=e.g;}}}
  if(!any)return null;for(let i=1;i<n;i++)r[i]=Math.max(r[i],r[i-1]-g*(D[i]-D[i-1]));for(let i=n-2;i>=0;i--)r[i]=Math.max(r[i],r[i+1]-g*(D[i+1]-D[i]));
  return d=>{let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(D[m]<=d)lo=m;else hi=m;}const i=lo;const f=Math.max(0,Math.min(1,(d-D[i])/((D[i+1]-D[i])||1)));return r[i]*(1-f)+r[i+1]*f;};}
 // út felszíne adott ponton (a villamossín a burkolatban fut)
 const rgrid=new Map(),rgAdd=k=>{const ax=rseg[k],az=rseg[k+1],bx=rseg[k+3],bz=rseg[k+4],hw=rseg[k+6];for(let a=Math.floor((Math.min(ax,bx)-hw)/16);a<=Math.floor((Math.max(ax,bx)+hw)/16);a++)for(let b=Math.floor((Math.min(az,bz)-hw)/16);b<=Math.floor((Math.max(az,bz)+hw)/16);b++){const kk=a*100003+b;let l=rgrid.get(kk);if(!l)rgrid.set(kk,l=[]);l.push(k);}};
 const roadYAt=(x,z)=>{const l=rgrid.get(Math.floor(x/16)*100003+Math.floor(z/16));if(!l)return null;let best=null,bd=1e9;for(const k of l){if(rseg[k+9]>1)continue;const ax=rseg[k],az=rseg[k+1],dx=rseg[k+3]-ax,dz=rseg[k+4]-az,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),d=Math.hypot(x-ax-dx*t,z-az-dz*t);
   if(d<rseg[k+6]+.2&&d<bd){bd=d;best=rseg[k+2]+(rseg[k+5]-rseg[k+2])*t;}}return best;};
 const wgrid=new Map();for(const l of lines){if(isRailC(l.pr.class)||l.pr.brunnel==='tunnel')continue;const w2=roadW(l.pr)/2;if(!w2)continue;const P=l.L;for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];
   for(let gx=Math.floor((Math.min(a[0],b[0])-w2)/16);gx<=Math.floor((Math.max(a[0],b[0])+w2)/16);gx++)for(let gz=Math.floor((Math.min(a[1],b[1])-w2)/16);gz<=Math.floor((Math.max(a[1],b[1])+w2)/16);gz++){const kk=gx*100003+gz;let L2=wgrid.get(kk);if(!L2)wgrid.set(kk,L2=[]);L2.push([a[0],a[1],b[0],b[1],w2]);}}}
 const onOtherRoad=(x,z)=>{const L2=wgrid.get(Math.floor(x/16)*100003+Math.floor(z/16));if(!L2)return false;for(const q of L2)if(segD(x,z,q[0],q[1],q[2],q[3])<q[4]-.6)return true;return false;};
 function rampSides(run,hw,off){off=off||.14;for(let k=1;k<run.length;k++){const a=run[k-1],b=run[k],ra=a[3]-(HS(a[0],a[1])+off),rb=b[3]-(HS(b[0],b[1])+off);if(ra<.6&&rb<.6)continue;const ga=Math.max(H(a[0],a[1]),a[3]-ra-.8),gb=Math.max(H(b[0],b[1]),b[3]-rb-.8);let ux=b[0]-a[0],uz=b[1]-a[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const nx=-uz,nz=ux;
   for(const sd of [1,-1]){const ax=a[0]+nx*sd*hw,az=a[1]+nz*sd*hw,bx=b[0]+nx*sd*hw,bz=b[1]+nz*sd*hw;if(onOtherRoad(ax,az)||onOtherRoad(bx,bz)||onOtherRoad((ax+bx)/2,(az+bz)/2))continue;quad(BR,[ax,Math.min(ga,a[3])-.6,az],[bx,Math.min(gb,b[3])-.6,bz],[bx,b[3]+.9,bz],[ax,a[3]+.9,az],[nx*sd,0,nz*sd]);
    if(ra>1.2||rb>1.2)cseg.push(ax,az,bx,bz,Math.min(a[3],b[3])-.3,Math.max(a[3],b[3])+1);}}}
 const EMB=[];
 const lineOrder=[...lines.filter(l=>!isRailC(l.pr.class)),...lines.filter(l=>isRailC(l.pr.class))];
 // rámpák előszámítása, majd a rámpába torkolló mellékutak is felemelkednek a csomópontig (egy szintben csatlakoznak)
 const roadL=lines.filter(l=>!isRailC(l.pr.class)&&!bridgeOK(l.pr)&&roadW(l.pr)>0&&l.pr.brunnel!=='tunnel'&&!/_construction$/.test(l.pr.class));
 const offR=pr=>[.16,.14,.07][pr.class==='path'?2:/^(motorway|trunk|primary|secondary|tertiary)$/.test(pr.class)?0:1];
 for(const l of roadL){l.D=cum(l.L);l.rf=rampFor(l.L,l.D,false,roadW(l.pr)/2,l.pr.class==='path');}
 {const add=[];for(const l of roadL){if(!l.rf)continue;const P=l.L;
   for(const o of roadL){if(o===l)continue;const Q=o.L;let ox0=1e9,ox1=-1e9,oz0=1e9,oz1=-1e9;for(const q of Q){ox0=Math.min(ox0,q[0]);ox1=Math.max(ox1,q[0]);oz0=Math.min(oz0,q[1]);oz1=Math.max(oz1,q[1]);}
    for(let i=0;i<P.length-1;i++){const A=P[i],B=P[i+1];if(Math.max(A[0],B[0])<ox0-2||Math.min(A[0],B[0])>ox1+2||Math.max(A[1],B[1])<oz0-2||Math.min(A[1],B[1])>oz1+2)continue;
     for(let j=0;j<Q.length-1;j++){const C=Q[j],Dd=Q[j+1],r1=[B[0]-A[0],B[1]-A[1]],r2=[Dd[0]-C[0],Dd[1]-C[1]],den=r1[0]*r2[1]-r1[1]*r2[0];if(Math.abs(den)<1e-6)continue;
      const t=((C[0]-A[0])*r2[1]-(C[1]-A[1])*r2[0])/den,u=((C[0]-A[0])*r1[1]-(C[1]-A[1])*r1[0])/den,l1=Math.hypot(...r1)||1,l2=Math.hypot(...r2)||1;if(t<-1.5/l1||t>1+1.5/l1||u<-1.5/l2||u>1+1.5/l2)continue;
      const ix=A[0]+r1[0]*t,iz=A[1]+r1[1]*t,hR=l.rf(l.D[i]+(l.D[i+1]-l.D[i])*Math.max(0,Math.min(1,t)));if(hR-(HS(ix,iz)+offR(o.pr))<.45)continue;
      const ol=Math.hypot(...r2)||1;const oP=o.pr.class==='path';if(l.pr.class==='path'&&!oP)continue;const gg=oP?.35:.06;for(const sg of [1,-1])add.push({x:ix,z:iz,dx:r2[0]/ol*sg,dz:r2[1]/ol*sg,h:hR,g:gg,rail:false,path:oP,len:(hR-HS(ix,iz))/gg+12});}}}}
  if(add.length){ENDS.push(...add);for(const l of roadL)l.rf=rampFor(l.L,l.D,false,roadW(l.pr)/2,l.pr.class==='path');}}
 // ---- úthálózat-magasság megoldó: csomópontban egy magasság, és nincs a valóságban lehetetlen meredekség ----
 {const NL=[],cl=new Map();let nid=0;const cid=(x,z)=>{const k=Math.round(x*2)*1000003+Math.round(z*2);let id=cl.get(k);if(id===undefined){id=nid++;cl.set(k,id);}return id;};
  for(const ln of lines){const pr=ln.pr,c=pr.class;if(isRailC(c)||/_construction$/.test(c)||pr.brunnel==='tunnel'||c==='ferry'||c==='pier'||c==='aerialway'||pr.level<0)continue;if(!roadW(pr))continue;
   const P0=ln.L;if(P0.length<2)continue;const D0=ln.D||cum(P0);ln.D=D0;const P=[],D=[];for(let i=0;i<P0.length;i++){if(i>0){const sl=D0[i]-D0[i-1],nn=Math.floor(sl/6);for(let k=1;k<nn;k++){const f=k/nn;P.push([P0[i-1][0]+(P0[i][0]-P0[i-1][0])*f,P0[i-1][1]+(P0[i][1]-P0[i-1][1])*f]);D.push(D0[i-1]+sl*f);}}P.push(P0[i]);D.push(D0[i]);}const bridge=pr.brunnel==='bridge',cls=c==='path'?2:/^(motorway|trunk|primary|secondary|tertiary)$/.test(c)?0:1,off=[.16,.14,.07][cls];
   let prof=null;if(bridge&&ln.R){try{prof=await bridgeProfileC(ln.tx,ln.ty,ln.E,ln.R,pr,off);}catch(e){}}
   const rf=bridge?null:ln.rf,base=P.map((q,i)=>prof?prof.at(prof.s0+ln.o0+D[i]):rf?Math.max(HS(q[0],q[1])+off,rf(D[i])):HS(q[0],q[1])+off);
   const ids=P.map(q=>cid(q[0],q[1])),w=bridge?8:rf?3:cls===2?.5:1,g=/motorway|trunk/.test(c)?.06:cls===0?.12:cls===2?.35:.18;NL.push({ln,P,D,base,ids,w,g});}
  const H0=new Float64Array(nid),W0=new Float64Array(nid);for(const L of NL)for(let i=0;i<L.ids.length;i++){H0[L.ids[i]]+=L.base[i]*L.w;W0[L.ids[i]]+=L.w;}
  const Hh=new Float64Array(nid);for(let i=0;i<nid;i++)Hh[i]=H0[i]/(W0[i]||1);
  const E=[];for(const L of NL)for(let i=1;i<L.ids.length;i++){const a=L.ids[i-1],b=L.ids[i];if(a===b)continue;E.push(a,b,L.D[i]-L.D[i-1],L.g);}
  // T-csomópontok: az útvég a közeli másik út legközelebbi pontjához kötődik, akkor is, ha nincs közös pontjuk az adatban
  {const vg=new Map();NL.forEach((L,li)=>L.P.forEach((q,i)=>{const k=Math.floor(q[0]/8)*100003+Math.floor(q[1]/8);let l=vg.get(k);if(!l)vg.set(k,l=[]);l.push(li,i);}));
   NL.forEach((L,li)=>{for(const i of [0,L.P.length-1]){const q=L.P[i];let best=null,bd=6;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=vg.get((Math.floor(q[0]/8)+a)*100003+Math.floor(q[1]/8)+b);if(!l)continue;
     for(let k=0;k<l.length;k+=2){if(l[k]===li)continue;const M=NL[l[k]],j=l[k+1];if(M.ids[j]===L.ids[i])continue;const d=Math.hypot(M.P[j][0]-q[0],M.P[j][1]-q[1]);if(d<bd){bd=d;best=M.ids[j];}}}
    if(best!=null)E.push(L.ids[i],best,Math.max(1,bd),Math.min(L.g,.25));}});}
  for(let it=0;it<90;it++){let mx=0;for(let k=0;k<E.length;k+=4){const a=E[k],b=E[k+1],lim=E[k+3]*E[k+2]+.05,dh=Hh[b]-Hh[a];if(Math.abs(dh)<=lim)continue;const ex=Math.abs(dh)-lim,wa=W0[a]||1,wb=W0[b]||1,sg=Math.sign(dh);
    Hh[a]+=sg*ex*wb/(wa+wb);Hh[b]-=sg*ex*wa/(wa+wb);if(ex>mx)mx=ex;}if(mx<.02)break;}
  for(const L of NL){const cr=L.ids.map((id,i)=>Hh[id]-L.base[i]);if(!cr.some(v=>Math.abs(v)>.03))continue;const D=L.D,n=D.length;
   L.ln.corr=d=>{let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(D[m]<=d)lo=m;else hi=m;}const f=Math.max(0,Math.min(1,(d-D[lo])/((D[hi]-D[lo])||1)));return cr[lo]*(1-f)+cr[hi]*f;};}}
 const GADJ=[],RFP=[],SHQ=[];// RFP: út-lábnyom (x,z,y,félszélesség) a terep alásüllyesztéséhez; SHQ: padka-szalagok
 // először a hidak magassága: végpontok
 // ---- csomópontok: a találkozó utak visszavágása és közös csomópont-felület ----
 const cutLine=(P,D,s0,s1)=>{const P2=[],D2=[];const at=s=>{let k=0;while(k<D.length-2&&D[k+1]<s)k++;const f=Math.max(0,Math.min(1,(s-D[k])/((D[k+1]-D[k])||1)));return[P[k][0]+(P[k+1][0]-P[k][0])*f,P[k][1]+(P[k+1][1]-P[k][1])*f];};
  P2.push(at(s0));D2.push(s0);for(let k=0;k<P.length;k++)if(D[k]>s0+.05&&D[k]<s1-.05){P2.push(P[k]);D2.push(D[k]);}P2.push(at(s1));D2.push(s1);return[P2,D2];};
 const keepIv=(tot,cuts,ext)=>{const C=cuts.map(([a,b])=>[Math.max(0,a-(a>0?ext:0)),Math.min(tot,b+(b<tot?ext:0))]).sort((p,q)=>p[0]-q[0]),out=[];let cur=0;for(const [a,b] of C){if(a-cur>.3)out.push([cur,a]);cur=Math.max(cur,b);}if(tot-cur>.3)out.push([cur,tot]);return out;};
 const builtUp=(x,z)=>{let n=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=bh.get((Math.floor(x/BC)+a)*100003+Math.floor(z/BC)+b);if(l)n+=l.length;}return n>=4;};// járda csak beépített helyen (hegyi úton nincs)
 const JN=new Map(),JPOL=[],jck=q=>Math.round(q[0]*2)*1000003+Math.round(q[1]*2);
 for(const ln of lines){const pr=ln.pr,c=pr.class;{let near=false;for(let k=0;k<ln.L.length&&!near;k++){const q=ln.L[k];if(inE(q[0],q[1],80))near=true;}if(!near)continue;}if(isRailC(c)||/_construction$/.test(c)||pr.brunnel||c==='ferry'||c==='pier'||c==='aerialway'||pr.level<0||c==='path')continue;let wd=roadW(pr);if(!wd)continue;
  const P=ln.L;if(P.length<2)continue;const D=cum(P);if(D[D.length-1]<.5)continue;const cls=/^(motorway|trunk|primary|secondary|tertiary)$/.test(c)?0:1;
  ln.tg=dHw.length?matchOSM(P):null;const lanes=ln.tg?lanesOf(ln.tg.t):0;if(lanes)wd=Math.max(wd*.75,lanes*3.2+(cls===0?.6:.3));ln.jhw=wd/2;ln.jD=D;ln.jt=[];
  for(let i=0;i<P.length;i++){const k=jck(P[i]);let j=JN.get(k);if(!j)JN.set(k,j={x:P[i][0],z:P[i][1],deg:0,arms:[]});j.deg+=(i===0||i===P.length-1)?1:2;j.arms.push([ln,i]);}}
 for(const j of JN.values()){if(j.deg<3)continue;const arms=[];
  for(const [ln,i] of j.arms){const P=ln.L,D=ln.jD;for(const dir of [-1,1]){if(i+dir<0||i+dir>=P.length)continue;let k=i+dir;while(k>0&&k<P.length-1&&Math.abs(D[k]-D[i])<4)k+=dir;
    let ux=P[k][0]-j.x,uz=P[k][1]-j.z;const ul=Math.hypot(ux,uz);if(ul<.1)continue;ux/=ul;uz/=ul;let av=dir>0?D[P.length-1]-D[i]:D[i];
    for(let m=i+dir;m>=0&&m<P.length;m+=dir){const jj=JN.get(jck(P[m]));if(jj&&jj.deg>=3&&jj!==j){av=Math.abs(D[m]-D[i])/2;break;}}
    arms.push({ln,s:D[i],dir,ux,uz,hw:ln.jhw,av,trim:0,a:Math.atan2(uz,ux)});}}
  if(arms.length<3)continue;arms.sort((p,q)=>p.a-q.a);const n=arms.length,K=new Array(n).fill(null);
  for(let a=0;a<n;a++){const A=arms[a],B=arms[(a+1)%n];let da=B.a-A.a;if(da<=0)da+=2*Math.PI;if(da>Math.PI*.9)continue;
   const px=j.x-A.uz*A.hw,pz=j.z+A.ux*A.hw,qx=j.x+B.uz*B.hw,qz=j.z-B.ux*B.hw,det=A.ux*(-B.uz)+A.uz*B.ux;if(Math.abs(det)<1e-4)continue;
   const rx=qx-px,rz=qz-pz,t=(rx*(-B.uz)+rz*B.ux)/det,s2=(A.ux*rz-A.uz*rx)/det;if(t<-.5||s2<-.5)continue;const capT=Math.min(16,2.6*Math.max(A.hw,B.hw)+3);if(t>capT*1.6||s2>capT*1.6)continue;const tt=Math.min(Math.max(0,t),capT),ss=Math.min(Math.max(0,s2),capT);// hegyesszögű csomópontnál nincs óriás folt
   A.trim=Math.max(A.trim,tt+.5);B.trim=Math.max(B.trim,ss+.5);K[a]=[px+A.ux*tt,pz+A.uz*tt,tt,ss];}
  for(const A of arms){A.trim=Math.min(A.trim,A.av*.9,25);if(A.trim<.4)A.trim=0;else A.ln.jt.push(A.dir>0?[A.s,A.s+A.trim]:[A.s-A.trim,A.s]);}
  JPOL.push({j,arms,K});}
 for(const ln of lineOrder){const pr=ln.pr,c=pr.class,sub=pr.subclass;
  if(!ln.L.some(q=>inE(q[0],q[1],40))){let near=false;for(let i=1;i<ln.L.length&&!near;i++){const a2=ln.L[i-1],b2=ln.L[i];if(Math.max(a2[0],b2[0])>=cx0-40&&Math.min(a2[0],b2[0])<=cx1+40&&Math.max(a2[1],b2[1])>=cz0-40&&Math.min(a2[1],b2[1])<=cz1+40)near=true;}if(!near)continue;}
  if(/_construction$/.test(c)||pr.brunnel==='tunnel'||c==='ferry'||c==='pier'||c==='aerialway'||pr.level<0)continue;
  const bridge=pr.brunnel==='bridge',layer=+pr.layer||0,P=ln.L,D=cum(P),tot=D[D.length-1];if(tot<.5)continue;
  const isRail=c==='rail'||c==='transit',clsR=c==='path'?2:/^(motorway|trunk|primary|secondary|tertiary)$/.test(c)?0:1;
  const offB=isRail?(sub==='tram'?.12:.1):[.16,.14,.07][clsR];
  let prof=null;if(bridge&&ln.R){try{prof=await bridgeProfileC(ln.tx,ln.ty,ln.E,ln.R,pr,offB);}catch(e){prof=null;}}
  const cF=ln.corr||null,deck0=p=>prof?prof.at(prof.s0+ln.o0+p[2]):HS(p[0],p[1])+offB+.3,deck=cF?p=>deck0(p)+cF(p[2]):deck0;
  if(c==='rail'||c==='transit'){const tram=sub==='tram';if(!tram&&/subway|monorail/.test(sub||''))continue;
   const rfR=bridge?null:rampFor(P,D,true,2);
   const yAt=p=>{if(tram){const ry=roadYAt(p[0],p[1]);if(ry!=null)return ry+.03;}if(bridge)return deck(p);const b0=HS(p[0],p[1])+(tram?.12:.1);return rfR?Math.max(b0,rfR(p[2])):b0;};
   runs(P,D,8,6,run=>{const mid=run[Math.floor(run.length/2)],onRd=tram&&roadYAt(mid[0],mid[1])!=null;ribbon(BED,run,tram?1.5:1.9,yAt);if(!bridge&&!onRd){for(const q of run)RFP.push(q[0],q[1],q[3],1.9);SHQ.push([run.map(q=>q.slice()),1.9]);}
    for(const s2 of [-.72,.72])ribbon(RAIL,run,.07,p=>p[3]+.07,s2,10,true);
    for(let k=1;k<run.length;k++){const a=run[k-1],b=run[k];if(tram)tseg.push(a[0],a[1],a[3],b[0],b[1],b[3]);thAdd(a[0],a[1],b[0],b[1],1.8);}
    if(bridge&&!onRd)bridgeSides(run,1.9);else if(rfR&&!onRd)rampSides(run,1.9,tram?.12:.1);});continue;}
  let wd=roadW(pr);if(!wd)continue;
  const cls=c==='path'?2:/^(motorway|trunk|primary|secondary|tertiary)$/.test(c)?0:1;
  const tg=ln.tg!==undefined?ln.tg:(cls<2&&dHw.length?matchOSM(P):null),lanes=tg?lanesOf(tg.t):0,spd=tg?spdOf(tg.t):0;
  const hwT=tg?tg.t.highway||'':'',rank=({motorway:0,trunk:1,primary:2,secondary:3,tertiary:4,minor:5,service:6,track:7})[c]??6.5,rankF=rank===5&&/living_street/.test(hwT)?6:rank===5&&/unclassified/.test(hwT)?4.6:pr.ramp&&rank<3?rank+.5:rank;
  if(lanes)wd=Math.max(wd*.75,lanes*3.2+(cls===0?.6:.3));const hw=wd/2;
  const off=[.16,.14,.07][cls],rf=bridge?null:(ln.rf!==undefined?ln.rf:rampFor(P,D,false,hw,c==='path')),yAt0=bridge?deck0:rf?p=>Math.max(HS(p[0],p[1])+off,rf(p[2])):p=>HS(p[0],p[1])+off,yAt=cF?p=>yAt0(p)+cF(p[2]):yAt0;
  const ow=+pr.oneway||0,mid=P[Math.floor(P.length/2)],ni=nameAt(mid[0],mid[1])||nameAt(P[0][0],P[0][1]);
  const midW=P[Math.floor(P.length/2)],walk=cls<2&&!bridge&&!/motorway|trunk/.test(c)&&c!=='service'&&c!=='track'&&!pr.ramp&&(builtUp(midW[0],midW[1])||!!(tg&&sideOf(tg.t)));
  let sides=tg?sideOf(tg.t):null;if(sides&&tg.rev)sides=[sides[1],sides[0]];
  const trimJ=!bridge&&ln.jt&&ln.jt.length>0;if(!bridge){ln.yF=yAt;ln.dHw2=hw;ln.dCls=cls;}
  const swOf=run=>{let sw=[0,0];if(walk){const a=run[Math.floor(run.length/2)],b=run[Math.min(run.length-1,Math.floor(run.length/2)+1)];let ux=b[0]-a[0],uz=b[1]-a[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const nx=-uz,nz=ux;
    if(sides)sw=sides.slice();else sw=[nearSW(a[0]-nx*(hw+3),a[1]-nz*(hw+3),4.5)?0:1,nearSW(a[0]+nx*(hw+3),a[1]+nz*(hw+3),4.5)?0:1];}return sw;};
  const swY=p=>p[3]+.12;// járda = burkolat + szegély, lejtőn sem csúszik el
  runs(P,D,8,6,run=>{let Ed=null;if(trimJ){for(const q of run)q[3]=yAt(q);}else{Ed=ribbon(R[cls],run,hw,yAt);
   if(!bridge)markings(run,hw,cls,ow,lanes);}
   let sw=[0,0];
   if(walk){const a=run[Math.floor(run.length/2)],b=run[Math.min(run.length-1,Math.floor(run.length/2)+1)];let ux=b[0]-a[0],uz=b[1]-a[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const nx=-uz,nz=ux;
    if(sides)sw=sides.slice();else sw=[nearSW(a[0]-nx*(hw+3),a[1]-nz*(hw+3),4.5)?0:1,nearSW(a[0]+nx*(hw+3),a[1]+nz*(hw+3),4.5)?0:1];
    if(!trimJ){if(sw[0])ribbon(SW,run,1.3,swY,-(hw+1.3),10,true);if(sw[1])ribbon(SW,run,1.3,swY,hw+1.3,10,true);}}
   if(!bridge){const hs=!!(sw[0]||sw[1]),he=hw+(hs?2.6:0);for(const q of run)RFP.push(q[0],q[1],q[3]+(hs?.12:0),he);SHQ.push([run.map(q=>[q[0],q[1],q[2],q[3]+(hs?.12:0)]),he]);}
   if(cF&&!bridge)for(const q of run){const cv=cF(q[2]);if(Math.abs(cv)>.35)GADJ.push(q[0],q[1],q[3]-.12,hw+(sw[0]||sw[1]?2.6:0),cv);}
   if(rf&&!bridge){rampSides(run,hw+(sw[0]||sw[1]?2.6:0),off);for(const q of run){const rs=q[3]-(HS(q[0],q[1])+off);if(rs>.25)EMB.push(q[0],q[1],q[3]-.12,hw+(sw[0]||sw[1]?2.6:0),rs);}}
   for(let k=1;k<run.length;k++){const a=run[k-1],b=run[k];rseg.push(a[0],a[1],a[3],b[0],b[1],b[3],hw,bridge?1:0,ni,cls,ow,lanes,spd,rankF);rgAdd(rseg.length-14);thAdd(a[0],a[1],b[0],b[1],hw+.3);
    if(walk&&(sw[0]||sw[1])&&inC(b[0],b[1])){let ux=b[0]-a[0],uz=b[1]-a[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const nx=-uz,nz=ux;
     if(Math.floor(a[2]/32)!==Math.floor(b[2]/32)){let sd=Math.floor(b[2]/32)%2?1:-1;if(!sw[sd>0?1:0])sd=-sd;const lx=b[0]+nx*sd*(hw+2),lz=b[1]+nz*sd*(hw+2);
      if(!inBld(lx,lz)&&!onRoad(lx,lz,.6))lamps.push(lx,H(lx,lz),lz,Math.atan2(-nx*sd,-nz*sd));}
     if(Math.floor(a[2]/13)!==Math.floor(b[2]/13))for(const sd of [-1,1]){if(!sw[sd>0?1:0]||rnd()>.72)continue;const x=b[0]+nx*sd*(hw+1.4),z=b[1]+nz*sd*(hw+1.4);if(!nearTree(x,z,14))sTrees.push(x,z);}}}
   if(bridge)bridgeSides(run,hw,Ed);});
  // csomópontnál visszavágott látható burkolat, felfestés és járda; a csomópontot közös felület fedi
  if(trimJ){const tot2=D[D.length-1];for(const [s0,s1] of keepIv(tot2,ln.jt,0)){const [P2,D2]=cutLine(P,D,s0,s1);if(P2.length<2)continue;runs(P2,D2,8,6,run=>{ribbon(R[cls],run,hw,yAt);markings(run,hw,cls,ow,lanes);});}
   if(walk)for(const [s0,s1] of keepIv(tot2,ln.jt,2.8)){const [P2,D2]=cutLine(P,D,s0,s1);if(P2.length<2)continue;runs(P2,D2,8,6,run=>{for(const q of run)q[3]=yAt(q);const sw=swOf(run);if(sw[0])ribbon(SW,run,1.3,swY,-(hw+1.3),10,true);if(sw[1])ribbon(SW,run,1.3,swY,hw+1.3,10,true);});}}
  if(prof)decorBridge(prof,names[ni]||'',hw,tg?tg.t['bridge:structure']||'':'');}
 for(const J of JPOL){const {j,arms,K}=J;if(!inC(j.x,j.z))continue;if(arms.some(A=>!A.ln.yF))continue;let cm=1;for(const A of arms)cm=Math.min(cm,A.ln.dCls??1);const B=R[cm],n=arms.length,pts=[];
  const yA=(A,t)=>A.ln.yF([j.x+A.ux*t,j.z+A.uz*t,A.s+A.dir*t]);let yc=0;for(const A of arms)yc+=yA(A,0);yc/=n;
  for(let a=0;a<n;a++){const A=arms[a],h=A.ln.dHw2||A.hw,t=A.trim,y=yA(A,t);pts.push([j.x+A.ux*t+A.uz*h,j.z+A.uz*t-A.ux*h,y],[j.x+A.ux*t-A.uz*h,j.z+A.uz*t+A.ux*h,y]);
   const k=K[a],Bn=arms[(a+1)%n];if(k&&k[2]<=A.trim+.01&&k[3]<=Bn.trim+.01)pts.push([k[0],k[1],(y+yA(Bn,Bn.trim))/2]);}
  const b0=B.p.length/3;B.p.push(j.x,yc+.006,j.z);B.u.push(j.x/14,j.z/14);for(const q of pts){B.p.push(q[0],q[2]+.006,q[1]);B.u.push(q[0]/14,q[1]/14);}
  for(let k=0;k<pts.length;k++){const a=b0+1+k,b=b0+1+(k+1)%pts.length;const p1=pts[k],p2=pts[(k+1)%pts.length],cr=(p1[0]-j.x)*(p2[1]-j.z)-(p1[1]-j.z)*(p2[0]-j.x);if(cr<0)B.i.push(b0,a,b);else B.i.push(b0,b,a);}}
 function markings(run,hw,cls,ow,lanes){if(cls>1||hw<2.4)return;const y=p=>p[3]+.02;
  const L=lanes||(ow?(hw*2>6.5?2:1):(hw*2>=5.8?2:1)),lw=2*hw/L,line=(o,dash)=>ribbon(dash?MD:MS,run,.075,y,o,6,true);
  if(ow){for(let i=1;i<L;i++)line(-hw+i*lw,true);}
  else if(L>=2){if(cls===0&&L>=4){line(-.13,false);line(.13,false);}else line(0,cls===1);const n=Math.floor(L/2);for(let i=1;i<n;i++){line(i*lw,true);line(-i*lw,true);}}
  if(cls===0&&hw>3.4){line(hw-.35,false);line(-(hw-.35),false);}}
 const nearRY=(x,z,r)=>{let best=null,bd=r;for(const dx of [-16,0,16])for(const dz of [-16,0,16]){const l=rgrid.get(Math.floor((x+dx)/16)*100003+Math.floor((z+dz)/16));if(!l)continue;for(const k of l){if(rseg[k+9]>1||rseg[k+7])continue;const ax=rseg[k],az=rseg[k+1],ddx=rseg[k+3]-ax,ddz=rseg[k+4]-az,l2=ddx*ddx+ddz*ddz||1,t=Math.max(0,Math.min(1,((x-ax)*ddx+(z-az)*ddz)/l2)),d=Math.hypot(x-ax-ddx*t,z-az-ddz*t)-rseg[k+6];if(d<bd){bd=d;best=rseg[k+2]+(rseg[k+5]-rseg[k+2])*t;}}}return best;};// a külön járda a mellette futó út szintjén
 for(const g2 of dSide){if(g2.length<2)continue;runs(g2,cum(g2),4,6,run=>{const ry=p=>{const y=nearRY(p[0],p[1],7);return y!=null?y+.12:HS(p[0],p[1])+.1;};ribbon(SW,run,1.25,ry,0,10);for(const q of run)RFP.push(q[0],q[1],q[3],1.25);SHQ.push([run.map(q=>q.slice()),1.25]);});}
 // ---- egy pálya: átfedő út-szalagok egy szintre hozása (lépcső helyett folytonos felület) ----
 {const cov=(x,z,y,inset)=>{let best=null;const l=rgrid.get(Math.floor(x/16)*100003+Math.floor(z/16));if(!l)return null;for(const k of l){if(rseg[k+7]||rseg[k+9]>1)continue;const ax=rseg[k],az=rseg[k+1],dx=rseg[k+3]-ax,dz=rseg[k+4]-az,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),d=Math.hypot(x-ax-dx*t,z-az-dz*t);
    if(d>rseg[k+6]-inset)continue;const ry=rseg[k+2]+(rseg[k+5]-rseg[k+2])*t;if(Math.abs(ry-y)>.6)continue;if(best==null||ry>best)best=ry;}return best;};
  const lift=(B,add,inset)=>{const P=B.p;for(let v=0;v<P.length;v+=3){const c=cov(P[v],P[v+2],P[v+1]-add,inset);if(c!=null&&c+add>P[v+1])P[v+1]=c+add;}};
  const sink=(B,inset)=>{const P=B.p;for(let v=0;v<P.length;v+=3){const c=cov(P[v],P[v+2],P[v+1],inset);if(c!=null&&P[v+1]>c-.04)P[v+1]=c-.04;}};
  lift(R[0],0,-.05);lift(R[1],0,-.05);lift(MS,.02,-.05);lift(MD,.02,-.05);sink(R[2],.15);sink(SW,.35);sink(BED,.1);}
 for(const q of dSig){if(!inC(q[0],q[1]))continue;const near=[];for(const dx of [-16,0,16])for(const dz of [-16,0,16]){const l=th.get(Math.floor((q[0]+dx)/16)*100003+Math.floor((q[1]+dz)/16));if(l)for(const e of l)if(segD(q[0],q[1],e[0],e[1],e[2],e[3])<10&&!near.includes(e))near.push(e);}
  if(!near.length)continue;near.sort((a,b)=>b[4]-a[4]);const A=near[0];let ux=A[2]-A[0],uz=A[3]-A[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const nx=-uz,nz=ux;
  let hB=0;for(const e of near){const ex=e[2]-e[0],ez=e[3]-e[1],el=Math.hypot(ex,ez)||1;if(Math.abs((ex*ux+ez*uz)/el)<.5){hB=Math.max(hB,e[4]);}}
  const ang=Math.atan2(ux,uz),grp=Math.abs(Math.cos(ang))>Math.SQRT1_2?0:1;sigN.push(q[0],q[1],ang,grp);
  for(const sd of [1,-1]){for(const extra of [1,2.6,4.2]){const x=q[0]+nx*sd*(A[4]+extra)-ux*sd*(hB+1.5),z=q[1]+nz*sd*(A[4]+extra)-uz*sd*(hB+1.5);if(onRoad(x,z,.4)||inBld(x,z))continue;SG.push(x,H(x,z),z,Math.atan2(-nx*sd,-nz*sd),grp);break;}}}
 function decorBridge(prof,nm,hw,stc){const nk=/lánchíd/i.test(nm)?'lanc':/erzsébet híd/i.test(nm)?'erzs':/szabadság híd/i.test(nm)?'szab':/margit híd|árpád híd|petőfi híd/i.test(nm)?'arch':/megyeri híd|rákóczi híd/i.test(nm)?'cable':null;
  const sk=/^suspension/.test(stc)?'susp':/^arch/.test(stc)?'arch':/truss/.test(stc)?'truss':/cable/.test(stc)?'cable':null,kind=nk||sk;
  const key=nm||(prof.full[0][0].toFixed(4)+','+prof.full[0][1].toFixed(4));if(!kind||decorated.has(key)||prof.L<35)return;decorated.add(key);
  if(kind==='arch'){archBridge(prof,hw);return;}if(kind==='cable'){cableBridge(prof,hw);return;}
  const KB=kind==='susp'?'erzs':kind==='truss'?'szab':kind;
  const F=prof.full.map(q=>[X(q[0]),Zf(q[1])]),Sx=prof.S,L=prof.L;
  const at=sv=>{let k=0;while(k<Sx.length-2&&Sx[k+1]<sv)k++;const a=F[k],b=F[k+1],l=(Sx[k+1]-Sx[k])||1,f=Math.max(0,Math.min(1,(sv-Sx[k])/l)),ux=(b[0]-a[0])/l,uz=(b[1]-a[1])/l,ul=Math.hypot(ux,uz)||1;return{x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,u:[ux/ul,uz/ul]};};
  const dk=sv=>prof.at(sv);
  const col=kind==='truss'?hx('#6b7880'):kind==='susp'?hx('#c9ccd0'):KB==='lanc'?hx('#d8ccb0'):KB==='erzs'?hx('#f1f1ec'):KB==='szab'?hx('#3f7d5a'):hx('#d9cfb8'),cab=kind==='truss'?hx('#6b7880'):kind==='susp'?hx('#9aa0a8'):KB==='lanc'?hx('#4a4f5a'):KB==='szab'?hx('#3f7d5a'):hx('#e8e8e2');
  const py=KB==='lanc'?[.24,.76]:KB==='erzs'?[.1,.9]:KB==='szab'?[.2,.8]:[];const topH=KB==='lanc'?30:KB==='erzs'?27:16,ofs=hw+(KB==='lanc'?2.4:1.6);
  const OFS={};{const p0=at(L*(py[0]||.5));const v0=[-p0.u[1],p0.u[0]];for(const sd of [-1,1]){let o=ofs;for(let g2=0;g2<30;g2++){const ix=p0.x+v0[0]*sd*(o-1.4),iz=p0.z+v0[1]*sd*(o-1.4);if(!onOtherRoad(ix,iz)&&!onOtherRoad(p0.x+v0[0]*sd*(o-.3),p0.z+v0[1]*sd*(o-.3)))break;o+=.8;}OFS[sd]=o;}}
  const OF=sd=>OFS[sd]||ofs;
  for(const f of py){const sv=L*f,p=at(sv),y=dk(sv);if(!inC(p.x,p.z))continue;const v=[-p.u[1],p.u[0]];
   for(const sd of [-1,1]){const cx=p.x+v[0]*sd*(OF(sd)+.6),cz=p.z+v[1]*sd*(OF(sd)+.6);obox(BX,cx,cz,p.u,KB==='lanc'?9:2.6,KB==='lanc'?4.5:2.6,y-14,y+topH,col);
    cseg.push(cx-p.u[0]*2-v[0]*sd*1.2,cz-p.u[1]*2-v[1]*sd*1.2,cx+p.u[0]*2-v[0]*sd*1.2,cz+p.u[1]*2-v[1]*sd*1.2,y-2,y+topH);}
   const sh=(OF(1)-OF(-1))/2,mx2=p.x+v[0]*sh,mz2=p.z+v[1]*sh,wsum=OF(1)+OF(-1);obox(BX,mx2,mz2,p.u,KB==='lanc'?9:2.6,wsum+(KB==='lanc'?5.7:3.8),y+topH-(KB==='lanc'?7:2.4),y+topH,col);
   if(KB==='lanc')obox(BX,mx2,mz2,p.u,10,wsum+6.6,y+topH,y+topH+1.2,col);
   if(KB==='szab')for(const sd of [-1,1]){const cx=p.x+v[0]*sd*(OF(sd)+.6),cz=p.z+v[1]*sd*(OF(sd)+.6);cyl(BX,cx,cz,.5,y+topH,y+topH+5,6,hx('#d9a93a'),0);}}
  if(!py.length)return;const p1=L*py[0],p2=L*py[1],mid=(p1+p2)/2,half=(p2-p1)/2;
  const cy=sv=>{const d=dk(sv);if(sv<p1){const t=sv/p1;return d+1+(dk(p1)+topH-1.5-d-1)*Math.pow(t,1.6);}if(sv>p2){const t=(L-sv)/(L-p2);return d+1+(dk(p2)+topH-1.5-d-1)*Math.pow(t,1.6);}
   const t=(sv-mid)/half,top=(dk(p1)+dk(p2))/2+topH-1.5,low=dk(mid)+(KB==='szab'?4:2.5);return low+(top-low)*t*t;};
  const st=4;for(let sv=0;sv<L-1e-3;sv+=st){const s2=Math.min(L,sv+st),a=at(sv),b=at(s2),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;if(!inC(mx,mz))continue;const v=[-a.u[1],a.u[0]],ya=cy(sv),yb=cy(s2);
   for(const sd of [-1,1]){const ax=a.x+v[0]*sd*OF(sd),az=a.z+v[1]*sd*OF(sd),bx=b.x+v[0]*sd*OF(sd),bz=b.z+v[1]*sd*OF(sd),th=KB==='lanc'?.9:KB==='szab'?.8:.35;
    quad(BX,[ax,ya-th/2,az],[bx,yb-th/2,bz],[bx,yb+th/2,bz],[ax,ya+th/2,az],[v[0]*sd,0,v[1]*sd],cab);
    if(Math.round(sv/st)%2===0){const dy=dk(sv);if(ya-dy>1.6){const hx2=-a.u[0]*.08,hz=-a.u[1]*.08;quad(BX,[ax-hx2,dy+.8,az-hz],[ax+hx2,dy+.8,az+hz],[ax+hx2,ya,az+hz],[ax-hx2,ya,az-hz],[v[0]*sd,0,v[1]*sd],cab);
     if(KB==='szab'){quad(BX,[ax,dy+.8,az],[bx,yb-.35,bz],[bx,yb,bz],[ax,dy+1.15,az],[v[0]*sd,0,v[1]*sd],cab);}}}}}}
 function bAt(prof,sv){const F=prof.full.map(q=>[X(q[0]),Zf(q[1])]),Sx=prof.S;let k=0;while(k<Sx.length-2&&Sx[k+1]<sv)k++;const a=F[k],b=F[k+1],l=(Sx[k+1]-Sx[k])||1,f=Math.max(0,Math.min(1,(sv-Sx[k])/l)),ux=b[0]-a[0],uz=b[1]-a[1],ul=Math.hypot(ux,uz)||1;return{x:a[0]+ux*f,z:a[1]+uz*f,u:[ux/ul,uz/ul]};}
 function archBridge(prof,hw){const L=prof.L,n=Math.max(1,Math.round(L/85)),sp=L/n,col=hx('#b9b2a4'),th=1.4;
  for(let i=0;i<=n;i++){const sv=Math.min(L-1,Math.max(1,i*sp)),p=bAt(prof,sv),y=prof.at(sv);if(i>0&&i<n&&inC(p.x,p.z))obox(BX,p.x,p.z,p.u,5,2*hw+3,y-30,y-.4,col);}
  for(let i=0;i<n;i++){const s0=i*sp,st=sp/16;for(let k=0;k<16;k++){const a=s0+k*st,b=a+st,pa=bAt(prof,a),pb=bAt(prof,b);if(!inC(pa.x,pa.z))continue;const ya=prof.at(a),yb=prof.at(b),f=t=>1-Math.pow(2*t-1,2),rise=Math.min(sp*.22,16);
    const ay=ya-1.2-rise*(1-f(k/16)),by=yb-1.2-rise*(1-f((k+1)/16)),v=[-pa.u[1],pa.u[0]];
    for(const sd of [-1,1]){const o=hw*.8*sd;quad(BX,[pa.x+v[0]*o,ay-th,pa.z+v[1]*o],[pb.x+v[0]*o,by-th,pb.z+v[1]*o],[pb.x+v[0]*o,by,pb.z+v[1]*o],[pa.x+v[0]*o,ay,pa.z+v[1]*o],[v[0]*sd,0,v[1]*sd],col);
     if(k%2===0&&ya-.6-ay>.8)obox(BX,pa.x+v[0]*o,pa.z+v[1]*o,pa.u,.5,.5,ay,ya-.5,col,false);}}}}
 function cableBridge(prof,hw){const L=prof.L,col=hx('#e9e7e1'),cab=hx('#d8d8d2'),pys=L>320?[.3,.7]:[.5];
  for(const f of pys){const sv=L*f,p=bAt(prof,sv),y=prof.at(sv);if(!inC(p.x,p.z))continue;const v=[-p.u[1],p.u[0]],H=Math.min(90,Math.max(35,L*.18));
   for(const sd of [-1,1])obox(BX,p.x+v[0]*sd*(hw+1.2),p.z+v[1]*sd*(hw+1.2),p.u,3,2,y-20,y+H,col);obox(BX,p.x,p.z,p.u,3,2*hw+4.4,y+H-4,y+H-1.5,col);
   const reach=Math.min(L*(pys.length>1?.22:.45),H*2.6);for(const dir of [-1,1])for(let d=10;d<reach;d+=9){const q=bAt(prof,sv+dir*d),yq=prof.at(sv+dir*d);
    for(const sd of [-1,1]){const tx=p.x+v[0]*sd*(hw+1.2),tz=p.z+v[1]*sd*(hw+1.2),ty=y+H-6-d/reach*12,bx=q.x+v[0]*sd*(hw+.6),bz=q.z+v[1]*sd*(hw+.6);
     quad(BX,[tx,ty,tz],[bx,yq+.5,bz],[bx,yq+.75,bz],[tx,ty+.25,tz],[v[0]*sd,0,v[1]*sd],cab);}}}}
 function bridgeSides(run,hw,Ed){const E=Ed||null;
  for(let k=1;k<run.length;k++){const a=run[k-1],b=run[k],y0=a[3],y1=b[3];let ux=b[0]-a[0],uz=b[1]-a[1];const ul=Math.hypot(ux,uz)||1;ux/=ul;uz/=ul;const nx=-uz,nz=ux;
   for(const sd of [1,-1]){const ax=a[0]+nx*sd*hw,az=a[1]+nz*sd*hw,bx=b[0]+nx*sd*hw,bz=b[1]+nz*sd*hw;if(onOtherRoad(ax,az)||onOtherRoad(bx,bz)||onOtherRoad((ax+bx)/2,(az+bz)/2))continue;
    quad(BR,[ax,y0-1.3,az],[bx,y1-1.3,bz],[bx,y1+1,bz],[ax,y0+1,az],[nx*sd,0,nz*sd]);cseg.push(ax,az,bx,bz,Math.min(y0,y1)-1.6,Math.max(y0,y1)+1.2);}
   quad(BR,[a[0]+nx*hw,y0-1.3,a[1]+nz*hw],[a[0]-nx*hw,y0-1.3,a[1]-nz*hw],[b[0]-nx*hw,y1-1.3,b[1]-nz*hw],[b[0]+nx*hw,y1-1.3,b[1]+nz*hw],[0,-1,0]);
   if(Math.floor(a[2]/48)!==Math.floor(b[2]/48)&&inC(b[0],b[1])){const gy=H(b[0],b[1])-3,top=y1-1.3;
    if(top-gy>3){const cc=[[-1.2,-1.2],[1.2,-1.2],[1.2,1.2],[-1.2,1.2]];
     for(let q=0;q<4;q++){const p1=cc[q],p2=cc[(q+1)%4];quad(BR,[b[0]+p1[0],gy,b[1]+p1[1]],[b[0]+p2[0],gy,b[1]+p2[1]],[b[0]+p2[0],top,b[1]+p2[1]],[b[0]+p1[0],top,b[1]+p1[1]],[p1[0]+p2[0],0,p1[1]+p2[1]]);}
     cseg.push(b[0]-1.2,b[1]-1.2,b[0]+1.2,b[1]+1.2,gy,top,b[0]+1.2,b[1]-1.2,b[0]-1.2,b[1]+1.2,gy,top);}}}}

 /* víz */
 for(const w of waters){const fl=[],holes=[];for(const q of w.o)fl.push(q[0],q[1]);for(const h of w.h){holes.push(fl.length/2);for(const q of h)fl.push(q[0],q[1]);}
  const all=[...w.o,...w.h.flat()],t=earcut(fl,holes.length?holes:null),base=WA.p.length/3;for(const q of all)WA.p.push(q[0],w.big?waterLvl(LA-q[1]/MLAT,LO+q[0]/ML):w.lvl,q[1]);
  for(let k=0;k<t.length;k+=3){const a=all[t[k]],b=all[t[k+1]],c=all[t[k+2]],ny=(b[1]-a[1])*(c[0]-a[0])-(b[0]-a[0])*(c[1]-a[1]);
   if(ny>0)WA.i.push(base+t[k],base+t[k+1],base+t[k+2]);else WA.i.push(base+t[k],base+t[k+2],base+t[k+1]);}}
 const WL=Ls.waterway,rivSeg=[];
 if(WL)for(const F of WL.feats){const pr=props(WL,F);if(pr.brunnel==='tunnel')continue;const wd={river:12,canal:9,stream:3,drain:2,ditch:1.5}[pr.class]||0;if(!wd)continue;
  for(const Rr of rings(F.geom)){const P=Rr.map(toL(WL.extent));if(P.length<2)continue;const m=P[Math.floor(P.length/2)];
   if(waters.some(w=>m[0]>=w.b[0]&&m[0]<=w.b[2]&&m[1]>=w.b[1]&&m[1]<=w.b[3]&&pip(m[0],m[1],w)))continue;
   let mn=1e9;for(const q of P)if(inE(q[0],q[1],100))mn=Math.min(mn,H(q[0],q[1]));if(mn>1e8)continue;
   const flat=pr.class==='river'||pr.class==='canal';runs(P,cum(P),8,8,run=>{ribbon(WA,run,wd/2,flat?()=>mn+.2:p=>H(p[0],p[1])+.12);for(let k=1;k<run.length;k++)rivSeg.push([run[k-1][0],run[k-1][1],run[k][0],run[k][1],wd/2+1]);});}}

 /* talaj: töltés a felhajtók alatt, hogy ne legyen rés vagy árok mellettük */
 {const GG=G+1;for(let k=0;k<EMB.length;k+=5){const x=EMB[k],z=EMB[k+1],y=EMB[k+2],hw2=EMB[k+3],rs=EMB[k+4],R2=hw2+Math.min(22,rs*2+1);
   const c0=(lon2fx(LO+x/ML)-tx)*G,r0=(lat2fy(LA-z/MLAT)-ty)*G,cmL=40075016.7*Math.cos(LA*Math.PI/180)/NT/G,rr=Math.ceil(R2/cmL)+1;
   for(let r=Math.max(0,Math.floor(r0-rr));r<=Math.min(G,Math.ceil(r0+rr));r++)for(let c=Math.max(0,Math.floor(c0-rr));c<=Math.min(G,Math.ceil(c0+rr));c++){const i=r*GG+c;if(wm[i])continue;const d=Math.hypot(c-c0,r-r0)*cmL,t=d<=hw2+1?y:y-(d-hw2-1)*.5;if(t>hg[i])hg[i]=t;}}
  for(let k=0;k<GADJ.length;k+=5){const x=GADJ[k],z=GADJ[k+1],y=GADJ[k+2],hw2=GADJ[k+3],cv=GADJ[k+4],R2=hw2+1+Math.min(30,Math.abs(cv)*2);
   const c0=(lon2fx(LO+x/ML)-tx)*G,r0=(lat2fy(LA-z/MLAT)-ty)*G,cmL=40075016.7*Math.cos(LA*Math.PI/180)/NT/G,rr=Math.ceil(R2/cmL)+1;
   for(let r=Math.max(0,Math.floor(r0-rr));r<=Math.min(G,Math.ceil(r0+rr));r++)for(let c=Math.max(0,Math.floor(c0-rr));c<=Math.min(G,Math.ceil(c0+rr));c++){const i=r*(G+1)+c;if(wm[i])continue;const d=Math.hypot(c-c0,r-r0)*cmL,e=Math.max(0,d-hw2-1)*.6;
    if(cv<0){const t=y+e;if(t<hg[i])hg[i]=t;}else{const t=y-e;if(t>hg[i])hg[i]=t;}}}}
 /* a terep az út alatt mindig a burkolat alá kerül: minden rácspont, amelynek háromszöge az út lábnyomát érinti, legalább 30 cm-rel lejjebb */
 const cmL0=40075016.7*Math.cos(LA*Math.PI/180)/NT/G;
 const lowerRFP=(fR)=>{for(let k=0;k<RFP.length;k+=4){const x=RFP[k],z=RFP[k+1],y=RFP[k+2]-.3,R2=RFP[k+3]+cmL0*fR,c0=(lon2fx(LO+x/ML)-tx)*G,r0=(lat2fy(LA-z/MLAT)-ty)*G,rr=Math.ceil(R2/cmL0);
  for(let r=Math.max(0,Math.floor(r0-rr));r<=Math.min(G,Math.ceil(r0+rr));r++)for(let c=Math.max(0,Math.floor(c0-rr));c<=Math.min(G,Math.ceil(c0+rr));c++){const i=r*(G+1)+c;if(wm[i])continue;if(Math.hypot(c-c0,r-r0)*cmL0<=R2&&hg[i]>y)hg[i]=y;}}};lowerRFP(1.45);
 // egy közös felület: az utak környezetében a terep az úthoz simul – a lábnyomban pontosan a burkolat alatt (emelve vagy süllyesztve), azon túl 10 m-en át lágyan vissza az eredeti domborzatra
 {const GG=G+1,B=10,bw=new Float32Array(GG*GG),bt=new Float32Array(GG*GG),NX=new Float32Array(GG),NZ=new Float32Array(GG);for(let c=0;c<=G;c++)NX[c]=X(fx2lon(tx+c/G));for(let r=0;r<=G;r++)NZ[r]=Zf(fy2lat(ty+r/G));
  const gc=x=>(lon2fx(LO+x/ML)-tx)*G,gr=z=>(lat2fy(LA-z/MLAT)-ty)*G;
  for(const [pts,he] of SHQ){const R=he+cmL0*.75,ext=(R+B)/cmL0+1;for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k],ca=gc(a[0]),cb=gc(b[0]),ra=gr(a[1]),rb=gr(b[1]);
    const c0=Math.max(0,Math.floor(Math.min(ca,cb)-ext)),c1=Math.min(G,Math.ceil(Math.max(ca,cb)+ext)),r0=Math.max(0,Math.floor(Math.min(ra,rb)-ext)),r1=Math.min(G,Math.ceil(Math.max(ra,rb)+ext));if(c0>c1||r0>r1)continue;
    const dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1;
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*GG+c;if(wm[i])continue;const px=NX[c]-a[0],pz=NZ[r]-a[1],t=Math.max(0,Math.min(1,(px*dx+pz*dz)/l2)),d=Math.hypot(px-dx*t,pz-dz*t);if(d>R+B)continue;
     const y=a[3]+(b[3]-a[3])*t-.3,w=d<=R?1:1-(d-R)/B;if(w>bw[i]+1e-6){bw[i]=w;bt[i]=y;}else if(w>=1&&bw[i]>=1&&y<bt[i])bt[i]=y;}}}
  const bm=new Uint8Array(GG*GG);for(let k=0;k<rseg.length;k+=14){if(!rseg[k+7])continue;const ax=rseg[k],az=rseg[k+1],bx=rseg[k+3],bz=rseg[k+4],Rb=rseg[k+6]+8,ext=Rb/cmL0+1,ca=gc(ax),cb=gc(bx),ra=gr(az),rb2=gr(bz);
   const c0=Math.max(0,Math.floor(Math.min(ca,cb)-ext)),c1=Math.min(G,Math.ceil(Math.max(ca,cb)+ext)),r0=Math.max(0,Math.floor(Math.min(ra,rb2)-ext)),r1=Math.min(G,Math.ceil(Math.max(ra,rb2)+ext));const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1;
   for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const px=NX[c]-ax,pz=NZ[r]-az,t=Math.max(0,Math.min(1,(px*dx+pz*dz)/l2));if(Math.hypot(px-dx*t,pz-dz*t)<=Rb)bm[r*GG+c]=1;}}
  // hidak mellett/alatt a terep nem emelkedik (a híd alatti tér szabad marad, a pálya széle mellett nem bukkan fel talaj)
  for(let i=0;i<GG*GG;i++){const w=bw[i];if(w<=0)continue;if(bm[i]&&bt[i]>hg[i])continue;const ww=w*w*(3-2*w);hg[i]+=ww*(bt[i]-hg[i]);}}
 lowerRFP(.75);// a simítás után is: minden út alatt a terep a burkolat alá kerül (nem bukkan át)
 // a megjelenített terep pontos magassága (ugyanaz a háromszögelés, mint a hálóé)
 const MH=(x,z)=>{const cf=(lon2fx(LO+x/ML)-tx)*G,rf2=(lat2fy(LA-z/MLAT)-ty)*G;if(cf<0||rf2<0||cf>G||rf2>G)return H(x,z);const c=Math.min(G-1,Math.floor(cf)),r=Math.min(G-1,Math.floor(rf2)),u=cf-c,v=rf2-r,W1=G+1,a=hg[r*W1+c],b=hg[r*W1+c+1],d=hg[(r+1)*W1+c],f=hg[(r+1)*W1+c+1];
  return u+v<=1?a+(b-a)*u+(d-a)*v:f+(d-f)*(1-u)+(b-f)*(1-v);};
 // épületek a végső terepre: az alap a körvonal alatti legalacsonyabb megjelenített terepszint (a fal úgyis 0,8 m-rel lejjebb indul)
 for(const B of BTR){let m2=1e9;for(const q of B.O)m2=Math.min(m2,MH(q[0],q[1]));const d=m2-B.mn;if(!(Math.abs(d)>.03)||Math.abs(d)>40)continue;
  BBUF.forEach((b,i)=>{const P=b.p;for(let k=B.m.l[i];k<B.e.l[i];k+=3)P[k+1]+=d;});for(let k=B.m.s;k<B.e.s;k+=9)SHS[k+1]+=d;for(let k=B.m.f;k<B.e.f;k+=8){FAC[k+4]+=d;FAC[k+5]+=d;}for(let k=B.m.c;k<B.e.c;k+=6){cseg[k+4]+=d;cseg[k+5]+=d;}}
 for(let k=0;k<SG.length;k+=5)SG[k+1]=MH(SG[k],SG[k+2]);// jelzőlámpák a végső terepen
 /* talaj */
 const GV=G+1,nV=GV*GV,gp=[],gc=[],gu=[],gi=[];let hsum=0;
 for(let r=0;r<=G;r++)for(let c=0;c<=G;c++){const lon=fx2lon(tx+c/G),lat=fy2lat(ty+r/G),x=X(lon),z=Zf(lat),y=hg[r*W+c];
  gp.push(x,y,z);gu.push(x/8,z/8);hsum+=y;
  let col=C.grass;for(const P of polys){if(x<P.b[0]||x>P.b[2]||z<P.b[1]||z>P.b[3])continue;if(pip(x,z,P)){col=P.k.c;break;}}
  if(wm[r*W+c])col=C.water;for(const s2 of rivSeg)if(segD(x,z,s2[0],s2[1],s2[2],s2[3])<s2[4]){col=C.water;break;}
  const jt=.95+rnd()*.07;gc.push(col[0]*jt,col[1]*jt,col[2]*jt);}
 for(let r=0;r<G;r++)for(let c=0;c<G;c++){const a=r*GV+c,b=a+1,d=a+GV,f=d+1;gi.push(a,d,b,b,d,f);}
 const sk=(i0,step,n)=>{for(let k=0;k<n;k++){const a=i0+k*step,b=a+step,va=gp.length/3;
  gp.push(gp[a*3],gp[a*3+1]-6,gp[a*3+2],gp[b*3],gp[b*3+1]-6,gp[b*3+2]);gu.push(0,0,0,0);gc.push(gc[a*3],gc[a*3+1],gc[a*3+2],gc[b*3],gc[b*3+1],gc[b*3+2]);
  gi.push(a,b,va,b,va+1,va,a,va,b,b,va,va+1);}};
 sk(0,1,G);sk(G*GV,1,G);sk(0,GV,G);sk(G,GV,G);
 // egy másik út (és járdája) 2,8 m-es sávja: ide padka nem lóghat be, különben a szomszéd útra borulna
 const nearRoadZone=(x,z)=>{for(const dx of [-16,0,16])for(const dz of [-16,0,16]){const l=rgrid.get(Math.floor((x+dx)/16)*100003+Math.floor((z+dz)/16));if(!l)continue;for(const k of l){if(rseg[k+9]>1)continue;const ax=rseg[k],az=rseg[k+1],ddx=rseg[k+3]-ax,ddz=rseg[k+4]-az,l2=ddx*ddx+ddz*ddz||1,t=Math.max(0,Math.min(1,((x-ax)*ddx+(z-az)*ddz)/l2));if(Math.hypot(x-ax-ddx*t,z-az-ddz*t)<rseg[k+6]+2.8)return true;}}return false;};
 // padka: az út szélétől a (lesüllyesztett) terepig érő sáv, a terep színével – nincs rés, nincs átszúró domb, más útra nem lóg rá
 {const S=cmL0*1.6,colAt=(x,z)=>{const c=Math.max(0,Math.min(G,Math.round((lon2fx(LO+x/ML)-tx)*G))),r=Math.max(0,Math.min(G,Math.round((lat2fy(LA-z/MLAT)-ty)*G))),i=(r*GV+c)*3;return[gc[i],gc[i+1],gc[i+2]];};
  for(const [run,he] of SHQ){const m=run.length;if(m<2)continue;for(const sd of [-1,1]){let prev=-1;
    for(let k=0;k<m;k++){const p=run[k],a=run[Math.max(0,k-1)],b=run[Math.min(m-1,k+1)];let tx2=b[0]-a[0],tz2=b[1]-a[1];const tl=Math.hypot(tx2,tz2)||1;tx2/=tl;tz2/=tl;const nx=-tz2*sd,nz=tx2*sd;
     const ix=p[0]+nx*he,iz=p[1]+nz*he;let w=S,bY=null;for(let t=.8;t<=S;t+=.8){if(nearRoadZone(ix+nx*t,iz+nz*t)){w=t-.8;bY=nearRY(ix+nx*(t+.4),iz+nz*(t+.4),3.5);break;}}if(!inE(ix,iz,2))w=0;
     if(w<.4){prev=-1;const lo=MH(ix+nx*.6,iz+nz*.6),dr=p[3]-lo;if(he>=2.4&&dr>.7&&k>0&&bY!=null&&p[3]-bY>1.5&&inE(ix,iz,2)){const q=run[k-1],qa=run[Math.max(0,k-2)];let qx2=p[0]-qa[0],qz2=p[1]-qa[1];const ql=Math.hypot(qx2,qz2)||1;const jx=q[0]+(-qz2/ql*sd)*he,jz=q[1]+(qx2/ql*sd)*he,lo2=MH(jx+nx*.6,jz+nz*.6);
      if(q[3]-lo2>.7){quad(BX,[jx,Math.min(lo,lo2)-.3,jz],[ix,Math.min(lo,lo2)-.3,iz],[ix,p[3]+.9,iz],[jx,q[3]+.9,jz],[nx,0,nz],[.62,.6,.56]);cseg.push(jx,jz,ix,iz,Math.min(lo,lo2)-.3,Math.max(p[3],q[3])+.9);}}continue;}// ahol nincs hely padkának és nagy a szintkülönbség: támfal mellvéddel – nem lehet az út alá hajtani
     const ox=ix+nx*w,oz=iz+nz*w,yo=MH(ox,oz)+.05,yi=Math.max(p[3]-.03,MH(ix,iz)+.04),col=colAt(ox,oz),v=gp.length/3;
     gp.push(ix,yi,iz,ox,yo,oz);gu.push(ix/8,iz/8,ox/8,oz/8);gc.push(col[0],col[1],col[2],col[0],col[1],col[2]);
     if(prev>=0){if(sd>0)gi.push(prev,v,prev+1,prev+1,v,v+1);else gi.push(prev,prev+1,v,prev+1,v+1,v);}prev=v;}}}}

 /* fák */
 const TR=[],WMk=ct.wm,onW=(x,z)=>{if(!WMk)return false;const c=Math.round((lon2fx(LO+x/ML)-tx)*G),r=Math.round((lat2fy(LA-z/MLAT)-ty)*G);return c>=0&&r>=0&&c<=G&&r<=G&&!!WMk[r*(G+1)+c];};
 // benzinkutak, amelyeknek nincs épülete az adatban: tető + kutak + kis shop az út mellé, szabad helyre
 for(const f of FUELP){if(f.used||!inE(f.x,f.z,0))continue;let best=null,bd=45;
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const l=ERG.get((Math.floor(f.x/24)+a)*100003+Math.floor(f.z/24)+b);if(!l)continue;for(const r of l){const d=segD(f.x,f.z,r[0],r[1],r[2],r[3])+(r[4]<3?14:0);if(d<bd){bd=d;best=r;}}}
  if(!best){f.why='noroad';continue;}f.why=['road',+bd.toFixed(1),best[4]];const dx=best[2]-best[0],dz=best[3]-best[1],ll=Math.hypot(dx,dz)||1,u=[dx/ll,dz/ll],t=Math.max(0,Math.min(1,((f.x-best[0])*dx+(f.z-best[1])*dz)/(ll*ll))),px=best[0]+dx*t,pz=best[1]+dz*t;
  let n=[-u[1],u[0]];if((f.x-px)*n[0]+(f.z-pz)*n[1]<0)n=[-n[0],-n[1]];const L=13,W=8.5,onMaj=(x,z)=>{const l=th.get(Math.floor(x/16)*100003+Math.floor(z/16));if(!l)return false;for(const s2 of l)if(s2[4]>=3&&segD(x,z,s2[0],s2[1],s2[2],s2[3])<s2[4]+.3)return true;return false;};
  for(let off=best[4]+W/2+2;off<best[4]+W/2+14;off+=1.5){const cx=px+n[0]*off,cz=pz+n[1]*off,pts=[];for(const a of [-1,-.5,0,.5,1])for(const b of [-1,0,1])pts.push([cx+u[0]*a*L/2+n[0]*b*W/2,cz+u[1]*a*L/2+n[1]*b*W/2]);
   if(pts.some(q=>inBld(q[0],q[1])||onMaj(q[0],q[1])||onW(q[0],q[1]))){f.why.push([Math.round(off),pts.filter(q=>inBld(q[0],q[1])).length,pts.filter(q=>onMaj(q[0],q[1])).length]);continue;}let g=1e9;for(const q of pts)g=Math.min(g,H(q[0],q[1]));
   f.used=true;f.mode=2;canopy(cx,cz,u,L,W,g,5.2,f.n);
   const sx=cx+n[0]*(W/2+5.5),sz=cz+n[1]*(W/2+5.5),sp=[[sx,sz],[sx+u[0]*5+n[0]*3,sz+u[1]*5+n[1]*3],[sx-u[0]*5-n[0]*3,sz-u[1]*5-n[1]*3]];
   if(!sp.some(q=>inBld(q[0],q[1])||onRoad(q[0],q[1],.3)||onW(q[0],q[1]))){const gs=Math.min(...sp.map(q=>H(q[0],q[1])));obox(BX,sx,sz,u,11,6.5,gs-.5,gs+3.8,[.93,.92,.9]);
    const fy=[sx-n[0]*3.27,sz-n[1]*3.27],a0=[fy[0]-u[0]*5.5,fy[1]-u[1]*5.5],a1=[fy[0]+u[0]*5.5,fy[1]+u[1]*5.5];quad(WG,[a0[0],gs,a0[1]],[a1[0],gs,a1[1]],[a1[0],gs+3.3,a1[1]],[a0[0],gs+3.3,a0[1]],[-n[0],0,-n[1]],[1,1,1],[[0,0],[11/24,0],[11/24,1],[0,1]]);
    const c4=[[-5.5,-3.25],[5.5,-3.25],[5.5,3.25],[-5.5,3.25]].map(([a,b])=>[sx+u[0]*a+n[0]*b,sz+u[1]*a+n[1]*b]);for(let k=0;k<4;k++)cseg.push(c4[k][0],c4[k][1],c4[(k+1)%4][0],c4[(k+1)%4][1],gs-.5,gs+3.8);bAdd({b:[Math.min(...c4.map(q=>q[0])),Math.min(...c4.map(q=>q[1])),Math.max(...c4.map(q=>q[0])),Math.max(...c4.map(q=>q[1]))],o:c4,h:[]});}
   const tx=px+n[0]*(best[4]+1.6)+u[0]*(L/2+2),tz=pz+n[1]*(best[4]+1.6)+u[1]*(L/2+2);if(!onRoad(tx,tz,.2)){const gt=H(tx,tz);obox(BX,tx,tz,u,.5,1.6,gt,gt+6.5,brandCol(f.n));SHS.push(tx-n[0]*.27,gt+5.6,tz-n[1]*.27,-n[0],-n[1],1.5,.6,4,shName(f.n));SHS.push(tx+n[0]*.27,gt+5.6,tz+n[1]*.27,n[0],n[1],1.5,.6,4,shName(f.n));
    cseg.push(tx-u[0]*.3,tz-u[1]*.3,tx+u[0]*.3,tz+u[1]*.3,gt,gt+6.5);}
   break;}}
 const addT=(x,z,sc,ty2)=>{if(TR.length>60000*5||onRoad(x,z,.8)||inBld(x,z)||onW(x,z))return;TR.push(x,MH(x,z),z,sc,ty2);};for(let k=0;k<lamps.length;k+=4)lamps[k+1]=MH(lamps[k],lamps[k+2]);
 for(let k=0;k<sTrees.length;k+=2)addT(sTrees[k],sTrees[k+1],.75+rnd()*.35,0);
 for(const q of dTr)if(inC(q[0],q[1]))addT(q[0],q[1],.8+rnd()*.45,0);
 for(const g2 of dRows)runs(g2,cum(g2),0,8,run=>{for(const q of run)if(inC(q[0],q[1]))addT(q[0],q[1],.75+rnd()*.35,0);});
 for(const P of polys){const den=P.k.tree;if(!den)continue;const x0=Math.max(P.b[0],cx0),x1=Math.min(P.b[2],cx1),z0=Math.max(P.b[1],cz0),z1=Math.min(P.b[3],cz1);
  if(x1<=x0||z1<=z0)continue;const n=Math.min(25000,(x1-x0)*(z1-z0)*den);
  for(let q=0;q<n;q++){const x=x0+rnd()*(x1-x0),z=z0+rnd()*(z1-z0);if(pip(x,z,P))addT(x,z,.8+rnd()*.6,P.k.con||(den>1/100&&rnd()<.3)?1:0);}}

 const SGN=[];if(MLY){const sp=mlySigns(tx,ty),r1=await Promise.race([sp,sleep(rebuild?30000:300).then(()=>'late')]);
  if(r1==='late')sp.then(v=>{if(v&&v.length)postMessage({t:'detail',tx,ty,gen:g});});
  else for(const [lo,la,v] of r1||[]){const code=signCode(v);if(!code)continue;let x=X(lo),z=Zf(la);if(!inC(x,z))continue;let best=null,bd=16;
   for(let k=0;k<rseg.length;k+=14){if(rseg[k+9]>1)continue;const ax=rseg[k],az=rseg[k+1],dx=rseg[k+3]-ax,dz=rseg[k+4]-az,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),px=ax+dx*t,pz=az+dz*t,d=Math.hypot(x-px,z-pz);if(d<bd){bd=d;best={px,pz,dx,dz,hw:rseg[k+6]};}}
   if(!best)continue;const ul=Math.hypot(best.dx,best.dz)||1,ux=best.dx/ul,uz=best.dz/ul,rx=-uz,rz=ux;let side=(x-best.px)*rx+(z-best.pz)*rz>=0?1:-1;
   if(bd<best.hw+1){x=best.px+rx*side*(best.hw+1.3);z=best.pz+rz*side*(best.hw+1.3);}const f=side>0?[-ux,-uz]:[ux,uz];SGN.push(x,MH(x,z),z,Math.atan2(f[0],f[1]),code);}}
 const F32=a=>new Float32Array(a),U32=a=>new Uint32Array(a);
 const out={t:'chunk',signs:SGN,tx,ty,gen:g,h:hg,wm,baseY:hsum/nV,
  ground:{p:F32(gp),c:F32(gc),u:F32(gu),i:U32(gi),nV},roads:R.map(b=>({p:F32(b.p),u:F32(b.u),i:U32(b.i)})),walk:{p:F32(SW.p),u:F32(SW.u),i:U32(SW.i)},
  bed:{p:F32(BED.p),i:U32(BED.i)},rail:{p:F32(RAIL.p),i:U32(RAIL.i)},bridge:{p:F32(BR.p),n:F32(BR.n)},
  wu:{p:F32(WU.p),n:F32(WU.n),u:F32(WU.u),c:F32(WU.c)},wg:{p:F32(WG.p),n:F32(WG.n),u:F32(WG.u),c:F32(WG.c)},roofs:{p:F32(RF.p),n:F32(RF.n),c:F32(RF.c)},
  water:{p:F32(WA.p),i:U32(WA.i)},trees:F32(TR),lamps:F32(lamps),demdec:DEMDEC,shs:F32(SHS),shn:SHN,fdbg:FUELP.map(f=>[+f.x.toFixed(1),+f.z.toFixed(1),f.mode||0,f.n,inBld(f.x,f.z)?1:0,f.dbgB||null,f.why||null]),rseg:F32(rseg),tseg:F32(tseg),cseg:F32(cseg),names,marks,rebuild:!!rebuild,ms:{p:F32(MS.p),i:U32(MS.i)},md:{p:F32(MD.p),u:F32(MD.u),i:U32(MD.i)},sig:F32(SG),sigN:F32(sigN),bx:{p:F32(BX.p),n:F32(BX.n),c:F32(BX.c)},wmo:{p:F32(WM.p),n:F32(WM.n),u:F32(WM.u),c:F32(WM.c)},wbr:{p:F32(WK.p),n:F32(WK.n),u:F32(WK.u),c:F32(WK.c)},style:ST.key,bidx:F32(bIdx),bunk:F32(BU),fac:F32(FAC),wpa:{p:F32(WP.p),n:F32(WP.n),u:F32(WP.u),c:F32(WP.c)}};
 const tl=[hg.buffer,wm.buffer,out.sig.buffer,out.sigN.buffer,out.trees.buffer,out.lamps.buffer,out.rseg.buffer,out.tseg.buffer,out.cseg.buffer];
 for(const o of [out.ground,out.ms,out.md,out.bx,out.wmo,out.wpa,...out.roads,out.walk,out.bed,out.rail,out.bridge,out.wu,out.wg,out.roofs,out.water])for(const k in o)if(o[k]&&o[k].buffer)tl.push(o[k].buffer);
 postMessage(out,tl);}

self.addEventListener('unhandledrejection',e=>console.error('W rej',e.reason&&e.reason.stack||e.reason));
const queue=[];let busy=false;
async function pump(){if(busy)return;busy=true;while(queue.length){const m=queue.shift();try{await build(m.tx,m.ty,m.gen,m.rebuild);}catch(err){console.error('build',err&&err.stack);postMessage({t:'fail',tx:m.tx,ty:m.ty,gen:m.gen,msg:String(err&&err.message||err)});}}busy=false;}
let MLY='';const mCache=new Map();
function mlySigns(tx,ty){const k=tx+','+ty;let p=mCache.get(k);if(p)return p;
 p=(async()=>{try{const r=await fetch('https://tiles.mapillary.com/maps/vtp/mly_map_feature_traffic_sign/2/14/'+tx+'/'+ty+'?access_token='+encodeURIComponent(MLY));if(!r.ok)return[];const L=readMVT(await r.arrayBuffer()),lay=L.traffic_sign||Object.values(L)[0];if(!lay)return[];
  const out=[],E=lay.extent||4096;for(const F of lay.feats){if(F.type!==1)continue;const pr=props(lay,F);for(const ring of rings(F.geom))for(const q of ring)out.push([fx2lon(tx+q[0]/E),fy2lat(ty+q[1]/E),String(pr.value||'')]);}return out;}catch(e){return[];}})();
 mCache.set(k,p);if(mCache.size>80)mCache.delete(mCache.keys().next().value);return p;}
const signCode=v=>{const m=/maximum-speed-limit-(\d+)/.exec(v);if(m)return+m[1];if(/--stop--/.test(v))return 1001;if(/yield|give-way/.test(v))return 1002;if(/no-entry/.test(v))return 1003;if(/pedestrians-crossing|crosswalk-zebra/.test(v))return 1004;if(/priority-road/.test(v))return 1005;return 0;};
self.onmessage=e=>{const m=e.data;
 if(m.t==='cfg'){MLY=m.mly||'';if(m.lowmem)LOWMEM=true;return;}
 if(m.t==='memdbg'){let dem=0;for(const v of tileD.values())if(v&&v.byteLength)dem+=v.byteLength;self.postMessage({t:'memdbg',s:{tilesP:tilesP.size,tileD:tileD.size,demMB:Math.round(dem/1e6),rmemo:rmemo.size,memo:memo.size,CTG:CTG.size,vmemo:vmemo.size,smemo:smemo.size,dCache:dCache.size,ctCache:ctCache.size,lcache:lcache.size,bpCache:bpCache.size,HOV:HOV.size,mCache:mCache.size,queue:queue.length}});return;}
 if(m.t==='hov'){const L=m.list;for(let i=0;i<L.length;i+=3)HOV.set(Math.round(L[i])+','+Math.round(L[i+1]),L[i+2]);return;}
 if(m.t==='init'){lat0=m.lat0;lon0=m.lon0;mlon=111320*Math.cos(lat0*Math.PI/180);queue.length=0;}
 else if(m.t==='chunk'){queue.push(m);if(!m.rebuild)prefetch(m.tx,m.ty);pump();}};
// a sorban váró csempék hálózati adatai (vektorcsempe, domborzat, részletes OSM) már most, párhuzamosan töltődnek – a feldolgozás így nem vár a hálózatra
function prefetch(tx,ty){try{layersOf(tx,ty).catch(()=>{});detailOf(tx,ty).catch(()=>{});const latN=fy2lat(ty),latS=fy2lat(ty+1),lonW=fx2lon(tx),lonE=fx2lon(tx+1);demBox(latS-.006,latN+.006,lonW-.009,lonE+.009).catch(()=>{});}catch(e){}}