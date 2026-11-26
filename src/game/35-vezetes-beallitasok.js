/* ---------- vezetés ---------- */
const car={x:0,z:0,y:0,vy:0,h:0,vx:0,vz:0,vF:0,steer:0,slope:0,pitch:0,roll:0,ground:true,onRoad:true,slip:0,spawned:false,impact:0,lean:0,dip:0,wet:0};
/* ---------- beállítások ---------- */
const TOUCH_EARLY=(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1)&&!matchMedia('(pointer:fine)').matches;
const CFG_DEF={tilt:false,tSens:1,photo:false,fps:true,dynres:true,qSet:false,mlyOn:true,mly:'',police:false,siren:true,radio:1,vMaster:.8,vEngine:.9,vAmb:.8,vMusic:.45,traffic:1,trams:true,quality:0,shake:true,mini:true,limit:true,marks:true,autoTime:false};
let CFG={...CFG_DEF};try{Object.assign(CFG,JSON.parse(localStorage.getItem('vj_cfg')||'{}'));}catch(e){}
const MLY_DEF='MLY|29949466331324987|62e5847d12580b480a0078677c3c0e5c';if(!CFG.mly)CFG.mly=MLY_DEF;// beépített Mapillary kliens-token (böngészős használatra szánt kulcs); a beállításokban felülírható
if(!CFG.v6){CFG.v6=1;CFG.photo=false;}// a fotóvetítés kísérleti lett: alapból ki
if(!CFG.qSet){CFG.quality=GPU_SOFT?2:TOUCH_EARLY?(/Apple/i.test(GPU)?1:2):GPU_WEAK?1:0;if(TOUCH_EARLY&&!CFG.tTraf){CFG.traffic=Math.min(CFG.traffic??1,.6);CFG.tTraf=1;}}// telefonon alapból alacsony minőség és ritkább forgalom
const saveCfg=()=>{try{localStorage.setItem('vj_cfg',JSON.stringify(CFG));}catch(e){}};
const STATIONS=['Kikapcsolva','Lo-fi Budapest','Éjszakai szintipop','Napsütéses funk'];
const SETS=[['Játékmenet',[
  ['police','tg','Rendőrség és körözés','Szabálysértésnél üldöznek a rendőrök'],
  ['siren','tg','Sziréna hangja',''],
  ['traffic','rg','Forgalom sűrűsége','0 = üres utcák, 2 = csúcsforgalom',0,2,.1],
  ['trams','tg','Villamosok',''],
  ['autoTime','tg','Valós idejű napszak','A napszak a gép órájához igazodik'],
  ['tilt','tg','Döntéses kormányzás (telefon)','A telefon döntésével kormányzol a csúszka helyett'],['tSens','rg','Érintéses kormány érzékenysége','',.5,2,.1]]],
 ['Hang és zene',[
  ['vMaster','rg','Fő hangerő','',0,1,.05],['vEngine','rg','Motor és gumi','',0,1,.05],['vAmb','rg','Város, duda, villamos','',0,1,.05],
  ['radio','sel','Rádió','B gombbal is váltható',STATIONS],['vMusic','rg','Zene hangereje','',0,1,.05]]],
 ['Valódi homlokzatok és táblák (Mapillary)',[
  ['mlyOn','tg','Mapillary-adatok használata','Utcafotókból vett homlokzatszínek és valódi közlekedési táblák'],
  ['photo','tg','Fotóvetítés a falakra (kísérleti)','A valódi utcafotókat rávetíti a közeli házfalakra. Pontatlan és zajos, ezért alapból ki van kapcsolva – a színek és magasságok a fotókból enélkül is átjönnek.'],
  ['mly','txt','Mapillary token','A „Client Token” (MLY|…). Csak ebben a böngészőben tárolódik.']]],
 ['Kép és kezelőfelület',[
  ['quality','sel','Grafikai minőség','Q gombbal is váltható. Integrált videokártyán a Közepes az ajánlott.',['Magas','Közepes','Alacsony']],
  ['dynres','tg','Automatikus felbontás','Akadás esetén kicsit csökkenti a felbontást, hogy folyamatos maradjon'],['fps','tg','FPS-mérő',''],
  ['shake','tg','Kamerarázkódás nagy sebességnél',''],['mini','tg','Minitérkép',''],['limit','tg','Sebességkorlát-tábla',''],['marks','tg','Nevezetesség-jelző','']]]];
let setOpen=false;
function buildSettings(){const B=$('setbody');B.textContent='';for(const [title,rows] of SETS){const h=document.createElement('h3');h.textContent=title;B.append(h);const g=document.createElement('div');g.className='sg';B.append(g);
 for(const [k,ty,lab,sub,a,b2,st] of rows){const r=document.createElement('div');r.className='row';const L=document.createElement('label');L.htmlFor='cfg_'+k;L.textContent=lab;if(sub){const sm=document.createElement('small');sm.textContent=sub;L.append(sm);}let I;
  if(ty==='tg'){I=document.createElement('input');I.type='checkbox';I.className='tg';I.checked=!!CFG[k];I.onchange=()=>setCfg(k,I.checked);}
  else if(ty==='txt'){I=document.createElement('input');I.type='text';I.placeholder='MLY|…';I.autocomplete='off';I.spellcheck=false;I.value=CFG[k]||'';I.onchange=()=>setCfg(k,I.value.trim());}
  else if(ty==='rg'){I=document.createElement('input');I.type='range';I.min=a;I.max=b2;I.step=st;I.value=CFG[k];I.oninput=()=>setCfg(k,+I.value);}
  else{I=document.createElement('select');a.forEach((o,i)=>{const op=document.createElement('option');op.value=i;op.textContent=o;I.append(op);});I.value=CFG[k];I.onchange=()=>setCfg(k,+I.value);}
  I.id='cfg_'+k;r.append(L,I);g.append(r);if(k==='mly'){const st=document.createElement('div');st.className='mst';st.id='mlystat';st.textContent=mlyStatus();g.append(st);}}}}
