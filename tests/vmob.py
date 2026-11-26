from vreal import *
import json
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    print('ready',wait_ready(pg,180))
    pg.screenshot(path='mob_start.png')
    print('touch?',pg.evaluate("()=>document.body.classList.contains('touch')"),'q',pg.evaluate("()=>JSON.parse(localStorage.getItem('vj_cfg')||'{}').quality"))
    pg.tap('#go');pg.wait_for_timeout(1500)
    v0=pg.evaluate("()=>window.__vj.car.vF")
    # hold gas
    pg.dispatch_event('#tGas','pointerdown',{'pointerId':5,'isPrimary':True,'pointerType':'touch'})
    pg.wait_for_timeout(6000)
    v1=pg.evaluate("()=>[window.__vj.car.vF,window.__vj.inp.thr]")
    # steer: pad drag to the right
    box=pg.locator('#steerPad').bounding_box()
    pg.dispatch_event('#steerPad','pointerdown',{'pointerId':7,'clientX':box['x']+box['width']*.5,'clientY':box['y']+40,'pointerType':'touch'})
    pg.dispatch_event('#steerPad','pointermove',{'pointerId':7,'clientX':box['x']+box['width']*.9,'clientY':box['y']+40,'pointerType':'touch'})
    pg.evaluate("()=>window.__vj.sim(.5)")
    st=pg.evaluate("()=>window.__vj.inp.steer")
    pg.wait_for_timeout(2500);pg.screenshot(path='mob_drive.png')
    pg.dispatch_event('#steerPad','pointerup',{'pointerId':7,'pointerType':'touch'});pg.dispatch_event('#tGas','pointerup',{'pointerId':5,'pointerType':'touch'})
    pg.tap('#tbSet');pg.wait_for_timeout(800);pg.screenshot(path='mob_set.png')
    print('speed before/after gas',round(v0,1),v1,'steer',round(st,2),'settings open',pg.evaluate("()=>!document.getElementById('settings').classList.contains('hide')"))
    print([l for l in logs if 'rror' in l][:5])
    br.close()
