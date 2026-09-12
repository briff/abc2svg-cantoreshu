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
// Hungarian chord charts spell B natural as 'H' and B flat as 'B'.  This hook
// runs after abc2svg's own chord transposition (gch_tr1, a closure-local
// function no module hook can replace) and rewrites the root and the slashed
// bass note of every chord symbol.
//
// What the tune writes is kept as written: 'F#' stays 'F#', 'Cb' stays 'Cb'.
// The only change is the Hungarian name of B natural - 'H', 'Bb' keeping its
// own name.
//
// A root abc2svg has transposed itself is not the tune's spelling, and that one
// is renamed by pitch class, on the side its accidentals came from:
//	sharps  C C# D D# E F F# G G# A A# H
//	flats   C Db D Eb E F Gb G Ab A Bb H
// gch_tr1 transposes along the line of fifths, so it writes roots no chart
// carries - a semitone up from B it writes 'B#', which reads here as 'C'.  A
// transposed root a chart can carry passes through this untouched as well: a
// semitone up from F stays the 'F#' gch_tr1 made of it.  The core marks what it
// transposed (gch.trsp, set in csan_add).
//
// On the way in, chord symbols are read as English names: 'B' is B natural.
// '%%huchords' says the tune writes them in Hungarian instead, and hu2en()
// then reads 'H' as B natural and a plain 'B' as B flat.  The core calls it as
// it parses a chord symbol (parse_gchord), before anything is transposed and
// before the text is saved for the play accompaniment, so the whole engine -
// transposition, playback, %%diagram - sees the English name.
//
// Unlike the on-demand modules, this one is linked into the core: its hooks
// must be registered before a tune is rendered, whether or not the tune asks
// for the directive.

abc2svg.huchords = {
	pc: {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11},

	// the names of the twelve pitch classes, on either side of the line of
	// fifths.  Both spell a natural as itself, so a root that needs no
	// accidental comes back unchanged whichever one answers.
	sharps: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'],
	flats: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'H'],

	// the root and the slashed bass note of a Hungarian chord symbol
	re_hu: [/^([BH])(##|#|bb|b|♯|♭)?/,
		/\/([BH])(##|#|bb|b|♯|♭)?/],

	// -- English name of a note name written in Hungarian --
	// 'H' is B natural, and a 'B' carrying no accidental is B flat.  A 'B'
	// that does carry one is already unambiguous and is left as it is.
	hu1: function(letter, acc) {
		return letter == 'H' || acc ? 'B' + acc : 'Bb'
	}, // hu1()

	// -- read a chord symbol written in Hungarian as an English one --
	// called by the core while parsing, under '%%huchords'
	hu2en: function(text) {
	    var	hc = abc2svg.huchords

		return text
			.replace(hc.re_hu[0],
				function(m, l, a) { return hc.hu1(l, a || '') })
			.replace(hc.re_hu[1],
				function(m, l, a) { return '/' + hc.hu1(l, a || '') })
	}, // hu2en()

	// -- one note name from a letter and its accidentals --
	name1: function(letter, acc) {
	    var	i,
		hc = abc2svg.huchords,
		n = hc.pc[letter],
		up = 0				// which side the accidentals are on

		for (i = 0; i < acc.length; i++) {
			if (acc[i] == '#' || acc[i] == '♯')
				up++
			else if (acc[i] == 'b' || acc[i] == '♭')
				up--
		}
		n = ((n + up) % 12 + 12) % 12
		return (up > 0 ? hc.sharps : hc.flats)[n]
	}, // name1()

	// the root of a chord symbol, and the bass note after its slash.
	// With nothing transposed there is only the Hungarian name of B
	// natural to write, so that pair matches no other root.
	re_all: [/^([A-G])(##|#|bb|b|♯|♭)?/,
		/\/([A-G])(##|#|bb|b|♯|♭)?/],
	re_b: [/^(B)(?![#b♯♭])/, /\/(B)(?![#b♯♭])/],

	// -- respell the root and the bass note of a chord symbol --
	// 'trsp' tells the root is abc2svg's spelling, not the tune's
	respell: function(text, trsp) {
	    var	hc = abc2svg.huchords,
		re = trsp ? hc.re_all : hc.re_b

		return text
			.replace(re[0],
				function(m, l, a) { return hc.name1(l, a || '') })
			.replace(re[1],
				function(m, l, a) { return '/' + hc.name1(l, a || '') })
	}, // respell()

	gch_build: function(of, s) {
	    var	i, gch

		if (s.a_gch) {
			for (i = 0; i < s.a_gch.length; i++) {
				gch = s.a_gch[i]
				if (gch.type == 'g' && gch.text)
					gch.text = abc2svg.huchords
						.respell(gch.text, gch.trsp)
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
