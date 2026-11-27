from vreal import *
import sys,json,time
name,la,lo=sys.argv[1],float(sys.argv[2]),float(sys.argv[3])
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1,mlyOn:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    t0=time.time();pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,300);tl=time.time()-t0;pg.wait_for_timeout(5000)
    r=pg.evaluate("""()=>{const v=window.__vj,c=v.car;let n=0,b5=0,b15=0,mx=0,ex=[],nul=0;
      for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;if(Math.hypot(a[k]-c.x,a[k+1]-c.z)>350)continue;
        const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],L=Math.hypot(dx,dz);if(L<2)continue;const ys=[];for(let s=0;s<=L;s+=.5){const t=s/L,x=a[k]+dx*t,z=a[k+1]+dz*t,y0=a[k+2]+(a[k+5]-a[k+2])*t;let y=v.surfaceAt(x,z,(ys.length?ys[ys.length-1]:y0));if(y==null||!isFinite(y)){nul++;y=y0;}ys.push(y);}
        for(let i=1;i<ys.length-1;i++){const d2=Math.abs(ys[i+1]-2*ys[i]+ys[i-1]);n++;if(d2>.05){b5++;if(ex.length<5)ex.push([Math.round(a[k]-c.x),Math.round(a[k+1]-c.z),+d2.toFixed(2)]);}if(d2>.15)b15++;if(d2>mx)mx=d2;}}}
      const m=new (v.camera.matrix.constructor)();let on=0,up=0,dn=0,ue=[],de=[];
      for(const ch of v.chunks.values()){if(ch.state!=='ready'||!ch.grp)continue;ch.grp.updateMatrixWorld(true);ch.grp.traverse(o=>{if(!o.isInstancedMesh)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const wx=m.elements[12]+o.matrixWorld.elements[12],wy=m.elements[13]+o.matrixWorld.elements[13],wz=m.elements[14]+o.matrixWorld.elements[14];if(Math.hypot(wx-c.x,wz-c.z)>350)continue;const g=v.meshSurf(wx,wz,wy+1.5,true);if(g==null)continue;on++;const d=wy-g;if(d>.3){up++;if(ue.length<3)ue.push([Math.round(wx-c.x),Math.round(wz-c.z),+d.toFixed(1)]);}if(d<-.4){dn++;if(de.length<3)de.push([Math.round(wx-c.x),Math.round(wz-c.z),+d.toFixed(1)]);}}});}
      let rk=0;for(const ch of v.chunks.values())if(ch.state==='ready')rk++;
      return {km:+(n*.5/1000).toFixed(1),lepcso5_km:+(b5/(n*.5/1000||1)).toFixed(1),lepcso15_km:+(b15/(n*.5/1000||1)).toFixed(1),max:+mx.toFixed(2),lyuk:nul,ex,targy:on,lebeg:up,sullyed:dn,ue,de,chunks:rk}}""")
    r['name']=name;r['betoltes_s']=round(tl,1);r['hibak']=[l for l in logs if 'rror' in l][:3]
    print('RES '+json.dumps(r,ensure_ascii=False))
    br.close()
