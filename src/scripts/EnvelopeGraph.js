(function(){
  'use strict';

  if (typeof require === 'function') {
    define(defineEnvelopeGraph);
  } else {
    window.EnvelopeGraph = defineEnvelopeGraph();
  }

  function defineEnvelopeGraph () {

    class EnvelopeGraph {
      constructor(container, o){
        o = o || {};

        this._container = container || window.document.body;

        this._minXValue = o.minXValue || 0;
        this._maxXValue = o.maxXValue || 100;
        this._minYValue = o.minYValue || 0;
        this._maxYValue = o.maxYValue || 100;

        this._dataPoints = [];

        this._UIVertexColor = o.vertexColor || o.UIVertexColor || '#000';
        this._UILineColor = o.lineColor || o.UILineColor || '#000';
        this._UIBackgroundColor = o.backgroundColor || o.UIBackgroundColor || '#FFF';
        this._UIVertexRadius = o.vertexRadius || o.UIVertexRadius || 3;

        this._canvas = window.document.createElement('canvas');
        this._canvas.width = this._container.clientWidth;
        this._canvas.height = this._container.clientHeight;
        this._container.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');

        this.assignListeners();
        this.drawUI();
      }

      /* --- getters and setters --- */

      set options (o) {
        this.container = o.container || this.container;
        this.minXValue = o.minXValue || this.minXValue;
        this.maxXValue = o.maxXValue || this.maxXValue;
        this.minYValue = o.minYValue || this.minYValue;
        this.maxYValue = o.maxYValue || this.maxYValue;
        this.UIVertexColor = o.vertexColor || o.UIVertexColor || this.UIVertexColor;
        this.UILineColor = o.lineColor || o.UILineColor || this.UILineColor;
        this.UIBackgroundColor = o.backgroundColor || o.UIBackgroundColor || this.UIBackgroundColor;
        this.UIVertexRadius = o.vertexRadius || o.UIVertexRadius || this.UIVertexRadius;
      }

      get minXValue () {
        return this._minXValue;
      }

      set minXValue (newVal) {
        this._minXValue = newVal;
        return this;
      }

      get minYValue () {
        return this._minYValue;
      }

      set minYValue (newVal) {
        this._minYValue = newVal;
        return this;
      }

      get dataPoints () {
        return this._dataPoints;
      }

      set dataPoints (newDataPoints) {
        this._dataPoints  = newDataPoints;
        this.drawUI();
        return this;
      }

      get domain () {
        return this._maxXValue - this._minXValue;
      }

      get range () {
        return this._maxYValue - this._minYValue;
      }

      get UIPointColor () {
        return this._UIVertexColor;
      }

      set UIPointColor (newColor) {
        this._UIVertexColor = newColor;
        this.drawUI();
        return this;
      }

      get UILineColor () {
        return this._UILineColor;
      }

      set UILineColor (newColor) {
        this._UILineColor = newColor;
        this.drawUI();
        return this;
      }

      get UIBackgroundColor () {
        return this._UIBackgroundColor;
      }

      set UIBackgroundColor (newColor) {
        this._UIBackgroundColor = newColor;
        this.drawUI();
        return this;
      }

      get UIVertexRadius () {
        var UIVertexRadius = Math.min(this._canvas.width, this._canvas.height)
                             * 0.01;
        this._UIVertexRadius = Math.max(UIVertexRadius, 2);
        return this._UIVertexRadius;
      }

      set UIVertexRadius (newRadius) {
        this._UIVertexRadius = newRadius;
        this.drawUI();
        return this;
      }

      /* --- Utility methods --- */

      dataToCanvasX (x) {
        var canvasX = ((x - this._minXValue)
                    / this.domain)
                    * this._canvas.width;
        return canvasX;
      }

      dataToCanvasY (y) {
        var canvasY = this._canvas.height -
                      (((y - this._minYValue)
                        / this.range)
                       * this._canvas.height);
        return canvasY;
      }

      canvasToDataX (canvasX) {
        var dataX = ((canvasX / this._canvas.width)
                     * this.domain)
                    + this._minXValue;
        return dataX;
      }

      canvasToDataY (canvasY) {
        var canvasYinv = this._canvas.height - canvasY;

        var dataY = ((canvasYinv / this._canvas.height)
                     * this.range)
                    + this._minYValue;
        return dataY;
      }

      /* --- UI Drawing --- */
      drawUI () {
        this._ctx.fillStyle = this._UIBackgroundColor;
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        for(var i = (this._dataPoints.length - 1); i > 0; i--) {
          this.drawPoint(this._dataPoints[i][0], this._dataPoints[i][1]);
          this.drawLineBetweenPoints(this._dataPoints[i][0], this._dataPoints[i][1],
                                     this._dataPoints[i-1][0], this._dataPoints[i-1][1]);
        }
        if(this._dataPoints.length > 0) {
          this.drawPoint(this._dataPoints[0][0], this._dataPoints[0][1]);
        }
      }

      drawPoint (x, y) {
          var canvasX = this.dataToCanvasX(x);
          var canvasY = this.dataToCanvasY(y);

          this._ctx.beginPath();
          this._ctx.arc(canvasX, canvasY, this.UIVertexRadius, 0, 2*Math.PI);
          this._ctx.fillStyle = this.UIPointColor;
          this._ctx.fill();
      }

      drawLineBetweenPoints (x1, y1, x2, y2) {
        var canvasX1 = this.dataToCanvasX(x1);
        var canvasX2 = this.dataToCanvasX(x2);
        var canvasY1 = this.dataToCanvasY(y1);
        var canvasY2 = this.dataToCanvasY(y2);

        this._ctx.beginPath();
        this._ctx.moveTo(canvasX1, canvasY1);
        this._ctx.lineTo(canvasX2, canvasY2);
        this._ctx.strokeStyle = this.UILineColor;
        this._ctx.stroke();
      }

      /* --- UI Interaction --- */
      addDataPoint (x, y) {
        this._dataPoints.push([x, y]);
        this._dataPoints.sort((a, b) => {
          return a[0] - b[0];
        });
      }

      assignListeners () {
        var _this = this;

        this._canvas.addEventListener('mousedown', mouseDownListener);

        function mouseDownListener (e) {
          var boundingClientRect = e.target.getBoundingClientRect();
          var clickX = e.clientX - boundingClientRect.left;
          var clickY = e.clientY - boundingClientRect.top;

          var dataX = _this.canvasToDataX(clickX);
          var dataY = _this.canvasToDataY(clickY);

          _this.addDataPoint(dataX, dataY);

          _this.drawUI();
        }
      }
    } /* --- End EnvelopeGraph class definition --- */

    return EnvelopeGraph;
  }
})();
