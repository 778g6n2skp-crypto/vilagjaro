"""Tesztautó-bejárás: a tesztautó végigmegy a körzet összes útján, és listázza a hibákat.
használat: python3 vbejaras.py NÉV LAT LON [SUGÁR_m] [MAX_ÚT_km]
kimenet: /tmp/bej_NÉV.json (események + lefedettség), képek: /tmp/bej_NÉV_*.png
"""
from vreal import *
import sys, json, math, os

name = sys.argv[1]; la = float(sys.argv[2]); lo = float(sys.argv[3])
R = float(sys.argv[4]) if len(sys.argv) > 4 else 450
MAXKM = float(sys.argv[5]) if len(sys.argv) > 5 else 12

JS_SETUP = r"""
(R)=>{const v=window.__vj,c=v.car;const cx=c.x,cz=c.z;const S=[];const seen=new Set();
 for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;
  const mx=(a[k]+a[k+3])/2,mz=(a[k+1]+a[k+4])/2;if(Math.hypot(mx-cx,mz-cz)>R)continue;const L=Math.hypot(a[k+3]-a[k],a[k+4]-a[k+1]);if(L<.3)continue;
  const key=[a[k],a[k+1],a[k+3],a[k+4]].map(q=>Math.round(q*2)).join(',');if(seen.has(key))continue;seen.add(key);
  S.push({x0:a[k],z0:a[k+1],y0:a[k+2],x1:a[k+3],z1:a[k+4],y1:a[k+5],hw:a[k+6],br:a[k+7],cls:a[k+9],ow:a[k+10],L,cov:false});}}
 const nk=(x,z)=>Math.round(x*2)+','+Math.round(z*2),N=new Map();S.forEach((s,i)=>{for(const [e,x,z] of [[0,s.x0,s.z0],[1,s.x1,s.z1]]){const k=nk(x,z);let l=N.get(k);if(!l)N.set(k,l=[]);l.push([i,e]);}});
 window.__PT={S,N,nk,cx,cz,ev:[],km:0,chains:0};return {segs:S.length,km:Math.round(S.reduce((a,s)=>a+s.L,0))/1000};}
"""

