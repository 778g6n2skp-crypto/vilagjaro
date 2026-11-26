from vreal import *
import sys,json
la,lo=float(sys.argv[1]),float(sys.argv[2]);R=float(sys.argv[3]) if len(sys.argv)>3 else 400
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,240);pg.wait_for_timeout(8000)
    r=pg.evaluate("""(R)=>{const v=window.__vj,c=v.car;let n=0,bur=0,bur2=0,flo=0,flo2=0;const ex=[];
      for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1||a[k+7])continue;const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],l=Math.hypot(dx,dz);if(l<.5)continue;const hw=a[k+6],nx=-dz/l,nz=dx/l;
        for(const t of [.25,.75]){const x=a[k]+dx*t,z=a[k+1]+dz*t,y=a[k+2]+(a[k+5]-a[k+2])*t;if(Math.hypot(x-c.x,z-c.z)>R)continue;n++;
          for(const o of [0,-(hw-.3),hw-.3]){const gc=v.terrainH(x+nx*o,z+nz*o);if(gc>y-.02){bur++;if(gc>y+.5){bur2++;if(ex.length<6)ex.push(['bur',Math.round(x),Math.round(z),+(gc-y).toFixed(1),hw,o]);}}}
          for(const sd of [-1,1]){const ge=v.terrainH(x+nx*sd*(hw+1.2),z+nz*sd*(hw+1.2));if(ge<y-1.5){flo++;if(ge<y-4)flo2++;}}}}}
      return {samples:n,buried:bur,buried1m:bur2,edgeDrop:flo,edgeDrop4m:flo2,ex}}""",R)
    print(json.dumps(r))
    br.close()
