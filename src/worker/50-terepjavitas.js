/* ---------- valósághű domborzat: épület- és lombkorona-dudorok kiszűrése, vízmeder ---------- */
const ctCache=new Map();
function correctTile(tx,ty){const key=tx+','+ty;let pr=ctCache.get(key);if(pr)return pr;
 pr=(async()=>{const lonW=fx2lon(tx),lonE=fx2lon(tx+1),latN=fy2lat(ty),latS=fy2lat(ty+1);
  await demBox(latS-.006,latN+.006,lonW-.009,lonE+.009);const Ls=await layersOf(tx,ty);
  const W=G+1,raw=new Float32Array(W*W);for(let r=0;r<=G;r++)for(let c=0;c<=G;c++)raw[r*W+c]=rawL(tx*G+c,ty*G+r);
  const mask=new Uint8Array(W*W),wm=new Uint8Array(W*W),lvl=new Float32Array(W*W);
  const raster=(L,F,cb,pre)=>{const s=G/L.extent;for(const P of polyGroups(rings(F.geom))){const o=P.o.map(q=>[q[0]*s,q[1]*s]),poly={o,h:P.h.map(h=>h.map(q=>[q[0]*s,q[1]*s]))};
   let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of o){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}
   if(pre)pre(poly,P,L,x1-x0,y1-y0);
   for(let r=Math.max(0,Math.ceil(y0));r<=Math.min(G,Math.floor(y1));r++)for(let c=Math.max(0,Math.ceil(x0));c<=Math.min(G,Math.floor(x1));c++)if(pip(c,r,poly))cb(r*W+c,poly,r,c);}};
  if(Ls.water)for(const F of Ls.water.feats){if(F.type!==3)continue;
   raster(Ls.water,F,(i,poly,r,c)=>{wm[i]=1;lvl[i]=poly.big?waterLvl(fy2lat(ty+r/G),fx2lon(tx+c/G)):poly.lvl;},(poly,P,L,w,h)=>{poly.big=w>20||h>20;
    if(!poly.big){let mn=1e9;for(const q of P.o)mn=Math.min(mn,rawAt(fy2lat(ty+q[1]/L.extent),fx2lon(tx+q[0]/L.extent)));poly.lvl=mn+.3;}});}
  if(Ls.building)for(const F of Ls.building.feats){if(F.type===3)raster(Ls.building,F,i=>{mask[i]=1;});}
  if(Ls.landcover)for(const F of Ls.landcover.feats){if(F.type===3&&props(Ls.landcover,F).class==='wood')raster(Ls.landcover,F,i=>{mask[i]=2;});}
  const h=raw.slice();
  for(let r=2;r<=G-2;r++)for(let c=2;c<=G-2;c++){const i=r*W+c;if(!mask[i]||wm[i])continue;const vals=[];
   for(let dr=-4;dr<=4;dr++)for(let dc=-4;dc<=4;dc++){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>G||cc>G)continue;const j=rr*W+cc;if(!mask[j]&&!wm[j])vals.push(raw[j]);}
   if(vals.length>=3){vals.sort((a,b)=>a-b);h[i]=Math.min(raw[i],vals[Math.floor(vals.length*.3)]);}
   else{let m=raw[i];for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)m=Math.min(m,raw[(r+dr)*W+c+dc]);h[i]=m;}}
  for(let r=1;r<G;r++)for(let c=1;c<G;c++){const i=r*W+c;if(wm[i])h[i]=Math.min(h[i],lvl[i]-1.6);}
  /* a talaj az út mellett az úthoz simul (bevágás/töltés), az út magasságát nem változtatjuk */
  const TLc=Ls.transportation;if(TLc){const cm=40075016.7*Math.cos(fy2lat(ty+.5)*Math.PI/180)/NT/G,sc=G/TLc.extent,best=new Float32Array(W*W).fill(1e9);
   for(const F of TLc.feats){if(F.type!==2)continue;const pp=props(TLc,F),cl=pp.class;if(pp.brunnel==='bridge'||pp.brunnel==='tunnel'||/_construction$/.test(cl))continue;
    let wd=({motorway:24,trunk:19,primary:17,secondary:14,tertiary:11,minor:9,service:6,track:4,raceway:10,busway:8})[cl]||0;if(cl==='rail'||cl==='transit')wd=4;if(cl==='path')continue;if(!wd)continue;const hw=wd/2,rad=(hw+cm+3)/cm;
    for(const Q of rings(F.geom))for(let k=1;k<Q.length;k++){const ax=Q[k-1][0]*sc,ay=Q[k-1][1]*sc,bx=Q[k][0]*sc,by=Q[k][1]*sc;
     for(let r=Math.max(1,Math.floor(Math.min(ay,by)-rad));r<=Math.min(G-1,Math.ceil(Math.max(ay,by)+rad));r++)for(let c=Math.max(1,Math.floor(Math.min(ax,bx)-rad));c<=Math.min(G-1,Math.ceil(Math.max(ax,bx)+rad));c++){
      const i=r*W+c;if(wm[i])continue;const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((c-ax)*dx+(r-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));const d=Math.hypot(c-ax-dx*t,r-ay-dy*t)*cm-hw;
      if(d<best[i])best[i]=d;}}}
   for(let r=1;r<G;r++)for(let c=1;c<G;c++){const i=r*W+c,d=best[i];if(d>cm+3)continue;const road=sL(tx*G+c,ty*G+r)-.08;
    const dh=h[i]-road;h[i]=d<=3?road:road+Math.max(-(d-3)*.5,Math.min((d-3)*.4,dh));}}
  if(memo.size>3000000){memo.clear();ctCache.clear();}
  for(let r=1;r<G;r++)for(let c=1;c<G;c++){const i=r*W+c;if(h[i]!==raw[i])memo.set((tx*G+c)*4e7+ty*G+r,h[i]);}
  return{h,wm};})();
 ctCache.set(key,pr);pr.catch(()=>ctCache.delete(key));if(ctCache.size>90)ctCache.delete(ctCache.keys().next().value);return pr;}
