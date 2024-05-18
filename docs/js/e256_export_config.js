/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var e256_config = ({}); // empty JSON declaration

function e256_export_params() {
  e256_config["mappings"] = {};
  for (const layer of paper.project.layers) {
    if (layer.hasChildren()) {
      e256_config["mappings"][layer.name] = list_layer_params(layer);
    }
  }
}

function list_layer_params(layer) {
  var e256_params = [];
  for (const item of layer.children) {
    item.save_params();
    switch (item.name) {
      case "grid":
        let grid_params = {};
        for (const param in item.data) {
          if (item.data[param].constructor.name === "Point") {
            grid_params[param] = [
              Math.round(mapp(item.data[param].x, 0, canvas_width, 0, MATRIX_RESOLUTION_X)),
              Math.round(mapp(item.data[param].y, 0, canvas_height, 0, MATRIX_RESOLUTION_Y))
            ];
          } else {
            grid_params[param] = item.data[param];
          }
        }
        e256_params.push(grid_params);
        break;

      case "touchpad":
        let touchpad_params = {};
        for (const param in item.data) {
          if (item.data[param].constructor.name === "Point") {
            touchpad_params[param] = [
              Math.round(mapp(item.data[param].x, 0, canvas_width, 0, MATRIX_RESOLUTION_X)),
              Math.round(mapp(item.data[param].y, 0, canvas_height, 0, MATRIX_RESOLUTION_Y))
            ];
          }
          else {
            touchpad_params[param] = item.data[param];
          }
        }
        e256_params.push(touchpad_params);
        break;

      case "slider":
        let slider_params = {};
        for (const param in item.data) {
          if (item.data[param].constructor.name === "Point") {
            slider_params[param] = [
              Math.round(mapp(item.data[param].x, 0, canvas_width, 0, MATRIX_RESOLUTION_X)),
              Math.round(mapp(item.data[param].y, 0, canvas_height, 0, MATRIX_RESOLUTION_Y))
            ];
          }
          else {
            slider_params[param] = item.data[param];
          }
        }
        e256_params.push(slider_params);
        break;

      case "switch":
        let switch_params = {};
        for (const param in item.data) {
          /*
          if (param === "mode_z") {
            // This parameter is removed
          }
          */
          if (item.data[param].constructor.name === "Point") {
            switch_params[param] = [
              Math.round(mapp(item.data[param].x, 0, canvas_width, 0, MATRIX_RESOLUTION_X)),
              Math.round(mapp(item.data[param].y, 0, canvas_height, 0, MATRIX_RESOLUTION_Y))
            ];
          }
          else {
            //console.log("A: " + item.data[param][0]["pos_z"]);
            //console.log("A: " + JSON.stringify(item.data[param][0]["pos_z"]["msg"]));
            switch_params[param] = item.data[param];
            //switch_params[param] = item.data[param][0]["pos_z"];
          }
        }
        e256_params.push(switch_params);
        break;

      case "knob":
        let knob_params = {};
        for (const param in item.data) {
          if (item.data[param].constructor.name === "Point") {
            knob_params[param] = [
              Math.round(mapp(item.data[param].x, 0, canvas_width, 0, MATRIX_RESOLUTION_X)),
              Math.round(mapp(item.data[param].y, 0, canvas_height, 0, MATRIX_RESOLUTION_Y))
            ];
          }
          else {
            knob_params[param] = item.data[param];
          }
        }
        e256_params.push(knob_params);
        break;

      case "path":
        let path_params = {};
        for (const param in item.data) {
          path_params.data[param] = parseInt(item.data[param]);
        }
        e256_params.push(path_params);
        break;

      case "polygon":
        let polygon_params = {};
        for (const param in item.data) {
          polygon_params.data[param] = parseInt(item.data[param]);
        }
        e256_params.push(polygon_params);
        break;
    }
  }
  return e256_params;
}
