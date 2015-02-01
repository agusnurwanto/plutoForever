var exec = require('exec');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = 'monitorBcat/';
var log = 'log/';
var dir = __dirname;
var configs = JSON.parse(fs.readFileSync('../../config_monitor.json', 'utf8').trim());
var path_pluto = configs.path.Pluto;
var path_airbinder = configs.path.Airbinder;

if (path_pluto && !fs.existsSync(path_pluto)) {
	return clog(path_pluto+': No such file or directory');
}else if (path_airbinder && !fs.existsSync(path_airbinder)) {
	return clog(path_airbinder+': No such file or directory');
}

/**
 * cek or mkdir
 * @param  {url}
 * @return {function}
 */
mkdirp(dir+'/'+path, function(err) {});
mkdirp(dir+'/'+log, function(err) {});

if(!process.env.SCRAPE_HOST){
	cexec('echo "'+configs.config.SCRAPE_HOST+'" > SCRAPE_HOST',function (error, stdout, stderr) {});
}

/**
 * cek apakah ini server Pluto
 * jika bukan hanya cek forever saja!
 * @param  {object} !configs.Pluto
 * @return {bolean}
 */
if(!configs.Pluto){
	cekForever(false);
	return true;
}

/**
 * cek elasticsearch
 * cek list forever
 */
cexec('service elasticsearch status', function (error, stdout, stderr) {
	if(stdout.indexOf('elasticsearch is running') != '-1'){
		clog('elasticsearch = ON');
	}else{
		clog('elasticsearch = OFF');
		cexec('service elasticsearch start', function (error, stdout, stderr) {});
	}
	cekForever(true);
	return true;
});

/**
 * singkatan dari console.log
 * @param  {string} log
 * @return {bolean}    
 */
function clog(log){
	console.log('----',log);
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
function cekForever(db){
	cexec('forever list', function (error, stdout, stderr) {
		for(var i in configs){
			if(configs[i].type=='airline'){
				var daemon = 'daemon_'+i.toLowerCase();
				if(stdout.indexOf(daemon) != '-1'){
						clog(daemon+' = ON');
				}else{
					clog(daemon+' = OFF');
					if(i=='Lion'||i=='Airasia')
						cexec('cd '+ path_airbinder +' && '+configs[i].start, function () {});
					else
						cexec('cd '+ path_pluto +' && '+configs[i].start, function () {});
				}
			}
		}
		if(db){
			if(stdout.indexOf('bin/www') != '-1'){
				clog('bin/www = ON');
			}else{
				clog('bin/www = OFF');
				cexec('cd '+ path_pluto +' && npm run start:pluto', function () {});
			}
		}

		setTimeout(function(){
			/**
			 * melakukan pengecekan port bcat
			 * membuat file untuk start bcat
			 * @param  {string} stdout  
			 */
			cexec('ps ax | grep bcat', function (error, stdout, stderr) {
				var cek = false;
				for(var i in configs){
					(function(i){
						if(configs[i].type!='path' || configs[i].type!='config'){
							if(stdout.indexOf(configs[i].port) == '-1'){
								cexec('touch monitorBcat/'+ configs[i].name +'.'+ configs[i].port,function (error, stdout, stderr) {});
								cek = true;
								clog("bcat "+configs[i].name+" port "+configs[i].port+" OFF");
							}
						}
					})(i);
				}
				if(cek == false){
					clog("All bcat = ON");
				}
			});
		},1000 );
	})
}