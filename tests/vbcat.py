from vreal import *
import sys,json
la,lo=float(sys.argv[1]),float(sys.argv[2])
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1,mlyOn:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,300);pg.wait_for_timeout(5000)
    r=pg.evaluate("""()=>{const v=window.__vj,c=v.car;const cat={},ex={};
      const who=(x,z,y)=>{const S=v.surfDbg(x,z);let best=null,bd=1e9;for(const q of S){const d=Math.abs(q[0]-y);if(d<bd){bd=d;best=q;}}return best?best[1]+'@'+best[2]:'none';};
      for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;if(Math.hypot(a[k]-c.x,a[k+1]-c.z)>350)continue;
        const dx=a[k+3]-a[k],dz=a[k+4]-a[k+1],L=Math.hypot(dx,dz);if(L<2)continue;const ys=[],ws=[];for(let s=0;s<=L;s+=.5){const t=s/L,x=a[k]+dx*t,z=a[k+1]+dz*t,y0=a[k+2]+(a[k+5]-a[k+2])*t;let y=v.surfaceAt(x,z,(ys.length?ys[ys.length-1]:y0));if(y==null||!isFinite(y))y=y0;ys.push(y);ws.push([x,z]);}
        for(let i=1;i<ys.length-1;i++){const d2=Math.abs(ys[i+1]-2*ys[i]+ys[i-1]);if(d2<=.05)continue;const w0=who(ws[i-1][0],ws[i-1][1],ys[i-1]),w1=who(ws[i][0],ws[i][1],ys[i]),w2=who(ws[i+1][0],ws[i+1][1],ys[i+1]);
          const s0=w0.split('@'),s1=w1.split('@'),s2=w2.split('@');let key;if(s0[1]!==s1[1]||s1[1]!==s2[1])key='csempevaltas';else if(s0[0]!==s1[0]||s1[0]!==s2[0])key='retegvaltas:'+[s0[0],s1[0],s2[0]].join('>');else key='azonos:'+s1[0];
          cat[key]=(cat[key]||0)+1;if(!ex[key]||ex[key].length<3)(ex[key]=ex[key]||[]).push([Math.round(ws[i][0]-c.x),Math.round(ws[i][1]-c.z),+d2.toFixed(2),a[k+7],a[k+9]]);}}}
      return {cat,ex};}""")
    print(json.dumps(r))
    br.close()
