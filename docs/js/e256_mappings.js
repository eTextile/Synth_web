/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

// Paper.js can't extend subclasses!
// See: https://github.com/paperjs/paper.js/issues/1335
// pixi.js: https://pixijs.com/
// Typescript: https://www.typescriptlang.org/

const MAX_PARAM = 16;

var hitOptions = {
  stroke: true,
  fill: true,
  tolerance: 8
};

/////////// TOUCHPAD Factory
function touchpadFactory() {
  var defaultWidth = 400;
  var defaultHeight = 400;
  var selectedPath = null;
  var selectedSegment = null;
  var newWidth = defaultWidth;
  var newHeight = defaultHeight;

  var touchpadHitOptions = {
    stroke: true,
    segment: true,
    fill: true,
    tolerance: 5
  };

  var _Touchpad = new paper.Group({
    data: {
      name: "touchpad",
      from: [null, null],
      to: [null, null],
      touchs: 3,
      min: 0,
      max: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (defaultWidth / 2)), Math.round(mouseEvent.point.y - (defaultHeight / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (defaultWidth / 2)), Math.round(mouseEvent.point.y + (defaultHeight / 2))];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.touchs = params.b;
      this.data.min = params.i;
      this.data.max = params.a;
    },
    setup: function () {
      var _pad = new paper.Path.Rectangle({
        name: "pad",
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 20,
        strokeColor: new paper.Color(0.7, 0, 0.5),
        fillColor: new paper.Color(1, 1, 1)
      });
      for (var i = 0; i < this.data.touchs; i++) {
        var _touch = new paper.Group({
          data: {
            name: "touch-" + i,
            value: [
              getRandomInt(this.data.from[0] + (_pad.strokeWidth), this.data.to[0] - (_pad.strokeWidth)),
              getRandomInt(this.data.from[1] + (_pad.strokeWidth), this.data.to[1] - (_pad.strokeWidth))
            ],
            Xchan: null, // TODO
            Xcc: null,   // TODO
            Ychan: null, // TODO
            Ycc: null    // TODO
          }
        });
        var _line_x = new paper.Path.Line({
          name: "line-x",
          from: new paper.Point(this.data.from[0] + (_pad.strokeWidth / 2), _touch.data.value[1]),
          to: new paper.Point(this.data.to[0] - (_pad.strokeWidth / 2), _touch.data.value[1]),
          strokeColor: "black",
          strokeWidth: 1
        });
        var _line_y = new paper.Path.Line({
          name: "line-y",
          from: new paper.Point(_touch.data.value[0], this.data.from[1] + (_pad.strokeWidth / 2)),
          to: new paper.Point(_touch.data.value[0], this.data.to[1] - (_pad.strokeWidth / 2)),
          strokeColor: "black",
          strokeWidth: 1
        });
        var _circle = new paper.Path.Circle({
          name: "circle",
          center: new paper.Point(_touch.data.value[0], _touch.data.value[1]),
          radius: 10,
          fillColor: "green"
        });
        _touch.addChild(_line_x);
        _touch.addChild(_line_y);
        _touch.addChild(_circle);
        this.addChild(_touch);
      }
      this.addChild(_pad);
      this.children["pad"].sendToBack();
    },
    onMouseDown: function (mouseEvent) {
      // selectedItem: "circle",...
      // selectedPath: fill, stroke
      // selectedSegment: 0, 1, 2...
      var hitResult = this.hitTest(mouseEvent.point, touchpadHitOptions);
      selectedItem = hitResult.item;
      if (currentMode === EDIT_MODE) {
        selectedPath = hitResult.type;
        if (selectedPath === "fill") {
          selectedSegment = null;
        } else if (selectedPath === "stroke") {
          selectedSegment = hitResult.location.index;
        } else {
          selectedItem = null;
          selectedPath = null;
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedPath === "fill") {
        }
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            this.translate(mouseEvent.delta);
            this.data.from = [
              Math.round(mouseEvent.point.x - (defaultWidth / 2)),
              Math.round(mouseEvent.point.y - (defaultHeight / 2))
            ];
            this.data.to = [
              Math.round(mouseEvent.point.x + (defaultWidth / 2)),
              Math.round(mouseEvent.point.y + (defaultHeight / 2))
            ];
            updateMenuParams(this.data);
            break;
          case "stroke":
            if (selectedItem.name === "pad") {
              switch (selectedSegment) {
                case 0: // Update left segment
                  this.children["pad"].segments[0].point.x = mouseEvent.point.x;
                  this.children["pad"].segments[1].point.x = mouseEvent.point.x;
                  this.data.from[0] = Math.round(mouseEvent.point.x);
                  var lastWidth = newWidth;
                  newWidth = this.bounds.right - mouseEvent.point.x;
                  for (var i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-x"].segments[0].point.x = mouseEvent.point.x + (this.children["pad"].strokeWidth / 2);
                    var newSize_x = ((this.bounds.right - this.children[i].children["line-y"].segments[0].point.x) * newWidth) / lastWidth;
                    this.children[i].children["line-y"].position.x = this.bounds.right - newSize_x;
                    this.children[i].children["circle"].position.x = this.bounds.right - newSize_x;
                  }
                  break;
                case 1: // Update top segment
                  this.children["pad"].segments[1].point.y = mouseEvent.point.y;
                  this.children["pad"].segments[2].point.y = mouseEvent.point.y;
                  this.data.from[1] = Math.round(mouseEvent.point.y);
                  var lastHeight = newHeight;
                  newHeight = this.bounds.bottom - mouseEvent.point.y;
                  for (var i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-y"].segments[0].point.y = mouseEvent.point.y + (this.children["pad"].strokeWidth / 2);
                    var newSize_y = ((this.bounds.bottom - this.children[i].children["line-x"].segments[0].point.y) * newHeight) / lastHeight;
                    this.children[i].children["line-x"].position.y = this.bounds.bottom - newSize_y;
                    this.children[i].children["circle"].position.y = this.bounds.bottom - newSize_y;
                  }
                  break;
                case 2: // Update right segment
                  this.children["pad"].segments[2].point.x = mouseEvent.point.x;
                  this.children["pad"].segments[3].point.x = mouseEvent.point.x;
                  this.data.to[0] = Math.round(mouseEvent.point.x);
                  var lastWidth = newWidth;
                  newWidth = mouseEvent.point.x - this.bounds.left;
                  for (var i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-x"].segments[1].point.x = mouseEvent.point.x - (this.children["pad"].strokeWidth / 2);
                    var newSize_x = ((this.children[i].children["line-y"].segments[0].point.x - this.bounds.left) * newWidth) / lastWidth;
                    this.children[i].children["line-y"].position.x = this.bounds.left + newSize_x;
                    this.children[i].children["circle"].position.x = this.bounds.left + newSize_x;
                  }
                  break;
                case 3: // Update bottom segment
                  this.children["pad"].segments[3].point.y = mouseEvent.point.y;
                  this.children["pad"].segments[0].point.y = mouseEvent.point.y;
                  this.data.to[1] = Math.round(mouseEvent.point.y);
                  var lastHeight = newHeight;
                  newHeight = mouseEvent.point.y - this.bounds.top;
                  for (var i = 1; i < this.data.touchs + 1; i++) {
                    this.children[i].children["line-y"].segments[1].point.y = mouseEvent.point.y - (this.children["pad"].strokeWidth / 2);
                    var newSize_y = ((this.children[i].children["line-x"].segments[0].point.y - this.bounds.top) * newHeight) / lastHeight;
                    this.children[i].children["line-x"].position.y = this.bounds.top + newSize_y;
                    this.children[i].children["circle"].position.y = this.bounds.top + newSize_y;
                  }
                  break;
              }
              updateMenuParams(this.data);
              break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedItem.name === "circle") {
          if (mouseEvent.point.x > this.children["pad"].bounds.left &&
            mouseEvent.point.x < this.children["pad"].bounds.right &&
            mouseEvent.point.y > this.children["pad"].bounds.top &&
            mouseEvent.point.y < this.children["pad"].bounds.bottom) {
            // SEND MIDI CONTROL_CHANGE
            //sendControlChange(selectedItem.parent.data.Xcc, selectedItem.parent.data.value.x, selectedItem.parent.data.Xchan);
            //sendControlChange(selectedItem.parent.data.Ycc, selectedItem.parent.data.value.y, selectedItem.parent.data.Ychan);
            selectedItem.parent.children["line-x"].position.y = mouseEvent.point.y;
            selectedItem.parent.children["line-y"].position.x = mouseEvent.point.x;
            selectedItem.parent.children["circle"].position = mouseEvent.point;
            selectedItem.parent.data.value[0] = Math.round(mouseEvent.point.x);
            selectedItem.parent.data.value[1] = Math.round(mouseEvent.point.y);
            updateMenuParams(selectedItem.parent.data);
          }
        }
      }
    }
  });
  return _Touchpad;
};

