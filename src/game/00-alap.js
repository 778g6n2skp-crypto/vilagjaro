import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const VERSION='__VERSION__';// a build.mjs tölti ki a VERSION fájlból

const MLAT=110574,TZ=14,NT=1<<TZ,G=128,CELL=20,RS=14;
const LOAD_R=950,LOOK_R=500,UNLOAD_R=2300,MAXF=5;
let lat0=47.50320,lon0=19.06010,mlon=111320*Math.cos(lat0*Math.PI/180),gen=1;
/* bal oldali közlekedés országai (durva határolódobozok, a szomszéd jobbos országokat kizárva) */
function leftHand(la,lo){const B=(a,b,c,d)=>la>=a&&la<=b&&lo>=c&&lo<=d;
 if(B(49.8,61,-8.7,1.9)&&!B(48,51.1,-5,2.6)||B(51.4,55.5,-10.7,-5.9))return true; // UK, Írország (Franciao. északi partja nélkül)
 if(B(35.8,36.1,14.1,14.6)||B(34.5,35.75,32.2,34.65))return true; // Málta, Ciprus
 if(B(24,45.6,122.9,146)&&!B(33,43.1,124,131))return true; // Japán (Korea nélkül)
 if(B(-44,-10,112,154)||B(-47.5,-34,166,179))return true; // Ausztrália, Új-Zéland
 if(B(6.5,30.5,68,89.5)&&!B(27,30.5,84,89.5)||B(20.5,26.7,88,92.7)||B(5.8,9.9,79.5,82)||B(26.3,30.5,80,88.3))return true; // India, Banglades, Srí Lanka, Nepál
 if(B(23.6,37,60.8,75)&&!B(25,37,60.8,66))return true; // Pakisztán (nagyjából)
 if(B(5.6,20.5,97.3,105.7)&&!B(10,20.5,102.2,105.7))return true; // Thaiföld
 if(B(.8,7.4,99.6,119.3)||B(1.15,1.48,103.6,104.1)||B(-11,6,95,141.1)||B(22.1,22.6,113.8,114.5)||B(22.1,22.22,113.52,113.6))return true; // Malajzia, Szingapúr, Indonézia, Hongkong, Makaó
 if(B(-35,-22,16.4,33)||B(-27,-17.8,20,29.5)||B(-18,-8,22,33.8)||B(-12,-1,29.3,40.5)||B(-4.8,5,33.9,42)||B(-1.5,4.3,29.5,35.1))return true; // Dél-Afrika, Botswana, Zambia–Zimbabwe, Tanzánia, Kenya, Uganda
 if(B(17.7,18.6,-78.4,-76.1)||B(20.9,27.3,-79.3,-72.7)||B(10,11.4,-61.95,-60.5)||B(12.9,13.4,-59.7,-59.4)||B(6.5,8.6,-61.4,-56.5))return true; // Jamaica, Bahamák, Trinidad, Barbados, Guyana
 return false;}
let LHT=leftHand(lat0,lon0);
const $=id=>document.getElementById(id);
const toLL=(x,z)=>[lat0-z/MLAT,lon0+x/mlon],toXZ=(lat,lon)=>[(lon-lon0)*mlon,-(lat-lat0)*MLAT];
const lon2fx=lon=>(lon+180)/360*NT;
const lat2fy=lat=>{const r=lat*Math.PI/180;return(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*NT;};
const fx2lon=fx=>fx/NT*360-180,fy2lat=fy=>Math.atan(Math.sinh(Math.PI*(1-2*fy/NT)))*180/Math.PI;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const statusEl=$('status');let statusT=0;
function status(msg,sec=4){statusEl.textContent=msg;statusT=performance.now()+sec*1000;}
