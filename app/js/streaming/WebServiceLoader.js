
MediaPlayer.dependencies.WebServiceLoader = function () {
    "use strict";

    var doLoad = function () {
            var xmlhttp = new XMLHttpRequest(),
            	bufferLevelMetrics = null,
            	trhoughSegMetrics = null,
                self = this;

            	bufferLevelMetrics = self.metricsBaselineExt.getThroughSegs();
            	trhoughSegMetrics = self.metricsExt.getBufferLevels();
            	
            	
                xmlhttp.open("GET", "http://localhost/webservice/webservice.php", true);
                
/*
                req.setRequestHeader("Cache-Control", "no-cache");
                req.setRequestHeader("Pragma", "no-cache");
                req.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
*/

                xmlhttp.setRequestHeader('Content-Type', 'application/json');

                xmlhttp.send(JSON.stringify(bufferLevelMetrics););
                xmlhttp.send(JSON.stringify(trhoughSegMetrics););
        }
        
    return {
        metricsModel: undefined,
        manifestModel: undefined,
        debug: undefined,
        manifestExt: undefined,
        metricsBaselineExt: undefined,

        load: function () {

            doLoad.call();
            
            return deferred.promise;
        }
       
    };
};

MediaPlayer.dependencies.WebServiceLoader.prototype = {
    constructor: MediaPlayer.dependencies.WebServiceLoader
};