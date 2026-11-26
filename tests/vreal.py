import os,sys,json,math
from v2 import cdn,osrm,nomi,sync_playwright
def setup_real(p,lat=None,lon=None):
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome',proxy={'server':os.environ['HTTPS_PROXY']},args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=br.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=3) if os.environ.get('MOBILE') else br.new_context(viewport={'width':1280,'height':720},ignore_https_errors=False)
    ctx.route('https://cdn.jsdelivr.net/**',cdn);ctx.route('https://unpkg.com/**',cdn)
    ctx.route('https://router.project-osrm.org/**',osrm);ctx.route('https://nominatim.openstreetmap.org/**',nomi)
    pg=ctx.new_page();logs=[]
    pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}'));pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.on('worker',lambda wk: wk.on('console',lambda m: logs.append('W '+m.text)))
    pg.on('requestfailed',lambda r: logs.append('FAIL '+r.url[:90]+' '+str(r.failure)))
    pg.goto('file://'+__import__('os').environ.get('VJ_FILE',os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','index.html')))
    return br,pg,logs
def wait_ready(pg,maxs=180):
    for i in range(maxs):
        pg.wait_for_timeout(1000)
        if pg.evaluate("()=>window.__vj&&window.__vj.car.spawned&&[...window.__vj.chunks.values()].filter(c=>c.state!=='ready').length===0"): return i
    return -1
if __name__=='__main__':
    with sync_playwright() as p:
        br,pg,logs=setup_real(p)
        print('ready',wait_ready(pg,120))
        pg.click('#go');pg.wait_for_timeout(500)
        pg.evaluate("()=>window.__vj.jump(47.4987,19.0412)")
        print('ready2',wait_ready(pg,240))
        pg.wait_for_timeout(20000)
        print(pg.evaluate("()=>[...window.__vj.chunks.values()].map(c=>[c.key,c.state,c.rseg?c.rseg.length/14:0,c.style])"))
        pg.screenshot(path='/home/claude/test/real_a.png')
        br.close()
        print('\n'.join([l for l in logs if 'GPU' not in l and 'GL Driver' not in l][:25]))
