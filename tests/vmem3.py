from vreal import *
import sys,json,time,psutil
pts=[tuple(map(float,p.split(','))) for p in sys.argv[1:]]
def rss():
    r={'renderer':0,'gpu':0}
    for p in psutil.process_iter(['name','cmdline']):
        try:
            cl=' '.join(p.info['cmdline'] or [])
            if 'chrom' not in (p.info['name'] or '').lower() and 'chrom' not in cl: continue
            if '--type=renderer' in cl: r['renderer']+=p.memory_info().rss
            elif '--type=gpu-process' in cl: r['gpu']+=p.memory_info().rss
        except Exception: pass
    return {k:round(v/1e6) for k,v in r.items()}
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:1,trams:true,quality:1,qSet:true,photo:false,autoTime:false,v6:1,mlyOn:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    t0=time.time()
    for la,lo in pts:
        pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,300);pg.wait_for_timeout(6000)
        g=pg.evaluate("""()=>{const v=window.__vj;let b=0,n=0;const seen=new Set();v.scene.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);n++;for(const k in o.geometry.attributes){b+=o.geometry.attributes[k].array.byteLength;}if(o.geometry.index)b+=o.geometry.index.array.byteLength;}});let ch=0,rd=0;for(const c of v.chunks.values()){ch++;if(c.state==='ready')rd++;}return {geoMB:Math.round(b/1e6),geos:n,chunks:ch,ready:rd,heap:Math.round(performance.memory.usedJSHeapSize/1e6),tex:v.renderer.info.memory.textures}}""")
        pg.evaluate('()=>window.__vj.memdbg()');pg.wait_for_timeout(500);w=pg.evaluate('()=>window.__memdbg')
        print(round(time.time()-t0),g,rss(),w,flush=True)
    br.close()
