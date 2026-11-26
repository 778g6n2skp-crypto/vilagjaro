/* ---------- színek ---------- */
const hx=s=>[(parseInt(s.slice(1,3),16)/255)**2.2,(parseInt(s.slice(3,5),16)/255)**2.2,(parseInt(s.slice(5,7),16)/255)**2.2];
const C={grass:hx('#6f8f48'),res:hx('#8f8b84'),com:hx('#8e8b87'),ind:hx('#85827c'),park:hx('#5f8b3c'),wood:hx('#41683a'),farm:hx('#a99a62'),
 sand:hx('#d2c39a'),wet:hx('#5f7f62'),rock:hx('#8f8a80'),ice:hx('#e6eef2'),water:hx('#2c6e86'),plaza:hx('#a29c92'),pitch:hx('#4f8c3a'),cem:hx('#5f7f48'),play:hx('#b59a74'),edu:hx('#9a938a')};
/* regionális építészeti profilok: falszín, tetőanyag, jellemző szintszám, tetőforma, díszítettség */
const STY={
 bud:{wall:['#d8c39a','#e6dcc4','#cdb68a','#c9c2b2','#d6b494','#e3d3a4','#bdb5a3','#ddd3bf','#c7a982','#b8b0a0'],roof:['#8e4a36','#4f5257','#76493a','#6b7076'],pitch:.85,lvl:[4,6],orn:1},
 hu:{wall:['#e7dcc6','#ddc9a1','#efe7d6','#d9c08f','#c9b9a0','#e8d9b5','#d8d2c6'],roof:['#9a4a35','#7f4434','#5b5d62','#8a4a3a'],pitch:.9,lvl:[1,3],orn:.4},
 pecs:{wall:['#e8cfa0','#d9a66a','#f0e2c4','#e2bf8a','#cfae83','#efe1c8','#d8b48a'],roof:['#a5512f','#8e4a36','#7a4232'],pitch:.9,lvl:[2,4],orn:.7},
 paris:{wall:['#e3d8c0','#dcd0b4','#e8dfcb','#d6c9ad','#e0d4ba','#d9cfb8'],roof:['#6c7680','#5d6670','#737d86'],mans:1,lvl:[6,7],orn:1,balc:1},
 fr:{wall:['#e8e0cf','#ddd2bc','#efe8da','#d3c6ad','#e6dcc5'],roof:['#5d6670','#9a4a35','#6c7680'],pitch:.7,mans:.25,lvl:[2,4],orn:.5},
 vienna:{wall:['#ecdcae','#e6d3a0','#efe6d2','#d9cfb9','#e8c98d','#f2ead8','#d8cdb8'],roof:['#5b5f66','#8e4a36','#6b7076'],pitch:.8,lvl:[5,6],orn:1},
 london:{wall:['#ece8e0','#e9e2d3','#f2efe8'],roof:['#4a4f57','#55595f','#5d6168'],pitch:.7,brick:.7,lvl:[3,5],orn:.6},
 nl:{wall:['#efe9df'],roof:['#3f4247','#7a4232'],pitch:.9,brick:.95,lvl:[3,4],orn:.4},
 it:{wall:['#d9a35e','#c9783f','#e2b878','#b65e3b','#e8cfa3','#d18e57','#c9a27a','#e0c08f'],roof:['#a5512f','#9a4a35','#b0613d'],pitch:.85,lvl:[4,6],orn:.7},
 med:{wall:['#f2efe8','#ece4d3','#e9dcc2','#f5f1e9','#e0c9a0','#efe6d2'],roof:['#b0613d','#a5512f','#9c5634'],pitch:.6,lvl:[3,5],orn:.3},
 nordic:{wall:['#9c3b30','#d8a843','#e9e4d8','#c97f3a','#8f9a8c','#e3d6b8','#b9c0b6'],roof:['#3f4247','#4a4f57','#6b3a30'],pitch:.85,lvl:[3,5],orn:.3},
 de:{wall:['#e8e2d4','#d8cfbd','#e5d9bd','#cfc6b6','#bfb6a5','#e0d2b0','#d9d4ca'],roof:['#7a4232','#4f5257','#8e4a36'],pitch:.85,lvl:[4,5],orn:.5},
 nyc:{wall:['#e6ddd0','#efe9df'],roof:['#4a4a4a','#5a5a5a'],brick:.75,lvl:[5,7],orn:.4,tall:1},
 us:{wall:['#ece9e2','#d8d3c6','#c9d2d6','#e6dcc6','#b9c4c0','#d9cbb4'],roof:['#4f4f52','#6b5e52','#3f4247'],pitch:.95,lvl:[1,2],orn:.1},
 asia:{wall:['#d7d5cf','#c8c6c0','#e2e0da','#bfc3c6','#d9d2c4'],roof:['#5b5f66','#6b7076'],lvl:[4,10],orn:.1,tall:1},
 gen:{wall:['#e3dccd','#d4c8b0','#cfc8bb','#e6d6b5','#c9b79a','#ddd5c6'],roof:['#8e4a36','#5b5f66','#7a4a3a'],pitch:.6,lvl:[3,5],orn:.5}};
