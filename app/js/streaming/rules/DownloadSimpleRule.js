/*
 * The copyright in this software is being made available under the BSD License, included below. This software may be subject to other third party and contributor rights, including patent rights, and no such rights are granted under this license.
 * 
 * Copyright (c) 2013, Digital Primates
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Digital Primates nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
MediaPlayer.rules.DownloadSimpleRule = function () {
    "use strict";
    
        var runningFastStart=true,
        	deltaTime=10000, 
        	deltaBuffer=1000, 
        	time1 = 0, 
        	t1 = 0,
        	      
        preInsertThroughputs = function (lastRequest, currentBandwidth, through, representationId) {
        	var self = this, now = new Date(), metricsBaselineThrough3Seg, metricsBaselineThrough, throughIndex;

			//self.debug.log("currentBandwidth: " + currentBandwidth + "b/ms");
			//self.debug.log("through: " + through+ "b/ms");
			//self.debug.log("lastRequest.range: " + lastRequest.range);

	        metricsBaselineThrough3Seg = self.metricsBaselinesModel.getMetricsBaselineFor(lastRequest.stream).Through3Seg;

	        metricsBaselineThrough = self.metricsBaselinesModel.getMetricsBaselineFor(lastRequest.stream).ThroughSeg;
	        
	        if(metricsBaselineThrough.length > 0){

	        	throughIndex = metricsBaselineThrough.length - 1;
    			self.debug.log("lastRequest.range: " + lastRequest.range + " - metricsBaselineThrough[throughIndex].range: " + metricsBaselineThrough[throughIndex].range);

	        	if(lastRequest.range != metricsBaselineThrough[throughIndex].range){
	    		    self.metricsBaselinesModel.addThroughputSeg(lastRequest.stream, lastRequest, now, currentBandwidth, lastRequest.range, representationId, through);
	        	}
	        }else{
		        self.metricsBaselinesModel.addThroughputSeg(lastRequest.stream, lastRequest, now, currentBandwidth, lastRequest.range, representationId, through); 
	        }
	        
	        if(metricsBaselineThrough3Seg.length > 0 ){

	        	throughIndex = metricsBaselineThrough3Seg.length - 1;

	        	if(lastRequest.range != metricsBaselineThrough3Seg[throughIndex].range){

	    			if(metricsBaselineThrough3Seg.length >= 3)
	    		    	metricsBaselineThrough3Seg.shift();    
	    		   self.metricsBaselinesModel.addThroughput3Seg(lastRequest.stream, lastRequest, now, through);
	        	}
	        }else{
	        	
	        	self.metricsBaselinesModel.addThroughput3Seg(lastRequest.stream, lastRequest, now, through);
	        }
	                     
        };
        
        return {
            debug: undefined,
            manifestExt: undefined,
            metricsExt: undefined,
            metricsBaselineExt: undefined,
            metricsBaselinesModel: undefined,
            
            checkIndex: function (current, metrics, data, metricsBaseline) {

                var self = this,
                lastRequest = self.metricsExt.getCurrentHttpRequest(metrics),
                firstRequest = self.metricsExt.getFirstHttpRequest(metrics), 				//First Request n(0)
                currentBufferLevel  = self.metricsExt.getCurrentBufferLevel(metrics),		//b(t)
                bDelay=0,																	//Onde sera aplicado? (ms)
                bMin=8000,
                bLow=16000,
                bHigh=40000,																//self.metricsExt.getMaxIndexForBufferType(lastRequest.stream)
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
            	
            	preInsertThroughputs.call(self, lastRequest, currentBandwidthMs, (currentThrough/1000), representation1.id);
            	
            	self.debug.log("Baseline - Stream Type: " + lastRequest.stream);
            	//self.debug.log("Baseline - currentThrough: " + currentThrough +"bps");
            	//self.debug.log("Baseline - lastRequest.range: " + lastRequest.range);
            	//self.debug.log("Baseline - currentBandwidth: " + currentBandwidth);
            	//self.debug.log("Baseline - current: " + current);
            	//self.debug.log("Baseline - representation1: " + representation1.id);
            	
        		//self.debug.log("Baseline - firstRequest stream: " + firstRequest.stream);
        		//if(firstRequest.responsecode)
            		//self.debug.log("Baseline -  firstRequest responsecode: " + firstRequest.responsecode);
        		//self.debug.log("Baseline -  firstRequest response: " + (firstRequest.trequest.getTime() - startRequest));
            	//self.debug.log("Baseline -  firstRequest finish: " + (firstRequest.tfinish.getTime()- startRequest));
        		//self.debug.log("Baseline -  firstRequest url: " + firstRequest.url);
        		//self.debug.log("Baseline -  firstRequest range: " + firstRequest.range);
            	
            	for(var i = 0; i < metrics.HttpList.length; i++){
            		self.debug.log("Baseline - HttpList Number: " + i);
            		self.debug.log("Baseline - stream: " + metrics.HttpList[i].stream);
            		if(metrics.HttpList[i].responsecode)
                		self.debug.log("Baseline -  responsecode: " + metrics.HttpList[i].responsecode);
            		self.debug.log("Baseline -  response: " + (metrics.HttpList[i].trequest.getTime()- startRequest));
                	self.debug.log("Baseline -  finish: " + (metrics.HttpList[i].tfinish.getTime()- startRequest));
            		self.debug.log("Baseline -  url: " + metrics.HttpList[i].url);
            		self.debug.log("Baseline -  range: " + metrics.HttpList[i].range);
            	}
          		
            	for(var j = 0; j < metricsBaseline.ThroughSeg.length; j++){
            		self.debug.log("Baseline - ThroughSeg Number: " + j);
            		self.debug.log("Baseline -  start: " + (metricsBaseline.ThroughSeg[j].startTime.getTime() - startRequest));
            		self.debug.log("Baseline -  finish: " + (metricsBaseline.ThroughSeg[j].finishTime.getTime()- startRequest));
            		self.debug.log("Baseline -  range: " + metricsBaseline.ThroughSeg[j].range);
            	}

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

MediaPlayer.rules.DownloadSimpleRule.prototype = {
    constructor: MediaPlayer.rules.DownloadSimpleRule
};