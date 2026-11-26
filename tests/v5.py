from v2 import *
def shot(pg,name): pg.wait_for_timeout(2500); pg.screenshot(path=f'/home/claude/test/{name}.png')
with sync_playwright() as p:
    br,pg,logs=setup(p)
    for i in range(90):
        pg.wait_for_timeout(1000)
        if pg.evaluate("()=>window.__vj&&window.__vj.car.spawned"): break
    pg.wait_for_timeout(5000); pg.click('#go')
    # bumps on hills
    pg.evaluate("""()=>{const c=window.__vj.car;const lat0=47.50320,lon0=19.06010,ml=111320*Math.cos(lat0*Math.PI/180);
      c.x=(14662*0.0013-lon0)*ml+1.5;c.z=-(47.5045-lat0)*110574;c.h=Math.PI;c.vx=c.vz=0;c.vF=0;c.y=200;c.ground=false;window.__vj.sim(6);}""")
    ys=[pg.evaluate("()=>{window.__vj.inp.thr=.6;window.__vj.sim(.2);const c=window.__vj.car;return [+c.z.toFixed(2),+c.y.toFixed(3),+c.vF.toFixed(1),c.ground]}") for k in range(30)]
    d2=[abs((ys[i+1][1]-ys[i][1])-(ys[i][1]-ys[i-1][1])) for i in range(1,len(ys)-1)]
    print('speed end',ys[-1],'max2nd',round(max(d2),3),'airborne',sum(1 for y in ys if not y[3]))
    # traffic at signals
    pg.evaluate("()=>window.__vj.sim(0)")
    pg.wait_for_timeout(3000)
    st=pg.evaluate("()=>{const T=window.__vj.traffic;return {n:T.length,stopped:T.filter(c=>c.v<.5).length,sig:T.filter(c=>c.sigL!=null).length,ls:[window.__vj.lightState(0),window.__vj.lightState(1)]}}")
    print('traffic',st)
    shot(pg,'v5_street')
    # police
    pg.evaluate("()=>window.__vj.crime(2,'teszt')")
    for k in range(10):
        pg.evaluate("()=>window.__vj.sim(.5)"); pg.wait_for_timeout(400)
    print('police',pg.evaluate("()=>window.__vj.police.map(p=>[Math.round(Math.hypot(p.x-window.__vj.car.x,p.z-window.__vj.car.z)),p.mode])"),'wanted',pg.evaluate("()=>window.__vj.wanted"))
    pg.keyboard.press('KeyC');shot(pg,'v5_police');pg.keyboard.press('KeyC');pg.keyboard.press('KeyC')
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(2500)
    print('mission',pg.evaluate("()=>document.getElementById('mission').textContent"),pg.evaluate("()=>document.getElementById('money').textContent"))
    pg.evaluate("()=>window.__vj.time(2)"); pg.keyboard.press('KeyC'); shot(pg,'v5_night'); pg.keyboard.press('KeyC'); pg.keyboard.press('KeyC')
    pg.evaluate("()=>window.__vj.time(0)")
    br.close()
    print('\n'.join([l for l in logs if 'GPU' not in l and 'GL Driver' not in l][:25]))
