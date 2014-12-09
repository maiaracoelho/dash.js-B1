/* Algoritmo da Dissertacao
 */
MediaPlayer.rules.RomeroAgressiveRule = function () {
    "use strict";

    return {
        debug: undefined,
        manifestExt: undefined,
        metricsExt: undefined,
        
        checkIndex: function (current, metrics, data) {
            var self = this,
            	lastRequest = self.metricsExt.getCurrentHttpRequest(metrics),
                downloadTime,
                throughput,
                newDownloadRatio,
                deferred,
                representation1,
                representation2,
                representation3,
                currentBandwidth,
                oneUpBandwidth,
                oneDownBandwidth, 
                max,
                representationCur = current;

            self.debug.log("Checking download ROMERO AGRESSIVE rule...");
        	//self.debug.log("Tamanho metrics HttpList: " + metrics.HttpList.length);
            
            if (!metrics) {
                //self.debug.log("No metrics, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }
                        
            if (lastRequest === null) {
                //self.debug.log("No requests made for this stream yet, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }

            if (lastRequest.mediaduration === null ||
                lastRequest.mediaduration === undefined ||
                lastRequest.mediaduration <= 0 ||
                isNaN(lastRequest.mediaduration)) {
                //self.debug.log("Don't know the duration of the last media fragment, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }
          
            deferred = Q.defer();

            downloadTime = (lastRequest.tfinish.getTime() - lastRequest.tresponse.getTime())/1000;
            throughput = lastRequest.mediaduration/ downloadTime; 
            
            //self.debug.log("lastRequest Type: " + lastRequest.stream );
            //self.debug.log("lastRequest.tfinish: " + lastRequest.tfinish);
            //self.debug.log("downloadTime: " + downloadTime + "s");
            //self.debug.log("lastRequest.mediaduration: " + lastRequest.mediaduration + "s");

            if (isNaN(throughput)) {
                self.debug.log("Invalid throughput, bailing.");
                deferred.resolve(new MediaPlayer.rules.SwitchRequest());
            } else {
            	max = self.manifestExt.getRepresentationCount1(data);
            	max -= 1;
            	representation2 = self.manifestExt.getRepresentationFor1(current, data);
            	currentBandwidth = self.manifestExt.getBandwidth1(representation2);
				//self.debug.log("currentBandwidth: " + currentBandwidth + "bps");
	
				newDownloadRatio = throughput * currentBandwidth;
				//self.debug.log("newDownloadRatio: " + newDownloadRatio + "bps");
					                	            
				if (newDownloadRatio > currentBandwidth) {
					while (representationCur < max){
						representation3 = self.manifestExt.getRepresentationFor1(representationCur + 1, data);
						oneUpBandwidth = self.manifestExt.getBandwidth1(representation3);

        				if (oneUpBandwidth < newDownloadRatio){
        					//self.debug.log("switch up.");
							current += 1;
						}
						representationCur++;
					}
					//self.debug.log("Current1: " + current + "representationCur1: " + representationCur);
					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));
														
				}else{
					while (representationCur > 0){
						representation1 = self.manifestExt.getRepresentationFor1(representationCur - 1, data);
						oneDownBandwidth = self.manifestExt.getBandwidth1(representation1);
						
						if(oneDownBandwidth > newDownloadRatio){
							//self.debug.log(" switch Down.");
							current -= 1;
						}
						representationCur--;
					}
					//self.debug.log("Current2: " + current + "representationCur2: " + representationCur);
					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));	
				}
            }										
            
            return deferred.promise;
        }
    };
};
   
MediaPlayer.rules.RomeroAgressiveRule.prototype = {
    constructor: MediaPlayer.rules.RomeroAgressiveRule
};