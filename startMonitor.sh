#!/bin/bash

# DOKUMENTASI
# 
# jalankan file ini untuk startMonitor.sh
# ./startMonitor.sh stop => berfungsi untuk stop monitor server
# 
# jika ada catatan lain silahkan dicomment di sini! :)

# deklarasi variable path
path=`dirname $(readlink -f ./startMonitor.sh)`;
start_monitor="./monitorAllServer.sh > log/MonitorAllServer.log";

# cek prosess di server
a=`ps ax | grep monitorAllServer.sh | grep -o '^[ ]*[0-9]*' | tr -d ' '`
arrIN=(${a// / });

if [ "$1" == "start" ]
then
	# cek apakah script sudah dijalankan
	if [ -z ${arrIN[1]} ]
	then
		echo "starting monitorAllServer.sh!";
		echo "${start_monitor} &";
		./monitorAllServer.sh > ${path}/log/MonitorAllServer.log &
	else
		echo "script is running in ps ${arrIN[0]}";
	fi
elif [ "$1" == "stop" ]
then
	if [ -z ${arrIN[1]} ]
	then
		echo "script not running!";
	else
		kill ${arrIN[0]}
		echo "kill ${arrIN[0]}";
		echo "stop monitor!";
	fi
elif  [ "$1" == "restart" ]
then
	if [ -z ${arrIN[1]} ]
	then
		echo "script not running!";
	else
		# stop process
		kill ${arrIN[0]}
		echo "kill ${arrIN[0]}";
		echo "stop monitor!";

		# start process
		echo "starting monitorAllServer.sh!";
		echo "${start_monitor} &";
		./monitorAllServer.sh > ${path}/log/MonitorAllServer.log &
	fi
else
	echo "not supported method";
	echo "$0 start|stop|restart";
fi