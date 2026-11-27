#!/bin/bash
# usage: runworld.sh file.html out.txt
F=$1; O=$2; : > $O
run(){ VJ_FILE=$F timeout 700 python3 vworld.py $1 $2 $3 2>&1 | grep '^RES' >> $O || echo "RES {\"name\":\"$1\",\"FAIL\":1}" >> $O; }
while read a b c; do run $a $b $c & if (( $(jobs -r | wc -l) >= 2 )); then wait -n; fi; done < places.txt; wait