/////////// TRIGGER Factory
function triggerFactory() {
  var defaulSize = 80;
  var selectedPath = null;
  var _Trigger = new paper.Group({
    data: {
      name: "trigger",
      value: null,
      from: [null, null],
      to: [null, null],
      chan: null,
      note: 33,
      velocity: null
    },
    setupFromMouseEvent: function (mouseEvent) {
      let halfSize = defaulSize / 2;
      this.data.from = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.c;
      this.data.note = params.n;
      this.data.velocity = params.v;
    },
    setup: function () {
      var sizeX = this.data.to[0] - this.data.from[0];
      var sizeY = this.data.to[1] - this.data.from[1];
      var circleCenterX = this.data.to[0] - (sizeX / 2);
      var circleCenterY = this.data.to[1] - (sizeY / 2);
      var _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 10,
        strokeColor: "lightblue",
        fillColor: "lightblue",
      });
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(circleCenterX, circleCenterY),
        radius: sizeX / 2.2,
        fillColor: "green"
      });
      this.addChild(_square);
      this.addChild(_circle);
    },
    onMouseDown: function (mouseEvent) {
      // selectedItem: "circle",...
      // selectedPath: fill, stroke
      var hitResult = this.hitTest(mouseEvent.point, hitOptions);
      selectedItem = hitResult.item;
      if (currentMode === EDIT_MODE) {
        selectedPath = hitResult.type;
      }
      else if (currentMode === PLAY_MODE) {
        if (selectedItem.name === "circle") {
          selectedItem.fillColor = "red";
          selectedItem.parent.data.value = this.data.note;
          if (connected) sendProgramChange(this.data.note, this.data.velocity, this.data.chan);
          setTimeout(this.triggerOff, 200, this);
        }
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            this.translate(mouseEvent.delta);
            this.data.from[0] = Math.round(this.data.from[0] += mouseEvent.delta.x);
            this.data.from[1] = Math.round(this.data.from[1] += mouseEvent.delta.y);
            this.data.to[0] = Math.round(this.data.to[0] += mouseEvent.delta.x);
            this.data.to[1] = Math.round(this.data.to[1] += mouseEvent.delta.y);
            updateMenuParams(this.data);
            break;
          case "stroke":
            if (selectedItem.name === "square") {
              var triggRadius_x = (this.bounds.right - this.bounds.left) / 2;
              var triggRadius_y = (this.bounds.bottom - this.bounds.top) / 2;
              var triggRadius = triggRadius_x;

              var triggCenter_x = this.bounds.left + triggRadius_x;
              var triggCenter_y = this.bounds.top + triggRadius_y;
              var x = mouseEvent.point.x - triggCenter_x;
              var y = mouseEvent.point.y - triggCenter_y;
              var lastTriggRadius = triggRadius;
              var triggRadius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              this.scale(triggRadius / lastTriggRadius);

              this.data.from[0] = Math.round(this.children["square"].bounds.left);
              this.data.to[0] = Math.round(this.children["square"].bounds.right);
              this.data.from[1] = Math.round(this.children["square"].bounds.top);
              this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
              updateMenuParams(this.data);

            } else if (selectedItem.name === "circle") {
              moveItem(this, mouseEvent);
            }
            break;
        }
      }
    },
    triggerOff: function (item) {
      item.children["circle"].fillColor = "green";
      item.data.value = 0;
      if (connected) sendNoteOff(item.data.note, 0, item.data.chan);
      updateMenuParams(item.data);
    }
  });
  return _Trigger;
}

