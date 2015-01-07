
MediaPlayer.models.MetricsBaselinesModel = function () {
    "use strict";

    return {
    	debug : undefined,
    	system : undefined,
        eventBus: undefined,
        streamMetrics: {},
        metricsBaselineChanged: function () {
            this.eventBus.dispatchEvent({
                type: "metricsBaselineChanged",
                data: {}
            });
        },

        metricBaselineChanged: function (streamType) {
            this.eventBus.dispatchEvent({
                type: "metricBaselineChanged",
                data: {stream: streamType}
            });
            this.metricsBaselineChanged();
        },

        metricBaselineUpdated: function (streamType, metricType, vo) {
            this.eventBus.dispatchEvent({
                type: "metricBaselineUpdated",
                data: {stream: streamType, metric: metricType, value: vo}
            });
            this.metricBaselineChanged(streamType);
        },

        metricBaselineAdded: function (streamType, metricType, vo) {
            this.eventBus.dispatchEvent({
                type: "metricBaselineAdded",
                data: {stream: streamType, metric: metricType, value: vo}
            });
            this.metricBaselineChanged(streamType);
        },

        clearCurrentMetricsBaselineForType: function (type) {
            delete this.streamMetrics[type];
            this.metricBaselineChanged(type);
        },

        clearAllCurrentMetricsBaseline: function () {
            var self = this;
            this.streamMetrics = {};
            this.metricsBaselineChanged.call(self);
        },

        getReadOnlyMetricsBaselineFor: function(type) {
            if (this.streamMetrics.hasOwnProperty(type)) {
                return this.streamMetrics[type];
            }

            return null;
        },

        getMetricsBaselineFor: function(type) {
            var metricsBaseline;

            if (this.streamMetrics.hasOwnProperty(type)) {
            	metricsBaseline = this.streamMetrics[type];
            } else {
            	metricsBaseline = this.system.getObject("metricsBaseline");
                this.streamMetrics[type] = metricsBaseline;
            }
            if (metricsBaseline != null){
                this.debug.log("getMetricsBaselinesFor");
            }
            return metricsBaseline;
        },
        
        addThroughputSeg: function (req, now) {
        	var vo = new MediaPlayer.vo.metrics.ThroughSeg();

        	vo.currentTime = now;
       	 	vo.stream = req.streamType;
       	 	vo.startTime = req.requestStartDate;
            vo.responseTime = req.firstByteDate;
            vo.finishTime = req.requestEndDate;
            vo.range = req.range;
            vo.duration = req.duration;
            vo.quality = req.quality; 

            this.getMetricsBaselineFor(req.streamType).ThroughSeg.push(vo);
            this.metricBaselineAdded(req.streamType, "ThroughSeg", vo);

            return vo;
        }, 
        
        updateThroughputSeg: function (throughSeg, bandwidth, through) {
        	
        	throughSeg.bandwidth = bandwidth;
        	throughSeg.throughSeg = through;

            this.metricBaselineUpdated(throughSeg.stream, "ThroughputSeg", throughSeg);

        }
      
    };
};

MediaPlayer.models.MetricsBaselinesModel.prototype = {
    constructor: MediaPlayer.models.MetricsBaselinesModel
};