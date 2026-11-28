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
        for(let i=1;i<ys.length-1;i++){const d2=Math.abs(ys[i+1]-2*ys[i]+ys[i-1]);n++;if(d2>.05){b5++;if(ex.length<5)ex.push([Math.round(a[k]-c.x),Math.round(a[k+1]-c.z),+d2.toFixed(2)]);}if(d2>.15)b15++;if(d2>mx){mx=d2;window.__MX=[Math.round(a[k]-c.x),Math.round(a[k+1]-c.z),k];}}}}
      const m=new (v.camera.matrix.constructor)();let on=0,up=0,dn=0,ue=[],de=[];
      for(const ch of v.chunks.values()){if(ch.state!=='ready'||!ch.grp)continue;ch.grp.updateMatrixWorld(true);ch.grp.traverse(o=>{if(!o.isInstancedMesh)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const wx=m.elements[12]+o.matrixWorld.elements[12],wy=m.elements[13]+o.matrixWorld.elements[13],wz=m.elements[14]+o.matrixWorld.elements[14];if(Math.hypot(wx-c.x,wz-c.z)>350)continue;const g=v.meshSurf(wx,wz,wy+1.5,true);if(g==null)continue;on++;const d=wy-g;if(d>.3){up++;if(ue.length<3)ue.push([Math.round(wx-c.x),Math.round(wz-c.z),+d.toFixed(1)]);}if(d<-.4){dn++;if(de.length<3)de.push([Math.round(wx-c.x),Math.round(wz-c.z),+d.toFixed(1)]);}}});}
      let en=0,pl=0,dr=0,pe=[];for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+7]||a[k+9]>1)continue;if(Math.hypot(a[k]-c.x,a[k+1]-c.z)>350)continue;const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],L=Math.hypot(dx,dz);if(L<1)continue;const nx=-dz/L,nz=dx/L,hw=a[k+6];
        for(let s=0;s<L;s+=2){const t=s/L,x=a[k]+dx*t,z=a[k+1]+dz*t,y=a[k+2]+(a[k+5]-a[k+2])*t;for(const sd of [-1,1])for(const o of [hw+.8,hw+4]){const px=x+nx*sd*o,pz=z+nz*sd*o,g=v.meshSurf(px,pz,y+5,true);if(g==null)continue;en++;const d=g-y;if(d>.6){pl++;if(pe.length<4)pe.push([Math.round(px-c.x),Math.round(pz-c.z),+d.toFixed(1)]);}if(d<-1)dr++;}}}}
      const t2ll=(x,y)=>[x/16384*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y/16384)))*180/Math.PI];
      const segs=[];const bounds=[];for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const [kx,ky]=String(ch.key).split(',').map(Number);const [lo0,la0]=t2ll(kx,ky),[lo1,la1]=t2ll(kx+1,ky+1);const [x0,z0]=v.toXZ(la0,lo0),[x1,z1]=v.toXZ(la1,lo1);bounds.push([Math.min(x0,x1),Math.min(z0,z1),Math.max(x0,x1),Math.max(z0,z1)]);
        const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;segs.push([a[k],a[k+1],a[k+2],a[k+3],a[k+4],a[k+5],a[k+9],a[k+7],ch.key,'r']);}const t=ch.tseg;if(t)for(let k=0;k<t.length;k+=6)segs.push([t[k],t[k+1],t[k+2],t[k+3],t[k+4],t[k+5],9,0,ch.key,'t']);}
      const nearB=(x,z)=>{for(const b of bounds){const dx=Math.min(Math.abs(x-b[0]),Math.abs(x-b[2])),dz=Math.min(Math.abs(z-b[1]),Math.abs(z-b[3]));if((dx<14&&z>b[1]-14&&z<b[3]+14)||(dz<14&&x>b[0]-14&&x<b[2]+14))return true;}return false;};
      const G2=new Map(),gk2=(x,z)=>Math.floor(x/4)*100003+Math.floor(z/4);const ends=[];segs.forEach((s,i)=>{for(const e of [0,1]){const x=s[e*3],z=s[e*3+1],y=s[e*3+2];if(Math.hypot(x-c.x,z-c.z)>330)continue;const o={x,z,y,i,e,s};ends.push(o);const k=gk2(x,z);let l=G2.get(k);if(!l)G2.set(k,l=[]);l.push(o);}});
      let sharp=0,dang=0,jm=0,jn=0,te=0,ten=0,sharpE=[],dangE=[],jmE=[];const segLen=s=>Math.hypot(s[3]-s[0],s[4]-s[1]);let kmR=0;segs.forEach(s=>{if(s[9]==='r'&&Math.hypot(s[0]-c.x,s[1]-c.z)<330)kmR+=segLen(s);});
      for(const o of ends){const l=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const q=G2.get((Math.floor(o.x/4)+a)*100003+Math.floor(o.z/4)+b);if(q)for(const p of q)if(p!==o)l.push(p);}
        const co=l.filter(p=>Math.hypot(p.x-o.x,p.z-o.z)<.3),same=co.filter(p=>p.s[8]===o.s[8]);
        if(same.length===1&&co.length===1){const p=same[0];if(p.s[9]==='r'&&o.s[9]==='r'&&o.e===1&&p.e===0&&!o.s[7]){const ux=o.s[3]-o.s[0],uz=o.s[4]-o.s[1],vx=p.s[3]-p.s[0],vz=p.s[4]-p.s[1];const an=Math.acos(Math.max(-1,Math.min(1,(ux*vx+uz*vz)/(Math.hypot(ux,uz)*Math.hypot(vx,vz)||1))))*180/Math.PI;if(an>25){sharp++;if(sharpE.length<4)sharpE.push([Math.round(o.x-c.x),Math.round(o.z-c.z),Math.round(an)]);}}}
        if(co.length===0&&!nearB(o.x,o.z)){const nb=l.filter(p=>Math.hypot(p.x-o.x,p.z-o.z)<4&&p.s[9]===o.s[9]);if(nb.length){dang++;if(dangE.length<4)dangE.push([Math.round(o.x-c.x),Math.round(o.z-c.z),o.s[9]]);}}
        if(co.length>=2&&o.s[9]==='r'){let mx=0;for(const p of co)if(p.s[9]==='r'&&!p.s[7]&&!o.s[7])mx=Math.max(mx,Math.abs(p.y-o.y));jn++;if(mx>.15){jm++;if(jmE.length<4)jmE.push([Math.round(o.x-c.x),Math.round(o.z-c.z),+mx.toFixed(2)]);}}}
      // csempehatár: az egyik csempe útvége a másik csempe ugyanazon útján eltérő magasságban
      const allE=[];segs.forEach(s=>{for(const e of [0,1])allE.push({x:s[e*3],z:s[e*3+1],y:s[e*3+2],s});});for(const o of allE){if(o.s[9]!=='r'||o.s[7]||!nearB(o.x,o.z))continue;for(const p of segs){if(p[8]===o.s[8]||p[9]!=='r'||p[7])continue;const dx=p[3]-p[0],dz=p[4]-p[1],l2=dx*dx+dz*dz||1,t=((o.x-p[0])*dx+(o.z-p[1])*dz)/l2;if(t<0||t>1)continue;if(Math.hypot(o.x-p[0]-dx*t,o.z-p[1]-dz*t)>.6)continue;ten++;if(Math.abs(p[2]+(p[5]-p[2])*t-o.y)>.1)te++;break;}}
      let hn=0,hh=0,hE=[];for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+7]||a[k+9]>1)continue;if(Math.hypot(a[k]-c.x,a[k+1]-c.z)>330)continue;const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],L=Math.hypot(dx,dz);for(let s=0;s<L;s+=1){const t=s/L,x=a[k]+dx*t,z=a[k+1]+dz*t,y=a[k+2]+(a[k+5]-a[k+2])*t;const S=v.surfDbg(x,z);hn++;if(!S.some(q=>q[1]>=1&&q[1]!==4&&Math.abs(q[0]-y)<.35)){hh++;if(hE.length<5)hE.push([Math.round(x-c.x),Math.round(z-c.z)]);}}}}
      let rk=0;for(const ch of v.chunks.values())if(ch.state==='ready')rk++;
      return {km:+(n*.5/1000).toFixed(1),lepcso5_km:+(b5/(n*.5/1000||1)).toFixed(1),lepcso15_km:+(b15/(n*.5/1000||1)).toFixed(1),max:+mx.toFixed(2),lyuk:nul,ex,targy:on,lebeg:up,sullyed:dn,ue,de,chunks:rk,szel_n:en,plato_pct:+(100*pl/(en||1)).toFixed(1),szakadek_pct:+(100*dr/(en||1)).toFixed(1),pe,szog_km:+(sharp/(kmR/1000||1)).toFixed(1),szakadas:dang,csp_elteres_pct:+(100*jm/(jn||1)).toFixed(1),hatar_lepcso_pct:+(100*te/(ten||1)).toFixed(1),jn,ten,uthiany_pct:+(100*hh/(hn||1)).toFixed(2),hE,sharpE,dangE,jmE}}""")
    try:
        from PIL import Image
        pg.screenshot(path=f'/tmp/vw_{name}.png');im=Image.open(f'/tmp/vw_{name}.png').convert('RGB');W,Hh=im.size;n=0;w=0
        for y in range(int(Hh*.6),Hh,6):
            for x in range(0,W,6):
                rr,gg,bb=im.getpixel((x,y));n+=1
                if rr>200 and gg>215 and bb>225 and bb-rr<40: w+=1
        r['feher_pct']=round(100*w/n,1)
    except Exception as e: r['feher_pct']=str(e)[:40]
    r["name"]=name;r["maxE"]=pg.evaluate("()=>window.__MX");r['betoltes_s']=round(tl,1);r['hibak']=[l for l in logs if 'rror' in l][:3]
    print('RES '+json.dumps(r,ensure_ascii=False))
    br.close()
