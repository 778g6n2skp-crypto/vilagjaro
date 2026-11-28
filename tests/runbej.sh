#!/bin/bash
F=$1
run(){ VJ_FILE=$F timeout 1500 python3 vbejaras.py $1 $2 $3 400 4 2>&1 | grep KÉSZ >> bej_log.txt; }
: > bej_log.txt
while read a b c; do run $a $b $c & if (( $(jobs -r | wc -l) >= 2 )); then wait -n; fi; done < places.txt; wait
