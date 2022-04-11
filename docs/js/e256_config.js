/*
  This file is part of the eTextile-Synthesizer project - http://synth.eTextile.org
  Copyright (c) 2014-2022 Maurin Donneaud <maurin@etextile.org>
  This work is licensed under Creative Commons Attribution-ShareAlike 4.0 International license, see the LICENSE file for details.
*/

const PROJECT = "ETEXTILE-SYNTH";
const NAME = "MAPPING-APP";
const VERSION = "1.0.12";

// E256 HARDWARE CONSTANTS
const FLASH_SIZE = 4096;
const RAW_COLS = 16;
const RAW_ROWS = 16;
const RAW_FRAME = RAW_COLS * RAW_ROWS;

// E256 MIDI I/O CHANNELS CONSTANTS [1:15]
const MIDI_INPUT_CHANNEL = 0;   // 
const MIDI_OUTPUT_CHANNEL = 1;  //
const MIDI_MODES_CHANNEL = 2;   //
const MIDI_STATES_CHANNEL = 3;  // 
const MIDI_LEVELS_CHANNEL = 4;  // 
const MIDI_ERROR_CHANNEL = 5;   //

const SYNC_MODE_TIMEOUT = 3000;

// E256 MODES CONSTANTS (MIDI_CHANNEL 1)
const SYNC_MODE = 0;           // Read incoming setup
const STANDALONE_MODE = 1;     // e256 synth is sending mappings values over MIDI hardware (DEFAULT MODE)
const MATRIX_MODE_RAW = 2;     // Get matrix analog sensor values (16x16) over USB using MIDI format
const MATRIX_MODE_INTERP = 3;  // Get matrix analog sensor values (16x16) over USB using MIDI format
const EDIT_MODE = 4;           // Get all blobs values over USB using MIDI format
const PLAY_MODE = 5;           // Get mappings values over USB using MIDI format
const MAX_PARAMS = 15;

// STATES CONSTANTS (MIDI_CHANNEL 2)
const CALIBRATE = 0;
const GET_CONFIG = 1;          // TODO: Fetch the e256 CONFIG file
const DONE_ACTION = 2;
const ERROR = 3;

// LEVELS CONSTANTS
const THRESHOLD = 0; // E256-LEDs: | 1 | 1 |
const SIG_IN = 1;    // E256-LEDs: | 1 | 0 |
const SIG_OUT = 2;   // E256-LEDs: | 0 | 1 |
const LINE_OUT = 3;  // E256-LEDs: | 0 | 0 |

// E256 MIDI I/O CONSTANTS
const NOTE_ON = 0x90; // 
const NOTE_OFF = 0x80; //
const CONTROL_CHANGE = 0xB0; //
const PROGRAM_CHANGE = 0xC0; //
const SYSTEM_EXCLUSIVE = 0xF0; // 240
const SYSEX_BEGIN = 0xF0; // 240
const SYSEX_END = 0xF7; // 247
const SYSEX_ID = 0x7D; // 253 http://midi.teragonaudio.com/tech/midispec/id.htm
const SYSEX_CONF = 0x7C; // 124
const SYSEX_SOUND = 0x6C; // 108

// VERBOSITY CONSTANTS
const STATES_CODES = {
  16 : "FLASH_CONFIG_ALLOC_DONE",
  17 : "FLASH_CONFIG_LOAD_DONE",
  18 : "FLASH_CONFIG_WRITE_DONE",
  19 : "USBMIDI_CONFIG_ALLOC_DONE",
  20 : "USBMIDI_CONFIG_LOAD_DONE",
  21 : "USBMIDI_SOUND_LOAD_DONE",
  22 : "USBMIDI_SET_LEVEL_DONE",
};

const ERROR_CODES = {
  33 : "ERROR_WAITING_FOR_GONFIG",
  34 : "ERROR_LOADING_GONFIG_FAILED",
  35 : "ERROR_CONNECTING_FLASH",
  36 : "ERROR_WHILE_OPEN_FLASH_FILE",
  37 : "ERROR_FLASH_FULL",
  38 : "ERROR_FILE_TO_BIG",
  39 : "ERROR_NO_CONFIG_FILE",
  40 : "ERROR_UNKNOWN_SYSEX"
};

const BI = 0; // [0] Blob UID
const BS = 1; // [1] Blob State
const BL = 2; // [2] Blob Last State
const BX = 3; // [3] Blob X centroid position
const BY = 4; // [4] Blob Y centroid position
const BZ = 5; // [5] Blob Depth
const BW = 6; // [6] Blob width
const BH = 7; // [7] Blob Height