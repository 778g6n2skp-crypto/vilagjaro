/* ---------- renderer ---------- */
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:true,powerPreference:'high-performance'});renderer.localClippingEnabled=true;
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xf3e3cf,180,920);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.3,5000);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(mapObj)mapObj.resize();});
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color()},stars:{value:0}},
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:'uniform vec3 top,hor,sunCol,sunDir;uniform float stars;varying vec3 vD;float h21(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}void main(){float h=max(vD.y,0.);vec3 c=mix(hor,top,pow(h,.5));float s=max(dot(vD,normalize(sunDir)),0.);c+=sunCol*(smoothstep(.9975,.999,s)*1.2+pow(s,10.)*.22);if(stars>0.){vec3 q=floor(vD*260.);float st=step(.9965,h21(q))*smoothstep(0.,.3,vD.y);c+=vec3(st*stars);}gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}'});
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const gtao=new GTAOPass(scene,camera,innerWidth,innerHeight);gtao.blendIntensity=.85;gtao.updateGtaoMaterial({radius:2.2,distanceExponent:1.4,thickness:2,scale:1.1,samples:12});gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});composer.addPass(gtao);
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.2,.5,.88);composer.addPass(bloom);composer.addPass(new OutputPass());
const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},sat:{value:1.06},vig:{value:.28}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;uniform float sat,vig;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float l=dot(c.rgb,vec3(.299,.587,.114));c.rgb=mix(vec3(l),c.rgb,sat);c.rgb=(c.rgb-.5)*1.04+.5;vec2 d=vUv-.5;c.rgb*=1.-vig*dot(d,d)*1.6;gl_FragColor=c;}'});composer.addPass(grade);
let quality=0;try{quality=+(localStorage.getItem('vj_q')||0)%3;}catch(e){}
const QN=['Magas','Közepes','Alacsony'];
const GPU=(()=>{try{const gl=renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)):'';}catch(e){return'';}})();
const GPU_WEAK=/Intel|UHD|Iris|Radeon\(TM\) Graphics|Radeon Graphics|Vega \d|Radeon Vega|Mali|Adreno|PowerVR|Microsoft Basic/i.test(GPU),GPU_SOFT=/SwiftShader|llvmpipe|Software/i.test(GPU);
const perf={n:0,t:0,fps:60,low:0,high:0};
function perfTick(dt){perf.n++;perf.t+=dt;if(perf.t<1)return;perf.fps=perf.n/perf.t;perf.n=0;perf.t=0;const el=document.getElementById('fps');if(el){el.classList.toggle('hide',!CFG.fps);el.textContent=Math.round(perf.fps)+' FPS · '+QN[quality]+' · '+Math.round(prCur*100)+'%';}
 if(!CFG.dynres||GPU_SOFT)return;if(perf.fps<46){perf.low++;perf.high=0;}else if(perf.fps>57){perf.high++;perf.low=0;}else{perf.low=perf.high=0;}
 const min=[.75,.6,.5][quality];let np=prCur;if(perf.low>=2&&prCur>min){np=Math.max(min,prCur*.85);perf.low=0;}else if(perf.high>=4&&prCur<prMax){np=Math.min(prMax,prCur*1.08);perf.high=0;}
 if(np!==prCur){prCur=np;renderer.setPixelRatio(np);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(np);composer.setSize(innerWidth,innerHeight);}}
let prMax=1,prCur=1;
function applyQuality(){prMax=Math.min(devicePixelRatio,[1.5,1,.8][quality]);prCur=prMax;const pr=prCur;gtao.enabled=quality===0;
 Object.assign(sun.shadow.camera,quality===0?{left:-90,right:90,top:90,bottom:-90}:{left:-55,right:55,top:55,bottom:-55});sun.shadow.camera.updateProjectionMatrix();try{TREE.dirty=true;}catch(e){}renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight);
 sun.castShadow=quality<2;const ms=quality===0?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}try{localStorage.setItem('vj_q',quality);}catch(e){}}
const sky=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),skyMat);sky.renderOrder=-1;scene.add(sky);
const pmrem=new THREE.PMREMGenerator(renderer),envScene=new THREE.Scene(),envGround=new THREE.Mesh(new THREE.CircleGeometry(900,24).rotateX(-Math.PI/2).translate(0,-40,0),new THREE.MeshBasicMaterial({color:0x777777}));
envScene.add(new THREE.Mesh(new THREE.SphereGeometry(1000,32,16),skyMat),envGround);let envRT=null,envT=0;
function updEnv(){envGround.material.color.copy(tCur.hg).multiplyScalar(.55);const rt=pmrem.fromScene(envScene,.02,1,3000);if(envRT)envRT.dispose();envRT=rt;scene.environment=rt.texture;}
const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:900});sun.shadow.bias=-.0005;sun.shadow.normalBias=.5;
applyQuality();scene.add(sun,sun.target);const hemi=new THREE.HemisphereLight(0xbfe3ff,0xa68a6d,1.5);scene.add(hemi);

