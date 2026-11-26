/* ---------- futár küldetés, pénz ---------- */
let money=0,mission=null;try{money=+(localStorage.getItem('vj_money')||0);}catch(e){}
function addMoney(d){money=Math.max(0,Math.round(money+d));try{localStorage.setItem('vj_money',money);}catch(e){}}
function startMission(){if(mission){mission=null;clearRoute();status('Futár küldetés megszakítva.',2);return;}const [la,lo]=toLL(car.x,car.z),ang=Math.random()*6.283,dist=900+Math.random()*900;
 const lat=la+Math.cos(ang)*dist/MLAT,lon=lo+Math.sin(ang)*dist/mlon;mission={dist,limit:dist/9.5+40,t:0,reward:Math.round((800+dist*2.4)/100)*100};setRoute(lat,lon);status('📦 Futár: vidd el a csomagot a rózsaszín nyilak mentén!',3.5);}
function updMission(dt){const mn=$('money');mn.classList.toggle('hide',!started);mn.textContent='💰 '+fmtFt(money);const el=$('mission');el.classList.toggle('hide',!mission);if(!mission)return;mission.t+=dt;
 const left=mission.limit-mission.t;if(left<=0){status('⏱ Lejárt az idő – a csomag nem ért célba.',4);mission=null;clearRoute();tone(300,0,.4,'sawtooth',.05);return;}
 el.textContent='📦 '+Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0')+' · '+fmtFt(mission.reward);}
