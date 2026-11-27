from vreal import *
import sys,json
la,lo=float(sys.argv[1]),float(sys.argv[2])
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1,mlyOn:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,300);pg.wait_for_timeout(4000)
    r=pg.evaluate("""()=>{const v=window.__vj,c=v.car;let n=0,sink=0,mx=0,ex=[];for(const ch of v.chunks.values()){if(ch.state!=='ready'||!ch.tseg)continue;const a=ch.tseg;for(let k=0;k<a.length;k+=6){if(Math.hypot(a[k]-c.x,a[k+1]-c.z)>300)continue;const L=Math.hypot(a[k+3]-a[k],a[k+4]-a[k+1]);for(let s=0;s<L;s+=1){const t=s/L,x=a[k]+(a[k+3]-a[k])*t,z=a[k+1]+(a[k+4]-a[k+1])*t,y=a[k+2]+(a[k+5]-a[k+2])*t;for(const o of [-1.2,0,1.2]){const dx=(a[k+4]-a[k+1])/L*o,dz=-(a[k+3]-a[k])/L*o;const sy=v.surfaceAt(x+dx,z+dz,y+.3);n++;const d=y-(sy==null?-1e9:sy);if(d>.25){sink++;if(d>mx)mx=d;if(ex.length<4)ex.push([Math.round(x-c.x),Math.round(z-c.z),+d.toFixed(2)]);}}}}}return {n,sink,mx:+mx.toFixed(2),ex};}""")
    print('RES',json.dumps(r))
    br.close()
