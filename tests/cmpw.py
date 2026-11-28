import json,sys
def load(f):
    d={}
    for l in open(f):
        if l.startswith('RES '):
            q=json.loads(l[4:]);d[q['name']]=q
    return d
A=load(sys.argv[1]);B=load(sys.argv[2])
print(f"{'hely':18} {'lépcső5/km':>14} {'lépcső15/km':>14} {'max':>12} {'lebeg':>9} {'süllyed':>9} {'betölt s':>11} {'plató%':>10} {'szakadék%':>10} {'fehér%':>8} {'szög/km':>10} {'szakadás':>9} {'csp-elt%':>10} {'határ%':>10} {'úthiány%':>12}")
for k in A:
    a=A[k];b=B.get(k,{})
    f=lambda key:f"{a.get(key,'-')}→{b.get(key,'-')}"
    print(f"{k:18} {f('lepcso5_km'):>14} {f('lepcso15_km'):>14} {f('max'):>12} {f('lebeg'):>9} {f('sullyed'):>9} {f('betoltes_s'):>11} {f('plato_pct'):>10} {f('szakadek_pct'):>10} {f('feher_pct'):>8} {f('szog_km'):>10} {f('szakadas'):>9} {f('csp_elteres_pct'):>10} {f('hatar_lepcso_pct'):>10} {f('uthiany_pct'):>12}")
