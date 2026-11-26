from v2 import *
import json
with sync_playwright() as p:
    br,pg,logs=setup(p)
    for i in range(90):
        pg.wait_for_timeout(1000)
        if pg.evaluate("()=>window.__vj&&window.__vj.car.spawned"): break
    pg.wait_for_timeout(9000)
    res=pg.evaluate("""()=>{const v=window.__vj,out={};const xz=(la,lo)=>v.toXZ(la,lo);
      for(const k of [14661,14664,14667]){const lon=k*0.0013,xr=xz(47.5,lon)[0];const segs=[];
        for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let i=0;i<a.length;i+=14){if(Math.abs(a[i]-xr)<1.2&&Math.abs(a[i+3]-xr)<1.2&&a[i+9]===0)segs.push([a[i+1],a[i+2],a[i+4],a[i+5],a[i+7]]);}}
        const z0=xz(47.4995-.003,lon)[1],z1=xz(47.5022+.003,lon)[1];const pts=[];for(const s of segs){if(Math.min(s[0],s[2])<Math.min(z0,z1)||Math.max(s[0],s[2])>Math.max(z0,z1))continue;pts.push([s[0],s[1],s[4]],[s[2],s[3],s[4]]);}
        pts.sort((a,b)=>a[0]-b[0]);let jump=0,grade=0,maxY=-1e9,minY=1e9;for(let i=1;i<pts.length;i++){const dz=pts[i][0]-pts[i-1][0],dy=Math.abs(pts[i][1]-pts[i-1][1]);if(dz<.05){jump=Math.max(jump,dy);continue;}grade=Math.max(grade,dy/dz);}
        for(const q of pts){maxY=Math.max(maxY,q[1]);minY=Math.min(minY,q[1]);}
        // rakpart alatt
        const clr=[];for(const ql of [47.4995-.00022,47.5022+.00022]){const zq=xz(ql,lon)[1];let qy=null,dy=null;for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let i=0;i<a.length;i+=14){
          if(Math.abs(a[i+1]-zq)<1.5&&Math.abs(a[i+4]-zq)<1.5&&Math.min(a[i],a[i+3])<=xr&&Math.max(a[i],a[i+3])>=xr&&a[i+7]===0)qy=a[i+2];if(Math.abs(a[i]-xr)<1.2&&Math.min(a[i+1],a[i+4])<=zq&&Math.max(a[i+1],a[i+4])>=zq&&a[i+9]===0){const t=(zq-a[i+1])/((a[i+4]-a[i+1])||1);dy=a[i+2]+(a[i+5]-a[i+2])*t;}}}
          clr.push(qy!=null&&dy!=null?+(dy-qy).toFixed(2):null);}
        out[k]={n:pts.length,maxJump:+jump.toFixed(2),maxGrade:+(grade*100).toFixed(1),rise:+(maxY-minY).toFixed(1),quayClear:clr};}
      // villamos a hídon vs út
      const k=14664,lon=k*0.0013,xr=xz(47.5,lon)[0];let dmax=0,n=0;
      for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const t=ch.tseg;for(let i=0;i<t.length;i+=6){if(Math.abs(t[i]-xr)>3)continue;const z=t[i+1];
        const a=ch.rseg;for(let j=0;j<a.length;j+=14){if(Math.abs(a[j]-xr)<1.2&&Math.min(a[j+1],a[j+4])<=z&&Math.max(a[j+1],a[j+4])>=z&&a[j+9]===0){const tt=(z-a[j+1])/((a[j+4]-a[j+1])||1),ry=a[j+2]+(a[j+5]-a[j+2])*tt;if(Math.abs(t[i+2]-ry)>.5)(out.tl=out.tl||[]).length<6&&out.tl.push([+z.toFixed(0),+t[i+2].toFixed(1),+ry.toFixed(1)]);dmax=Math.max(dmax,Math.abs(t[i+2]-ry));n++;}}}}
      let tn=0,tx=[];for(const ch of v.chunks.values()){if(ch.tseg)for(let i=0;i<ch.tseg.length;i+=6)if(Math.abs(ch.tseg[i]-xr)<6){tn++;}}let jmax=0,jn=0;{const k2=14664,xr2=xz(47.5,k2*0.0013)[0];for(let la=Math.floor((47.4995-.004)/0.0009);la<=Math.ceil((47.5022+.004)/0.0009);la++){const zq=xz(la*0.0009,k2*0.0013)[1];let hs=[];
       for(const ch of v.chunks.values()){if(ch.state!=='ready')continue;const a=ch.rseg;for(let i=0;i<a.length;i+=14){if(a[i+9]>1)continue;const minx=Math.min(a[i],a[i+3]),maxx=Math.max(a[i],a[i+3]),minz=Math.min(a[i+1],a[i+4]),maxz=Math.max(a[i+1],a[i+4]);
        if(minx-.5<=xr2&&maxx+.5>=xr2&&minz-.5<=zq&&maxz+.5>=zq){const L=Math.hypot(a[i+3]-a[i],a[i+4]-a[i+1])||1,t=Math.max(0,Math.min(1,((xr2-a[i])*(a[i+3]-a[i])+(zq-a[i+1])*(a[i+4]-a[i+1]))/(L*L)));hs.push(a[i+2]+(a[i+5]-a[i+2])*t);}}}
       if(hs.length>1){jn++;jmax=Math.max(jmax,Math.max(...hs)-Math.min(...hs));(out.jl=out.jl||[]).push([la,+zq.toFixed(0),hs.map(h=>+h.toFixed(1)).join('/')]);}}}out.junctions={n:jn,maxDiff:+jmax.toFixed(2)};
      out.tram={samples:n,maxDiff:+dmax.toFixed(2),tsegNear:tn,xr};return out;}""")
    print(json.dumps(res))
    br.close()
    print([l for l in logs if 'PAGEERROR' in l or 'rror' in l][:5])
