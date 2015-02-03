
MediaPlayer.models.MetricsBaselineList = function () {
    "use strict";

    return {
    	BufferMin: [],         //vector with size=deltaTime
		ThroughSeg: [],        
		Through3Seg: []        

    };
};

MediaPlayer.models.MetricsBaselineList.prototype = {
    constructor: MediaPlayer.models.MetricsBaselineList
};