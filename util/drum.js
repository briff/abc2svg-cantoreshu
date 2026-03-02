// drum.js - generation of drum sequences
//
// Copyright (C) 2026 Jean-François Moine
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

// This file contains the configuration and the generation
// of drum accompaniment.

// %%begindrum .. %%enddrum: define a drum pattern
//
// These sequences contain drum tabs (https://en.wikipedia.org/wiki/Drum_tablature).
// When the instrument letters are not well-known ones, a legend may be added.
// The default instrument letters are
//
// CC |-Crash cymbal----|
// H  |-Hi-Hat----------|
// HH |-Hi-Hat----------|
// Rd |-Ride cymbal-----|
// S  |-Snare-drum------|
// SD |-Snare-drum------|
// T1 |-High-tom--------|
// T2 |-Mid-tom---------|
// FT |-Floor-tom-------|
// B  |-Bass-drum-------|
// BD |-Bass-drum-------|
// Hf |-Hi-hat-foot-----|

// %%drum [ sequence_ID ]
// This command activates drum playback, starting the sequence ID.
// If no ID, drum playback stops.

// table of the drum instruments
//fixme: change this table and the associated code
//	for it accepts "Hi-hat-foot" as well as "pedal hi-hat"
abc2svg.perc_nam = `
35 acoustic bass drum
36 bass drum 1
37 side stick
38 acoustic snare
39 hand clap
40 electric snare
41 low floor tom
42 closed hi-hat
43 high floor tom
44 pedal hi-hat
45 low tom
46 open hi-hat
47 low-mid tom
48 hi-mid tom
49 crash cymbal 1
50 high tom
51 ride cymbal 1
52 chinese cymbal
53 ride bell
54 tambourine
55 splash cymbal
56 cowbell
57 crash cymbal 2
58 vibraslap
59 ride cymbal 2
60 hi bongo
61 low bongo
62 mute hi conga
63 open hi conga
64 low conga
65 high timbale
66 low timbale
67 high agogo
68 low agogo
69 cabasa
70 maracas
71 short whistle
72 long whistle
73 short guiro
74 long guiro
75 claves
76 hi wood block
77 low wood block
78 mute cuica
79 open cuica
80 mute triangle
81 open triangle
`

// default instrument shortcuts
abc2svg.perc_instr = {
B:  35,
BD: 35,
S:  38,
SD: 38,
H:  42,
HH: 42,
FT: 43,
Hf: 44,
T2: 47,
T1: 50,
Rd: 51,
CC: 57,
}

abc2svg.drum = {

    // %%begindrum..%%enddrum command
    beg_end: function(of, type, opt, txt) {
	if (type != "drum")
		return of(type, opt, txt)
    var	l, p, pat,
	abc = this,
	cfmt = abc.cfmt()

	function bad() {
		abc.syntax(1, abc.errs.bad_val, "%%begindrum")
	}

	// convert a percussion name into a MIDI key
	function get_perc(p) {
	    var	i, j, k, l

		p = p.replace(/-/g, ' ').trim().toLowerCase().split(' ')
		for (i = 0; i < p.length; i++)
			p[i] = ' ' + p[i]	// start the words by a space
		i = 0
		while (1) {			// search the 1st word
			j = abc2svg.perc_nam.indexOf(p[i])
			if (j > 0)
				break
			if (++i >= p.length)
				return		// no instrument!
		}
		l = abc2svg.perc_nam.lastIndexOf('\n', j)
		if (l < 0)
			l = 0			// candidate
		j = l
		if (i < p.length - 1)
		    while (1) {			// search if many words in a line
			k = abc2svg.perc_nam.indexOf(p[i + 1], j + 1)
			if (k < 0)
				break
			k = abc2svg.perc_nam.lastIndexOf('\n', k)
			j = abc2svg.perc_nam.indexOf(p[i], j)
			if (j < 0)
				break
			j = abc2svg.perc_nam.lastIndexOf('\n', j)
			if (j == k) {
//fixme: continue with the next word
				break
			}
		}
		return parseInt(abc2svg.perc_nam.slice(l, l + 3))
	} // get_perc()

	// --- beg_end ---
	if (!cfmt.drum)
		cfmt.drum = {}
	if (!cfmt.drum.pat)
		cfmt.drum.pat = {}
	pat = []
	txt = txt.trim().split(/\n+/)
	while (1) {
		l = txt.shift()				// next line
		if (!l)
			break
		l = /(^[A-Za-z0-9][A-Za-z0-9]?)\s*\|(.+)\|$/g.exec(l.trim())
		if (!l)
			return bad()
		if (/^[-ox|]*$/.test(l[2])) {		// if sequence
			pat.push({
				instr: l[1],
				seq: l[2]
			})
		} else {				// legend
			if (!cfmt.drum)
				cfmt.drum = {}
			if (!cfmt.drum.instr)
				cfmt.drum.instr = {}
			cfmt.drum.instr[l[1]] = get_perc(l[2])
		}
	}
	cfmt.drum.pat[opt] = pat
    }, // beg_end()

    // %%drum command
    set_fmt: function(of, cmd, parm) {
	if (cmd != "drum")
		return of(cmd, parm)
    var	i, j, k, n, p, instr, s,
	abc = this,
	cfmt = abc.cfmt(),
	curv = abc.get_curvoice(),
	parse = abc.get_parse(),
	pat = (parm && parm != "0") ? cfmt.drum.pat[parm] : null,
	seq = []

	function bad() {
		abc.syntax(1, abc.errs.bad_val, "%%drum")
	}

	if (!curv)
		return abc.syntax(1, "$1 must be in a voice", "%%drum")
	s = abc.new_block("mididrum")
	s.play = s.invis = 1 //true
	s.on = !!pat
	if (!pat)
		return
	s.nb = 1
	s.seq = seq

	// build an array of chords from the drum tab
	for (i = 0; i < pat.length; i++) {		// instrument loop
		instr = pat[i].instr
		instr = (cfmt.drum && cfmt.drum.instr && cfmt.drum.instr[instr])
			|| abc2svg.perc_instr[instr]
		if (!instr) {
//			return bad()
			abc.syntax(1, "Unknown instrument in %%drum " + parm)
			continue
		}
		p = pat[i].seq
		n = 1
		k = 0
		for (j = 0; j < p.length; j++) {
			switch (p[j]) {
			case 'o':
			case 'x':
				if (!seq[k])
					seq[k] = []
				seq[k].push(instr)
			default:			// ('-')
				k++
				break
			case '|':
				n++
				break
			}
		}
		if (n > s.nb)
			s.nb = n
		seq.length = k
	}
    }, //set_fmt()

    set_hooks: function(abc) {
	abc.do_begin_end = abc2svg.drum.beg_end.bind(abc, abc.do_begin_end)
	abc.set_format = abc2svg.drum.set_fmt.bind(abc, abc.set_format)
    }
} //drum

