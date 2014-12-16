
MediaPlayer.vo.metrics.Through3Seg = function () {
    "use strict";
    
    this.index = NaN;
    this.currentTime = null;   		//Real-Time
    this.startTime = null;     		//Real-Time
    this.responseTime = null;     		//Real-Time
    this.finishTime = null;    		//Real-Time
    this.range = null;    		//Segment range  
    this.duration = null;    		//Segment duration  
    this.quality = NaN;
    this.bandwidth = null;    		//Segment bandwidth  
    this.through3Seg = null;    		//Segment Throughput  
};

MediaPlayer.vo.metrics.Through3Seg.prototype = {
    constructor: MediaPlayer.vo.metrics.Through3Seg
};