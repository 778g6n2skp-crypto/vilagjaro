/* ---------- térkép-app (MapLibre) ---------- */
let mapObj=null,mapOpen=false,meMk=null,destMk=null,mapLoading=null;
function loadMapLib(){if(mapLoading)return mapLoading;mapLoading=new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';document.head.appendChild(l);
 const s=document.createElement('script');s.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});return mapLoading;}
const bearing=()=>Math.atan2(Math.sin(car.h),-Math.cos(car.h))*180/Math.PI;
async function toggleMap(){mapOpen=!mapOpen;$('mapapp').classList.toggle('on',mapOpen);keys.clear();if(!mapOpen){$('c').focus();return;}
 const [la,lo]=toLL(car.x,car.z);
 if(!mapObj){try{await loadMapLib();}catch(e){$('mapmsg').textContent='A térkép most nem tölthető be (nincs internet?). A kereső fent így is működik.';return;}
  $('mapmsg').remove();mapObj=new maplibregl.Map({container:'mapview',style:'https://tiles.openfreemap.org/styles/liberty',center:[lo,la],zoom:15,attributionControl:{compact:true}});
  mapObj.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
  const el=document.createElement('div');el.className='me';el.innerHTML='<svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="12" fill="#2b2540"/><path d="M13 4 L19 19 L13 15 L7 19 Z" fill="#ff5d8f"/></svg>';
  meMk=new maplibregl.Marker({element:el,rotationAlignment:'map'}).setLngLat([lo,la]).addTo(mapObj);
  mapObj.on('load',()=>{mapObj.addSource('route',{type:'geojson',data:route?{type:'Feature',geometry:{type:'LineString',coordinates:route.ll.map(p=>[p[1],p[0]])}}:{type:'FeatureCollection',features:[]}});
   mapObj.addLayer({id:'route',type:'line',source:'route',paint:{'line-color':'#ff5d8f','line-width':7,'line-opacity':.9},layout:{'line-cap':'round','line-join':'round'}});});
  mapObj.on('click',e=>pickPoint(e.lngLat.lat,e.lngLat.lng,'Kijelölt pont'));}
 else{mapObj.resize();mapObj.jumpTo({center:[lo,la]});}
 meMk.setLngLat([lo,la]).setRotation(bearing());}
function pickPoint(lat,lon,label){if(!mapObj)return;if(destMk)destMk.remove();
 const box=document.createElement('div');box.className='pop';const b=document.createElement('b');b.textContent=label;box.appendChild(b);
 const r=document.createElement('button');r.className='btn';r.textContent='Útvonal ide';r.onclick=()=>{setRoute(lat,lon);};
 const t=document.createElement('button');t.className='btn alt';t.textContent='Teleport ide';t.onclick=()=>{toggleMap();jump(lat,lon,label);};box.append(r,t);
 destMk=new maplibregl.Marker({color:'#ff5d8f'}).setLngLat([lon,lat]).setPopup(new maplibregl.Popup({offset:28,closeButton:false}).setDOMContent(box)).addTo(mapObj);destMk.togglePopup();}
async function search(){const q=$('q').value.trim();if(!q)return;
 try{const [la,lo]=toLL(car.x,car.z);const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q)+'&viewbox='+(lo-.3)+','+(la+.2)+','+(lo+.3)+','+(la-.2));const js=await r.json();
  if(!js.length){status('Nem találtam: '+q,3);return;}const lat=+js[0].lat,lon=+js[0].lon,nm=js[0].display_name.split(',')[0];
  if(mapObj){mapObj.flyTo({center:[lon,lat],zoom:15});pickPoint(lat,lon,nm);}else jump(lat,lon,nm);}
 catch(e){status('A keresés most nem elérhető.',3);}}
$('qgo').onclick=search;$('q').addEventListener('keydown',e=>{if(e.key==='Enter')search();});$('clr').onclick=clearRoute;$('mclose').onclick=()=>toggleMap();
function jump(lat,lon,label){gen++;for(const ch of [...chunks.values()])dispose(ch);inflight=0;for(const t of trams)scene.remove(t.grp);trams.length=0;traffic.length=0;
 lat0=lat;lon0=lon;LHT=leftHand(lat,lon);mlon=111320*Math.cos(lat0*Math.PI/180);wk.postMessage({t:'init',lat0,lon0});Object.assign(car,{x:0,z:0,vx:0,vz:0,vF:0,spawned:false});carMesh.visible=false;
 routeLocal();if(routeMesh){scene.remove(routeMesh);routeMesh.geometry.dispose();routeMesh=null;}placeT=0;cruise=null;$('where').textContent='';status('Ugrás: '+label+' – a város épül…',5);}