/////////// SWITCH Factory
function switchFactory() {
  var defaulSize = 80;
  var selectedPath = null;
  var _Switch = new paper.Group({
    data: {
      name: "switch",
      from: [null, null],
      to: [null, null],
      value: null,
      chan: null,
      note: null,
      velocity: null
    },
    setupFromMouseEvent: function (mouseEvent) {
      let halfSize = defaulSize / 2
      this.data.from = [Math.round(mouseEvent.point.x - halfSize), Math.round(mouseEvent.point.y - halfSize)];
      this.data.to = [Math.round(mouseEvent.point.x + halfSize), Math.round(mouseEvent.point.y + halfSize)];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.c;
      this.data.note = params.n;
      this.data.velocity = params.v;
    },
    setup: function(){
      var _square = new paper.Path.Rectangle({
        name: "square",
        from: this.data.from,
        to: this.data.to,
        strokeWidth: 10,
        strokeColor: "lightblue",
        fillColor: "white"
      });
      var _cross = new paper.Group({
        name: "cross"
      });
      var _line_a = new paper.Path.Line({
        name: "line",
        from: new paper.Point(this.data.from[0], this.data.from[1]),
        to: new paper.Point(this.data.to[0], this.data.to[1]),
        strokeWidth: 8,
        strokeColor: "black"
      });
      var _line_b = new paper.Path.Line({
        name: "line",
        from: new paper.Point(this.data.from[0], this.data.to[1]),
        to: new paper.Point(this.data.to[0], this.data.from[1]),
        strokeWidth: 8,
        strokeColor: "black",
      });
      this.addChild(_square);
      _cross.addChild(_line_a);
      _cross.addChild(_line_b);
      this.addChild(_cross);
    },
    onMouseDown: function (mouseEvent) {
      // selectedItem: "circle",...
      // selectedPath: fill, stroke
      var hitResult = this.hitTest(mouseEvent.point, hitOptions);
      selectedItem = hitResult.item;
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(mouseEvent.point, hitOptions);
        selectedPath = hitResult.type;
      }
      else if (currentMode === PLAY_MODE) {
        this.data.value = !this.data.value;
        if (this.data.value) {
          this.children["cross"].visible = true;
          //if (connected) sendNoteOn(this.data.note, this.data.velocity, this.data.chan);
        } else {
          this.children["cross"].visible = false;
          if (connected) sendNoteOff(this.data.note, 0, this.data.chan);
        }
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            this.data.from[0] = Math.round(this.children["square"].bounds.left);
            this.data.from[1] = Math.round(this.children["square"].bounds.top);
            this.data.to[0] = Math.round(this.children["square"].bounds.right);
            this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
            updateMenuParams(this.data);
            break;
          case "stroke":
            if (selectedItem.name === "square") {
              var switchRadius_x = (this.bounds.right - this.bounds.left) / 2;
              var switchRadius_y = (this.bounds.bottom - this.bounds.top) / 2;
              var switchRadius = switchRadius_x;
              var switchCenter_x = this.bounds.left + switchRadius_x;
              var switchCenter_y = this.bounds.top + switchRadius_y;
              var x = mouseEvent.point.x - switchCenter_x;
              var y = mouseEvent.point.y - switchCenter_y;
              var lastSwitchRadius = switchRadius;
              var switchRadius = Math.sqrt((x * x) + (y * y)) - (this.children["square"].strokeWidth / 2);
              this.scale(switchRadius / lastSwitchRadius);
              this.data.from[0] = Math.round(this.children["square"].bounds.left);
              this.data.from[1] = Math.round(this.children["square"].bounds.top);
              this.data.to[0] = Math.round(this.children["square"].bounds.right);
              this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
            } else if (selectedItem.name === "line") {
              moveItem(this, mouseEvent);
              this.data.from[0] = Math.round(this.children["square"].bounds.left);
              this.data.from[1] = Math.round(this.children["square"].bounds.top);
              this.data.to[0] = Math.round(this.children["square"].bounds.right);
              this.data.to[1] = Math.round(this.children["square"].bounds.bottom);
            }
            updateMenuParams(this.data);
            break;
        }
      }
    }
  });
  return _Switch;
}

