// crawl from seeds file
// add all of the links which crawled to redis links(set)
// for each link, get the whole html content
// regex for match IP and port
// add host:port to redis hosts(set)
// 192.168.1.83 select 10 

//http://www.youdaili.cn/Daili/http/
//http://www.youdaili.cn/Daili/guonei/
//http://www.youdaili.cn/Daili/guowai/
//http://www.cnproxy.com/
//http://www.freeproxylists.net

var proxyFounder = {
	
	initialize: function(){
		this.initCrawler();
		this.initRedis();
	},
	
	initCrawler: function() {
	console.log('initCrawler');

	    var that = this;
	    var Crawler = require("crawler");
	    var Schedule = require('node-schedule');
	    var Crawler = Crawler.Crawler;
	     //v="3";m="4";a="2";l="9";q="0";b="5";i="7";w="6";r="8";c="1"
	    var strPort = "qcavmbwirl";
	    
	    that.strPort = strPort;
	    that.schedule = Schedule;
	
	    that.crawler = new Crawler({
	      maxConnections: 1,
	      forceUTF8:true,
	      timeout: (1000 * 20)
	    });	
	},
	
	initRedis: function() {
	console.log('initRedis');
		
	    var that = this;
	    var Redis = require("redis");
	    var Url = require("url");
	    var url = Url.parse('redis://root:AY29WRdLbAq2@192.168.1.243:6379')
	    var port  = url.port;
	    var host = url.hostname;		
	    that.redis = Redis.createClient(port, host);
	    console.log('connected to ' + host + port);
	},
	
	addLinks:function() {
		console.log('addLinks');
		var that = this;
		var lineReader = require('line-reader');	
		var redis = that.redis;
		var key = "seeds";
		
		redis.select(10);		
		//
		that.redis.del('hosts', function(err){
				
				});
		
		lineReader.eachLine('./hosts', function(line, last) {
			console.log(line);
			
				redis.sadd(key, line, function (err){
				if(err){
						console.log('ERROR a:', err);
					} else {
						console.log('links :', line);
					}
				});	
			if(last){
				console.log('process :');
			}		
		});		
	},
	
	process: function() {
		
		console.log('process begin:');	
		this.initialize();
		//add all of the links to redis
		this.addLinks();
		
		//for each link, get the whole html content
		var that = this;
		var redis = that.redis;
		var proxyServers = "";
			
		var hostName;
		var portNum;
		var http = that.http;

		that.processSeeds();
	},
	
	processSeeds: function(){
		console.log('processSeed');
		var that = this;
		var key = "seeds";
		var redis = that.redis;
		var fs = require("fs");
		
		redis.select(10);

		redis.srandmember(key, function (err, seeds){
		
		      if (err) {
		
			console.log(err);
		
		      } else {
		      	      console.log("seeds :" + seeds);
				
			that.processEachSeed(seeds, function (err) {

		
			});
			that.processSeeds();	
		
		      }
		
		    });		
				
	},

	processEachSeed: function(seeds, proc){
		console.log('processEachSeed');
		var that = this;
		var fs = require("fs");
		var key = "seeds";
		var strPort = that.strPort;
		
		
		crawler = that.crawler;
		var redis = that.redis;		
		redis.select(10);
		
		var cnproxyreg = {
				url:/http:\/\/www\.\w+\.\w+\/proxy\d+.html/,
				ip:/\d+\.\d+\.\d+\.\d+/g, 
				port:/(\+[vmalqbiwrc]){2,4}/g};
		var youdailireg = {	
			url:/http:\/\/www\.\w+\.\w+.*\/\d+_?\d+?\.html/,
				ip:/\d+\.\d+\.\d+\.\d+:\d+/g};
		
		console.log("param: " + seeds);
		    if (seeds) {
		
		      crawler.queue([{
		
			uri: seeds,
			
			callback: function(err, result, $) {
		
			  if (err) {
		
			    console.log(err);
		
			  } else {
			  	  console.log("uri: " + seeds);		  	  
			 
				//extract IPs from seeds
				var rawHtml = result.body.toString();
				
				var validCnproxy = seeds.match(cnproxyreg.url);
				var validYdl = seeds.match(youdailireg.url);

				if(validCnproxy){

			  	  var ipaddress = rawHtml.match(cnproxyreg.ip);

			  	  var ports = rawHtml.match(cnproxyreg.port);
			  	  
			  	  for(var i = 0; i < ipaddress.length;i++){
			  	  	  
			  	  	 var port = ports[i].replace(/\+/g,"").replace(/v/g,3).replace(/m/g,4).replace(/a/g,2)
			  	  	  	.replace(/l/g,9).replace(/q/g,0).replace(/b/g,5).replace(/i/g,7).replace(/w/g,6).replace(/r/g,8).replace(/c/g,1);
			  	  	  	/*		  
			  	  	  	fs.appendFile('./crwal2.log',  validCnproxy + ":" + ipaddress[i] + ":" + port + "\n", function (err) {
			  	  	  		 if (err) {
			  	  	  		 	 console.log("ERROR: " + err);
							}
							
					  
							 });*/
			  	  	  	
			  	  	  	redis.sadd("hosts", ipaddress[i] + ":" + port, function (err){
					if(err){
							console.log('ERROR a:', err);
						} else {
							console.log('keys :', ipaddress[i] + ":" + port);
						}
						
					});
			  	  	  
			  	  }			  	  

				}
				
				if(validYdl){

			  	  var ipaddress = rawHtml.match(youdailireg.ip);

			  	  
			  	  for(var i = 0; i < ipaddress.length;i++){
			  	  	  /*
			  	  	  	fs.appendFile('./crwal2.log',  validYdl + ":" + ipaddress[i] + "\n", function (err) {
			  	  	  		 if (err) {
			  	  	  		 	 console.log("ERROR: " + err);
							}
							
					  
							 });*/			  	  	  
			  	  	  			  
			  	  redis.sadd("hosts", ipaddress[i], function (err){
					if(err){
							console.log('ERROR a:', err);
						} else {
							console.log('keys :', ipaddress[i] + ":" + port);
						}
						
					});
			  	  	  
			  	  }			  	  

				}

			  	   $("a").each(function(index,a) {
					
					console.log("a.href: " + a.href);

					var link = "";
					
					//var rePattern_cnproxy = /http:\/\/www\.\w+\.\w+\/proxy\d+.html/;
					//var rePattern_ydl = /http:\/\/www\.\w+\.\w+.*\/\d+\.html/;
					
					var rePattern_cnproxy = cnproxyreg.url;
					var rePattern_ydl = youdailireg.url;
					
					var cnproxy = a.href.match(rePattern_cnproxy);
					var ydl = a.href.match(rePattern_ydl);
					if(cnproxy){
						link= cnproxy;
					}
					if(ydl){
						link = ydl;
					}
					   //update url to redis db
					   redis.sadd(key, link, function(err){
							   if(err){
								   console.log();
							   }else {
								   console.log("Added links: " + key + " Link " + link);
							   }
					   });			
					
				   });				
 
		
			  }
		
			}
		
		      }]);

				   
		
		    }		
	}
	
};
/*
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.minute = 48;

schedule.scheduleJob(rule, function(){
    proxyFounder.process();
});
*/
proxyFounder.process();


