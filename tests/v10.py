import os,sys
from v2 import *
with sync_playwright() as p:
    br,pg,logs=setup(p)
    for i in range(90):
        pg.wait_for_timeout(1000)
        if pg.evaluate("()=>window.__vj&&window.__vj.car.spawned"): break
    pg.wait_for_timeout(4000); pg.click('#go'); pg.wait_for_timeout(500)
    pg.evaluate("()=>window.__vj.sim(10)")
    tot={'ov':0,'samples':0}
    for k in range(60):
        r=pg.evaluate("""()=>{const T=window.__vj.traffic;window.__vj.sim(1);let ov=0;for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i],b=T[j];if(Math.abs(a.y-b.y)<2&&Math.hypot(a.x-b.x,a.z-b.z)<2.6)ov++;}
          const rk={};for(const c of T){const r=c.ch.rseg[c.k+13];const key=r<3?'fő':r<5?'gyűjtő':'mellék';rk[key]=(rk[key]||0)+1;}return [ov,T.length,rk,T.filter(c=>c.v<.5).length]}""")
        tot['ov']+=r[0]; tot['samples']+=1
        if k%15==0: print(r)
    print('overlap events per sample',tot['ov']/tot['samples'])
    br.close()
    print([l for l in logs if 'PAGEERROR' in l][:5])
