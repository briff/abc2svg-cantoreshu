// chord.js - generation of accompaniment
//
// Copyright (C) 2020-2024 Jean-Francois Moine and Seymour Shlien
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

// -- chord table --
// from https://en.wikipedia.org/wiki/Chord_(music)
// index = chord symbol type
// value: array of MIDI pitch / root
//	index = inversion
abc2svg.chnm = {
	'': [0, 4, 7],
	'6': [0, 4, 7, 9],
	'7': [0, 4, 7, 10],
	M7: [0, 4, 7, 11],
	aug: [0, 4, 8],
	aug7: [0, 4, 8, 10],
	m: [0, 3, 7],
	m6: [0, 3, 7, 9],
	m7: [0, 3, 7, 10],
	mM7: [0, 3, 7, 11],
	dim: [0, 3, 6],
	dim7: [0, 3, 6, 9],
	m7b5: [0, 3, 6, 10],
	'9': [0, 4, 7, 10, 14],
//	m9:
//	maj9:
//	M9:
	'11': [0, 4, 7, 10, 14, 17],
	sus4: [0, 5, 7]
//	sus9:
//	'7sus4':
//	'7sus9':
//	'5':
}

abc2svg.letmid = {			// letter -> MIDI pitch
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11
} // letmid

abc2svg.chord = function(first,		// first symbol in time
			 voice_tb,	// table of the voices
			 cfmt) {	// tune parameters
    var	chnm, i, k, vch, s, gchon,
	C = abc2svg.C,
	trans = 48 + (cfmt.chord.trans ? cfmt.chord.trans * 12 : 0)

	// create a chord according to the bass note
	function chcr(b, ch) {
	    var	t,
		r = ch.slice(),
		i = r.length

		if (b) {
			while (--i > 0) {
				if (r[i] == b)		// search the bass in the chord
					break
			}
			if (i > 0)
				r[0] = b, r[i] = 0
			else
				r.unshift(b)
		}
		r[0] -= 12			// bass one octave lower
		return r
	} // chcr()

	// get the playback part of the first chord symbol
	function filter(a_cs) {
	    var	i, cs, t

		for (i = 0; i < a_cs.length; i++) {
			cs = a_cs[i]
			if (cs.type != 'g')
				continue
			t = cs.otext
			if (t.slice(-1) == ')')		// if alternate chord
				t = t.replace(/\(.*/, '') // remove it
			return t.replace(/\(|\)|\[|\]/g,'') // remove ()[]
		}
	} // filter()

	// generate a chord
	function gench(sb) {
	    var	r, ch, b, m, n, not,
		a = filter(sb.a_gch),
		s = {
			v: vch.v,
			p_v: vch,
			type: C.NOTE,
			time: sb.time,
			notes: []
		}

		if (!a)
			return
		a = a.match(/([A-G])([#♯b♭]?)([^/]*)\/?(.*)/)
			// a[1] = note, a[2] = acc, a[3] = type, a[4] = bass
		if (!a)
			return

		r = abc2svg.letmid[a[1]]		// root
		if (r == undefined)			// "N" or no chord
			return

			switch (a[2]) {
			case "#":
			case "♯": r++; break
			case "b":
			case "♭": r--; break
			}
			if (!a[3]) {
				ch = chnm[""]
			} else {
				ch = abc2svg.ch_alias[a[3]]
				if (ch == undefined)
					ch = a[3]
				ch = chnm[ch]
				if (!ch)
					ch = a[3][0] == 'm' ? chnm.m : chnm[""]
			}
			if (a[4]) {			// bass
				b = a[4][0].toUpperCase()
				b = abc2svg.letmid[b]
				if (b != undefined) {
					switch (a[4][1]) {
					case "#":
					case "♯": b++; if (b >= 12) b = 0; break
					case "b":
					case "♭": b--;  if (b < 0) b = 11; break
					}
				}
			}
		if (b == undefined)
			b = 0
		ch = chcr(b, ch)

		// generate the notes of the chord
		n = ch.length
		r += trans
		if (sb.p_v.tr_snd)
			r += sb.p_v.tr_snd
		for (m = 0; m < n; m++) {
			not = {
				midi: r + ch[m]
			}
			s.notes.push(not)
		}
		s.nhd = n - 1

		// insert the chord in the chord voice and in the tune
		s.prev = vch.last_sym
		vch.last_sym.next = s
		s.ts_next = sb.ts_next
		sb.ts_next = s
		s.ts_prev = sb
		if (s.ts_next)
			s.ts_next.ts_prev = s
		vch.last_sym = s
	} // gench()

	// -- chord() --

	// set the chordnames defined by %%MIDI chordname
	chnm = abc2svg.chnm
	if (cfmt.chord.names) {
		for (k in cfmt.chord.names)
			chnm[k] = cfmt.chord.names[k]
	}

	// define the MIDI channel
	k = 0
	for (i = 0; i < voice_tb.length; i++) {
		if (k < voice_tb[i].chn)
			k = voice_tb[i].chn
	}
	if (k == 9)
		k++			// skip the channel 10

	// create the chord voice
	vch = {
		v: voice_tb.length,
		id: "_chord",
		time: 0,
		sym: {
			type: C.BLOCK,
			subtype: "midiprog",
			chn: k + 1,
			instr: cfmt.chord.prog || 0,
			time: 0,
			ts_prev: first,
			ts_next: first.ts_next
		},
		vol: cfmt.chord.vol || .6	// (external default 76.2)
	}
	vch.sym.p_v = vch
	vch.sym.v = vch.v
	vch.last_sym = vch.sym
	voice_tb.push(vch)
	first.ts_next = vch.sym

	// loop on the symbols and add the accompaniment chords
	gchon = cfmt.chord.gchon
	s = first
	while (1) {
		if (!s.ts_next) {
			if (gchon)
				vch.last_sym.dur = s.time - vch.last_sym.time
			break
		}
		s = s.ts_next
		if (!s.a_gch) {
			if (s.subtype == "midigch") {
				if (gchon && !s.on)
					vch.last_sym.dur = s.time - vch.last_sym.time
				gchon = s.on
			}
			continue
		}
		if (!gchon)
			continue
		for (i = 0; i < s.a_gch.length; i++) {
			gch = s.a_gch[i]
			if (gch.type != 'g')
				continue
		    if (!vch.last_sym.dur)
			vch.last_sym.dur = s.time - vch.last_sym.time
			gench(s)
			break
		}
	}
} // chord()