/////////// SLIDER Factory
function sliderFactory(mouseEvent) {
  var defaultWidth = 50;
  var defaultHeight = 400;

  var selectedPath = null;
  var selectedSegment = null;
  var lastValue = null;
  var sliderHitOptions = {
    stroke: true,
    segment: true,
    fill: true,
    tolerance: 5
  };
  var _Slider = new paper.Group({
    data: {
      name: "slider",
      from: [null, null],
      to: [null, null],
      value: 0,
      chan: null,
      cc: null,
      min: null,
      max: null
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.from = [Math.round(mouseEvent.point.x - (defaultWidth / 2)), Math.round(mouseEvent.point.y - (defaultHeight / 2))];
      this.data.to = [Math.round(mouseEvent.point.x + (defaultWidth / 2)), Math.round(mouseEvent.point.y + (defaultHeight / 2))];
    },
    setupFromConfig: function (params) {
      this.data.from = params.from;
      this.data.to = params.to;
      this.data.chan = params.c;
      this.data.cc = params.o;
      this.data.min = params.i;
      this.data.max = params.a;
    },
    setup: function(){
      var _rect = new paper.Path.Rectangle({
        name: "rect",
        value: 0,
        from: new paper.Point(this.data.from[0], this.data.from[1]),
        to: new paper.Point(this.data.to[0], this.data.to[1]),
        strokeWidth: 10,
        strokeColor: "lightblue",
        fillColor: "white"
      });
      var _handle = new paper.Path.Line({
        name: "handle",
        from: new paper.Point(this.data.from[0], this.data.from[1] + (defaultHeight / 2)),
        to: new paper.Point(this.data.to[0], this.data.from[1] + (defaultHeight / 2)),
        strokeWidth: 10,
        strokeCap: "round",
        strokeColor: "black"
      });
      this.addChild(_rect);
      this.addChild(_handle);
    },
    onMouseDown: function (mouseEvent) {
      var hitResult = this.hitTest(mouseEvent.point, sliderHitOptions);
      selectedItem = hitResult.item;
      if (currentMode === EDIT_MODE) {
        selectedPath = hitResult.type;
        if (selectedPath === "stroke") selectedSegment = hitResult.location.index;
      }
      else if (currentMode === PLAY_MODE) {
        this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.min, this.data.max));
        console.log(this.data.value);
        this.children["handle"].position.y = mouseEvent.point.y;
      }
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            moveItem(this, mouseEvent);
            this.data.from[0] = Math.round(this.children["rect"].bounds.left);
            this.data.from[1] = Math.round(this.children["rect"].bounds.top);
            this.data.to[0] = Math.round(this.children["rect"].bounds.right);
            this.data.to[1] = Math.round(this.children["rect"].bounds.bottom);
            updateMenuParams(this.data);
            break;
          case "stroke":
            switch (selectedItem.name) {
              case "rect":
                switch (selectedSegment) {
                  case 0: // Update left segment
                    this.data.from[0] = Math.round(this.bounds.left);
                    this.children["rect"].segments[0].point.x = mouseEvent.point.x;
                    this.children["rect"].segments[1].point.x = mouseEvent.point.x;
                    this.children["handle"].segments[0].point.x = mouseEvent.point.x;
                    break;
                  case 1: // Update top segment
                    this.data.from[1] = Math.round(this.bounds.top);
                    this.children["rect"].segments[1].point.y = mouseEvent.point.y;
                    this.children["rect"].segments[2].point.y = mouseEvent.point.y;
                    this.children["handle"].position.y = this.bounds.bottom - ((this.bounds.bottom - this.bounds.top) / 2);
                    break;
                  case 2: // Update right segment
                    this.data.to[0] = Math.round(this.bounds.right);
                    //width = this.bounds.right - this.bounds.left;
                    this.children["rect"].segments[2].point.x = mouseEvent.point.x;
                    this.children["rect"].segments[3].point.x = mouseEvent.point.x;
                    this.children["handle"].segments[1].point.x = mouseEvent.point.x;
                    break;
                  case 3: // Update bottom segment
                    this.data.to[1] = Math.round(this.bounds.bottom);
                    this.children["rect"].segments[3].point.y = mouseEvent.point.y;
                    this.children["rect"].segments[0].point.y = mouseEvent.point.y;
                    this.children["handle"].position.y = this.bounds.bottom - ((this.bounds.bottom - this.bounds.top) / 2);
                    break;
                }
                updateMenuParams(this.data);
                break;
              case "handle":
                moveItem(this, mouseEvent);
                this.data.from[0] = Math.round(this.children["rect"].bounds.left);
                this.data.from[1] = Math.round(this.children["rect"].bounds.top);
                this.data.to[0] = Math.round(this.children["rect"].bounds.right);
                this.data.to[1] = Math.round(this.children["rect"].bounds.bottom);
                updateMenuParams(this.data);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        if (mouseEvent.point.y > this.bounds.top && mouseEvent.point.y < this.bounds.bottom) {
          lastValue = this.data.value;
          this.children["handle"].position.y = mouseEvent.point.y;
          this.data.value = Math.round(mapp(mouseEvent.point.y, this.bounds.top, this.bounds.bottom, this.data.min, this.data.max));
          console.log(this.data.value);
          if (this.data.value != lastValue) {
            if (connected) sendControlChange(this.data.cc, this.data.value, this.data.chan);
            updateMenuParams(this.data);
          }
        }
      }
    },
    onMouseUp: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
      }
      else if (currentMode === PLAY_MODE) {
        updateMenuParams(this.data);
      }
    }
  });
  return _Slider;
}

