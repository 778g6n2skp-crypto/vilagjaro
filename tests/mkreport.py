import json, math, html, os
from PIL import Image
OUT = '/home/claude/report'
places = [l.split()[0] for l in open('/home/claude/test/places.txt') if l.strip()]
DESC = {'borulás': 'az autó felborult',
        'leesés': 'az autó több mint 1,2 m-rel az út szintje alá került (leesett vagy beesett)',
        'út alatt': 'az autó fölött 1,2–3 m-en belül útfelület van (túl alacsony felüljáró vagy egymásra csúszott rétegek)',
        'letérés': 'a tesztautó nem tudta követni az utat',
        'elakadás': 'gázt ad, de 2,5 másodpercig nem halad (épületnek, falnak, peremnek ment)',
        'ütközés': 'hirtelen lassulás (több mint 4 m/s egy tized másodperc alatt)',
        'levegőben': '0,35 másodpercnél tovább a levegőben',
        'döccenés': 'hirtelen függőleges lökés (30 m/s² fölött)'}
ORDER = ['borulás', 'leesés', 'út alatt', 'letérés', 'elakadás', 'ütközés', 'levegőben', 'döccenés']
NAMES = {'SanFrancisco': 'San Francisco', 'Tokio_Shibuya': 'Tokió, Shibuya', 'Rio_SantaTeresa': 'Rio, Santa Teresa', 'Zermatt': 'Zermatt',
         'Manhattan': 'Manhattan', 'Mumbai': 'Mumbai', 'Nairobi': 'Nairobi', 'Lisszabon_Alfama': 'Lisszabon, Alfama', 'Dubai': 'Dubaj',
         'Iowa_videk': 'Iowa (vidék)', 'Hongkong_Central': 'Hongkong, Central', 'Budapest_Buda': 'Budapest, Buda', 'Budapest_Taban': 'Budapest, Tabán'}
esc = lambda s: html.escape(str(s))
osm = lambda e: f"https://www.openstreetmap.org/?mlat={e['lat']}&mlon={e['lon']}#map=19/{e['lat']}/{e['lon']}"
rows = []; cards = []; tot_km = 0; tot = {k: 0 for k in ORDER}
for pl in places:
    f = f'/tmp/bej_{pl}.json'
    if not os.path.exists(f): continue
    d = json.load(open(f)); km = max(.1, d['km']); tot_km += km
    cl = []
    for e in d['ev']:
        for c in cl:
            if c['type'] == e['type'] and math.hypot(c['x'] - e['x'], c['z'] - e['z']) < 15:
                c['n'] += 1; c['val'] = max(c['val'], e['val']); break
        else:
            cl.append(dict(e, n=1))
    cnt = {k: sum(1 for c in cl if c['type'] == k) for k in ORDER}
    for k in ORDER: tot[k] += cnt[k]
    rows.append((pl, km, d['lefedettseg'], cnt, sum(cnt.values()) / km))
    shots = []
    for i, (fn, e) in enumerate(d['shots'][:4]):
        im = Image.open(fn).convert('RGB'); im.thumbnail((640, 360))
        rel = f'img/{pl}_{i}.jpg'; im.save(f'{OUT}/{rel}', quality=72); shots.append((rel, e))
    cards.append((pl, cl, shots))
rows.sort(key=lambda r: -r[4])
trs = ''.join(f"<tr><td>{esc(NAMES.get(p, p))}</td><td class=n>{km:.1f}</td><td class=n>{cov}%</td>" + ''.join(f"<td class=n>{c[k] or ''}</td>" for k in ORDER) + f"<td class='n b'>{per:.1f}</td></tr>" for p, km, cov, c, per in rows)
sec = ''
for pl, cl, shots in sorted(cards, key=lambda x: -len(x[1])):
    if not cl:
        sec += f"<section class=pl><h3>{esc(NAMES.get(pl, pl))}</h3><p class=ok>Nem talált hibát a bejárt utakon.</p></section>"; continue
    figs = ''.join(f"<figure><img src='{esc(s)}' alt='{esc(e['type'])}' loading=lazy><figcaption><b>{esc(e['type'])}</b> · {e['val']} · <a href='{esc(osm(e))}'>{e['lat']:.5f}, {e['lon']:.5f}</a></figcaption></figure>" for s, e in shots)
    li = ''.join(f"<li><b>{esc(c['type'])}</b> {c['val']}{' (' + str(c['n']) + '×)' if c['n'] > 1 else ''} · <a href='{esc(osm(c))}'>{c['lat']:.5f}, {c['lon']:.5f}</a></li>" for c in sorted(cl, key=lambda c: (ORDER.index(c['type']), -c['val']))[:40])
    sec += f"<section class=pl><h3>{esc(NAMES.get(pl, pl))} <span>{len(cl)} hibahely</span></h3><div class=g>{figs}</div><details><summary>Hibahelyek listája ({len(cl)})</summary><ol>{li}</ol></details></section>"
