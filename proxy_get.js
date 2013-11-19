// 1.create redis client to connect to redis-server
// 2.push all the proxy host:port to redis(local)
// 3.recursively call the function to process each proxy
// 4.update the result to redis(10)
// 192.168.1.82 select 10 

var proxyDetector = {
	
	initialize: function(){
		
		this.initRedis();	
		
	},
	
	initRedis: function() {
		var that = this;
		var interval = 5;
		var Redis = require("redis");
		var fs = require("fs");
		var Url = require("url");
		var url = Url.parse('redis://root:AY29WRdLbAq2@192.168.1.243:6379')
		var port  = url.port;
		var host = url.hostname;
		var auth = url.auth;
		var http = require("http");
		
		that.http = http;
		that.fs = fs;
		that.interval = interval;
		that.proxyHosts = "";
		
		that.redis = Redis.createClient(port, host);	
	},
	
	testProxyServer: function(){
		
		var that = this;
		var redis = that.redis;
		var proxyServers = "";
		var key = "hosts";	
		var hostName;
		var portNum;
		var http = that.http;
		var fs = require("fs");
		
		var lineReader = require('line-reader');
		var moment = require('moment');	
		
		redis.select(10);

		redis.spop(key, function(err,result){
				if(err){
					console.log('ERR:', err);
				}else{
					if(result != null){

						
						console.log('pro:' + result);
						
						hostName = result.split(":")[0];
						portNum = result.split(":")[1];
						console.log(hostName + " " + portNum);
						
						var start = new Date();
						var startDate = moment(start);		
						
						var options = {
						  hostname: hostName,
						  port: portNum,
						  path: 'http://www.douban.com',
						  method: 'GET'
						};

						var req = http.get(options, function(res) {					  
						  
						  res.setEncoding('utf8');
						  res.on('data', function (chunk) {
							  console.log('STATUS: ' + res.statusCode);
							  console.log('HEADERS: ' + JSON.stringify(res.headers));
							  console.log("Http request: " + hostName + " " + portNum);						  		  
							
							//
							if(chunk && (res.statusCode === "200" || chunk.indexOf("all rights reserved") > -1 || chunk.indexOf("redirected") > -1)){
								var endDate = moment(new Date());
								var secondsDiff = endDate.diff(startDate, 'seconds');
								
								var newkey = "hosts_";
								
								if(secondsDiff < 3){
									newkey = newkey + "3";
								}else if(secondsDiff < 5){
									newkey = newkey + "5";
								}else if(secondsDiff < 10){
									newkey = newkey + "10";
								}else {
									newkey = newkey + "unknown";
								}
								
								console.log('BODY: ' + chunk);
								
								proxyServers = options.hostname + ":" + options.port;
								
								redis.sadd(newkey, proxyServers, function (err){
									if(err){
										console.log('ERROR :', err);
									}
									});
														
								console.log('Request took:', secondsDiff, 's');							
							}

						  });
						  

						  
						}).on('error', function(e) {
						  console.log('problem with request: ' + e.message + ". " + options.hostname + ":" + options.port);
						});
						
				
					setTimeout(function () {
							that.testProxyServer();
						}, 5000);	
						
					}
					
				}
			});			
	},
	
	process: function(){
		
		this.initialize();
		var that = this;
		var lineReader = require('line-reader');
		var moment = require('moment');
		var http = that.http;	
		var interval = that.interval;
		var redis = that.redis;
		
		http.globalAgent.maxSockets = 100;

		that.testProxyServer();

	}
};
proxyDetector.process();
/*
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.minute = 35;

schedule.scheduleJob(rule, function(){
    proxyDetector.process();
});
*/
