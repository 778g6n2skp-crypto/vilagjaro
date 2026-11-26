from vreal import *
import sys,json
la,lo=float(sys.argv[1]),float(sys.argv[2]);R=float(sys.argv[3]) if len(sys.argv)>3 else 500
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false,autoTime:false,v6:1}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,240);pg.wait_for_timeout(9000)
    r=pg.evaluate("""(q)=>{const v=window.__vj,[cx,cz]=v.toXZ(q[0],q[1]),R=q[2],S=[];
      for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;if(Math.hypot(a[k]-cx,a[k+1]-cz)>R)continue;S.push([a[k],a[k+1],a[k+2],a[k+3],a[k+4],a[k+5],a[k+7],a[k+6]]);}}
      const nodes=new Map();for(const s of S)for(const e of [[s[0],s[1],s[2]],[s[3],s[4],s[5]]]){const k=Math.round(e[0]*2)+','+Math.round(e[1]*2);let l=nodes.get(k);if(!l)nodes.set(k,l=[]);l.push(e[2]);}
      let nm=0,worstN=[];for(const [k,l] of nodes){const d=Math.max(...l)-Math.min(...l);if(d>.5){nm++;worstN.push([+d.toFixed(1),k]);}}worstN.sort((a,b)=>b[0]-a[0]);
      const G=new Map();S.forEach((s,i)=>{const k=Math.floor(Math.min(s[0],s[3])/20)+','+Math.floor(Math.min(s[1],s[4])/20);let l=G.get(k);if(!l)G.set(k,l=[]);l.push(i);});
      let bad=0,ok=0,wc=[];for(let i=0;i<S.length;i++){const a=S[i];const gx=Math.floor(Math.min(a[0],a[3])/20),gz=Math.floor(Math.min(a[1],a[4])/20);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const l=G.get((gx+dx)+','+(gz+dz));if(!l)continue;for(const j of l){if(j<=i)continue;const b=S[j];
        const r1x=a[3]-a[0],r1z=a[4]-a[1],r2x=b[3]-b[0],r2z=b[4]-b[1],den=r1x*r2z-r1z*r2x;if(Math.abs(den)<1e-6)continue;const t=((b[0]-a[0])*r2z-(b[1]-a[1])*r2x)/den,u=((b[0]-a[0])*r1z-(b[1]-a[1])*r1x)/den;if(t<=.02||t>=.98||u<=.02||u>=.98)continue;
        const ya=a[2]+(a[5]-a[2])*t,yb=b[2]+(b[5]-b[2])*u,dy=Math.abs(ya-yb);if(dy>.35&&dy<4.5){bad++;if(wc.length<8)wc.push([+dy.toFixed(1),Math.round(a[0]+r1x*t-cx),Math.round(a[1]+r1z*t-cz),a[6],b[6]]);}else ok++;}}}
      return {segs:S.length,nodes:nodes.size,nodeMismatch:nm,worstN:worstN.slice(0,6),crossBad:bad,crossOk:ok,wc}}""",[la,lo,R])
    print(json.dumps(r))
    br.close()
