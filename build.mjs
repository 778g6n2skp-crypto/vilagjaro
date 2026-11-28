// Világjáró összeállító: a src/ modulokból egyetlen index.html készül (ezt szolgálja ki a GitHub Pages).
// Használat: node build.mjs   – a verziószámot a VERSION fájl adja.
import fs from 'fs';
const rd=f=>fs.readFileSync(f,'utf8');
const dir=d=>fs.readdirSync(d).filter(f=>f.endsWith('.js')).sort().map(f=>rd(`${d}/${f}`)).join('\n');
const ver=rd('VERSION').trim();
// ellenőrzés: sorvégi megjegyzés mögé került kód (kétszer okozott már hibát)
{let bad=[];for(const d of ['src/worker','src/game'])for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.js'))){rd(`${d}/${f}`).split('\n').forEach((l,i)=>{const m=l.match(/(^|[^:'"\\])\/\/(.*)$/);if(m&&/(\bif\(|\bfor\(|;\s*(const|let|var)\s|\)\{|=>\{|\breturn\b[^.]*;)/.test(m[2]))bad.push(`${d}/${f}:${i+1}: ${m[2].slice(0,80)}`);});}
 if(bad.length){console.error('HIBA: kód megjegyzésben:\n'+bad.join('\n'));process.exit(1);}}
let out=rd('src/page.html');
out=out.replace('/*@style*/',()=>rd('src/style.css')).replace('/*@worker*/',()=>dir('src/worker')).replace('/*@game*/',()=>dir('src/game').replace(/__VERSION__/g,ver));
fs.writeFileSync('index.html',out);
console.log('index.html kész, verzió:',ver,'méret:',out.length);
