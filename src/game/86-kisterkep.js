/* ---------- kistérkép ---------- */
const mc=$('mini'),mg=mc.getContext('2d'),MS=.85;
function drawMini(){const W=mc.width,R=W/2;mg.setTransform(1,0,0,1,0,0);mg.clearRect(0,0,W,W);mg.save();mg.beginPath();mg.arc(R,R,R,0,7);mg.clip();
 mg.fillStyle='#2b2540';mg.fillRect(0,0,W,W);mg.translate(R,R);const rot=-Math.PI/2-Math.atan2(Math.cos(camH),Math.sin(camH));mg.rotate(rot);mg.scale(MS,MS);mg.translate(-car.x,-car.z);
 const rad=R/MS;mg.lineCap='round';mg.lineJoin='round';
 for(const [cls,col,wd] of [[2,'rgba(255,250,240,.16)',3],[1,'#8f86a8',8],[0,'#ffd166',12]]){mg.strokeStyle=col;mg.lineWidth=wd;mg.beginPath();
  for(const ch of chunks.values()){if(ch.state!=='ready'||rectD(ch.rect,car.x,car.z)>rad)continue;const a=ch.rseg;
   for(let k=0;k<a.length;k+=RS){if(a[k+9]!==cls||Math.abs(a[k]-car.x)>rad||Math.abs(a[k+1]-car.z)>rad)continue;mg.moveTo(a[k],a[k+1]);mg.lineTo(a[k+3],a[k+4]);}}mg.stroke();}
 if(route&&route.xz){mg.strokeStyle='#ff5d8f';mg.lineWidth=9;mg.beginPath();route.xz.forEach((p,i)=>i?mg.lineTo(p[0],p[1]):mg.moveTo(p[0],p[1]));mg.stroke();}
 mg.fillStyle='#06d6a0';for(const c of traffic)if(Math.abs(c.x-car.x)<rad&&Math.abs(c.z-car.z)<rad){mg.beginPath();mg.arc(c.x,c.z,3.5,0,7);mg.fill();}
 mg.fillStyle='#f6c21c';for(const t of trams)for(const s of t.sec){mg.beginPath();mg.arc(s.x,s.z,4.5,0,7);mg.fill();}
 mg.restore();mg.fillStyle='#ff5d8f';mg.strokeStyle='#fffaf0';mg.lineWidth=3;mg.beginPath();mg.moveTo(R,R-17);mg.lineTo(R+11,R+12);mg.lineTo(R,R+6);mg.lineTo(R-11,R+12);mg.closePath();mg.fill();mg.stroke();
 const na=rot-Math.PI/2;mg.fillStyle='#fffaf0';mg.font='900 26px Nunito,system-ui';mg.textAlign='center';mg.textBaseline='middle';mg.fillText('É',R+Math.cos(na)*(R-24),R+Math.sin(na)*(R-24));}

$('gopen').onclick=()=>toggleGarage();$('gclose').onclick=()=>toggleGarage();
$('go').onclick=()=>{started=true;$('start').classList.add('hide');initAudio();$('c').focus();if(TOUCH){const de=document.documentElement,rf=de.requestFullscreen||de.webkitRequestFullscreen;try{const pr=rf&&rf.call(de);if(pr&&pr.then)pr.then(()=>screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})).catch(()=>{});}catch(e){}}};
