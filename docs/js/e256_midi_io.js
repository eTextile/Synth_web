/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

var MIDIInput = null;
var MIDIOutput = null;

let inputSetup = false;
let outputSetup = false;
var midi_device_connected = false; // SET I TO FALSE
var loaded_file = null; // from user desktop
var fetch_config_file = null; // from e256 flash memory

const DEFAULT_MIDI_CHANNEL = 1;     // [1:16]
const DEFAULT_MIDI_NOTE = 64;
const DEFAULT_MIDI_VELOCITY = 127;  // [0:127]
const DEFAULT_MIDI_VALUE = 0;
const DEFAULT_MIDI_CC = 23;
const DEFAULT_MIDI_AFT = 24;
const DEFAULT_MIDI_PGM = 10;
const DEFAULT_MIDI_MIN = 0;
const DEFAULT_MIDI_MAX = 127;

function* midi_index() {
  let index = 1;
  while (true) {
    index = index++;
    index = index % 128;
    yield index++;
  }
};

const default_midi_index = midi_index();

// MIDI struct
// https://www.midi.org/specifications-old/item/table-2-expanded-messages-list-status-bytes
function midi_msg_status_pack(type, channel) {
  return (channel - 1) | (type << 4);
};

function midi_msg_status_unpack(status) {
  return {
    "type": (status >> 4) & 0xF, // Save the 4 MSB bits
    "channel": (status & 0xF) + 1 // Save the 4 LSB bits [0000 === chan 1]
  };
};

function note_on(chan, note, velo) {
  let status = midi_msg_status_pack(NOTE_ON, chan);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  };
};

function note_off(chan, note, velo) {
  let status = midi_msg_status_pack(NOTE_OFF, chan);
  return {
    "status": status,
    "data1": note,
    "data2": velo
  }
};

function control_change(chan, ctr, val) {
  let status = midi_msg_status_pack(C_CHANGE, chan);
  return {
    "status": status,
    "data1": ctr,
    "data2": val
  }
};

function polyphonic_aftertouch(chan, aft) {
  let status = midi_msg_status_pack(P_AFTERTOUCH, chan);
  return {
    "status": status,
    "data1": aft,
    "data2": null
  }
};

function program_change(chan, pgm) {
  let status = midi_msg_status_pack(P_CHANGE, chan);
  return {
    "status": status,
    "data1": pgm,
    "data2": null
  }
};

function limit(min, max) {
  return {
    "min": min, // [0:127]
    "max": max  // [0:127]
  }
};

// MIDI MESSAGE BUILDER
function midi_msg_builder(mode) {
  // NOTE_OFF
  // NOTE_ON 
  // P_AFTERTOUCH
  // C_CHANGE
  // P_CHANGE
  // C_AFTERTOUCH
  // P_BEND
  // SYS_EX

  let msg = {};
  switch (mode) {
    case NOTE_ON:
      msg.midi = new note_on(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        DEFAULT_MIDI_VELOCITY
      );
      break;
    case C_CHANGE:
      msg.midi = new control_change(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value,
        DEFAULT_MIDI_VELOCITY
      );
      msg.limit = new limit(
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      );
      break;
    case P_AFTERTOUCH:
      msg.midi = new polyphonic_aftertouch(
        DEFAULT_MIDI_CHANNEL,
        default_midi_index.next().value
      );
      msg.limit = new limit(
        DEFAULT_MIDI_MIN,
        DEFAULT_MIDI_MAX
      );
      break;
  };
  return msg;
};

function MIDIsetup() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
  } else {
    alert("This browser does not support MIDI!");
  }
 };

