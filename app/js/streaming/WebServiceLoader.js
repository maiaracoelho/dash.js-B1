﻿
MediaPlayer.dependencies.WebServiceLoader = function () {
    "use strict";

    var bufferLevelMetrics = [],
		trhoughSegMetrics = [],
		arqJson = "",
		runWebservice = 0,
    
    doLoad = function (metrics, metricsBaseline) {
            var xmlhttp = new XMLHttpRequest(),
                self = this, 
                url = "http://192.168.3.3/dash_vod/webservice.php";
        		runWebservice++;

            if ( metrics == 0 && metricsBaseline == 0){
            	
            	bufferLevelMetrics = null;
            	trhoughSegMetrics = null;
            	url += "?comando=/home/vod/dash_cenarios_scripts/scenario1.py";
                xmlhttp.open("GET", url, true);
            	self.debug.log(url);
                xmlhttp.setRequestHeader("Content-Type", "text/html");
            	
            }else{
            
            	bufferLevelMetrics = metrics.BufferLevel;
            	trhoughSegMetrics = metricsBaseline.ThroughSeg;
            	
                self.debug.log("BufferLevel: "+ bufferLevelMetrics.length);
                self.debug.log("trhoughSegMetrics: "+ trhoughSegMetrics.length);
                
                xmlhttp.open("POST", url, true);
                xmlhttp.setRequestHeader("Content-Type", "multipart/form-data");
            }
        
        	arqJson = '{"bufferLevelMetrics":' +JSON.stringify(bufferLevelMetrics);
        	arqJson += ', "throughSegMetrics":'+ JSON.stringify(trhoughSegMetrics)+'}';
        	
        	self.debug.log(arqJson);

            xmlhttp.onload = function () {
                    if (xmlhttp.status < 200 || xmlhttp.status > 299)
                    {
                        self.debug.log("WEBSERVICE FAIL");

                        return;
                    }else{
                        self.debug.log("WEBSERVICE SUCESS");

                    	return;
                    }
                    

            };
                
            xmlhttp.send(arqJson);
        }
        
    return {
        metricsModel: undefined,
        manifestModel: undefined,
        debug: undefined,
        manifestExt: undefined,
        metricsBaselineExt: undefined,
        tokenAuthentication:undefined,


        load: function (metrics, metricsBaseline) {
        	
            doLoad.call(this, metrics, metricsBaseline);

            return;
        }
       
    };
};

MediaPlayer.dependencies.WebServiceLoader.prototype = {
    constructor: MediaPlayer.dependencies.WebServiceLoader
};