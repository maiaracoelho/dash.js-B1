
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

            return metricsBaseline;
        },

        addThroughput3Seg: function (streamType, req, now, through) {
        	var vo = new MediaPlayer.vo.metrics.Through3Seg();
               	
        	vo.currentTime = now;
            vo.startTime = req.tresponse;
            vo.finishTime = req.tfinish;
            vo.throughSeg = through;

            this.getMetricsBaselineFor(streamType).Through3Seg.push(vo);
            this.metricBaselineAdded(streamType, "Through3Seg", vo);

            return vo;
        }, 
        
        addThroughputSeg: function (streamType, req, now, bandwidth, range, representationId, throughSeg) {

        	var vo = new MediaPlayer.vo.metrics.ThroughSeg();

            vo.currentTime = now;
            vo.startTime = req.tresponse;
            vo.finishTime = req.tfinish;
            vo.bandwidth = bandwidth;    		
            vo.range = range;    		
            vo.representationId = representationId;   
            vo.throughSeg = throughSeg;   

            this.getMetricsBaselineFor(streamType).ThroughSeg.push(vo);
            this.metricBaselineAdded(streamType, "ThroughSeg", vo);

            return vo;
        }, 
      
    };
};

MediaPlayer.models.MetricsBaselinesModel.prototype = {
    constructor: MediaPlayer.models.MetricsBaselinesModel
};