function onMIDISuccess(midiAccess) {
  midiAccess.onstatechange = function (msg) {
    switch (msg.port.state) {
      case "connected":
        for (let input of midiAccess.inputs.values()) {
          if (input.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDIInput = input;
            inputSetup = true;
          }
        }
        for (let output of midiAccess.outputs.values()) {
          if (output.name === "ETEXTILE_SYNTH MIDI 1") {
            MIDIOutput = output;
            outputSetup = true;
          }
        }
        if (inputSetup && outputSetup) {
          midi_device_connected = true;
          MIDIInput.onmidimessage = onMIDIMessage;
          console.log("IN: " + MIDIInput.name);
          console.log("OUT: " + MIDIOutput.name);
          setTimeout(function () {
            send_midi_msg(new program_change(MIDI_MODES_CHANNEL, SYNC_MODE));
            console.log("REQUEST: SYNC_MODE");
          }, 1000);
        }
        break;
      case "disconnected":
        MIDIInput = null;
        MIDIOutput = null;
        inputSetup = false;
        outputSetup = false;
        midi_device_connected = false;
        e256_current_mode = PENDING_MODE;
        console.log("MODE: " + MODE_CODES[e256_current_mode]);
        updateMenu();
        break;
    }
  }
};

function onMIDIFailure(error) {
  alert("MIDI ERROR :" + error);
};

function updateMenu() {
  if (midi_device_connected) {
    connectSwitch.checked = true;
    $("#connectSwitch").removeClass("btn-danger").addClass("btn-success");
    $("#summaryAction").html("CONNECTED").removeClass("alert-warning").addClass("alert-success");
    $("#startMenu").collapse("show");
  }
  else {
    connectSwitch.checked = false;
    $("#startMenu").collapse("hide");
    $("#calibrateMenu").collapse("hide");
    $("#matrixMenu").collapse("hide");
    $("#mappingMenu").collapse("hide");
    $("#loadingCanvas").collapse("show");
    $("#matrixCanvas").collapse("hide");
    $("#mappingCanvas").collapse("hide");
    $("#summaryAction").html("DISCONNECTED").removeClass("alert-success").addClass("alert-warning");
    $("#contextualContent").html("This is the web app made for loading graphic & audio modules in to your eTextile-Synthesizer.");
    $("#connectSwitch").removeClass("btn-success").addClass("btn-danger");
    $(".param").collapse("hide");
  }
};

// RAW MIDI MESSAGES!
// MIDI 1.0
// midiMsg -> ROW MIDI mesage
function onMIDIMessage(midiMsg) {
  let status = midi_msg_status_unpack(midiMsg.data[0]);
  let data1 = midiMsg.data[1];
  //let data2 = midiMsg.data[2];

  /*
  console.log (
    "TYPE: " + status.type +
    " CHAN: " + status.channel +
    " DATA1: " + midiMsg.data[1] +
    " DATA2: " + midiMsg.data[2]
  );
  */

  switch (status.type) {
    case NOTE_ON:
      e256_blobs.add(midiMsg.data);
      break;
    case NOTE_OFF:
      e256_blobs.remove(midiMsg.data);
      break;
    case C_CHANGE:
      // N/A
      break;
    case P_CHANGE:
      switch (status.channel) {
        case MIDI_VERBOSITY_CHANNEL:
          switch (VERBOSITY_CODES[data1]) {
  
            case "MATRIX_MODE_RAW_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              // TODO: Update menu
              break;

            case "MAPPING_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              // TODO: Update menu
              break;

            case "EDIT_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              e256_current_mode = EDIT_MODE;
              break;
  
            case "PLAY_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              e256_current_mode = PLAY_MODE;
              break;
  
            case "PENDING_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, SYNC_MODE));
              console.log("REQUEST: SYNC_MODE");
              break;
  
            case "SYNC_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              e256_current_mode = SYNC_MODE;
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, LOAD_MODE));
              console.log("REQUEST: LOAD_MODE");
              updateMenu();
              break;

            case "CALIBRATE_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              break;

            case "LOAD_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, FETCH_MODE));
              console.log("REQUEST: FETCH_MODE");
              e256_current_mode = FETCH_MODE;
              break;

            case "ALLOCATE_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              e256_export_params();
              sysex_alloc(SYSEX_CONF, conf_size);
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, UPLOAD_MODE));
              console.log("REQUEST: UPLOAD_MODE");
              break;

            case "UPLOAD_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              sysex_upload(string_to_bytes(JSON.stringify(e256_config)));
              break;

            case "FETCH_MODE_DONE":
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              draw_controler_from_config(fetch_config_file);
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, EDIT_MODE));
              console.log("REQUEST: EDIT_MODE");
              e256_current_mode = EDIT_MODE;
              break;

            default:
              console.log("RECEIVED: " + VERBOSITY_CODES[data1]);
              send_midi_msg(new program_change(MIDI_MODES_CHANNEL, EDIT_MODE));
              console.log("REQUEST: EDIT_MODE");
              break;
          }
          break;
        case MIDI_ERROR_CHANNEL:
          console.log("ERROR: " + ERROR_CODES[data1]);
          break;
      }
      break;

    case SYS_EX:
      switch (e256_current_mode) {

        case FETCH_MODE:
          const decoder = new TextDecoder();
          let conf_str = decoder.decode(midiMsg.data);
          fetch_config_file = conf_str.slice(1, -1);
          break;

        case MATRIX_MODE_RAW:
          e256_matrix.update(midiMsg.data);
          break;
        
          case EDIT_MODE:
          e256_blobs.update(midiMsg.data);
          break;

        case PLAY_MODE:
          // N/A
          break;
      }
      break;
    default:
      break;
  }
};

