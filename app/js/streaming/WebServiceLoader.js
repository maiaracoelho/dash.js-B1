
MediaPlayer.dependencies.WebServiceLoader = function () {
    "use strict";

    var doLoad = function (metrics, metricsBaseline) {
            var xmlhttp = new XMLHttpRequest(),
            	bufferLevelMetrics = [],
            	trhoughSegMetrics = [],
                self = this;
            	
            	self.debug.log("Chegou no WebService");
            	
            	bufferLevelMetrics = metrics.BufferLevel;
            	trhoughSegMetrics = metricsBaseline.ThroughSeg;
            	
                self.debug.log("BufferLevel: "+ bufferLevelMetrics[0].level);

                xmlhttp.open("POST", "http://localhost/webservice/webservice.php");
                
/*
                req.setRequestHeader("Cache-Control", "no-cache");
                req.setRequestHeader("Pragma", "no-cache");
                req.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
*/

                xmlhttp.setRequestHeader('Content-Type', 'application/json');
                
                var arqJson = '{ "bufferLevelMetrics": ' +JSON.stringify(bufferLevelMetrics);
                	arqJson += ', "throughSegMetrics": '+ JSON.stringify(trhoughSegMetrics)+" }";
                
                self.debug.log(arqJson);
                
                xmlhttp.send(arqJson);
        }
        
    return {
        metricsModel: undefined,
        manifestModel: undefined,
        debug: undefined,
        manifestExt: undefined,
        metricsBaselineExt: undefined,

        load: function (metrics, metricsBaseline) {
        	
        	this.debug.log("Chegou no Load");
            doLoad.call(this, metrics, metricsBaseline);
        	this.debug.log("Saiu no Load");

            return deferred.promise;
        }
       
    };
};

MediaPlayer.dependencies.WebServiceLoader.prototype = {
    constructor: MediaPlayer.dependencies.WebServiceLoader
};