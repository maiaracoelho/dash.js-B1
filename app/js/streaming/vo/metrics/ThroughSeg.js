
MediaPlayer.vo.metrics.ThroughSeg = function () {
    "use strict";

    this.index = NaN;
    this.currentTime = null;   		//Real-Time
    this.startTime = null;     		//Real-Time
    this.finishTime = null;    		//Real-Time
    this.range = null;    		//Segment range  
    this.quality = NaN;
    this.data = [];
    this.bandwidth = null;    		//Segment bandwidth  
    this.throughSeg = null;    		//Segment Throughput  
};

MediaPlayer.vo.metrics.ThroughSeg.prototype = {
    constructor: MediaPlayer.vo.metrics.ThroughSeg
};