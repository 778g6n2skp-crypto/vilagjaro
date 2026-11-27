importScripts('https://cdn.jsdelivr.net/npm/earcut@2.2.4/dist/earcut.min.js');
const TZ=14,NT=1<<TZ,G=256;// terep-rács: ~6,5 m (a régi 13 m nem tudta követni a dombos utakat)
let lat0=0,lon0=0,mlon=1,tileURL=null;const MLAT=110574;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const say=msg=>postMessage({t:'status',msg});
const lon2fx=lon=>(lon+180)/360*NT;
const lat2fy=lat=>{const r=lat*Math.PI/180;return(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*NT;};
const fx2lon=fx=>fx/NT*360-180;
const fy2lat=fy=>Math.atan(Math.sinh(Math.PI*(1-2*fy/NT)))*180/Math.PI;