/////////// KNOB Factory
function knobFactory(mouseEvent) {
  var defaultRadius = 80;
  var defaultOffet = 90;
  var defaultStrokeWidth = 10;
  var selectedPath = null;
  var last_offset = 0;
  var last_radius = 0;
  var last_tVal = 0;

  var _Knob = new paper.Group({
    data: {
      name: "knob",
      center: [null, null],
      radius: 50,
      offset: 60,
      radius: 0,
      tVal: 0,
      tChan: 1,
      tCc: 1,
      tMin: 0,
      tMax: 127,
      rChan: 1,
      rCc: 2,
      rMin: 0,
      rMax: 127
    },
    setupFromMouseEvent: function (mouseEvent) {
      this.data.center[0] = Math.round(mouseEvent.point.x);
      this.data.center[1] = Math.round(mouseEvent.point.y);
      this.data.radius = defaultRadius;
    },
    setupFromConfig: function (params) {
      for (var i = 0; i < params.length; i++) {
        this.data.center = params[i].center;
        this.data.radius = params[i].radius;
        this.data.offset = params[i].o;
        this.data.tChan = params[i].t;
        this.data.tCc = params[i].tc;
        this.data.tMin = params[i].ti;
        this.data.tMax = params[i].ta;
        this.data.rChan = params[i].r;
        this.data.rCc = params[i].rc;
        this.data.rMin = params[i].ri;
        this.data.rMax = params[i].ra;
      }
    },
    setup: function(){
      var headPos = pol_to_cart(this.data.radius - defaultStrokeWidth, deg_to_rad(defaultOffet));
      var footPos = pol_to_cart(this.data.radius - defaultStrokeWidth * 2, deg_to_rad(defaultOffet));
      var handlePos = pol_to_cart(this.data.radius + defaultStrokeWidth, deg_to_rad(defaultOffet));
      var _circle = new paper.Path.Circle({
        name: "circle",
        center: new paper.Point(this.data.center[0], this.data.center[1]),
        radius: this.data.radius,
        strokeColor: "lightblue",
        fillColor: "blue",
        strokeWidth: 10
      });
      var _needle = new paper.Group({
        name: "needle"
      });
      var _head = paper.Path.Circle({
        name: "head",
        center: new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y),
        radius: 6,
        strokeColor: "black",
        strokeWidth: 5
      });
      var _foot = paper.Path.Line({
        name: "foot",
        from: new paper.Point(this.data.center[0], this.data.center[1]),
        to: new paper.Point((this.data.center[0] + footPos.x), this.data.center[1] + footPos.y),
        strokeCap: "round",
        strokeColor: "black",
        strokeWidth: 5,
      });
      var _handle = new paper.Path.RegularPolygon({
        name: "handle",
        center: new paper.Point(this.data.center[0] + handlePos.x, this.data.center[1] + handlePos.y),
        radius: 10,
        fillColor: "red",
        sides: 3
      });
      _Knob.addChild(_circle);
      _needle.addChild(_head);
      _needle.addChild(_foot);
      _Knob.addChild(_needle);
      _handle.rotate(-30);
      _Knob.addChild(_handle);
    },
    onMouseDown: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        var hitResult = this.hitTest(mouseEvent.point, hitOptions);
        selectedPath = hitResult.type;
        selectedItem = hitResult.item;
      }
      else if (currentMode === PLAY_MODE) {
        var x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
        var y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);
        headPos = pol_to_cart(polar.radius, polar.theta);
        footPos = pol_to_cart(polar.radius, polar.theta);
        this.children["needle"].children["head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle"].children["foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

        last_radius = this.data.radius;
        this.data.radius = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
        if (connected && this.data.radius != last_radius) {
          sendControlChange(this.data.rCc, this.data.radius, this.data.rChan);
        }

        last_tVal = this.data.tVal;
        var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
        this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
        if (connected && this.data.tVal != last_tVal) {
          sendControlChange(this.data.tCc, this.data.tVal, this.data.tChan);
        }
      }
    },
    onMouseUp: function (mouseEvent) {
      //updateMenuParams(this.data);
    },
    onMouseDrag: function (mouseEvent) {
      if (currentMode === EDIT_MODE) {
        switch (selectedPath) {
          case "fill":
            if (selectedItem.name === "handle") {
              var x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
              var y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
              last_offset = this.data.offset;
              this.data.offset = Math.round(rad_to_deg(cart_to_pol(x, y).theta));
              var delta = this.data.offset - last_offset;
              this.children["handle"].rotate(delta, new paper.Point(this.data.center[0], this.data.center[1]));
              updateMenuParams(this.data);
            } else {
              //moveItem(this, mouseEvent);
              this.data.center[0] += Math.round(mouseEvent.delta.x);
              this.data.center[1] += Math.round(mouseEvent.delta.y);
              this.translate(mouseEvent.delta);
            }
            break;
          case "stroke":
            switch (selectedItem.name) {
              case "circle":
                var x = mouseEvent.point.x - this.data.center[0];
                var y = mouseEvent.point.y - this.data.center[1];
                var polar = cart_to_pol(x, y);
                this.scale(polar.radius / this.data.radius);
                this.data.radius = Math.round(polar.radius);
                break;
              case "needle":
                //moveItem(this, mouseEvent);
                this.data.center[0] += Math.round(mouseEvent.delta.x);
                this.data.center[1] += Math.round(mouseEvent.delta.y);
                this.translate(mouseEvent.delta);
                break;
            }
        }
      }
      else if (currentMode === PLAY_MODE) {
        let x = mouseEvent.point.x - this.data.center[0]; // Place the x origin to the circle center
        let y = mouseEvent.point.y - this.data.center[1]; // Place the y origin to the circle center
        var polar = cart_to_pol(x, y);
        var headPos;
        var footPos;
        if (polar.radius > this.data.radius) {
          var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(this.data.radius, polar.theta);
          footPos = pol_to_cart(this.data.radius, polar.theta);
        } else {
          last_radius = this.data.radius;
          this.data.radius = Math.round(mapp(polar.radius, 0, this.data.radius, this.data.rMin, this.data.rMax));
          var newPolar = rotatePolar(rad_to_deg(polar.theta), this.data.offset);
          last_tVal = this.data.tVal;
          this.data.tVal = Math.round(mapp(newPolar, 0, 380, this.data.tMin, this.data.tMax));
          headPos = pol_to_cart(polar.radius, polar.theta);
          footPos = pol_to_cart(polar.radius, polar.theta);
        }
        this.children["needle"].children["head"].position = new paper.Point(this.data.center[0] + headPos.x, this.data.center[1] + headPos.y);
        this.children["needle"].children["foot"].segments[1].point = new paper.Point(this.data.center[0] + footPos.x, this.data.center[1] + footPos.y);

        updateMenuParams(this.data);

        // SEND MIDI CONTROL_CHANGE
        if (connected && this.data.tVal != last_tVal) {
          sendControlChange(this.data.tCc, this.data.tVal, this.data.tChan);
        }
        if (connected && this.data.radius != last_radius) {
          sendControlChange(this.data.rCc, this.data.radius, this.data.rChan);
        }
      }
    }
  });
  return _Knob;
}

