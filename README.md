# Világjáró

Böngészős autós játék valós térképadatokból: vezess bárhol a világon.

**Játék:** https://778g6n2skp-crypto.github.io/vilagjaro/

## Felépítés

A játék forrása modulokra van bontva a `src/` mappában. Ezekből a `build.mjs` állítja össze az egyfájlos `index.html`-t, amit a GitHub Pages kiszolgál.

| Mappa / fájl | Mi van benne |
|---|---|
| `src/page.html` | Az oldal váza (HTML, kezelőfelület) |
| `src/style.css` | Megjelenés, telefonos elrendezés |
| `src/worker/` | Háttérszál: domborzat, térképcsempék, OSM-adatok, hidak, csempék felépítése |
| `src/game/` | A játék: megjelenítés, fizika, forgalom, hang, térkép, kezelőfelület |
| `VERSION` | Verziószám, a játékban a beállítások alján és az induló képen látszik |
| `tests/` | Automatikus tesztek (valódi térképadaton is) |

## Összeállítás

```
node build.mjs
```

Minden változtatás után: összeállítás, tesztek a régi és az új verzión ugyanazokon az útvonalakon, és csak akkor kerül fel, ha semmi nem lett rosszabb.

## Adatforrások

OpenStreetMap közreműködők (ODbL), OpenFreeMap vektorcsempék, Terrarium domborzat (AWS Open Data), Mapillary utcafotók (CC BY-SA).
