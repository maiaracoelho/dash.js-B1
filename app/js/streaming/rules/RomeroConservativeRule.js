/** Algoritmo com característica de adaptação conservativa, implementado a partir da Dissertação de Romero
 * 	@class RomeroConservativeRule
 */

MediaPlayer.rules.RomeroConservativeRule = function () {
    "use strict";
    var insertThroughputs = function (throughList, availableRepresentations) {
		var self = this, representation, bandwidth, quality, downloadTime, segDuration, through;
		
		for(var i = 0; i < throughList.length; i++){
			quality = throughList[i].quality;
			representation = availableRepresentations[quality];
			bandwidth = self.metricsExt.getBandwidthForRepresentation(representation.id);
			bandwidth /= 1000; //bit/ms
			
			downloadTime = throughList[i].finishTime.getTime() - throughList[i].responseTime.getTime();
			segDuration = throughList[i].duration * 1000; 
			
			through = (bandwidth * segDuration)/downloadTime; 
			
			self.debug.log("bandwidth: " + bandwidth);
			self.debug.log("through: " + through);
			
    		self.metricsBaselinesModel.updateThroughputSeg(throughList[i], bandwidth, through);

		}
    };
    
    return {
        debug: undefined,
        manifestExt: undefined,
        metricsExt: undefined,
        metricsBaselinesModel: undefined,
        /**
         * @param {current} current - Índice da representação corrente
         * @param {metrics} metrics - Metricas armazenadas em MetricsList
         * @param {data} data - Dados de audio ou vídeo
         * @memberof RomeroConservativeRule#
         */
        checkIndex: function (current, metrics, data, metricsBaseline, availableRepresentations) {
            var self = this,
            	lastRequest = self.metricsExt.getLastHttpRequest(metrics),
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
                representationCur = current,
                SENSIVITY = 0.7;

            self.debug.log("Checking download ROMERO CONSERVATIVE rule...");

            if (!metrics) {
             	//self.debug.log("No metrics, bailing.");
             	return Q.when(new MediaPlayer.rules.SwitchRequest());
             }
             
             if (!metricsBaseline) {
             	//self.debug.log("No metrics Baseline, bailing.");
             	return Q.when(new MediaPlayer.rules.SwitchRequest());
             }
                        
             if (lastRequest == null) {
                 //self.debug.log("No requests made for this stream yet, bailing.");
                 return Q.when(new MediaPlayer.rules.SwitchRequest());
             }
          
            deferred = Q.defer();

            insertThroughputs.call(self, metricsBaseline.ThroughSeg, availableRepresentations);

            downloadTime = (lastRequest.tfinish.getTime() - lastRequest.tresponse.getTime())/1000;
            max = self.manifestExt.getRepresentationCount1(data);
        	max -= 1;
        	representation2 = self.manifestExt.getRepresentationFor1(current, data);
        	currentBandwidth = self.manifestExt.getBandwidth1(representation2);
			//self.debug.log("currentBandwidth: " + currentBandwidth + "bps");
        	           
        	throughput = (currentBandwidth * lastRequest.mediaduration)/downloadTime ; 	//verificar valores
			newDownloadRatio = throughput * SENSIVITY;
			self.debug.log("newDownloadRatio: " + newDownloadRatio + "bps");

            self.debug.log("lastRequest Type: " + lastRequest.stream );
            self.debug.log("lastRequest.tfinish: " + lastRequest.tfinish);
            self.debug.log("downloadTime: " + downloadTime + "s");
            self.debug.log("lastRequest.mediaduration: " + lastRequest.mediaduration + "s");

            if (isNaN(newDownloadRatio)) {
                self.debug.log("Invalid newDownloadRatio, bailing.");
                deferred.resolve(new MediaPlayer.rules.SwitchRequest());
            } else {
            	
				if (newDownloadRatio > currentBandwidth) {
					while (representationCur < max){
						representation3 = self.manifestExt.getRepresentationFor1(representationCur + 1, data);
						oneUpBandwidth = self.manifestExt.getBandwidth1(representation3);

        				if (oneUpBandwidth < newDownloadRatio){
        					self.debug.log("switch up.");
							current += 1;
						}
						representationCur++;
					}
					self.debug.log("Current1: " + current + "representationCur1: " + representationCur);
					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));
														
				}else{
					while (representationCur > 0){
						representation1 = self.manifestExt.getRepresentationFor1(representationCur - 1, data);
						oneDownBandwidth = self.manifestExt.getBandwidth1(representation1);
						
						if(oneDownBandwidth > newDownloadRatio){
							self.debug.log(" switch Down.");
							current -= 1;
						}
						representationCur--;
					}
					self.debug.log("Current2: " + current + "representationCur2: " + representationCur);
					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));	
				}
            }										
            
            return deferred.promise;
        }
    };
};
   
MediaPlayer.rules.RomeroConservativeRule.prototype = {
    constructor: MediaPlayer.rules.RomeroConservativeRule
};