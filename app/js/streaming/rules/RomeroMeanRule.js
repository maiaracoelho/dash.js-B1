/** Algoritmo com característica de adaptação conservativa, implementado a partir da Dissertação de Romero
 * 	@class RomeroMeanRule
 */

MediaPlayer.rules.RomeroMeanRule = function () {
    "use strict";

    
    return {
        debug: undefined,
        manifestExt: undefined,
        metricsExt: undefined,
        metricsBaselineExt: undefined,
        /**
         * @param {current} current - Índice da representação corrente
         * @param {metrics} metrics - Metricas armazenadas em MetricsList
         * @param {data} data - Dados de audio ou vídeo
         * @memberof RomeroMeanRule#
         */
        checkIndex: function (current, metrics, data, metricsBaseline) {

            var self = this,
            	lastRequest = self.metricsExt.getCurrentHttpRequest(metrics),
            	through3SegList = metricsBaseline.Through3Seg,
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
                sumThroughs = 0;

            self.debug.log("Checking download ROMERO MEAN rule...");
        	self.debug.log("Tamanho metrics HttpList: " + metrics.HttpList.length);
        	self.debug.log("Tamanho metricsBaseline Through: " + metricsBaseline.ThroughSeg.length);
        	self.debug.log("Tamanho metricsBaseline Through3: " + metricsBaseline.Through3Seg.length);

            if (!metrics) {
                //self.debug.log("No metrics, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }
            
            if (!metricsBaseline) {
                //self.debug.log("No metricsBaseline, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }
                        
            if (lastRequest == null) {
                //self.debug.log("No requests made for this stream yet, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }

            if (lastRequest.mediaduration == null ||
                lastRequest.mediaduration == undefined ||
                lastRequest.mediaduration <= 0 ||
                isNaN(lastRequest.mediaduration)) {
                //self.debug.log("Don't know the duration of the last media fragment, bailing.");
                return Q.when(new MediaPlayer.rules.SwitchRequest());
            }
            
            deferred = Q.defer();
            
            downloadTime = (lastRequest.tfinish.getTime() - lastRequest.tresponse.getTime())/1000;

            max = self.manifestExt.getRepresentationCount1(data);
        	max -= 1;
        	
        	representation2 = self.manifestExt.getRepresentationFor1(current, data);
        	currentBandwidth = self.manifestExt.getBandwidth1(representation2);
        	
        	self.debug.log("Baseline - LastRequest Type: " + lastRequest.stream );
            self.debug.log("Baseline - LastRequest.tfinish: " + lastRequest.tfinish);
            self.debug.log("Baseline - DownloadTime: " + downloadTime + "s");
            self.debug.log("Baseline - LastRequest.mediaduration: " + lastRequest.mediaduration + "s");
			self.debug.log("Baseline - CurrentBandwidth: " + currentBandwidth + "bps");
			self.debug.log("Baseline - Through3SegList.length: " + through3SegList.length + " Type: " + lastRequest.stream);

           	if (through3SegList.length == numSegs){
           		
           		for(var i=0; i < numSegs; i++){
           			sumThroughs += through3SegList[i].throughSeg;
    				self.debug.log("Baseline - Through"+ i +": " + through3SegList[i].throughSeg + "bps");

           		}
           		averageThroughput = sumThroughs/numSegs;
           		
           		averageThroughput = averageThroughput * SENSIVITY;
				self.debug.log("Baseline - AverageThroughput: " + averageThroughput + "bps");
					                	            
				if (averageThroughput > currentBandwidth) {
					while (representationCur < max){
						representation3 = self.manifestExt.getRepresentationFor1(representationCur + 1, data);
						oneUpBandwidth = self.manifestExt.getBandwidth1(representation3);

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