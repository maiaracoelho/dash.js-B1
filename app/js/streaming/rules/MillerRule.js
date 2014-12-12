/* Algoritmo TR5: Adaptation Algorithm for Adaptive Streaming over HTTP
 * 
 * Essa regra caracteriza um algoritmo agressivo
 */
 
MediaPlayer.rules.MillerRule = function () {
    "use strict";
 	
    var runningFastStart=true,
	deltaTime=10000,
	deltaBuffer=1000, 
	time1 = 0, 
	t1 = 0;

return {
    debug: undefined,
    manifestExt: undefined,
    metricsExt: undefined,
    metricsBaselineExt: undefined,
    
    checkIndex: function (current, metrics, data, metricsBaseline) {

        var self = this,
        lastRequest = self.metricsExt.getCurrentHttpRequest(metrics),
        firstRequest = self.metricsExt.getFirstHttpRequest(metrics), 				//First Request n(0)
        currentBufferLevel  = self.metricsExt.getCurrentBufferLevel(metrics),		//b(t)
        bDelay=0,																	//Onde sera aplicado? (ms)
        bMin=8000,
        bLow=16000,
        bHigh=50000,																//self.metricsExt.getMaxIndexForBufferType(lastRequest.stream)
        bOpt=0.5*(bLow+bHigh),
        downloadTime,															
        currentThrough,																	//p_n(t)
        time2,
        time,																		//current Time of session
        now = new Date(),															//current timestamp
        deferred,    
        ALPHA_1 = 0.75,
    	ALPHA_2 = 0.33,
    	ALPHA_3 = 0.5,
    	ALPHA_4 = 0.75,
        ALPHA_5 = 0.9,
        representation1,
        representation2,
        representation3,
        currentBandwidth,
        oneUpBandwidth,
        oneDownBandwidth, 
        max,
        startRequest,
        bufferMinTime1,
        bufferMinTime2,
        averageThrough,
        currentBandwidthMs = 0;
        
    	self.debug.log("Baseline - Regra TR5 MillerRule...");
     	self.debug.log("Baseline - Tamanho HttpList: " + metrics.HttpList.length);
     	self.debug.log("Baseline - Tamanho BufferLevel: " + metrics.BufferLevel.length);
     	self.debug.log("Baseline - Tamanho Through: " + metricsBaseline.ThroughSeg.length);

        if (!metrics) {
        	//self.debug.log("No metrics, bailing.");
        	return Q.when(new MediaPlayer.rules.SwitchRequest());
        }
        
        if (!metricsBaseline) {
        	//self.debug.log("No metrics Baseline, bailing.");
        	return Q.when(new MediaPlayer.rules.SwitchRequest());
        }
        
        if (currentBufferLevel == null) {
            //self.debug.log("No requests made for this stream yet, bailing.");
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
        
        if (firstRequest == null) {
            //self.debug.log("No requests made for this stream yet, bailing.");
            return Q.when(new MediaPlayer.rules.SwitchRequest());
        }

        if (firstRequest.mediaduration == null ||
        		firstRequest.mediaduration == undefined ||
        		firstRequest.mediaduration <= 0 ||
            isNaN(firstRequest.mediaduration)) {
            //self.debug.log("Don't know the duration of the first media fragment, bailing.");
            return Q.when(new MediaPlayer.rules.SwitchRequest());
        }
        
     	deferred = Q.defer();

        //O início da sessão como um todo se acontece a partir do momento em que a primeira requisição de mídia é feita.
    	startRequest = firstRequest.trequest.getTime(); 
    	time = lastRequest.tfinish.getTime() - startRequest;
    	
    	
    	
    	 /*for(var i = 0; i < metrics.BufferLevel.length; i++){
    		self.debug.log("Baseline - BufferLevel Number: " + i);
        		self.debug.log("Baseline -  t: " + (metrics.BufferLevel[i].t.getTime() - startRequest));
    		self.debug.log("Baseline -  level: " + metrics.BufferLevel[i].level);
    		
    	}*/
  		
  		for(var i = 0; i < metrics.HttpList.length; i++){
    		self.debug.log("Baseline - HttpList Number: " + i);
    		self.debug.log("Baseline - stream: " + metrics.HttpList[i].stream);
    		if(metrics.HttpList[i].responsecode)
        		self.debug.log("Baseline -  responsecode: " + metrics.HttpList[i].responsecode);
    		self.debug.log("Baseline -  response: " + metrics.HttpList[i].tresponse.getTime());
        	self.debug.log("Baseline -  finish: " + metrics.HttpList[i].tfinish.getTime());
    		self.debug.log("Baseline -  type: " + metrics.HttpList[i].type);
    		
    	}
  		/*
    	for(var j = 0; j < metricsBaseline.ThroughSeg.length; j++){
    		self.debug.log("Baseline - ThroughSeg Number: " + j);
    		self.debug.log("Baseline -  start: " + metricsBaseline.ThroughSeg[j].startTime.getTime());
    		self.debug.log("Baseline -  finish: " + metricsBaseline.ThroughSeg[j].finishTime.getTime());
    	}
    	*/
    	if (time >= deltaTime){
    		t1 = time - deltaTime;
        }
    	
    	time2 = time1 + deltaBuffer + 1; 

        	downloadTime = (lastRequest.tfinish.getTime() - lastRequest.tresponse.getTime())/1000;
        	
        	max = self.manifestExt.getRepresentationCount1(data);
        	max -= 1;
        	
        	representation1 = self.manifestExt.getRepresentationFor1(current, data);
        	currentBandwidth = self.manifestExt.getBandwidth1(representation1);
        	currentBandwidthMs = currentBandwidth/1000;
        	
        	currentThrough = (lastRequest.mediaduration/downloadTime) * currentBandwidth; 
        	
        	self.debug.log("Baseline - Stream Type: " + lastRequest.stream);
        	self.debug.log("Baseline - Session Time: " + time+" ms");
        	self.debug.log("Baseline - representation1: " + representation1);
        	self.debug.log("Baseline - currentBandwidth: " + currentBandwidth);
        	self.debug.log("Baseline - lastRequest.range: " + lastRequest.range);
        	self.debug.log("Baseline - lastRequest.finish: " + lastRequest.tfinish.getTime() +"ms");

        	bufferMinTime1 = self.metricsBaselineExt.getBufferMinTime(time1, deltaBuffer, metrics, startRequest);
        	bufferMinTime2 = self.metricsBaselineExt.getBufferMinTime(time2, deltaBuffer, metrics, startRequest);
    		averageThrough = self.metricsBaselineExt.getAverageThrough(t1, time, metricsBaseline, startRequest);	
    		
        	//self.debug.log("Baseline - bufferMinTime1: " + bufferMinTime1);
        	//self.debug.log("Baseline - bufferMinTime2: " + bufferMinTime2);
    		//self.debug.log("Baseline - averageThrough: " + averageThrough);
    		
    		if(current != max){
    			representation2 = self.manifestExt.getRepresentationFor1(current+1, data);
        		oneUpBandwidth = self.manifestExt.getBandwidth1(representation2);
        		oneUpBandwidth /= 1000;
    		}
    		
    		 if (isNaN(averageThrough) || isNaN(bufferMinTime1) || isNaN(bufferMinTime2)) {
                 self.debug.log("The averageThrough are NaN, bailing.");
                 deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));
             }else{
        			self.debug.log("Começa a regra");

            	 if(runningFastStart &&
                         current != max &&
                         bufferMinTime1 <= bufferMinTime2 &&													//para todo t1<t2<=t *
                         currentBandwidthMs <= ALPHA_1 * averageThrough){ 
                      	
           			self.debug.log("runningFastStart");
                 	
                      if(currentBufferLevel.level < bMin){
                      	if(oneUpBandwidth <= ALPHA_2 * averageThrough){
                      		self.debug.log("Up ALPHA_2");
          					current += 1;
                      	}
                      }else if (currentBufferLevel.level < bLow){
                      	if(oneUpBandwidth <= ALPHA_3 * averageThrough){
                      		self.debug.log("Up ALPHA_3");
          					current += 1;
                      	}
                      }else{
                      	if(oneUpBandwidth <= ALPHA_4 * averageThrough){
                      		self.debug.log("Up ALPHA_4");
          					current += 1;
                      	}
                      	if(currentBufferLevel.level > bHigh){
                             self.debug.log("Apply delay 1");
                             //deferred.resolve(bHigh - lastRequest.mediaduration);
                      	}
                      }
                      deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));
                   }else{
            		   self.debug.log("runningFastStart not true");
                	   runningFastStart = false;
                	                          	   
                       if(currentBufferLevel.level < bMin){
                            self.debug.log("Down MIN");
                            current = 0;
                       }else if(currentBufferLevel.level < bLow){
                            if(current != 0 && currentBandwidth >= currentThrough){
                                  self.debug.log("Down One");
                                  current -= 1;
                            }
                       }else if(currentBufferLevel.level < bHigh){
                    		 if(current == max || oneUpBandwidth >= ALPHA_5 * averageThrough){
                                    self.debug.log("Apply delay 2");
                                    //deferred.resolve(Math.max(currentBuffer.level - lastRequest.mediaduration, bOpt));
                    		 }
                       }else{
                    		 if(current == max || oneUpBandwidth >= ALPHA_5 * averageThrough){
                                   self.debug.log("Apply delay 3");
                                   //deferred.resolve(Math.max(currentBuffer.level - lastRequest.mediaduration, bOpt));
                    		 }else{
                                 	self.debug.log("Up One");
         								current += 1;
                    		 }
                       }
                       self.debug.log("Current: " + current);

                       deferred.resolve(new MediaPlayer.rules.SwitchRequest(current));                            	   
                    }
                 }
    		 	time1 = time2 + 1;
    		 	
    		 	return deferred.promise;
	}
};
};

MediaPlayer.rules.MillerRule.prototype = {
   constructor: MediaPlayer.rules.MillerRule
};

                