leg = ''.join(f"<li><b>{k}</b>: {DESC[k]}</li>" for k in ORDER)
totline = ', '.join(f"{k} {tot[k]}" for k in ORDER if tot[k])
page = f"""<!DOCTYPE html><html lang=hu><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Tesztautó-bejárás</title>
<link rel=preconnect href=https://fonts.googleapis.com><link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;800&display=swap" rel=stylesheet>
<style>
/* VOICE: tárgyilagos munkanapló
   IDEA: útellenőri jegyzőkönyv – helyszínenként a hibák, fényképpel
   PICTURE: az összesítő táblázat, alatta a hibahelyek képei
   COLOUR and TYPE: fehér/fekete, egy piros kiemelés; Figtree
   LAYOUT: összesítés elöl, utána helyszínenként */
:root{{color-scheme:light dark;--bg:light-dark(#fff,#0e1116);--ink:light-dark(#14161a,#e8eaee);--mut:light-dark(#5b616b,#9aa1ab);--line:light-dark(#e3e5e8,#262b33);--acc:#e6261f}}
:root[data-theme=light]{{color-scheme:light}}:root[data-theme=dark]{{color-scheme:dark}}
*{{box-sizing:border-box;min-width:0}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 Figtree,system-ui,sans-serif;overflow-x:clip}}
.band{{padding:clamp(24px,4vw,56px) max(5vw,16px);max-width:1240px;margin:0 auto}}
h1{{font-size:clamp(30px,5vw,48px);line-height:1.05;margin:0 0 10px;font-weight:800;text-wrap:balance}}h2{{font-size:24px;margin:34px 0 10px}}h3{{font-size:20px;margin:0 0 10px}}h3 span{{color:var(--mut);font-weight:400;font-size:15px;margin-left:8px}}
p.lead{{color:var(--mut);max-width:70ch;margin:0 0 20px}}
.scroll{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;font-size:14px}}th,td{{padding:8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}}th{{font-weight:600;color:var(--mut)}}td.n,th.n{{text-align:right}}td.b{{font-weight:800;color:var(--acc)}}
.pl{{border-top:2px solid var(--ink);padding-top:16px;margin-top:28px}}.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:12px}}
figure{{margin:0}}figure img{{width:100%;height:auto;display:block;border-radius:6px}}figcaption{{font-size:13px;color:var(--mut);padding-top:4px}}figcaption b{{color:var(--ink)}}
a{{color:inherit}}details{{margin-top:10px}}summary{{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}}ol{{font-size:14px;padding-left:22px}}.ok{{color:var(--mut)}}
ul.leg{{font-size:14px;color:var(--mut);padding-left:18px}}ul.leg b{{color:var(--ink)}}
</style></head><body><main class=band>
<h1>Tesztautó-bejárás: {sum(tot.values())} hibahely {tot_km:.0f} km úton</h1>
<p class=lead>A tesztautó 13 helyen, helyenként kb. 4 km-t vezetett végig a betöltött utakon, és minden szokatlan eseményt feljegyzett. Az egymáshoz 15 m-en belül eső, azonos típusú események egy hibahelynek számítanak. Verzió: v21. Összesen: {esc(totline)}.</p>
<div class=scroll><table><thead><tr><th>Hely</th><th class=n>km</th><th class=n>bejárva</th>{''.join(f'<th class=n>{k}</th>' for k in ORDER)}<th class=n>hiba/km</th></tr></thead><tbody>{trs}</tbody></table></div>
<h2>Mit jelentenek</h2><ul class=leg>{leg}</ul>
<h2>Helyszínek, a legsúlyosabb hibák képével</h2>{sec}
</main></body></html>"""
open(f'{OUT}/index.html', 'w').write(page)
print(len(page), sum(tot.values()), round(tot_km, 1), tot)
for r in rows: print(r[0], round(r[1], 1), r[2], round(r[4], 2), {k: v for k, v in r[3].items() if v})