JS_CHAIN = r"""
()=>{const v=window.__vj,c=v.car,P=window.__PT,S=P.S;const st=S.findIndex(s=>!s.cov);if(st<0)return null;
 // útvonal-lánc: a kezdő szakaszból előre, a csomópontokban a legkisebb kanyarodású (előbb a még be nem járt) folytatás
 let cur=st,dir=0;const path=[];const segIds=[];let len=0;
 const pts=i=>{const s=S[i];return dir?[[s.x1,s.z1,s.y1],[s.x0,s.z0,s.y0]]:[[s.x0,s.z0,s.y0],[s.x1,s.z1,s.y1]];};
 for(let n=0;n<400&&len<500;n++){const [A,B]=pts(cur);if(!path.length)path.push(A);path.push(B);segIds.push(cur);len+=S[cur].L;S[cur].used=true;
  const hd=Math.atan2(B[0]-A[0],B[1]-A[1]);const l=P.N.get(P.nk(B[0],B[1]))||[];let best=null,bs=1e9;
  for(const [j,e] of l){if(j===cur)continue;const s=S[j];const nx=e?s.x0:s.x1,nz=e?s.z0:s.z1,bx=e?s.x1:s.x0,bz=e?s.z1:s.z0;const h2=Math.atan2(nx-bx,nz-bz);const turn=Math.abs(Math.atan2(Math.sin(h2-hd),Math.cos(h2-hd)));if(turn>1.9)continue;
   if(s.ow&&e===1)continue;const sc=turn+(s.cov||s.used?3:0);if(sc<bs){bs=sc;best=[j,e];}}
  if(!best||bs>=3+1.9)break;cur=best[0];dir=best[1];}
 for(const s of S)s.used=false;
 // indulás
 const p0=path[0],p1=path[1];const h0=Math.atan2(p1[0]-p0[0],p1[1]-p0[1]);let y0=v.surfaceAt(p0[0],p0[1],p0[2]+1);if(y0==null||!isFinite(y0))y0=p0[2];
 Object.assign(c,{x:p0[0],z:p0[1],y:y0+.3,vy:0,h:h0,vx:0,vz:0,vF:0,w:0,steer:0,ground:false,impact:0});v.inp.thr=0;v.inp.brk=0;v.inp.steer=0;v.sim(.6);
 const D=[0];for(let i=1;i<path.length;i++)D.push(D[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));const TOT=D[D.length-1];
 const at=s=>{s=Math.max(0,Math.min(TOT,s));let i=1;while(i<D.length-1&&D[i]<s)i++;const f=(s-D[i-1])/((D[i]-D[i-1])||1);const a=path[i-1],b=path[i];return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,i];};
 let si=0,t=0,air=0,stuck=0,pvy=null,pvF=0,prevY=c.y,stop=null,wasG=false;const ev=[];
 const E=(type,val,extra)=>{ev.push(Object.assign({type,x:+c.x.toFixed(1),z:+c.z.toFixed(1),y:+c.y.toFixed(2),h:+c.h.toFixed(2),val:+(+val).toFixed(2)},extra||{}));};
 const hwAt=i=>S[segIds[Math.min(segIds.length-1,Math.max(0,i-1))]].hw;
 while(t<TOT/4+25){
  // vetület a pályára
  let bd=1e9,bsx=si;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,u=Math.max(0,Math.min(1,((c.x-a[0])*dx+(c.z-a[1])*dz)/l2)),d=Math.hypot(c.x-a[0]-dx*u,c.z-a[1]-dz*u);const s=D[i-1]+u*Math.sqrt(l2);if(d<bd&&Math.abs(s-si)<40){bd=d;bsx=s;}}
  si=Math.max(si,bsx);if(si>TOT-6)break;const [px,pz,py,pi]=at(si);
  // lefedettség
  for(let k=Math.max(0,pi-2);k<Math.min(segIds.length,pi+1);k++){const s=S[segIds[k]];const mx=(s.x0+s.x1)/2,mz=(s.z0+s.z1)/2;if(Math.hypot(c.x-mx,c.z-mz)<s.hw+2+s.L/2)s.cov=true;}
  // kormányzás és sebesség
  const la=at(si+Math.max(7,c.vF*.9)),want=Math.atan2(la[0]-c.x,la[1]-c.z),he=Math.atan2(Math.sin(want-c.h),Math.cos(want-c.h));
  const ah=at(si+25),a2=at(si+6);const turnAhead=Math.abs(Math.atan2(Math.sin(Math.atan2(ah[0]-a2[0],ah[1]-a2[1])-Math.atan2(a2[0]-px,a2[1]-pz)),Math.cos(Math.atan2(ah[0]-a2[0],ah[1]-a2[1])-Math.atan2(a2[0]-px,a2[1]-pz))));
  const vt=turnAhead>.9?6:turnAhead>.45?9:(S[segIds[Math.min(segIds.length-1,pi-1)]].cls===0?15:11);
  v.inp.steer=Math.max(-1,Math.min(1,he*2.2));v.inp.thr=c.vF<vt?.8:0;v.inp.brk=c.vF>vt+3?.6:0;
  v.sim(.1);t+=.1;
  if(t<1.2){pvy=null;pvF=c.vF;prevY=c.y;continue;}
  // hibák
  const hw=hwAt(pi);if(bd>hw+3){E('letérés',bd,{hw});stop='letérés';break;}
  if(!c.ground){air+=.1;}else{if(air>=.35)E('levegőben',air,{drop:+(prevY-c.y).toFixed(2)});air=0;}
  if(c.ground&&wasG&&pvy!=null){const acc=Math.abs(c.vy-pvy)/.1;if(acc>30)E('döccenés',acc);}
  pvy=c.ground?c.vy:null;wasG=c.ground;
  if(Math.abs(c.roll)>1.0||Math.abs(c.pitch)>.9){E('borulás',Math.max(Math.abs(c.roll),Math.abs(c.pitch)));stop='borulás';break;}
  if(pvF-c.vF>4){E('ütközés',pvF-c.vF);}pvF=c.vF;
  if(c.vF<.7&&v.inp.thr>0)stuck+=.1;else stuck=0;if(stuck>2.5){E('elakadás',stuck);stop='elakadás';break;}
  if(c.y<py-1.2){E('leesés',py-c.y);stop='leesés';break;}
  {const top=v.meshSurf(c.x,c.z,c.y+6,true);if(top!=null&&top>c.y+1.2&&!S[segIds[Math.min(segIds.length-1,pi-1)]].br){const rs=v.surfDbg(c.x,c.z).filter(q=>q[1]>=1&&q[1]<=3&&q[0]>c.y+1.2&&q[0]<c.y+3);if(rs.length)E('út alatt',rs[0][0]-c.y);}}
  prevY=c.y;}
 for(const k of segIds.slice(0,Math.max(1,Math.ceil(segIds.length*Math.min(1,si/(TOT||1))))))S[k].cov=true;S[st].cov=true;
 v.inp.thr=0;v.inp.steer=0;v.inp.brk=0;P.km+=si/1000;P.chains++;
 for(const e of ev){const ll=v.toLL(e.x,e.z);e.lat=+ll[0].toFixed(6);e.lon=+ll[1].toFixed(6);}P.ev.push(...ev);
 return {len:Math.round(TOT),drove:Math.round(si),stop,n:ev.length,left:S.filter(s=>!s.cov).length};}
"""