for(const k in STY){STY[k].W=STY[k].wall.map(hx);STY[k].R=STY[k].roof.map(hx);STY[k].key=k;}
function styleAt(lat,lon){const B=(a,b,c,d)=>lat>=a&&lat<=b&&lon>=c&&lon<=d;
 if(B(47.35,47.62,18.92,19.34))return'bud';if(B(46.03,46.12,18.14,18.32))return'pecs';if(B(48.79,48.93,2.2,2.48))return'paris';if(B(48.1,48.33,16.18,16.58))return'vienna';
 if(B(51.28,51.7,-.52,.34))return'london';if(B(40.49,40.92,-74.27,-73.69))return'nyc';
 if(B(45.7,48.6,16.1,22.9))return'hu';if(B(52,53.6,3.3,7.3)||B(50.7,52,2.5,6.4))return'nl';
 if(B(49.9,59,-8.2,1.8))return'london';if(B(41.3,51.1,-5.2,8.3))return lat<44.2?'med':'fr';
 if(B(36.6,47.1,6.6,18.6))return'it';if(B(35.8,43.9,-9.6,3.4)||B(34.8,41.8,19.3,28.3))return'med';
 if(B(46.3,55.1,5.8,24.2))return'de';if(lat>55&&lon>4&&lon<32)return'nordic';
 if(B(24,49.5,-125,-66))return'us';if(B(20,46,100,146))return'asia';return'gen';}
const FLAT=['#6d6d6a','#7b7a75','#5f615f','#8a857c','#74716b'].map(hx);
let WALL=STY.gen.W,ROOF=FLAT;
function landClass(layer,p){const c=p.class,s=p.subclass;
 if(layer==='water')return{c:C.water,p:9,water:1};
 if(layer==='park')return{c:C.park,p:5,tree:1/240};
 if(layer==='landcover'){if(c==='wood')return{c:C.wood,p:6,tree:1/40,con:s==='forest'&&p.leaf_type==='needleleaved'};
  if(c==='grass')return{c:C.park,p:4,tree:s==='park'||s==='garden'?1/260:s==='scrub'?1/120:0};if(c==='farmland')return{c:C.farm,p:3};
  if(c==='sand')return{c:C.sand,p:4};if(c==='wetland')return{c:C.wet,p:4};if(c==='rock')return{c:C.rock,p:4};if(c==='ice')return{c:C.ice,p:4};return null;}
 if(layer==='landuse'){if(/residential|suburb|quarter|neighbourhood/.test(c))return{c:C.res,p:1};if(/commercial|retail/.test(c))return{c:C.com,p:1};
  if(/industrial|railway|garages|construction|military|dam/.test(c))return{c:C.ind,p:1};if(c==='cemetery')return{c:C.cem,p:2,tree:1/220};
  if(/school|university|college|kindergarten|hospital|library|theme_park|zoo/.test(c))return{c:C.edu,p:2,tree:1/600};
  if(c==='pitch'||c==='stadium')return{c:C.pitch,p:3};if(c==='playground')return{c:C.play,p:3};return null;}
 if(layer==='transportation')return{c:C.plaza,p:7};return null;}
function hash(n){n=Math.floor(Math.abs(n))%2147483647;return Math.imul(n|0,2654435761)>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pipR(x,z,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
const pip=(x,z,poly)=>{if(!pipR(x,z,poly.o))return false;for(const h of poly.h)if(pipR(x,z,h))return false;return true;};
function segD(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;let t=l?((x-ax)*dx+(z-az)*dz)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-ax-dx*t,z-az-dz*t);}
const LMK=[{k:'parlament',lat:47.50705,lon:19.04565,r:160,n:'Országház (Parlament)'},{k:'bazilika',lat:47.50088,lon:19.05390,r:48,n:'Szent István-bazilika'},{k:'hosok',lat:47.51499,lon:19.07786,r:60,n:'Hősök tere – Millenniumi emlékmű'}];
const RW={motorway:15,trunk:13,primary:12,secondary:10.5,tertiary:9,minor:7,service:4.5,track:3.2,raceway:9,busway:7,path:2.2};