function moveItem(item, mouseEvent) {
  item.translate(mouseEvent.delta);
  item.data.from[0] += Math.round(mouseEvent.delta.x);
  item.data.from[1] += Math.round(mouseEvent.delta.y);
  item.data.to[0] += Math.round(mouseEvent.delta.x);
  item.data.to[1] += Math.round(mouseEvent.delta.y);
}

function scale2d(item, mouseEvent) {
  var x = mouseEvent.point.x - item.data.x;
  var y = mouseEvent.point.y - item.data.y;
  var radius = Math.sqrt((x * x) + (y * y));
  var newRadius = radius - (item.children[0].strokeWidth / 2);
  var oldRadius = (item.data.to.x - item.data.from.x) / 2;
  item.scale(newRadius / oldRadius);
  item.data.size = Math.round(item.children[0].bounds.width);
}

function deg_to_rad(degree) {
  return degree * (Math.PI / 180);
}

function rad_to_deg(radian) {
  return radian * (180 / Math.PI);
}

// Returning radian
function cart_to_pol(x, y) {
  var radius = Math.sqrt((x * x) + (y * y));
  var theta = 0;
  if (x == 0 && 0 < y) {
    theta = (Math.PI / 2);
  } else if (x == 0 && y < 0) {
    theta = (3 * Math.PI) / 2;
  } else if (x < 0) {
    theta = Math.atan(y / x) + Math.PI;
  } else if (y < 0) {
    theta = Math.atan(y / x) + (2 * Math.PI);
  } else {
    theta = Math.atan(y / x);
  }
  return {
    "radius": radius,
    "theta": theta
  }
}

function pol_to_cart(radius, theta) {
  var x = radius * Math.cos(theta);
  var y = radius * Math.sin(theta);
  return {
    "x": x,
    "y": y
  }
}

function rotatePolar(degree, offset) {
  // return (Math.abs(degree - 380) + offset) % 380; // Anti-clockwise direction
  return (Math.abs(degree + 380) - offset) % 380;    // Clockwise direction
}

function mapp(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Max is exclusive and min is inclusive
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function updateMenuParams(data) {
  var paramsIndex = 0;
  $('#summaryContent').html("Parameters");
  for (const param in data) {
    $("#paramInputAtribute-" + paramsIndex).html(param);
    $("#paramInputValue-" + paramsIndex).val(data[param]);
    $("#param-" + paramsIndex).collapse("show");
    paramsIndex++;
  }
  for (var i = MAX_PARAM; i >= paramsIndex; i--) {
    $("#param-" + i).collapse("hide");
  }
}
