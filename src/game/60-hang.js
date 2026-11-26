/* ---------- hang ---------- */
let au=null;
function initAudio(){try{const c=new AudioContext(),o1=c.createOscillator(),o2=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();
 const master=c.createGain(),busE=c.createGain(),busA=c.createGain(),busM=c.createGain(),busS=c.createGain();master.connect(c.destination);for(const b of [busE,busA,busM,busS])b.connect(master);
 o1.type=CAR.snd[0];o2.type='square';lp.type='lowpass';g.gain.value=0;o1.connect(lp);o2.connect(lp);lp.connect(g);g.connect(busE);o1.start();o2.start();
 const buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const ns=c.createBufferSource();ns.buffer=buf;ns.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1800;bp.Q.value=1.2;const ng=c.createGain();ng.gain.value=0;ns.connect(bp);bp.connect(ng);ng.connect(busE);ns.start();
 const ns2=c.createBufferSource();ns2.buffer=buf;ns2.loop=true;const lp2=c.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=420;const ag=c.createGain();ag.gain.value=0;ns2.connect(lp2);lp2.connect(ag);ag.connect(busA);ns2.start();
 const o3=c.createOscillator();o3.type='sine';const g3=c.createGain();g3.gain.value=.5;o3.connect(g3);g3.connect(lp);o3.start();
 const ns3=c.createBufferSource();ns3.buffer=buf;ns3.loop=true;const wlp=c.createBiquadFilter();wlp.type='lowpass';wlp.frequency.value=650;const wg=c.createGain();wg.gain.value=0;ns3.connect(wlp);wlp.connect(wg);wg.connect(busE);ns3.start();
 const ns4=c.createBufferSource();ns4.buffer=buf;ns4.loop=true;const ibp=c.createBiquadFilter();ibp.type='bandpass';ibp.frequency.value=500;ibp.Q.value=2;const ig=c.createGain();ig.gain.value=0;ns4.connect(ibp);ibp.connect(ig);ig.connect(busE);ns4.start();
 const s1=c.createOscillator();s1.type='sine';s1.frequency.value=700;const slp=c.createBiquadFilter();slp.type='lowpass';slp.frequency.value=1400;const sg=c.createGain();sg.gain.value=0;s1.connect(slp);slp.connect(sg);sg.connect(busS);s1.start();
 const dl=c.createDelay(1),fb=c.createGain(),dlp=c.createBiquadFilter(),wet=c.createGain();dl.delayTime.value=.36;fb.gain.value=.32;dlp.type='lowpass';dlp.frequency.value=2200;wet.gain.value=.28;dl.connect(dlp);dlp.connect(fb);fb.connect(dl);dlp.connect(wet);wet.connect(busM);
 au={c,o1,o2,o3,lp,g,ng,ag,wg,ig,ibp,s1,sg,buf,master,busE,busA,busM,busS,dl};}catch(e){}}
let thudT=0;function thud(st){const now=performance.now();if(!au||muted||now<thudT)return;thudT=now+350;const c=au.c,src=c.createBufferSource();src.buffer=au.buf;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=c.createGain(),v=Math.min(.35,st*.03);
 g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.35);src.connect(f);f.connect(g);g.connect(au.busA);src.start();src.stop(c.currentTime+.4);tone(70,0,.3,'sine',Math.min(.2,st*.02));}
function tone(f,t0,dur,type,vol,f2){if(!au||muted)return;const c=au.c,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;if(f2)o.frequency.setValueAtTime(f2,c.currentTime+t0+dur*.5);
 g.gain.setValueAtTime(0,c.currentTime+t0);g.gain.linearRampToValueAtTime(vol,c.currentTime+t0+.01);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t0+dur);o.connect(g);g.connect(au.busA);o.start(c.currentTime+t0);o.stop(c.currentTime+t0+dur+.05);}
let honkT=0;function honk(me,c){const now=performance.now();if(now<honkT)return;honkT=now+700;let v=.07;if(!me&&c){const d=Math.hypot(c.x-car.x,c.z-car.z);v=.07/(1+d/15);}tone(me?420:380,0,.35,'square',v);tone(me?520:470,0,.35,'square',v*.8);}
let bellT=0;function bell(){const now=performance.now();if(now<bellT)return;bellT=now+2500;tone(1320,0,.6,'sine',.08);tone(1320,.22,.7,'sine',.08);}
const GEARS=[0,12,23,34,46,70];let tN=-1;
function updAudio(){if(!au)return;const sp=Math.abs(car.vF),t=au.c.currentTime;let gi=0;while(gi<4&&sp>GEARS[gi+1]*CAR.vmax/58)gi++;
 const rpm=sp<.5?.14:Math.max(.14,car.rpm||.2),fr=CAR.snd[1]+rpm*CAR.snd[2];au.o3.frequency.setTargetAtTime(fr*2,t,.05);
 au.o1.frequency.setTargetAtTime(fr,t,.05);au.o2.frequency.setTargetAtTime(fr*.5,t,.05);au.lp.frequency.setTargetAtTime(380+rpm*1500,t,.05);
 {const m=muted?0:CFG.vMaster;au.master.gain.setTargetAtTime(m,t,.05);au.busE.gain.setTargetAtTime(mapOpen||setOpen?0:CFG.vEngine,t,.1);au.busA.gain.setTargetAtTime(CFG.vAmb,t,.1);au.busM.gain.setTargetAtTime(CFG.radio?CFG.vMusic*.9:0,t,.2);au.busS.gain.setTargetAtTime(CFG.siren?1:0,t,.1);}
 musicTick();
 const on=started&&!mapOpen;au.g.gain.setTargetAtTime(on?.026+inp.thr*.036:0,t,.08);if(tN!==carSel){tN=carSel;au.o1.type=CAR.snd[0];}
 au.ng.gain.setTargetAtTime(on&&car.ground?Math.max(0,Math.min(1,(car.slip-3)/9))*.08:0,t,.06);
 au.ag.gain.setTargetAtTime(on?.012+Math.min(traffic.length,20)*.0009:0,t,.5);
 au.wg.gain.setTargetAtTime(on?Math.min(.05,(sp/55)**2*.05):0,t,.2);au.ig.gain.setTargetAtTime(on?inp.thr*rpm*.03:0,t,.06);au.ibp.frequency.setTargetAtTime(300+rpm*900,t,.05);
 if(on&&traffic.length>6&&Math.random()<.0025){const f2=360+Math.random()*140;tone(f2,0,.25+Math.random()*.3,'square',.008);}}
