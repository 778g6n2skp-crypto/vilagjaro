// Világjáró összeállító: a src/ modulokból egyetlen index.html készül (ezt szolgálja ki a GitHub Pages).
// Használat: node build.mjs   – a verziószámot a VERSION fájl adja.
import fs from 'fs';
const rd=f=>fs.readFileSync(f,'utf8');
const dir=d=>fs.readdirSync(d).filter(f=>f.endsWith('.js')).sort().map(f=>rd(`${d}/${f}`)).join('\n');
const ver=rd('VERSION').trim();
let out=rd('src/page.html');
out=out.replace('/*@style*/',()=>rd('src/style.css')).replace('/*@worker*/',()=>dir('src/worker')).replace('/*@game*/',()=>dir('src/game').replace(/__VERSION__/g,ver));
fs.writeFileSync('index.html',out);
console.log('index.html kész, verzió:',ver,'méret:',out.length);
