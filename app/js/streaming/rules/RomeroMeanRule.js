/** Algoritmo com característica de adaptação conservativa, implementado a partir da Dissertação de Romero
 * 	@class RomeroMeanRule
 */

MediaPlayer.rules.RomeroMeanRule = function () {
    "use strict";
    var insertThroughputs = function (throughList, availableRepresentations) {
		var self = this, representation, bandwidth, quality, downloadTime, segDuration, through;
		
		for(var i = 0; i < throughList.length; i++){
			quality = throughList[i].quality;
			representation = availableRepresentations[quality];
			bandwidth = self.metricsExt.getBandwidthForRepresentation(representation.id);
			bandwidth /= 1000; //bit/ms
			
			downloadTime = throughList[i].finishTime.getTime() - throughList[i].responseTime.getTime();
			segDuration = throughList[i].duration/1000; 
			
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
        metricsBaselineExt: undefined,
        metricsBaselinesModel: undefined,
        /**
         * @param {current} current - Índice da representação corrente
         * @param {metrics} metrics - Metricas armazenadas em MetricsList
         * @param {data} data - Dados de audio ou vídeo
         * @memberof RomeroMeanRule#
         */
        checkIndex: function (current, metrics, data, metricsBaseline, availableRepresentations) {

            var self = this,
            	httpRequestList = self.metricsExt.getHttpRequests(metrics),
            	lastRequest = self.metricsExt.getLastHttpRequest(metrics),
            	downloadTime,
                now = new Date(),														//current timestamp
                averageThroughput,
                deferred,
                representation1,
                representation2,
                representation3,
                currentBandwidth,
                oneUpBandwidth,
                oneDownBandwidth, 
                max,
                representationCur = current,
                numSegs = 3,															//numero de segmentos que serão calculados na media dos throughs
                SENSIVITY = 0.95,
                currentBandwidthMs = 0;

            self.debug.log("Checking download ROMERO MEAN rule...");
         	self.debug.log("Baseline - Tamanho HttpList: " + httpRequestList.length);
        	self.debug.log("Baseline - Tamanho Through: " + metricsBaseline.ThroughSeg.length);

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
            
        	downloadTime = (lastRequest.tfinish.getTime() - lastRequest.tresponse.getTime())/1000;

            max = self.manifestExt.getRepresentationCount1(data);
        	max -= 1;
        	
        	representation2 = self.manifestExt.getRepresentationFor1(current, data);
        	currentBandwidth = self.manifestExt.getBandwidth1(representation2);
        	currentBandwidthMs = currentBandwidth/1000;

        	insertThroughputs.call(self, metricsBaseline.ThroughSeg, availableRepresentations);

           	if (metricsBaseline.ThroughSeg.length >= numSegs){

           		averageThroughput = self.metricsBaselineExt.getAverageThrough3Segs(numSegs, metricsBaseline);	
           		averageThroughput = averageThroughput * SENSIVITY;
           		
				self.debug.log("Baseline - AverageThroughput: " + averageThroughput + "bps");
					                	            
				if (averageThroughput > currentBandwidthMs) {
					while (representationCur < max){
						representation3 = self.manifestExt.getRepresentationFor1(representationCur + 1, data);
						oneUpBandwidth = self.manifestExt.getBandwidth1(representation3);
						oneUpBandwidth /= 1000;

        				if (oneUpBandwidth < averageThroughput){
        					//self.debug.log("switch up.");
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
						oneDownBandwidth /= 1000;

						if(oneDownBandwidth > averageThroughput){
							//self.debug.log(" switch Down.");
							current -= 1;
						}
						representationCur--;
					}
					self.debug.log("Current2: " + current + "representationCur2: " + representationCur);
					deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));	
				}
            }else{
				deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));	
            }
            
            return deferred.promise;
        }
    };
};
   
MediaPlayer.rules.RomeroMeanRule.prototype = {
    constructor: MediaPlayer.rules.RomeroMeanRule
};