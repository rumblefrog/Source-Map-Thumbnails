#!/bin/bash
IFS=$'\n'
files=( $(ls | grep .bsp | grep tfdb_) )
touch -f output.txt
for file in ${files[@]}; do
    echo '"'$file'",' >> output.txt
done