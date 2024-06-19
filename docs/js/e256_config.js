/*
  This file is part of the eTextile-Synthesizer project - https://synth.eTextile.org
  Copyright (c) 2014-2024 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.21";

var current_controleur = { "id": null };
var previous_controleur = { "id": null };
var current_touch = { "id": null };
var previous_touch = { "id": null };
var current_part = { "id": null };

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;
const MATRIX_RESOLUTION_X = 64;
const MATRIX_RESOLUTION_Y = 64;

// E256 SOFTWARE CONSTANTS
const TOUCH_RADIUS = 25;
const FONT_SIZE = 20;

// E256 MIDI I/O CHANNELS CONSTANTS [1:15]
const MIDI_LEVELS_CHANNEL = 3;
const MIDI_MODES_CHANNEL = 4;
const MIDI_VERBOSITY_CHANNEL = 5;
const MIDI_ERROR_CHANNEL = 6;

// LEVELS CONSTANTS (MIDI_LEVELS_CHANNEL)
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |

// E256 MIDI TYPES CONSTANTS
const NOTE_OFF = 0x8;     // NOTE_OFF // 1 0 0 0  // OFF to ON = OFF | ON
const NOTE_ON = 0x9;      // NOTE_ON // 1 0 0 1  // ON to OFF = ON & OFF
const P_AFTERTOUCH = 0xA; // POLYPHONIC_AFTERTOUCH
const C_CHANGE = 0xB;     // CONTROL_CHANGE
const P_CHANGE = 0xC;     // PROGRAM_CHANGE
const C_AFTERTOUCH = 0xD; // CHANNEL_AFTERTOUCH
const P_BEND = 0xE;       // PITCH_BEND
const SYS_EX = 0xF;       // SYSTEM_EXCLUSIVE
// type: 0xF1  TimeCodeQuarterFrame
// type: 0xF2  SongPosition
// type: 0xF3  SongSelect
// type: 0xF6  TuneRequest
// type: 0xF8  Clock
// type: 0xFA  Start
// type: 0xFB  Continue
// type: 0xFC  Stop
// type: 0xFE  ActiveSensing
// type: 0xFF  SystemReset
// type: 0xF8-0xFF - if more specific handler not configured

const SYSEX_BEGIN = 0xF0;      // DEC: 240
const SYSEX_END = 0xF7;        // DEC: 247
const SYSEX_DEVICE_ID = 0x7D;  // DEC: 253 http://midi.teragonaudio.com/tech/midispec/id.html

const SYSEX_CONF = 0x7C;       // DEC: 124
const SYSEX_SOUND = 0x6C;      // DEC: 108
//...

const MIDI_TYPES = {
  0x8: "NOTE_OFF",        // NOTE_OFF
  0x9: "NOTE_ON",         // NOTE_ON
  0xA: "P_AFTERTOUCH",    // POLYPHONIC_AFTERTOUCH
  0xB: "C_CHANGE",        // CONTROL_CHANGE
  0xC: "P_CHANGE",        // PROGRAM_CHANGE
  0xD: "C_AFTERTOUCH",    // CHANNEL_AFTERTOUCH
  0xE: "P_BEND",          // PITCH_BEND
  0xF: "SYS_EX"           // SYSTEM_EXCLUSIVE
};

const DATA1 = {
  0x8: "note",
  0x9: "note",
  0xA: "press",
  0xB: "cc",
  0xC: "pgm",
  0xD: "lsb",
  0xE: "??", // FIXME!
  0xF: "press"
};

const DATA2 = {
  0x8: "velo",
  0x9: "velo",
  0xA: null,
  0xB: null,
  0xC: null,
  0xD: "msb",
  0xE: "??", // FIXME!
  0xF: null
};

// E256 MODES CONSTANTS (MIDI_MODES_CHANNEL)
const PENDING_MODE = 0;     // Waiting mode
const SYNC_MODE = 1;        // Hand chake mode
const CALIBRATE_MODE = 2;
const MATRIX_MODE_RAW = 3;  // Get matrix analog sensor values (16x16) over USB using MIDI format
const EDIT_MODE = 4;        // Get all blobs values over USB using MIDI format
const PLAY_MODE = 5;        // Get mappings values over USB using MIDI format
const ALLOCATE_MODE = 6;    //
const UPLOAD_MODE = 7;      //
const APPLY_MODE = 8;       //
const WRITE_MODE = 9;       //
const LOAD_MODE = 10;       //
const FETCH_MODE = 11;      // Request mapping config file
const STANDALONE_MODE = 12; // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const ERROR_MODE = 13;      // Unexpected behaviour

// VERBOSITY MODES CONSTANTS
const MODE_CODES = {
  0: "PENDING_MODE",
  1: "SYNC_MODE",
  2: "CALIBRATE_MODE",
  3: "MATRIX_MODE_RAW",
  4: "EDIT_MODE",
  5: "PLAY_MODE",
  6: "ALLOCATE_MODE",
  7: "UPLOAD_MODE",
  8: "APPLY_MODE",
  9: "WRITE_MODE",
  10: "LOAD_MODE",
  11: "FETCH_MODE",
  12: "STANDALONE_MODE",
  13: "ERROR_MODE"
};

// VERBOSITY CODES CONSTANTS
const PENDING_MODE_DONE = 0;
const SYNC_MODE_DONE = 1;
const CALIBRATE_MODE_DONE = 2;
const MATRIX_MODE_RAW_DONE = 3;
const EDIT_MODE_DONE = 4;
const PLAY_MODE_DONE = 5;
const ALLOCATE_MODE_DONE = 6;
const UPLOAD_MODE_DONE = 7;
const APPLY_MODE_DONE = 8;
const WRITE_MODE_DONE = 9;
const LOAD_MODE_DONE = 10;
const FETCH_MODE_DONE = 11;
const STANDALONE_MODE_DONE = 12;
const DONE_ACTION = 13;

const VERBOSITY_CODES = {
  0: "PENDING_MODE_DONE",
  1: "SYNC_MODE_DONE",
  2: "CALIBRATE_MODE_DONE",
  3: "MATRIX_MODE_RAW_DONE",
  4: "EDIT_MODE_DONE",
  5: "PLAY_MODE_DONE",
  6: "ALLOCATE_MODE_DONE",
  7: "UPLOAD_MODE_DONE",
  8: "APPLY_MODE_DONE",
  9: "WRITE_MODE_DONE",
  10: "LOAD_MODE_DONE",
  11: "FETCH_MODE_DONE",
  12: "STANDALONE_MODE_DONE",
  13: "DONE_ACTION"
};

// ERROR CODES CONSTANTS
const WAITING_FOR_CONFIG = 0;
const CONNECTING_FLASH = 1;
const FLASH_FULL = 2;
const FILE_TO_BIG = 3;
const NO_CONFIG_FILE = 4;
const WHILE_OPEN_FLASH_FILE = 5;
const USBMIDI_CONFIG_LOAD_FAILED = 6;
const FLASH_CONFIG_LOAD_FAILED = 7;
const CONFIG_APPLY_FAILED = 8;
const UNKNOWN_SYSEX = 9;
const TOO_MANY_BLOBS = 10;

const ERROR_CODES = {
  0: "WAITING_FOR_CONFIG",
  1: "CONNECTING_FLASH",
  2: "FLASH_FULL",
  3: "FILE_TO_BIG",
  4: "NO_CONFIG_FILE",
  5: "WHILE_OPEN_FLASH_FILE",
  6: "USBMIDI_CONFIG_LOAD_FAILED",
  7: "FLASH_CONFIG_LOAD_FAILED",
  8: "CONFIG_APPLY_FAILED",
  9: "UNKNOWN_SYSEX",
  10: "TOO_MANY_BLOBS"
};