abc2svg.gendrum = function(first,	// first symbol in time
			 voice_tb,	// voice table
			 cfmt) {	// tune parameters
    var	c, i, on, n, nb, ss, v, seq, vols, l, dl, i_rst,
	s = first,
	C = abc2svg.C,
	vdr = {				// create the percussion voice
		v: voice_tb.length,
		id: "_drum",
		time: 0,
		sym: {
			type: C.BLOCK,
			subtype: "midiprog",
			chn: 9,		// percussion channel
//			instr: 0,
			time: 0,
			dur: 0
		}
	},
	_sdr = {			// drum template
		v: vdr.v,
		p_v: vdr,
		type: C.NOTE,
		nhd: 0
	}

	// generate the drum sequences up to the next %%drum or to the end of voice
	function gendr(ss, s) {
	    var	c, i, j, sdr, s2,
		ti = ss.time,
		te = s.time + (s.dur || 0),
		d = dl * nb / l		// base note duration

		while (!ss.dur)
			ss = ss.next
		while (ti < te) {
			if (ss.bar_type
			 && (ss.text >= '2' && ss.text <= '9')) {
				i = i_rst
				while (!ss.dur)
					ss = ss.ts_next
			} else {
				i = 0
			}
			for ( ; i < seq.length; i++) {	// generate 'nb' measures
				c = seq[i]
				if (!c) {
					ti += d
					continue
				}
				sdr = Object.create(_sdr)
				sdr.time = ti
				s2 = sdr
				sdr.dur = d
				sdr.notes = []
				sdr.nhd = c.length - 1
				for (j = 0; j < c.length; j++)
					sdr.notes.push({
						dur: d,
						midi: seq[i][j]
					})
				if (s2.next) {			// voice linkage
					sdr.next = s2.next
					s2.next = sdr
					sdr.prev = s2
					sdr.next.prev = sdr
				} else {			// first drum symbol
					vdr.last_sym.next = sdr
					sdr.prev = vdr.last_sym
					vdr.last_sym = sdr
				}

				// time linkage and repeat variants
				while (ss.ts_next && ss.time < ti)
					ss = ss.ts_next
				s = ss
				while (s.ts_next && !s.dur && s.time == ti) {
					if (s.bar_type
					 && s.text == '1')
						i_rst = i
					s = s.ts_next
				}
				while (s.ts_next && s.dur && s.time == ti
				    && s.v < sdr.v)
					s = s.ts_next
				sdr.ts_next = s
				sdr.ts_prev = s.ts_prev
				s.ts_prev = sdr
				sdr.ts_prev.ts_next = sdr

				ti += d
			}
			ss = s
		}
	} //gendr()

	// -- gendrum() --

	// link the drum voice
	vdr.sym.p_v = vdr
	vdr.sym.v = vdr.v
	vdr.last_sym = vdr.sym

	while (!s.dur)
		s = s.ts_next
	vdr.sym.ts_prev = s.ts_prev
	vdr.sym.ts_next = s
	vdr.sym.ts_prev.ts_next =
		s.ts_prev = vdr.sym

	// get the measure duration at start of tune
	dl = first.p_v.meter.wmeasure		// ending meter duration
	for (s = first; s && !s.bar_type; s = s.ts_next) {
		if (s.wmeasure) {
			dl = s.wmeasure		// starting meter duration
			break
		}
	}

	// generate the drum sequence per voice
	for (v = 0; v < voice_tb.length; v++) {
		on = seq = null
		nb = 1
		for (s = voice_tb[v].sym; s; s = s.next) {
			if (s.subtype != "mididrum") {
				if (s.wmeasure)
					dl = s.wmeasure
				continue
			}
			if (s.on != undefined)
				on = s.on		// on/off
			if (s.nb)
				nb = s.nb		// number of bars
			if (s.seq) {
				seq = s.seq
				l = seq.length
			}
			if (on && seq) {
				ss = s
				while (1) {
					if (!s.next
					 || s.next.subtype == "mididrum"
					 || s.next.wmeasure)
						break
					s = s.next
				}
				gendr(ss, s)
			}
		}
	}
	voice_tb.push(vdr)
} // gendrum()

// define the commands %%begindrum and %%drum
if (!abc2svg.mhooks)
	abc2svg.mhooks = {}
abc2svg.mhooks.drum = abc2svg.drum.set_hooks