function send_midi_msg(midiMsg) {
  if (midi_device_connected) {
    //console.log("OUT:" + Object.values(midiMsg));
    if (midiMsg.data2 === null) {
      MIDIOutput.send([midiMsg.status, midiMsg.data1]);
    } else {
      MIDIOutput.send([midiMsg.status, midiMsg.data1, midiMsg.data2]);
    }
  }
  else {
    alert("MIDI_HARDWARE IS NOT CONNECTED!");
  }
  midi_term.push(midiMsg);
};

// Send data via MIDI system exclusive message
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_IDENTIFIER, SYSEX_SIZE_MSB, SYSEX_SIZE_LSB, SYSEX_END ] 
// Recive: USBMIDI_CONFIG_ALLOC_DONE
// Send: [ SYSEX_BEGIN, SYSEX_DEVICE_ID, SYSEX_DATA, SYSEX_END ]
// Recive: USBMIDI_CONFIG_LOAD_DONE
function sysex_alloc(identifier, size) {
  if (conf_size < FLASH_SIZE) {
    let size_msb = size >> 7;
    let size_lsb = size & 0x7F;
    //let header = [SYSEX_BEGIN, SYSEX_DEVICE_ID];
    //let midiMsg = header.concat(identifier).concat(size_msb).concat(size_lsb).concat(SYSEX_END);
    console.log("ALOCATE: " + [SYSEX_BEGIN, SYSEX_DEVICE_ID, identifier, size_msb, size_lsb, SYSEX_END]);
    MIDIOutput.send([SYSEX_BEGIN, SYSEX_DEVICE_ID, identifier, size_msb, size_lsb, SYSEX_END]);
  } else {
    alert("FILE TO BIG!");
  }
};

function sysex_upload(data) {
  //let midiMsg = [SYSEX_BEGIN, SYSEX_DEVICE_ID, data, SYSEX_END];
  let header = [SYSEX_BEGIN, SYSEX_DEVICE_ID];
  let midiMsg = header.concat(data).concat(SYSEX_END);
  //console.log("UPLOAD: " + [SYSEX_BEGIN, SYSEX_DEVICE_ID, data, SYSEX_END]);
  MIDIOutput.send(midiMsg);
};

/*
function e256_alocate_memory() {
  switch (loaded_file.type) {
    case "application/json":
        sysex_alloc(SYSEX_CONF, conf_size);
      break;
    case "application/wav":
      //sysex_alloc(SYSEX_SOUND, sound.length); // TODO
      break;
    default:
      alert("MISSING FILE!");
      break;
  }
};
*/

$(document).ready(function () {
  $("#loadingCanvas").collapse("show");
  MIDIsetup();
});

function string_to_bytes(str) {
  let bytes = [];
  for (let i = 0, n = str.length; i < n; i++) {
    let char = str.charCodeAt(i);
    bytes.push(char);
  }
  return bytes;
};
