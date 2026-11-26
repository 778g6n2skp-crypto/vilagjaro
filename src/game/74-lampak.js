/* ---------- közlekedési lámpák ---------- */
let sigTime=0;const SIG_T=26;
function lightState(g){const t=sigTime%SIG_T;return g===0?(t<11?2:t<13?1:0):(t<13?0:t<24?2:1);}
function updSignals(dt){sigTime+=dt;for(let g=0;g<2;g++){const st=lightState(g);MAT.sigL[g].forEach((m,ci)=>{m.emissiveIntensity=(ci===0&&st===0)||(ci===1&&st===1)||(ci===2&&st===2)?2.4:.05;});}}
const nodeGroup=(ang,grp,fx,fz)=>Math.abs(Math.sin(ang)*fx+Math.cos(ang)*fz)>.7?grp:1-grp;
function sigLimit(c,fx,fz){let lim=null;for(const ch of chunks.values()){const S=ch.sigN;if(!S||!S.length||ch.state!=='ready'||rectD(ch.rect,c.x,c.z)>40)continue;
 for(let k=0;k<S.length;k+=4){const rx=S[k]-c.x,rz=S[k+1]-c.z;if(Math.abs(rx)>32||Math.abs(rz)>32)continue;const al=rx*fx+rz*fz,lt=Math.abs(rx*fz-rz*fx);if(al<4||al>30||lt>9)continue;
  const st=lightState(nodeGroup(S[k+2],S[k+3],fx,fz));if(st===0||(st===1&&al>11)){const v=Math.max(0,(al-10)*.9);lim=lim==null?v:Math.min(lim,v);}}}return lim;}