with sync_playwright() as p:
    br, pg, logs = setup_real(p)
    pg.wait_for_timeout(1500)
    pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1,mlyOn:false}))")
    pg.reload(); wait_ready(pg, 120); pg.click('#go'); pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({la},{lo})"); wait_ready(pg, 300); pg.wait_for_timeout(6000)
    info = pg.evaluate(JS_SETUP, R)
    print('szakaszok', info, flush=True)
    while True:
        r = pg.evaluate(JS_CHAIN)
        if r is None: break
        st = pg.evaluate("()=>({km:window.__PT.km,ch:window.__PT.chains})")
        if st['ch'] % 20 == 0: print(st, r, flush=True)
        if st['km'] > MAXKM: break
    res = pg.evaluate("()=>{const P=window.__PT;const S=P.S;const tot=S.reduce((a,s)=>a+s.L,0),cov=S.filter(s=>s.cov).reduce((a,s)=>a+s.L,0);return {ev:P.ev,km:P.km,chains:P.chains,lefedettseg:Math.round(100*cov/tot)}}")
    # képek a legsúlyosabb eseményekről
    sev = {'borulás': 100, 'leesés': 90, 'út alatt': 80, 'letérés': 60, 'elakadás': 55, 'levegőben': 50, 'ütközés': 40, 'döccenés': 20}
    evs = sorted(res['ev'], key=lambda e: -(sev.get(e['type'], 0) + min(30, e['val'])))
    shots = []; taken = []
    for e in evs:
        if len(shots) >= 10: break
        if any(math.hypot(e['x'] - q['x'], e['z'] - q['z']) < 25 for q in taken): continue
        taken.append(e)
        pg.evaluate("(e)=>{const v=window.__vj,c=v.car;const back=9;Object.assign(c,{x:e.x-Math.sin(e.h)*back,z:e.z-Math.cos(e.h)*back,vx:0,vz:0,vF:0,vy:0,h:e.h});const y=v.surfaceAt(c.x,c.z,e.y+2);c.y=(y==null?e.y:y)+.3;v.inp.thr=0;v.sim(.3);}", e)
        pg.wait_for_timeout(700)
        fn = f"/tmp/bej_{name}_{len(shots)}.png"; pg.screenshot(path=fn); shots.append([fn, e])
    res['shots'] = shots; res['name'] = name; res['center'] = [la, lo]
    json.dump(res, open(f'/tmp/bej_{name}.json', 'w'), ensure_ascii=False)
    from collections import Counter
    print('KÉSZ', name, 'km', round(res['km'], 1), 'láncok', res['chains'], 'lefedettség%', res['lefedettseg'], dict(Counter(e['type'] for e in res['ev'])))
    br.close()
