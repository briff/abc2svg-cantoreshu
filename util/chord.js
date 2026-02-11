// chord.js - generation of accompaniment
//
// Copyright (C) 2020-2026 Jean-François Moine and Seymour Shlien
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
    var	chnm, i, k, vch, s, gchon, rhy, ti, dt, gchnb,
	chmid = [],			// bass and chord pitches
	md = first.p_v.meter.wmeasure,	// measure duration
	nextim = 0,
	C = abc2svg.C,
	trans = 48 + (cfmt.chord.trans ? cfmt.chord.trans * 12 : 0)

	// create a chord according to the bass note
	function chcr(b, ch) {
	    var	j, r,
		i = ch.length

		if (b) {
			while (--i > 0) {
				if (ch[i] == b)		// search the bass in the chord
					break
			}
			if (i > 0) {
				r = []
				for (j = i; j < ch.length; j++)
					r.push(ch[j])
				for (j = 0; j < i; j++)
					r.push(ch[j] + 12)
			}
		}
		if (!r)
			r = ch.slice()
		r.splice(0, 0, r[0] - 12)		// add the bass
		if (b && !i)
			r[0] = b - 12
		if (rhy == '+'				// if no rhythm
		 && (ch[i] == 3 || ch[i] == 4))
			r[1] = ch[0]			// don't double the third
		return r
	} // chcr()

	// return a new chord rhythm from a meter (M:)
	function meterhy(s) {
		if (!s.a_meter[0])
			return '+'		// M:none
	    var	r,
		t = s.a_meter[0].top,
		b = s.a_meter[0].bot

		switch (b) {
		case '2':
			b = 4
			t *= 2
			// fall thru
		case undefined:
			if (t[0] == 'C')
				t = 4, b = 4
			// fall thru
		case '4':
			if (t == '3')
				return "fzczcz"
			return "fzczfzczfzcz".slice(0, t * 2)
		case '8':
			return "fzcfzcfzcfzc".slice(0, t)
		}
		return 'z'			// no chord
	} // meterhy()

	// build a chord rhythm
	function bld_rhy(p) {
	    var	i, c, n

		rhy = p == '+'
			? p			// no rhythm
			: p.match(/\[([G-Lg-l]\,*)+\]\d?|[bcf-lzG-L],*\d?/g)
		if (!rhy)
//fixme: error
			rhy = '+'
		for (i = 0; i < rhy.length; i++) {
			c = rhy[i]
			n = c.slice(-1)
			if (n >= '2' && n <= '9') {
				rhy[i] = c.slice(0, -1)
				while (--n > 0)
					rhy.splice(++i, 0, '+')
			}
		}
		dt = md / rhy.length * gchnb		// delta time
	} // bld_rhy()

	// generate a chord
	function gench(sb, i) {
	    var	r, ch, b, m, n, nt,
		a = sb.a_gch[i].otext

		if (a.slice(-1) == ')')			// if alternate chord
			a = a.replace(/\(.*/, '')	// remove it
		a = a.replace(/\(|\)|\[|\]/g,'')	// remove ()[]
			.replace(/♯/g, '#')
			.replace(/♭/g, 'b')
			.match(/([A-G])([#b]?)([^/]*)\/?(.*)/)
			// a[1] = note, a[2] = acc, a[3] = type, a[4] = bass
		if (!a)
			return

		r = abc2svg.letmid[a[1]]		// root
		if (r == undefined)			// "N" or no chord
			return

			switch (a[2]) {
			case "#": r++; break
			case "b": r--; break
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
					case "#": b = (b + 1) % 12; break
					case "b": b = (b + 11) % 12; break
					}
					b = b - r
					if (b < 0)
						b += 12
				}
			}

		// generate the notes of the chord
		chmid = chcr(b, ch)
		n = chmid.length
		r += trans
		for (m = 0; m < n; m++)
			chmid[m] += r
	} // gench()

	// stop the previous chord by setting its duration
	function set_dur(s2, tim) {			// previous chord
		if (s2.dur
		 || tim == s2.time
		 || s2.nhd == undefined)	// no chord yet
			return
		s2.dur = tim - s2.time
		for (var m = 0; m <= s2.nhd; m++)
			s2.notes[m].dur = s2.dur
	} // set_dur()

	// add a note to a chord
	function addnt(s, p) {
		p = "GHIJKghijk".indexOf(p)
		if ((p % 5) >= chmid.length)		// no such note in this chord
			return
		s.nhd++
		s.notes.push({
			midi: chmid[p % 5 + 1]		// skip the bass
		})
		if (p >= 5)
			s.notes[s.nhd].midi += 12	// upper octave
	} // addnt()

	// insert a chord in the chord voice
	function insch(s_next, tim) {
		if (!chmid.length)
			return			// no defined chord yet
	    var	s, m,
		s2 = vch.last_sym,
		i = rhy[ti++]

		switch (i[0]) {
		case '+':			// same chord
			if (rhy != '+')
				return
			ti = 0
			break
		case undefined:
		case 'z':
			set_dur(s2, tim)	// stop the previous chord
			return
		}

		s = {
			v: vch.v,
			p_v: vch,
			type: C.NOTE,
			notes: []
		}
		s.time = tim
		switch (i[0]) {
		case 'c':
			s.nhd = chmid.length - 2
			for (m = 0; m <= s.nhd; m++)
				s.notes.push({
					midi: chmid[m + 1]
				})
			break
		case '[':
			s.nhd = -1
			for (m = 1; m < i.length - 1; m++) {
				addnt(s, i[m])
				while (i[m + 1] == ',')
					s.notes[s.nhd].midi -= 12,
					m++
			}
			break
		default:
			s.nhd = -1
			addnt(s, i[0])
			m = 1
			while (i[m] == ',')
				s.notes[0].midi -= 12,
				m++
			break
		case 'f':
			s.notes[0] = {
				midi: chmid[0]
			}
			s.nhd = 0		// keep the chord root
			break
		case '+':			// no rhythm
		case 'b':
			s.nhd = chmid.length - 1
			for (m = 0; m <= s.nhd; m++)
				s.notes.push({
					midi: chmid[m]
				})
			break
		}
		s.prev = s2			// previous chord
		s2.next = s
		set_dur(s2, tim)		// stop the last chord
		
		vch.last_sym = s

		if (s_next) {				// if not last symbol of the tune
			s.ts_next = s_next		// insert before a bar
			s.ts_prev = s_next.ts_prev
			s_next.ts_prev = s
//			if (s.ts_prev)
				s.ts_prev.ts_next = s
		} else {				// no bar at end of tune
			while (s2.ts_next)
				s2 = s2.ts_next
			s2.ts_next = s
			s.ts_prev = s2
		}
	} // insch()

	// -- chord() --

	// set the chordnames defined by %%MIDI chordname
	chnm = abc2svg.chnm
	if (cfmt.chord.names) {
		for (k in cfmt.chord.names) {
			chnm[k] = []
			for (i = 0; i < cfmt.chord.names[k].length; i++)
				chnm[k].push(+cfmt.chord.names[k][i])
		}
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
			dur: 0,
			next: {
				type: C.BLOCK,
				subtype: "midictl",
				time:0,
				dur: 0,
				ctrl: 7,		// volume
				val: cfmt.chord.vol || 75
			}
		}
	}
	vch.sym.p_v = vch
	vch.sym.v = vch.v
	vch.sym.next.p_v = vch
	vch.sym.next.v = vch.v
	vch.sym.next.prev = vch.sym
	vch.last_sym = vch.sym.next
	voice_tb.push(vch)

	s = first

	// insert the MIDI program and the volume of the chord voice after the tempo
	while (s.type != C.TEMPO
	 && s.ts_next && !s.ts_next.dur)	// but before the first note
		s = s.ts_next
	vch.sym.ts_prev = s
	vch.sym.ts_next = vch.sym.next
	vch.sym.next.ts_prev = vch.sym
	vch.sym.next.ts_next = s.ts_next
	if (s.ts_next)
		s.ts_next.ts_prev = vch.sym.next
	s.ts_next = vch.sym

	// loop on the symbols and add the accompaniment chords
	if (cfmt.chord.gchon != false)
		gchon = 1			// chordon by default
	gchnb = cfmt.chord.gchnb || 1
	s = first
	bld_rhy(cfmt.chord.rhy			// chord rhythm
		|| meterhy(s.p_v.meter))
	ti = 0					// time index in rhy
	while (1) {
		if (gchon) {
			while (s.time > nextim) {
				insch(s, nextim)	// generate the rhythm
				nextim += rhy == '+' ? 100000 : dt
			}
			if (s.bar_type == "|"		// if a normal measure bar
			 && rhy != '+'
			 && nextim != s.time) {		// and wrong times
//fixme: measure error
				nextim = s.time		// resynchronize
				ti = 0
			}
		}
		if (gchon && s.a_gch) {
			for (i = 0; i < s.a_gch.length; i++) {
				if (s.a_gch[i].type != 'g')
					continue
				gench(s, i)
				if (rhy == '+')
					nextim = s.time
				break
			}
		}
		if (!s.dur) {
			if (s.bar_num) {		// if measure bar
				if (gchnb == 1
				 || !((s.bar_num - 1) % gchnb))
					ti = 0		// reset the time index
			} else if (s.wmeasure) {	// if meter
				md = s.wmeasure
				if (rhy != '+')
					bld_rhy(meterhy(s))
			} else if (s.subtype == "midigch") {
				if (s.on != undefined) {
					gchon = s.on
					if (!gchon && rhy == '+')
						set_dur(vch.last_sym, s.time)
				}
				if (s.gchnb)
					gchnb = s.gchnb
				if (gchon && s.rhy)
					bld_rhy(s.rhy)	// new rhythm
			}
		}
		if (!s.ts_next)
			break
		s = s.ts_next
	}
	if (gchon)  {
			while (s.time + (s.dur || 0) > nextim) {
				insch(s.dur ? null : s, nextim)
				if (rhy == '+')
					break
				nextim += dt
			}
		set_dur(vch.last_sym, s.time + (s.dur || 0))
	}
} // chord()
