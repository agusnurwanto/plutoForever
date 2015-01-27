#!/bin/bash

# deklarasi path
tm=5;
basePath=`dirname $(readlink -f ./startMonitor.sh)`;
path_bcat=${basePath}"/monitorBcat";
path_log=${basePath}"/log";

# deklarasi array maskapai
# disesuaikan dengan server yang dipakai
# biarkan kosong jika ga pakai server airline
declare -a log=("Garuda" "Citilink" "Express" "Sriwijaya" "Airasia" "Lion")

# deklarasi nama file untuk start bcat
# jika bukan server Pluto maka variable Pluto dihapus saja
declare -a logfile=("MonitorAllServer" "Pluto")

# menambahkan variable airline ke start_bcat
arraylength=${#log[@]}
for(( i=0; i<${arraylength}; i++ ))
do
    logfile[i+2]=${log[i]}
done

# lakukan infinity loop untuk cek server
while [ true ]
do
    date;

    # jalankan cekServer.js
    # membuat file di monitorBcat jika ada port yang mati
    echo "node ${basePath}/cekServer.js";
    node ${basePath}/cekServer.js;

    sleep ${tm};

    cek_bcat="ls ${path_bcat}";
    echo ${cek_bcat};
    cek_bcat=`${cek_bcat}`;
    start_bcat=(${cek_bcat// / });

    # lakukan pengecekan dan restart bcat bila mati
    arraylength=${#start_bcat[@]}
    for(( i=0; i<${arraylength}; i++ ))
    do
        echo ${cek_bcat};
        start="${path_bcat}/${start_bcat[i]}"
        echo "cek -f" ${start};
        if [ -f "${start}" ]
        then
            cek_bcat=${start_bcat[i]};
            airline=$(echo ${cek_bcat} | cut -d. -f1);
            port=$(echo ${cek_bcat} | cut -d. -f2);

            echo "cek airline ${airline} port ${port}";

            # cek tail apakah aktif
            cek_tail=`ps ax | grep tail\ -f\ ${path_log}/${airline}.log | grep -o '^[ ]*[0-9]*' | tr -d ' '`;
            arrIN=(${cek_tail// / });

            # cek apakah script sudah dijalankan
            if [ -n "${arrIN[1]}" ]
            then
                # stop process
                kill ${arrIN[0]};
                echo "kill ${arrIN[0]}";
            fi

            if [ -n "${port}" ]
            then
                tail -f ${path_log}/${airline}.log | bcat --port ${port} &
            fi
            echo `rm ${start}`;
        fi
    done

    sleep ${tm};

    # dapatkan total size folder log
    size=`du log`;
    size1="${size/log/}";
    size2=`echo "${size1/\t/}" | xargs`;

    # Reset size log file bila lebih dari 100mb
    if [ "$size2" -gt 100000 ]
    then
        arraylength=${#log[@]}
        for(( i=0; i<${arraylength}; i++ ))
        do
            # Reset size log file
            logfile[i+2]=${log[i]}
            echo "" > ${path_log}"/${airline[i]}.log";
            echo "echo \"\" > ${path_log}\"/${airline[i]}.log\"";

            # Remove file err.log
            err_log="${path_log}/${airline[i]}.err.log";
            if [ -f "$err_log" ]
            then
                echo `rm "$err_log";`
            fi
        done
    fi

    sleep ${tm};

    # cek redis
    printf "ps ax | grep redis\n\n";
    cek_redis=`ps ax | grep redis`;
    if [[ "$cek_redis" != *"redis-server"* ]]
    then
        echo "Redis OFF and run auto START";
        redis-server;
    fi

    sleep ${tm};

done