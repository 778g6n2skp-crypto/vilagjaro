/* ---------- rádió: élőben generált zene (nincs jogvédett anyag) ---------- */
const mtof=n=>440*Math.pow(2,(n-69)/12);
const ST=[null,
 {bpm:82,swing:.18,ch:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],bass:[41,40,38,36],sc:[65,67,69,72,74,77,79],kick:[0,7,10],snare:[4,12],hat:2,voice:'keys',lead:'keys',crackle:true,mel:.32},
 {bpm:104,swing:0,ch:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],bass:[45,41,48,43],sc:[69,72,74,76,79,81],kick:[0,4,8,12],snare:[4,12],hat:1,voice:'pad',lead:'saw',arp:true,mel:.22},
 {bpm:112,swing:.1,ch:[[55,59,62,65],[60,64,67,70],[55,59,62,65],[62,65,69,72]],bass:[43,48,43,50],sc:[67,70,72,74,77,79],kick:[0,6,10],snare:[4,12],hat:1,voice:'keys',lead:'square',funk:true,mel:.3}];
let mStep=0,mNext=0,mBar=0,mSeed=1;
const mr=()=>{mSeed=(mSeed*16807)%2147483647;return(mSeed&1023)/1024;};
function radioMsg(){const el=$('radio');if(!CFG.radio){el.classList.add('hide');return;}el.textContent='♪ '+STATIONS[CFG.radio];el.classList.remove('hide');clearTimeout(radioMsg.t);radioMsg.t=setTimeout(()=>el.classList.add('hide'),3500);}
function mVoice(type,f,t,dur,vol,toDelay){const c=au.c,o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter();lp.type='lowpass';
 if(type==='keys'){o.type='sine';const o2=c.createOscillator();o2.type='triangle';o2.frequency.value=f*2.003;const g2=c.createGain();g2.gain.value=.18;o2.connect(g2);g2.connect(lp);o2.start(t);o2.stop(t+dur+.1);lp.frequency.value=1800;}
 else if(type==='pad'){o.type='sawtooth';lp.frequency.setValueAtTime(500,t);lp.frequency.linearRampToValueAtTime(1300,t+dur*.5);lp.frequency.linearRampToValueAtTime(600,t+dur);o.detune.value=(mr()-.5)*14;}
 else if(type==='saw'){o.type='sawtooth';lp.frequency.value=2400;}else if(type==='square'){o.type='square';lp.frequency.value=1600;}else if(type==='bass'){o.type='triangle';lp.frequency.value=600;}
 o.frequency.value=f;const att=type==='pad'?dur*.35:.008;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(vol*.35,t+Math.max(att+.01,dur*.6));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(lp);lp.connect(g);g.connect(au.busM);if(toDelay)g.connect(au.dl);o.start(t);o.stop(t+dur+.1);}
function mDrum(kind,t,vol){const c=au.c;
 if(kind==='k'){const o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(au.busM);o.start(t);o.stop(t+.32);return;}
 const src=c.createBufferSource();src.buffer=au.buf;const f=c.createBiquadFilter(),g=c.createGain();
 if(kind==='s'){f.type='bandpass';f.frequency.value=1700;f.Q.value=.8;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);}
 else if(kind==='h'){f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);}
 else{f.type='bandpass';f.frequency.value=3000;f.Q.value=4;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.01);}
 src.connect(f);f.connect(g);g.connect(au.busM);src.start(t,Math.random()*1.5);src.stop(t+.25);}
let mLast=0,mMel=60;
function musicTick(){const S=ST[CFG.radio];if(!S||!au||muted||CFG.vMusic<=0){mNext=0;return;}const c=au.c,sx=60/S.bpm/4;if(mNext<c.currentTime)mNext=c.currentTime+.05;
 while(mNext<c.currentTime+.3){const st=mStep%16,bar=Math.floor(mStep/16),ci=bar%S.ch.length,t=mNext+(st%2?S.swing*sx:0),ch=S.ch[ci];
  if(st===0){if(bar%4===0)mSeed=1+(Math.floor(bar/4)%3)*977;for(const n of ch)mVoice(S.voice,mtof(n),t,sx*16*(S.voice==='pad'?1.02:.9),S.voice==='pad'?.022:.03,true);}
  if(S.funk&&(st===6||st===14))for(const n of ch)mVoice('keys',mtof(n+12),t,sx*1.2,.018,false);
  const bp=S.arp?st%2===0:(st===0||st===8||(st===11&&mr()<.6)||(S.funk&&(st===3||st===14)));if(bp)mVoice('bass',mtof(S.bass[ci]+(S.arp&&st%4===2?12:0)),t,sx*(S.arp?1.6:3.5),.11,false);
  if(S.arp&&st%2===1)mVoice('saw',mtof(ch[(st>>1)%ch.length]+12),t,sx*.9,.012,true);
  if(S.kick.includes(st))mDrum('k',t,.32);if(S.snare.includes(st))mDrum('s',t,.11);if(st%S.hat===0)mDrum('h',t,st%4===2?.05:.03);
  if(S.crackle&&Math.random()<.25)mDrum('c',t+Math.random()*sx,.012);
  if(st%2===0&&mr()<S.mel&&!(st>=12&&bar%4===3)){const sc=S.sc;let i=sc.indexOf(mMel);if(i<0)i=2;i=Math.max(0,Math.min(sc.length-1,i+Math.floor(mr()*5)-2));mMel=sc[i];
   mVoice(S.lead,mtof(mMel),t,sx*(mr()<.3?4:2),S.lead==='keys'?.04:.016,true);}
  mStep++;mNext+=sx;}}
