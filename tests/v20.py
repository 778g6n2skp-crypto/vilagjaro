from v2 import *
with sync_playwright() as p:
    br,pg,logs=setup(p)
    for i in range(90):
        pg.wait_for_timeout(1000)
        if pg.evaluate("()=>window.__vj&&window.__vj.car.spawned"): break
    pg.click('#go'); pg.wait_for_timeout(500)
    print(pg.evaluate("""()=>{const v=window.__vj,c=v.car;v.setCar(1);window.__lab=true;Object.assign(c,{x:0,z:0,y:0,vy:0,h:0,vx:0,vz:0,vF:0,w:0,ax:0,steer:0,ground:true,onRoad:true,slope:0,wet:0});v.GB.g=1;
     const I=v.inp,dt=1/120,out=[];I.thr=0;I.brk=1;I.steer=0;let t=0;for(;t<3;t+=dt)v.physics(dt);out.push(['reverse 3s',+c.vF.toFixed(2),v.GB.g]);
     I.steer=1;let h0=c.h;for(t=0;t<2;t+=dt)v.physics(dt);out.push(['reverse+left 2s v',+c.vF.toFixed(2),'dh',+(c.h-h0).toFixed(2)]);
     I.steer=0;I.brk=0;I.thr=1;for(t=0;t<1.5;t+=dt)v.physics(dt);out.push(['gas while reversing 1.5s',+c.vF.toFixed(2),v.GB.g]);
     for(t=0;t<2;t+=dt)v.physics(dt);out.push(['then forward',+c.vF.toFixed(2),v.GB.g]);window.__lab=false;I.thr=0;return out}"""))
    br.close()
