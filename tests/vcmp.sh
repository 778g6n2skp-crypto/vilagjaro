#!/bin/bash
# usage: vcmp.sh file1 file2
for f in "$@"; do echo "=== $f"; for r in "47.49848 19.0408 47.49975 19.04760" "47.4990 19.0388 47.5032 19.0392" "47.5250 19.0200 47.5285 19.0270" "47.4935 19.0385 47.4985 19.0388"; do
 echo -n "$r : "; SWEEP=${SWEEP:-0} VJ_FILE=$f timeout 900 python3 vdrive.py $r 2>&1 | grep hossz | cut -c1-200; done; done
