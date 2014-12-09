
MediaPlayer.vo.metrics.ThroughSeg = function () {
    "use strict";

    this.currentTime = null;   		//Real-Time
    this.startTime = null;     		//Real-Time
    this.finishTime = null;    		//Real-Time
    this.bandwidth = null;    		//Segment bandwidth  
    this.range = null;    		//Segment range  
    this.representationId = null;   //Segment representation  
    this.throughSeg = null;    		//Segment Throughput  
};

MediaPlayer.vo.metrics.ThroughSeg.prototype = {
    constructor: MediaPlayer.vo.metrics.ThroughSeg
};