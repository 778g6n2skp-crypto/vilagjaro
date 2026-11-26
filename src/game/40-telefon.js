/* ---------- telefon: érintéses vezérlés, eszköztár, teljes képernyő ---------- */
const TOUCH=(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1)&&!matchMedia('(pointer:fine)').matches;
const TI={on:false,act:false,st:0,thr:0,brk:0,hb:false};
function cycleCam(){camMode=(camMode+1)%4;status(['Követő kamera','Távoli kamera','Vezetőülés','Motorháztető'][camMode],1.2);}
$('sx').onclick=()=>{if(setOpen)toggleSettings();};$('tbSet').onclick=()=>{if(!mapOpen&&!garageOpen)toggleSettings();};$('tbMap').onclick=()=>{if(!setOpen&&!garageOpen)toggleMap();};$('tbCam').onclick=cycleCam;$('tbReset').onclick=()=>{if(started)resetCar(false);};
for(const b of document.querySelectorAll('#tb button'))b.addEventListener('pointerdown',e=>e.stopPropagation());
if(TOUCH){document.body.classList.add('touch');TI.on=true;$('touch').classList.remove('hide');document.querySelector('.tkeys').style.display='block';
 const hold=(id,k)=>{const el=$(id);const on=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}TI[k]=k==='hb'?true:1;el.classList.add('on');if(navigator.vibrate)navigator.vibrate(8);},off=e=>{TI[k]=k==='hb'?false:0;el.classList.remove('on');};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);el.addEventListener('contextmenu',e=>e.preventDefault());};
 hold('tGas','thr');hold('tBrake','brk');hold('tHb','hb');$('tHorn').addEventListener('pointerdown',e=>{e.preventDefault();honk(1);});
 const pad=$('steerPad'),knob=$('steerKnob');let pid=null;
 const mv=e=>{const r=pad.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),v=Math.max(-1,Math.min(1,dx/(r.width*.4)));TI.st=-v;TI.act=true;knob.style.transform=`translateX(${v*r.width*.4}px)`;};
 pad.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;try{pad.setPointerCapture(pid);}catch(_){}mv(e);});pad.addEventListener('pointermove',e=>{if(e.pointerId===pid)mv(e);});
 const up=e=>{if(e.pointerId!==pid)return;pid=null;TI.st=0;TI.act=CFG.tilt?TI.act:false;knob.style.transform='';};pad.addEventListener('pointerup',up);pad.addEventListener('pointercancel',up);
 // döntéses kormányzás: fekvő helyzetben a telefon előre-hátra billentése (beta) a kormány
 addEventListener('deviceorientation',e=>{if(!CFG.tilt||pid!==null||e.beta==null)return;const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0,b=(ang===90?-1:ang===270||ang===-90?1:0)*e.beta;if(!ang){TI.st=Math.max(-1,Math.min(1,-(e.gamma||0)/28));}else TI.st=Math.max(-1,Math.min(1,b/24));TI.act=true;});
 const rot=()=>{$('rotate').classList.toggle('hide',!(started&&innerHeight>innerWidth));};addEventListener('resize',rot);setInterval(rot,1500);
 document.addEventListener('gesturestart',e=>e.preventDefault());document.addEventListener('dblclick',e=>e.preventDefault());}
