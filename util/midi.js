//#javascript
// Set the MIDI pitches in the notes
//
// Copyright (C) 2015-2019 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

// Usage:
//	// Define a get_abcmodel() callback function
//	// This one is called by abc2svg after ABC parsing 
//	user.get_abcmodel = my_midi_callback
//
//	// In this function
//	function my_midi_callback(tsfirst, voice_tb, music_types, info) {
//
//		// Create a AbcMIDI instance
//		var abcmidi = new AbcMIDI();
//
//		// and set the MIDI pitches
//		abcmidi.add(tsfirst, voice_tb);
//
//		// The MIDI pitches are stored in the notes
//		//	s.notes[i].midi
//	}

// AbcMIDI creation
function AbcMIDI() {
    var	C = abc2svg.C,
	// key table - index = number of accidentals + 7
	keys = [
		new Int8Array([-1,-1,-1,-1,-1,-1,-1 ]),	// 7 flat signs
		new Int8Array([-1,-1,-1, 0,-1,-1,-1 ]),	// 6 flat signs
		new Int8Array([ 0,-1,-1, 0,-1,-1,-1 ]),	// 5 flat signs
		new Int8Array([ 0,-1,-1, 0, 0,-1,-1 ]),	// 4 flat signs
		new Int8Array([ 0, 0,-1, 0, 0,-1,-1 ]),	// 3 flat signs
		new Int8Array([ 0, 0,-1, 0, 0, 0,-1 ]),	// 2 flat signs
		new Int8Array([ 0, 0, 0, 0, 0, 0,-1 ]),	// 1 flat signs
		new Int8Array([ 0, 0, 0, 0, 0, 0, 0 ]),	// no accidental
		new Int8Array([ 0, 0, 0, 1, 0, 0, 0 ]),	// 1 sharp signs
		new Int8Array([ 1, 0, 0, 1, 0, 0, 0 ]),	// 2 sharp signs
		new Int8Array([ 1, 0, 0, 1, 1, 0, 0 ]),	// 3 sharp signs
		new Int8Array([ 1, 1, 0, 1, 1, 0, 0 ]),	// 4 sharp signs
		new Int8Array([ 1, 1, 0, 1, 1, 1, 0 ]),	// 5 sharp signs
		new Int8Array([ 1, 1, 1, 1, 1, 1, 0 ]),	// 6 sharp signs
		new Int8Array([ 1, 1, 1, 1, 1, 1, 1 ])	// 7 sharp signs
	],
	scale = new Int8Array([0, 2, 4, 5, 7, 9, 11])	// note to pitch
				

	// add MIDI pitches
	AbcMIDI.prototype.add = function(s,		// starting symbol
					voice_tb) {	// voice table

	    var bmap,					// measure base map
			map = new Int8Array(70),	// current map - 10 octaves
			tie_map,			// index = MIDI pitch
			tie_time,
			v,
			transp				// clef transpose

		// re-initialize the map on bar
		function bar_map() {
			for (var i = 0; i < 10; i++)
				map.set(bmap, i * 7)
		} // bar_map()

		// define the note map
		function key_map(s) {
			bmap = keys[s.k_sf + 7]
			bar_map()
		} // key_map()

		// convert ABC pitch to MIDI
		function pit2midi(s, note) {
		    var	a = note.acc
			p = note.pit + 19 + transp	// (+19 for pitch from C-1)

			if (a) {
				if (a == 3)		 // (3 = natural)
					a = 0
				else if (note.micro_n)
					a = (a < 0 ? -note.micro_n : note.micro_n) /
								note.micro_d * 2
				map[p] = a
			} else {
				a = map[p]
			}

			if (tie_time[p]) {
				if (s.time > tie_time[p]) {
					delete tie_map[p]
					delete tie_time[p]
				} else {
					a = tie_map[p]
				}
			}

			note.midi = ((p / 7) | 0) * 12 + scale[p % 7] + a

			if (note.tie_ty) {
				tie_map[p] = a
				tie_time[p] = s.time + s.dur
			}
		} // pit2midi()

		// initialize the clefs and keys
		for (v = 0; v < voice_tb.length; v++) {
			if (!voice_tb[v].sym)
				continue
			s = voice_tb[v].clef
			transp = (s.clef_octave && !s.clef_oct_transp) ?
					s.clef_octave : 0
			key_map(voice_tb[v].key);	// init acc. map from key sig.

			// and loop on the symbols of the voice
			vloop(v)
		}
	    function vloop(v) {
		var	i, g, p, note,
			s = voice_tb[v].sym,
			vtime = s.time,		// next time
			rep_tie_map = []

		tie_map = []
		tie_time = []
		while (s) {
			if (s.time > vtime) {	// if time skip
				bar_map()	// force a measure bar
				vtime = s.time
			}
			if (s.dur)
				vtime = s.time + s.dur
			switch (s.type) {
			case C.BAR:
//fixme: pb when lack of measure bar (voice overlay, new voice)
				// x times repeat
				if (s.text) {
					if (s.text[0] == '1') {	// 1st time
						rep_tie_map = [];
						rep_tie_time = []
						rep_tie_map.set(tie_map)
					} else if (rep_tie_map.length) {
						tie_map = []
						tie_time = []
						for (i = 0; i < rep_tie_map.length; i++) {
							tie_map[i] = rep_tie_map[i];
							tie_time[i] = s.time
						}
					}
				}
				if (!s.invis)
					bar_map()
				break
			case C.CLEF:
				transp = (s.clef_octave && !s.clef_oct_transp) ?
						s.clef_octave : 0
				break
			case C.GRACE:
				for (g = s.extra; g; g = g.next) {
					if (!g.type != C.NOTE)
						continue
					for (i = 0; i <= g.nhd; i++)
						note.midi = pit2midi(s, g.notes[i])
				}
				break
			case C.KEY:
				key_map(s)
				break
			case C.NOTE:
				for (i = 0; i <= s.nhd; i++)
					pit2midi(s, s.notes[i])
				break
			}
			s = s.next
		}
	    } // vloop()
	} // add()
} // end AbcMidi
