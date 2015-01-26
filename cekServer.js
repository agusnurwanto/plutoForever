var exec = require('exec');
var fs = require('fs');
var path = 'monitorBcat/';
var dir = __dirname;
var configs = JSON.parse(fs.readFileSync(dir+'/config_monitor.json', 'utf8').trim());
var data = {};
var folderPluto = 'scrapePluto';
var folderAirbinder = 'scrapeAirbinder';

/**
 * melakukan pengecekan port bcat
 * membuat file untuk start bcat
 * @param  {string} stdout  
 */
cexec('ps ax | grep bcat', function (error, stdout, stderr) {
	for(var i in configs){
		if(stdout.indexOf(configs[i].port) == '-1'){
			cexec('touch monitorBcat/'+i,function (error, stdout, stderr) {});
		}
	}
});

/**
 * cek apakah ini server Pluto
 * jika bukan hanya cek forever saja!
 * @param  {object} !configs.Pluto
 * @return {bolean}
 */
if(!configs.Pluto){
	cekForever(data, false);
	return true;
}

/**
 * cek elasticsearch
 * cek list forever
 */
cexec('service elasticsearch status', function (error, stdout, stderr) {
	if(stdout.indexOf('elasticsearch is running') != '-1'){
		data['elasticsearch'] = 'ON';
	}else{
		data['elasticsearch'] = 'OFF';
		cexec('service elasticsearch start', function (error, stdout, stderr) {});
	}
	cekForever(data, true);
	return true;
});

/**
 * singkatan dari console.log
 * @param  {string} log
 * @return {bolean}    
 */
function clog(log){
	console.log('----',log,'\n');
}

/**
 * menjalankan exec dengan node
 * @param  {string}   method perintah CMD
 * @param  {function} cb     callback
 * @return {bolean}          
 */
function cexec(method, cb){
	clog(method);
	exec(method,cb);
}

/**
 * Melakukan pengecekan forever node apa saja yang jalan
 * Start forever jika ditemukan forever mati
 * @param  {object} data
 * @param  {bolean} db   bolean apakah ini server elastic atau bukan
 * @return {bolean}      
 */
function cekForever(data, db){
	cexec('forever list', function (error, stdout, stderr) {
		for(var i in configs){
			if(configs[i].type=='airline'){
				var daemon = 'daemon_'+i.toLowerCase();
				if(stdout.indexOf(daemon) != '-1'){
						data[daemon] = 'ON';
				}else{
					data[daemon] = 'OFF';
					if(i=='Lion'||i=='Airasia')
						cexec('cd ../../../'+ folderAirbinder +' && '+configs[i].start, function () {});
					else
						cexec('cd ../../../'+ folderPluto +' && '+configs[i].start, function () {});
				}
			}
		}
		if(db){
			if(stdout.indexOf('bin/www abdul') != '-1'){
				data['bin/www abdul'] = 'ON';
			}else{
				data['bin/www abdul'] = 'OFF';
				cexec('cd ../../../'+ folderPluto +' && npm run start:pluto', function () {});
			}
		}
		var a = new Date(),
			y = a.getFullYear(),
			m = a.getMonth()+1,
			d = a.getDate(),
			h = a.getHours(),
			i = a.getMinutes(),
			s = a.getSeconds();
		data['time'] = d+'-'+m+'-'+y+' '+h+':'+i+':'+s;

		clog(JSON.stringify(data));
	})
}