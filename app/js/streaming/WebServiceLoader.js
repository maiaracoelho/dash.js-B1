
MediaPlayer.dependencies.WebServiceLoader = function () {
    "use strict";

    var doLoad = function (metrics, metricsBaseline) {
            var xmlhttp = new XMLHttpRequest(),
            	bufferLevelMetrics = [],
            	trhoughSegMetrics = [],
                self = this, 
                url = "http://localhost/webservice/webservice.php";
            	
            if ( metrics == 0 && metricsBaseline == 0){
            	
            	bufferLevelMetrics = null;
            	trhoughSegMetrics = null;
            	
                xmlhttp.open("GET", url);
                xmlhttp.setRequestHeader("Content-Type", "application/json");
            	
            }else{
            	bufferLevelMetrics = metrics.BufferLevel;
            	trhoughSegMetrics = metricsBaseline.ThroughSeg;
            	
                self.debug.log("BufferLevel: "+ bufferLevelMetrics[0].level);

                xmlhttp.open("POST", url);
                xmlhttp.setRequestHeader("Content-Type", "application/json");
            }
            
            var arqJson = '{ "bufferLevelMetrics": ' +JSON.stringify(bufferLevelMetrics);
        	arqJson += ', "throughSegMetrics": '+ JSON.stringify(trhoughSegMetrics)+' }';
        
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

        load: function (metrics, metricsBaseline) {
        	
            doLoad.call(this, metrics, metricsBaseline);

            return;
        }
       
    };
};

MediaPlayer.dependencies.WebServiceLoader.prototype = {
    constructor: MediaPlayer.dependencies.WebServiceLoader
};