function setCfg(k,v){CFG[k]=v;if(k==='quality')CFG.qSet=true;saveCfg();applyCfg(k);if(k==='tilt'){if(v&&window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{});if(!v){TI.st=0;TI.act=false;}}}
function applyCfg(k){if(k==='quality'||k==null){quality=CFG.quality;applyQuality();}
 if((k==='police'||k==null)&&!CFG.police){wanted=0;while(police.length)dropPolice(0);}
 if(k==='radio'&&au)radioMsg();
 $('mini').classList.toggle('hide',!CFG.mini);
 if(k==null||k==='mly'||k==='mlyOn'){wk.postMessage({t:'cfg',mly:CFG.mlyOn?CFG.mly:''});mly.err='';if(k){mly.done.clear();if(CFG.mlyOn&&CFG.mly){for(const ch of chunks.values())if(ch.state==='ready')wk.postMessage({t:'chunk',tx:ch.tx,ty:ch.ty,gen,rebuild:1});}}}}
function toggleSettings(){setOpen=!setOpen;$('settings').classList.toggle('hide',!setOpen);keys.clear();if(setOpen){buildSettings();diag();}else $('c').focus();}
// diagnosztika a beállítások alján: ha telefonon valami nem jó, ebből látszik, hol akad el
function diag(){let el=$('diag');if(!el){el=document.createElement('div');el.id='diag';el.style.cssText='font:600 11px ui-monospace,monospace;opacity:.6;margin-top:14px;white-space:pre-wrap';$('setbody').after(el);}
 let r=0,l=0,bv=0,dd='';for(const ch of chunks.values()){if(ch.state==='ready'){r++;dd=ch.demdec||dd;ch.grp.traverse(o=>{if(o.geometry&&o.parent&&o.parent!==ch.grp&&o.geometry.attributes.position)bv+=o.geometry.attributes.position.count;});}else l++;}
 el.textContent=`Világjáró ${VERSION} · Diagnosztika – GPU: ${GPU} · minőség: ${['magas','közepes','alacsony'][quality]} · csempék: ${r} kész, ${l} tölt · épület-csúcspontok: ${bv} · domborzat: ${dd||'?'} · ${innerWidth}×${innerHeight} @${devicePixelRatio}`;}
$('sopen').onclick=()=>toggleSettings();$('sclose').onclick=()=>toggleSettings();$('sreset').onclick=()=>{CFG={...CFG_DEF};saveCfg();applyCfg();buildSettings();};
const keys=new Set(),inp={thr:0,brk:0,steer:0,hb:false};let camMode=0,muted=false,started=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'){if(e.code==='Escape')e.target.blur();return;}
 if(e.code==='KeyO'||(e.code==='Escape'&&setOpen)){if(!mapOpen&&!garageOpen)toggleSettings();e.preventDefault();return;}if(setOpen)return;
 if(e.code==='KeyG'||(e.code==='Escape'&&garageOpen)){if(!mapOpen)toggleGarage();e.preventDefault();return;}if(garageOpen)return;
 if(e.code==='KeyM'||(e.code==='Escape'&&mapOpen)){toggleMap();e.preventDefault();return;}if(mapOpen)return;keys.add(e.code);
 if(e.code==='KeyT'){cruise=cruise==null&&car.vF>2?car.vF:null;}
 if(e.code==='KeyF'&&started)startMission();if(e.code==='KeyQ'){setCfg('quality',(CFG.quality+1)%3);status('Grafika: '+QN[quality],2);}if(e.code==='KeyB'){setCfg('radio',(CFG.radio+1)%STATIONS.length);}
 if(e.code==='KeyC')cycleCam();if(e.code==='KeyN'){if(CFG.autoTime)setCfg('autoTime',false);nextTime();}if(e.code==='KeyR')resetCar(false);if(e.code==='KeyK')muted=!muted;if(e.code==='KeyH')$('help').classList.toggle('on');if(e.code==='KeyE')honk(1);
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
function readInput(dt){const k=c=>keys.has(c);let thr=k('KeyW')||k('ArrowUp')?1:0,brk=k('KeyS')||k('ArrowDown')?1:0,st=(k('KeyA')||k('ArrowLeft')?1:0)-(k('KeyD')||k('ArrowRight')?1:0),hb=k('Space');
 const gp=navigator.getGamepads?navigator.getGamepads()[0]:null;let an=false;
 if(gp){const ax=gp.axes[0]||0;if(Math.abs(ax)>.12){st=-ax;an=true;}thr=Math.max(thr,gp.buttons[7]?.value||0);brk=Math.max(brk,gp.buttons[6]?.value||0);hb=hb||!!gp.buttons[0]?.pressed;}
 if(TI.on){thr=Math.max(thr,TI.thr);brk=Math.max(brk,TI.brk);hb=hb||TI.hb;if(TI.act){st=Math.max(-1,Math.min(1,TI.st*(CFG.tSens||1)));an=true;}}
 if(mapOpen||garageOpen||setOpen){thr=0;brk=0;st=0;hb=false;}
 const rate=st===0||Math.sign(st)!==Math.sign(inp.steer)?6:3.2;inp.steer=an?st:inp.steer+Math.max(-rate*dt,Math.min(rate*dt,st-inp.steer));inp.thr=thr;inp.brk=brk;inp.hb=hb;}
const GB={g:1,shift:0};