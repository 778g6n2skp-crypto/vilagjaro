import json, math, io, sys, urllib.parse, time
from PIL import Image
from shapely.geometry import LineString, Polygon, box
import mapbox_vector_tile as mvt
from playwright.sync_api import sync_playwright

V='/home/claude/vendor/node_modules/'
def lon2fx(lon,n): return (lon+180)/360*n
def lat2fy(lat,n): r=math.radians(lat); return (1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*n

def cdn(route):
    u=route.request.url
    m={'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js':V+'three/build/three.module.js',
       'https://cdn.jsdelivr.net/npm/earcut@2.2.4/dist/earcut.min.js':V+'earcut/dist/earcut.min.js',
       'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js':V+'maplibre-gl/dist/maplibre-gl.js',
       'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css':V+'maplibre-gl/dist/maplibre-gl.css'}
    if u in m: p=m[u]
    elif '/examples/jsm/' in u: p=V+'three/examples/jsm/'+u.split('/examples/jsm/')[1]
    else: return route.abort()
    route.fulfill(path=p, content_type='text/css' if p.endswith('.css') else 'application/javascript', headers={'Access-Control-Allow-Origin':'*'})

def dem(route):
    z,x,y=map(int,route.request.url.split('terrarium/')[1].replace('.png','').split('/'))
    im=Image.new('RGB',(256,256));px=im.load()
    for j in range(256):
        for i in range(256):
            gx=(x*256+i)/256/2**z*360-180; gy=y*256+j
            h=104+HILL*(math.sin(gx*400)*1.0+math.cos(gy/55)*.6); v=h+32768
            px[i,j]=(int(v//256),int(v%256),int((v%1)*256))
    b=io.BytesIO();im.save(b,'PNG')
    route.fulfill(body=b.getvalue(),content_type='image/png',headers={'Access-Control-Allow-Origin':'*'})

RIV0,RIV1=47.4995,47.5022
HILL=float(__import__('os').environ.get('HILL','4'))
def tile(route):
    z,x,y=map(int,route.request.url.split('/test/')[1].replace('.pbf','').split('/'))
    n=2**z
    w=x/n*360-180; e=(x+1)/n*360-180
    N=math.degrees(math.atan(math.sinh(math.pi*(1-2*y/n)))); S=math.degrees(math.atan(math.sinh(math.pi*(1-2*(y+1)/n))))
    P=lambda lat,lon:((lon2fx(lon,n)-x)*4096,(lat2fy(lat,n)-y)*4096)
    clipb=box(-64,-64,4160,4160)
    L={k:[] for k in ['transportation','transportation_name','building','water','landuse','park']}
    fid=[1]
    def add(layer,geom,props):
        g=geom.intersection(clipb)
        if g.is_empty: return
        fid[0]+=1
        L[layer].append({'geometry':g.wkt,'properties':props,'id':fid[0]})
    def line(pts): return LineString([P(a,b) for a,b in pts])
    def poly(pts): return Polygon([P(a,b) for a,b in pts])
    lo0=math.floor(w/0.0013)-1; lo1=math.ceil(e/0.0013)+1
    la0=math.floor(S/0.0009)-1; la1=math.ceil(N/0.0009)+1
    for k in range(lo0,lo1):
        lon=k*0.0013; major=k%3==0
        props={'class':'primary' if major else 'minor'}
        if not major and k%2==0: props['oneway']=1
        nm=f'Teszt utca {k%100}'
        if major:
            add('transportation',line([(S-.01,lon),(RIV0-.0005,lon)]),props)
            add('transportation',line([(RIV0-.0005,lon),(RIV1+.0005,lon)]),dict(props,brunnel='bridge',layer=1))
            add('transportation',line([(RIV1+.0005,lon),(N+.01,lon)]),props)
        else:
            add('transportation',line([(S-.01,lon),(RIV0-.0003,lon)]),props); add('transportation',line([(RIV1+.0003,lon),(N+.01,lon)]),props)
        if major and k%9==3:
            tl=lon+0.000012
            add('transportation',line([(S-.01,tl),(RIV0-.00045,tl)]),{'class':'rail','subclass':'tram'})
            add('transportation',line([(RIV0-.00045,tl),(RIV1+.0006,tl)]),{'class':'rail','subclass':'tram','brunnel':'bridge','layer':1})
            add('transportation',line([(RIV1+.0006,tl),(N+.01,tl)]),{'class':'rail','subclass':'tram'})
        if major: nm={0:'Széchenyi Lánchíd',3:'Teszt ívhíd',6:'Teszt ferdekábeles híd'}.get(k%9,nm)
        add('transportation_name',line([(S-.01,lon),(N+.01,lon)]),{'name':nm,'class':props['class']})
    for k in range(la0,la1):
        lat=k*0.0009
        if RIV0-.0004<lat<RIV1+.0004: continue
        cl='secondary' if k%4==0 else 'minor'
        add('transportation',line([(lat,w-.01),(lat,e+.01)]),{'class':cl})
        add('transportation_name',line([(lat,w-.01),(lat,e+.01)]),{'name':f'Kereszt utca {k%100}','class':cl})
        if k%4==0:
            add('transportation',line([(lat+0.000012,w-.01),(lat+0.000012,e+.01)]),{'class':'rail','subclass':'tram'})
    for ql in (RIV0-.00022,RIV1+.00022):
        add('transportation',line([(ql,w-.01),(ql,e+.01)]),{'class':'secondary'})
        add('transportation_name',line([(ql,w-.01),(ql,e+.01)]),{'name':'Teszt rakpart','class':'secondary'})
    add('water',poly([(RIV0,w-.01),(RIV1,w-.01),(RIV1,e+.01),(RIV0,e+.01)]),{'class':'river'})
    add('landuse',box(-64,-64,4160,4160),{'class':'residential'})
    for a in range(la0,la1):
        for b in range(lo0,lo1):
            la=a*0.0009+0.00012; lo=b*0.0013+0.00014
            if RIV0-0.0008<la<RIV1+0.0002: continue
            if (a,b)==(52782,14661): continue
            if (a*7+b)%5==0:
                add('park',poly([(la,lo),(la+0.0006,lo),(la+0.0006,lo+0.001),(la,lo+0.001)]),{'class':'park'}); continue
            for q in range(3):
                for r in range(2):
                    l1=la+r*0.00032; o1=lo+q*0.00034
                    house=(a+b+q)%4==0; sz=0.00013 if house else 0.00025
                    add('building',poly([(l1,o1),(l1+sz,o1),(l1+sz,o1+sz*1.3),(l1,o1+sz*1.3)]),{'render_height':5 if house else 12+((a+b+q)%3)*4,'render_min_height':0})
    data=mvt.encode([{'name':k,'features':v} for k,v in L.items() if v],default_options={'y_coord_down':True,'quantize_bounds':None})
    route.fulfill(body=data,content_type='application/x-protobuf',headers={'Access-Control-Allow-Origin':'*'})

def osrm(route):
    q=route.request.url.split('/driving/')[1].split('?')[0]
    (a,b),(c,d)=[tuple(map(float,p.split(','))) for p in q.split(';')]
    coords=[[a,b],[a,d],[c,d]]
    route.fulfill(body=json.dumps({'routes':[{'distance':1000,'geometry':{'type':'LineString','coordinates':coords},'legs':[{'steps':[{'maneuver':{'type':'depart','location':coords[0]},'name':'Teszt utca'},{'maneuver':{'type':'turn','modifier':'left','location':coords[1]},'name':'Kereszt utca 80'},{'maneuver':{'type':'arrive','location':coords[2]},'name':''}]}]}]}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})

def generic(route):
    u=route.request.url
    if u=='https://tiles.openfreemap.org/planet':
        return route.fulfill(body=json.dumps({'tiles':['https://tiles.openfreemap.org/planet/test/{z}/{x}/{y}.pbf']}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
    if '/planet/test/' in u: return tile(route)
    if '/styles/liberty' in u:
        return route.fulfill(body=json.dumps({'version':8,'sources':{},'layers':[{'id':'bg','type':'background','paint':{'background-color':'#e8e0d0'}}]}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
    route.abort()

def overpass(route):
    body=urllib.parse.unquote_plus(route.request.post_data or '')
    s_,w,n,e=map(float,body.split('[bbox:')[1].split(']')[0].split(','))
    els=[];nid=[5000000]
    def way(pts,tags,closed=False):
        nid[0]+=1;g=[{'lat':a,'lon':b} for a,b in pts];nodes=list(range(nid[0]*100,nid[0]*100+len(pts)))
        if closed:g.append(g[0]);nodes.append(nodes[0])
        els.append({'type':'way','id':nid[0],'geometry':g,'tags':tags})
    lo0=math.floor(w/0.0013)-1;lo1=math.ceil(e/0.0013)+1;la0=math.floor(s_/0.0009)-1;la1=math.ceil(n/0.0009)+1
    for k in range(lo0,lo1):
        lon=k*0.0013
        if k%3==0: way([(s_-.01,lon),(n+.01,lon)],dict({'highway':'primary','lanes':'4','maxspeed':'50','sidewalk':'both'},**({'bridge:structure':'arch'} if k%9==3 else {'bridge:structure':'cable-stayed'} if k%9==6 else {})))
        else: way([(s_-.01,lon),(n+.01,lon)],{'highway':'residential','lanes':'2','maxspeed':'30','sidewalk':'separate'})
        if k%3!=0:
            for off in (-0.00009,0.00009): way([(s_-.01,lon+off),(n+.01,lon+off)],{'highway':'footway','footway':'sidewalk'})
    for k in range(la0,la1):
        lat=k*0.0009
        way([(lat,w-.01),(lat,e+.01)],{'highway':'secondary' if k%4==0 else 'residential','maxspeed':'40'})
        for kk in range(lo0,lo1):
            if kk%3==0: els.append({'type':'node','id':9000000+k*1000+kk,'lat':lat,'lon':kk*0.0013,'tags':{'highway':'traffic_signals'}})
    # landmark buildings in block near origin (lat 47.5038.., lon 19.0594..)
    a=52782;b=14661;la=a*0.0009+0.00012;lo=b*0.0013+0.00014
    if s_<la<n and w<lo<e:
        way([(la,lo),(la+0.00025,lo),(la+0.00025,lo+0.0005),(la,lo+0.0005)],{'building':'church','name':'Teszt templom'},True)
        lo2=lo+0.00068
        way([(la,lo2),(la+0.00028,lo2),(la+0.00028,lo2+0.0004),(la,lo2+0.0004)],{'building':'yes','name':'Teszt Bazilika','tourism':'attraction','height':'34','roof:shape':'dome','roof:colour':'green','building:colour':'#e8dcc0'},True)
        la3=la+0.00034
        way([(la3,lo),(la3+0.0002,lo),(la3+0.0002,lo+0.0009),(la3,lo+0.0009)],{'building':'yes','name':'Teszt Palota','historic':'building'},True)
        way([(la3,lo),(la3+0.0002,lo),(la3+0.0002,lo+0.0006),(la3,lo+0.0006)],{'building:part':'yes','height':'18','building:colour':'#f2d16b'},True)
        way([(la3+0.00004,lo+0.00065),(la3+0.00016,lo+0.00065),(la3+0.00016,lo+0.00085),(la3+0.00004,lo+0.00085)],{'building:part':'yes','min_height':'0','height':'36','roof:shape':'onion','roof:colour':'#5fa58e'},True)
    def rect(A,B,u0,v0,du,dv,tags):
        la=A*0.0009+0.00012+u0;lo=B*0.0013+0.00014+v0
        if s_<la<n and w<lo<e: way([(la,lo),(la+du,lo),(la+du,lo+dv),(la,lo+dv)],tags,True)
    rect(52782,14662,0,0,.00035,.0009,{'building':'cathedral','name':'Teszt Katedrális'})
    rect(52783,14661,0,.0002,.0004,.0005,{'building':'mosque','name':'Teszt mecset'})
    rect(52781,14661,0,0,.0005,.0009,{'building':'train_station','name':'Teszt pályaudvar'})
    rect(52781,14662,0,0,.0006,.001,{'building':'government','name':'Teszt Parlament'})
    rect(52784,14661,0,.0001,.0004,.0006,{'building':'yes','amenity':'theatre','name':'Teszt Operaház'})
    rect(52784,14662,.0001,.0003,.00025,.00035,{'man_made':'tower','building':'tower','tower:construction':'lattice','height':'120','name':'Teszt torony'})
    rect(52782,14660,.0001,.0002,.0003,.0004,{'building':'office','height':'160','name':'Teszt torony irodaház'})
    rect(52783,14660,0,.0002,.0004,.0006,{'building':'synagogue','name':'Teszt zsinagóga'})
    rect(52783,14662,0,0,.0005,.0008,{'building':'castle','historic':'castle','name':'Teszt vár'})
    A,B=52784,14660;la=A*0.0009+0.00012;lo=B*0.0013+0.00014
    if s_<la<n and w<lo<e:
        P=[(la,lo),(la+.0005,lo),(la+.0005,lo+.0009),(la,lo+.0009)]
        els.append({'type':'relation','id':77,'tags':{'type':'multipolygon','building':'palace','name':'Teszt kastély'},'members':[
          {'type':'way','role':'outer','geometry':[{'lat':a,'lon':b} for a,b in P[:3]]},{'type':'way','role':'outer','geometry':[{'lat':a,'lon':b} for a,b in [P[2],P[3],P[0]]]}]})
    for t in range(40):
        els.append({'type':'node','id':8000000+t,'lat':s_+0.0004+(t%20)*0.0006,'lon':lo0*0.0013+0.0013*3+0.00008*(1 if t<20 else -1),'tags':{'natural':'tree'}})
    route.fulfill(body=json.dumps({'elements':els}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})

def nomi(route):
    route.fulfill(body=json.dumps({'address':{'city_district':'Terézváros','city':'Budapest'}}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})


MLY_LOG=[]
def mly_images(route):
    import urllib.parse as up
    q=dict(up.parse_qsl(up.urlparse(route.request.url).query));MLY_LOG.append('img '+q.get('bbox',''))
    if 'bbox' not in q: return route.fulfill(status=200,body='{"data":[]}',headers={'content-type':'application/json','access-control-allow-origin':'*'})
    w,s_,e,n=map(float,q['bbox'].split(','))
    data=[]
    # cameras along E-W streets (lat k*0.0009), heading east (90)
    for k in range(math.floor(s_/0.0009),math.ceil(n/0.0009)+1):
        lat=k*0.0009
        if not (s_<lat<n): continue
        lo=w+0.0003
        while lo<e:
            data.append({'id':str(len(data)+1),'thumb_256_url':'https://mock-mly.test/t.png','computed_geometry':{'type':'Point','coordinates':[lo,lat]},'compass_angle':90,'is_pano':False})
            lo+=0.0004
    route.fulfill(body=json.dumps({'data':data[:150]}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
def mly_thumb(route):
    from PIL import Image; import io
    im=Image.new('RGB',(256,144),(150,190,235))
    px=im.load()
    for y in range(144):
        for x in range(256):
            if y<36: continue
            if y>100: px[x,y]=(90,90,95); continue
            px[x,y]=(217,119,43) if x<128 else (90,79,168)
    b=io.BytesIO();im.save(b,'PNG')
    route.fulfill(body=b.getvalue(),content_type='image/png',headers={'Access-Control-Allow-Origin':'*'})
def mly_signs(route):
    z,x,y=map(int,route.request.url.split('/2/')[1].split('?')[0].split('/'))
    n=2**z
    P=lambda lat,lon:((lon2fx(lon,n)-x)*4096,(lat2fy(lat,n)-y)*4096)
    w=x/n*360-180; e=(x+1)/n*360-180
    N=math.degrees(math.atan(math.sinh(math.pi*(1-2*y/n)))); S=math.degrees(math.atan(math.sinh(math.pi*(1-2*(y+1)/n))))
    feats=[];vals=['regulatory--maximum-speed-limit-50--g1','regulatory--stop--g1','regulatory--yield--g1','information--pedestrians-crossing--g1','regulatory--maximum-speed-limit-30--g1','regulatory--no-entry--g1']
    i=0
    for k in range(math.floor(S/0.0009),math.ceil(N/0.0009)+1):
        lat=k*0.0009+0.00011
        lo=w+0.0002
        while lo<e:
            px,py=P(lat,lo)
            if 0<=px<4096 and 0<=py<4096: feats.append({'geometry':f'POINT({px} {py})','properties':{'value':vals[i%len(vals)],'id':i}});i+=1
            lo+=0.0006
    data=mvt.encode([{'name':'traffic_sign','features':feats}],default_options={'y_coord_down':True,'quantize_bounds':None})
    route.fulfill(body=data,content_type='application/x-protobuf',headers={'Access-Control-Allow-Origin':'*'})

def setup(p):
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=br.new_context(viewport={'width':1280,'height':720})
    ctx.route('https://cdn.jsdelivr.net/**',cdn);ctx.route('https://unpkg.com/**',cdn)
    ctx.route('https://s3.amazonaws.com/**',dem);ctx.route('https://tiles.openfreemap.org/**',generic)
    ctx.route('https://graph.mapillary.com/**',mly_images);ctx.route('https://mock-mly.test/**',mly_thumb);ctx.route('https://tiles.mapillary.com/**',mly_signs)
    ctx.route('https://router.project-osrm.org/**',osrm);ctx.route('**/api/interpreter',overpass);ctx.route('https://nominatim.openstreetmap.org/**',nomi)
    pg=ctx.new_page();logs=[]
    pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}'));pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.on('worker',lambda wk: wk.on('console',lambda m: logs.append('W '+m.text)))
    pg.goto('file://'+__import__('os').environ.get('VJ_FILE',__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','index.html')))
    return br,pg,logs

def car(pg): return pg.evaluate("()=>{const c=window.__vj.car;return {x:+c.x.toFixed(1),z:+c.z.toFixed(1),y:+c.y.toFixed(2),v:+c.vF.toFixed(1),g:c.ground,h:+c.h.toFixed(2),ai:window.__vj.traffic.length,tr:window.__vj.trams.length}}")

if __name__=='__main__':
    with sync_playwright() as p:
        br,pg,logs=setup(p)
        t0=time.time()
        for i in range(90):
            pg.wait_for_timeout(1000*1)
            if pg.evaluate("()=>window.__vj&&window.__vj.car.spawned"): break
        print('spawn after',round(time.time()-t0),'s', pg.evaluate("()=>[...window.__vj.chunks.values()].map(c=>c.state)"))
        pg.wait_for_timeout(1000*6)
        pg.screenshot(path='/home/claude/test/v2_0.png')
        pg.click('#go')
        pg.evaluate("()=>{window.__vj.inp.thr=1;window.__vj.sim(6)}"); print('after sim', car(pg))
        pg.wait_for_timeout(1000*3); pg.screenshot(path='/home/claude/test/v2_1.png')
        pg.evaluate("()=>{window.__vj.inp.thr=0;window.__vj.sim(8)}"); print('after sim2', car(pg))
        pg.wait_for_timeout(1000*3); pg.screenshot(path='/home/claude/test/v2_2.png')
        pg.keyboard.press('KeyC'); pg.wait_for_timeout(1000*3); pg.screenshot(path='/home/claude/test/v2_3far.png'); pg.keyboard.press('KeyC'); pg.keyboard.press('KeyC')
        pg.evaluate("()=>window.__vj.time(1)"); pg.wait_for_timeout(1000*3); pg.screenshot(path='/home/claude/test/v2_4sunset.png')
        pg.evaluate("()=>window.__vj.time(2)"); pg.wait_for_timeout(1000*3); pg.screenshot(path='/home/claude/test/v2_5night.png')
        pg.evaluate("()=>window.__vj.time(0)")
        pg.evaluate("()=>window.__vj.setRoute(47.5060,19.0650)"); pg.wait_for_timeout(1000*2)
        pg.evaluate("()=>window.__vj.sim(.1)"); pg.wait_for_timeout(1000*4); pg.screenshot(path='/home/claude/test/v2_6route.png')
        print('route', pg.evaluate("()=>window.__vj.route&&window.__vj.route.ll.length"), pg.evaluate("()=>document.getElementById('route').textContent"), pg.evaluate("()=>document.getElementById('where').textContent"))
        pg.keyboard.press('KeyM'); pg.wait_for_timeout(1000*6); pg.screenshot(path='/home/claude/test/v2_7map.png')
        pg.mouse.click(700,300); pg.wait_for_timeout(1000*2); pg.screenshot(path='/home/claude/test/v2_8pick.png')
        pg.keyboard.press('KeyM'); pg.wait_for_timeout(1000*1)
        print('final', car(pg))
        br.close()
    print('\n'.join([l for l in logs if 'GPU stall' not in l and 'GL Driver' not in l][:50]))
