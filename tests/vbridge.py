from vreal import *
import sys,json
BR=[('Megyeri',47.6108,19.0890),('Árpád',47.5360,19.0560),('Margit',47.5148,19.0470),('Lánchíd',47.4991,19.0436),('Erzsébet',47.4914,19.0500),('Szabadság',47.4862,19.0560),('Petőfi',47.4770,19.0650),('Rákóczi',47.4640,19.0720)]
sel=sys.argv[1:] or [b[0] for b in BR]
JS="""(c)=>{const v=window.__vj;const [cx,cz]=v.toXZ(c[0],c[1]);const nodes=new Map();
 for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;for(const e of [0,3]){const x=a[k+e],z=a[k+e+1],y=a[k+e+2];if(Math.hypot(x-cx,z-cz)>700)continue;
   const key=Math.round(x*2)+','+Math.round(z*2);let n=nodes.get(key);if(!n)nodes.set(key,n={x,z,ys:[],br:0});n.ys.push(y);if(a[k+7])n.br++;}}}
 const bad=[];for(const n of nodes.values()){if(n.ys.length<2)continue;const sp=Math.max(...n.ys)-Math.min(...n.ys);if(sp>.3)bad.push([+sp.toFixed(2),Math.round(n.x-cx),Math.round(n.z-cz),n.br,n.ys.length]);}
 // T-csomópont: útvég közel (<6 m) másik út pontjához
 const ends=[],pts=[];for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14){if(a[k+9]>1)continue;if(Math.hypot(a[k]-cx,a[k+1]-cz)>700)continue;pts.push([a[k],a[k+1],a[k+2],a[k+3],a[k+4],a[k+5]]);}}
 const deg=new Map();for(const s of pts)for(const e of [[s[0],s[1],s[2]],[s[3],s[4],s[5]]]){const key=Math.round(e[0]*2)+','+Math.round(e[1]*2);deg.set(key,(deg.get(key)||0)+1);}
 let tj=0,tjw=[];for(const s of pts)for(const e of [[s[0],s[1],s[2]],[s[3],s[4],s[5]]]){if(deg.get(Math.round(e[0]*2)+','+Math.round(e[1]*2))!==1)continue;let bd=6,by=null;for(const o of pts){if(o===s)continue;const dx=o[3]-o[0],dz=o[4]-o[1],l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((e[0]-o[0])*dx+(e[1]-o[1])*dz)/l2)),d=Math.hypot(e[0]-o[0]-dx*t,e[1]-o[1]-dz*t);if(d<bd){bd=d;by=o[2]+(o[5]-o[2])*t;}}
   if(by!=null&&Math.abs(by-e[2])>Math.max(.5,bd*.3)){tj++;if(tjw.length<5)tjw.push([+(by-e[2]).toFixed(1),Math.round(e[0]-cx),Math.round(e[1]-cz)]);}}
 bad.sort((p,q)=>q[0]-p[0]);
 let bs=0,bmax=-1e9,bmin=1e9;for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let k=0;k<a.length;k+=14)if(a[k+7]&&Math.hypot(a[k]-cx,a[k+1]-cz)<400){bs++;bmax=Math.max(bmax,a[k+2]);bmin=Math.min(bmin,a[k+2]);}}
 return {tjunc:tj,tjw,nodes:nodes.size,mismatch:bad.length,worst:bad.slice(0,8),bridgeSegs:bs,deck:[+bmin.toFixed(1),+bmax.toFixed(1)]};}"""
with sync_playwright() as p:
    br,pg,logs=setup_real(p)
    pg.wait_for_timeout(1500);pg.evaluate("()=>localStorage.setItem('vj_cfg',JSON.stringify({traffic:0,trams:false,quality:2,qSet:true,photo:false}))");pg.reload()
    wait_ready(pg,120);pg.click('#go');pg.wait_for_timeout(500)
    for nm,la,lo in BR:
        if nm not in sel: continue
        pg.evaluate(f"()=>window.__vj.jump({la},{lo})");wait_ready(pg,240);pg.wait_for_timeout(8000)
        r=pg.evaluate(JS,[la,lo]);print(nm,json.dumps(r,ensure_ascii=False))
    br.close()
    print([l for l in logs if 'PAGEERROR' in l][:4])
