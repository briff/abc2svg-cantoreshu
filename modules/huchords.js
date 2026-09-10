// abc2svg - huchords.js - Hungarian chord-symbol spelling
//
// Copyright (C) 2026 Bertalan Fodor
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.
//
// Hungarian chord charts spell B natural as 'H' and B flat as 'B'.
// abc2svg parses and transposes chord roots as English note names and spells
// the result relative to the destination key, so a semitone up may come out as
// 'B#' or 'Cb' - not how a chord chart reads.  This hook runs after abc2svg's
// own chord transposition (gch_tr1, a closure-local function no module hook can
// replace) and rewrites every root and slashed bass note onto the fixed palette
//	C Db D Eb E F Gb G Ab A Bb H
// by pitch class.
//
// Unlike the on-demand modules, this one is linked into the core: it answers to
// no %% directive, so it must already be registered when a tune is rendered.
// The 'H' -> English 'B' rewrite on the way in belongs to the calling app.

abc2svg.huchords = {
	pc: {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11},
	names: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'H'],

	// -- one note name from a letter and its accidentals --
	name1: function(letter, acc) {
		var	i,
			n = abc2svg.huchords.pc[letter]

		for (i = 0; i < acc.length; i++) {
			if (acc[i] == '#' || acc[i] == '♯')
				n++
			else if (acc[i] == 'b' || acc[i] == '♭')
				n--
		}
		return abc2svg.huchords.names[((n % 12) + 12) % 12]
	}, // name1()

	// -- respell the root and the bass note of a chord symbol --
	respell: function(text) {
	    var	hc = abc2svg.huchords

		return text
			.replace(/^([A-G])(##|#|bb|b|♯|♭)?/,
				function(m, l, a) { return hc.name1(l, a || '') })
			.replace(/\/([A-G])(##|#|bb|b|♯|♭)?/,
				function(m, l, a) { return '/' + hc.name1(l, a || '') })
	}, // respell()

	gch_build: function(of, s) {
	    var	i, gch

		if (s.a_gch) {
			for (i = 0; i < s.a_gch.length; i++) {
				gch = s.a_gch[i]
				if (gch.type == 'g' && gch.text)
					gch.text = abc2svg.huchords.respell(gch.text)
			}
		}
		of(s)
	}, // gch_build()

	set_hooks: function(abc) {
		abc.gch_build = abc2svg.huchords.gch_build.bind(abc, abc.gch_build)
	} // set_hooks()
} // huchords

if (!abc2svg.mhooks)
	abc2svg.mhooks = {}
abc2svg.mhooks.huchords = abc2svg.huchords.set_hooks
