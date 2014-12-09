
MediaPlayer.vo.metrics.Through3Seg = function () {
    "use strict";
    
    this.currentTime = null;   //Real-Time
    this.startTime = null;     //Real-Time
    this.finishTime = null;    //Real-Time
    this.throughSeg = null;    //Segment Throughput  
};

MediaPlayer.vo.metrics.Through3Seg.prototype = {
    constructor: MediaPlayer.vo.metrics.Through3Seg
};