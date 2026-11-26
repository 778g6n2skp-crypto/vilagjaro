from vreal import *
import sys,json,math
# usage: la0 lo0 la1 lo1
la0,lo0,la1,lo1=map(float,sys.argv[1:5])
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({(la0+la1)/2},{(lo0+lo1)/2})");wait_ready(pg,240);pg.wait_for_timeout(6000)
    r=pg.evaluate("""(q)=>{const v=window.__vj,c=v.car;let [x0,z0]=v.toXZ(q[0],q[1]);const [x1,z1]=v.toXZ(q[2],q[3]);let y0=400;if(q[4]){let bd=1e9;for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(!a[k+7]||a[k+9]>0)continue;const d=Math.hypot(a[k]-x0,a[k+1]-z0);if(d<bd){bd=d;x0=a[k];z0=a[k+1];y0=a[k+2]+1.5;}}}}const L=Math.hypot(x1-x0,z1-z0),ux=(x1-x0)/L,uz=(z1-z0)/L;
      Object.assign(c,{x:x0,z:z0,y:y0,vy:0,h:Math.atan2(ux,uz),vx:0,vz:0,vF:0,w:0,steer:0,ground:false});v.sim(4);const out=[];let landed=false,under=0,flip=0,air=0,minG=1e9,falls=0,prevY=c.y,maxJump=0;
      for(let t=0;t<90;t+=.1){const s=(c.x-x0)*ux+(c.z-z0)*uz;if(s>L-15)break;const lat=(c.x-x0)*(-uz)+(c.z-z0)*ux;let tgt=null,bs=1e9;const dW=Math.atan2(x1-c.x,z1-c.z);for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((c.x-a[k])*dx+(c.z-a[k+1])*dz)/l2)),px=a[k]+dx*t,pz=a[k+1]+dz*t,d=Math.hypot(c.x-px,c.z-pz);if(d>a[k+6]+2.5||Math.abs(a[k+2]-c.y)>3)continue;
          const l=Math.sqrt(l2);let ex=dx/l,ez=dz/l;if(ex*Math.sin(dW)+ez*Math.cos(dW)<0){ex=-ex;ez=-ez;}const al=Math.abs(Math.atan2(Math.sin(Math.atan2(ex,ez)-dW),Math.cos(Math.atan2(ex,ez)-dW)));const sc=al*20+d;if(sc<bs){bs=sc;tgt=[px+ex*10-ez*q[5]*Math.sin(t*.7),pz+ez*10+ex*q[5]*Math.sin(t*.7)];}}}
        const want=tgt?Math.atan2(tgt[0]-c.x,tgt[1]-c.z):dW;let he=Math.atan2(Math.sin(want-c.h),Math.cos(want-c.h));v.inp.steer=Math.max(-1,Math.min(1,he*2.2));v.inp.thr=c.vF<14?.8:0;v.inp.brk=0;v.sim(.1);if(c.ground)landed=true;{const th=v.terrainH(c.x,c.z);if(landed&&!isNaN(th)&&c.y<th-.6)under++;if(landed&&(Math.abs(c.roll||0)>.7||Math.abs(c.pitch||0)>.7))flip++;}if(landed&&!c.ground)air++;const dy=Math.abs(c.y-prevY);if(dy>maxJump&&landed&&t>6){maxJump=dy;globalThis.__jAt=[+c.x.toFixed(1),+c.z.toFixed(1),+prevY.toFixed(1),+c.y.toFixed(1),+t.toFixed(1)];}prevY=c.y;
        if(Math.round(t*10)%10===0)out.push([Math.round(s),Math.round(lat*10)/10,+c.y.toFixed(1),+c.vF.toFixed(1),c.ground?1:0,+(v.terrainH(c.x,c.z)).toFixed(1)]);}
      const cs=[];for(const ch of v.chunks.values()){if(ch.state!=='ready'||!ch.cseg)continue;const a=ch.cseg;for(let i=0;i<a.length;i+=6){const dx=a[i+2]-a[i],dz=a[i+3]-a[i+1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((c.x-a[i])*dx+(c.z-a[i+1])*dz)/l2)),d=Math.hypot(c.x-a[i]-dx*t,c.z-a[i+1]-dz*t);
        if(d<4)cs.push([+d.toFixed(2),+a[i+4].toFixed(1),+a[i+5].toFixed(1),+Math.hypot(dx,dz).toFixed(1),Math.round(Math.atan2(dx,dz)*57)]);}}
      const roadNear=[];for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((c.x-a[k])*dx+(c.z-a[k+1])*dz)/l2)),d=Math.hypot(c.x-a[k]-dx*t,c.z-a[k+1]-dz*t);if(d<a[k+6]+3)roadNear.push([+d.toFixed(1),+a[k+6].toFixed(1),+(a[k+2]+(a[k+5]-a[k+2])*t).toFixed(1),a[k+7],Math.round(Math.atan2(dx,dz)*57)]);}}
      v.inp.thr=0;v.inp.steer=0;return {cs,roadNear,carH:Math.round(c.h*57),carY:+c.y.toFixed(1),L:Math.round(L),air,maxJump:+maxJump.toFixed(2),under,flip,jAt:globalThis.__jAt,trace:out}}""",[la0,lo0,la1,lo1,int(__import__('os').environ.get('BR','0')),float(__import__('os').environ.get('SWEEP','0'))])
    print('hossz',r['L'],'alatt',r['under'],'borul',r['flip'],'levegőben (tized mp)',r['air'],'legnagyobb ugrás 0,1 s alatt',r['maxJump'],r.get('jAt'))
    print('falak',r['cs']);print('utak',r['roadNear']);print('autó irány',r['carH'],'y',r['carY'])
    for t in r["trace"]: print(t)
    br.close()
