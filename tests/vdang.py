from vreal import *
import sys,json
la,lo=float(sys.argv[1]),float(sys.argv[2])
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1,mlyOn:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,300);pg.wait_for_timeout(5000)
    r=pg.evaluate("""()=>{const v=window.__vj,c=v.car;const E=[];for(const ch of v.chunks.values()){if(ch.state!=='ready'||!ch.tseg)continue;const t=ch.tseg;for(let k=0;k<t.length;k+=6)for(const e of [0,1])E.push([t[k+e*3],t[k+e*3+1],t[k+e*3+2],ch.key]);}
      const out=[];for(const a of E){if(Math.hypot(a[0]-c.x,a[1]-c.z)>500)continue;let n=0,nearest=1e9;for(const b of E){if(b===a)continue;const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d<.3)n++;else if(d<nearest)nearest=d;}if(n===0)out.push([Math.round(a[0]-c.x),Math.round(a[1]-c.z),+nearest.toFixed(1),a[3]]);}return {n:E.length,dang:out};}""")
    print(json.dumps(r))
    br.close()