const TIMES=[
 {n:'Nappal',el:48,az:215,top:'#3a86d4',hor:'#d9e8f3',fog:'#cfdde8',sunC:'#fff3e2',sunI:2.6,hs:'#bcd7f0',hg:'#8c7b66',hemiI:1.1,night:0,fn:220,ff:1300},
 {n:'Naplemente',el:6,az:258,top:'#3e4d9c',hor:'#ffa77a',fog:'#f3a888',sunC:'#ffb37a',sunI:1.6,hs:'#ffc6a8',hg:'#6a4e6a',hemiI:1.05,night:.5,fn:150,ff:820},
 {n:'Éjszaka',el:38,az:300,top:'#070b22',hor:'#2a3366',fog:'#1e2650',sunC:'#8ea4ff',sunI:.28,hs:'#3a4890',hg:'#121228',hemiI:.55,night:1,fn:60,ff:650},
 {n:'Hajnal',el:8,az:95,top:'#6d8fd0',hor:'#ffd2c0',fog:'#f4d3c4',sunC:'#ffd3b0',sunI:1.5,hs:'#ffdcd2',hg:'#73606e',hemiI:1.05,night:.3,fn:150,ff:860}];
const CK=['top','hor','fog','sunC','hs','hg'];
const pack=t=>{const o={...t};for(const k of CK)o[k]=new THREE.Color(t[k]);return o;};
let tIdx=0,tK=1;const tCur=pack(TIMES[0]);let tFrom=pack(TIMES[0]),tTo=pack(TIMES[0]);
function autoTimeIdx(){const h=new Date().getHours()+new Date().getMinutes()/60;return h>=7&&h<17?0:h>=17&&h<20?1:h>=5&&h<7?3:2;}
function nextTime(){tIdx=(tIdx+1)%TIMES.length;tFrom={};for(const k in tCur)tFrom[k]=tCur[k].clone?tCur[k].clone():tCur[k];tTo=pack(TIMES[tIdx]);tK=0;status(TIMES[tIdx].n,2);}
const sunDir=new THREE.Vector3();
function applyTime(dt){if(tK<1){tK=Math.min(1,tK+dt/2.2);const e=tK*tK*(3-2*tK);
  for(const k in tTo){if(typeof tTo[k]==='string')continue;if(tTo[k].isColor)tCur[k].copy(tFrom[k]).lerp(tTo[k],e);else tCur[k]=tFrom[k]+(tTo[k]-tFrom[k])*e;}}
 const T=tCur;sunDir.setFromSphericalCoords(1,THREE.MathUtils.degToRad(90-T.el),THREE.MathUtils.degToRad(T.az));
 const u=skyMat.uniforms;u.top.value.copy(T.top);u.hor.value.copy(T.hor);u.sunDir.value.copy(sunDir);u.sunCol.value.copy(T.sunC).multiplyScalar(1-T.night*.85);u.stars.value=Math.max(0,T.night-.5)*1.6;
 scene.fog.color.copy(T.fog);scene.fog.near=T.fn*[1,.8,.6][quality];scene.fog.far=T.ff*[1,.8,.55][quality];hemi.color.copy(T.hs);hemi.groundColor.copy(T.hg);hemi.intensity=T.hemiI*.55;sun.color.copy(T.sunC);sun.intensity=T.sunI;
 envT-=dt;if(!envRT||(tK<1&&envT<=0)||(tK>=1&&envT>-9&&envT<=0)){envT=tK<1?.35:-10;updEnv();}
 const n=T.night;MAT.wmo.emissiveIntensity=n*.8;MAT.wpa.emissiveIntensity=n*.8;MAT.wbr.emissiveIntensity=n*.85;MAT.wu.emissiveIntensity=n*.9;MAT.wg.emissiveIntensity=n*1.3;MAT.lampHead.emissiveIntensity=n*3;MAT.pool.opacity=n*.8;
 carParts.head.emissiveIntensity=.3+n*2.5;SHOPNIGHT=n;for(const m of SHOPMATS)m.emissiveIntensity=.12+n*.95;for(const l of carParts.lights)l.intensity=n*45;MAT.aiLight.emissiveIntensity=.2+n*2;MAT.tramWin.emissiveIntensity=n*1.2;}
