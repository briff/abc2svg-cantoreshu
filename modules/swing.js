// swing.js - module to set a swing feel
//
// Copyright (C) 2025 Jean-François Moine
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
// This module is loaded when "%%playswing" appears in a ABC source.
//
// Parameters
//	%%playswing duration_1 restart_time duration_2
// with the durations and time in percent of the duration of the two notes.
//
// This command may appear globally or in a voice.

"use strict"
if (typeof abc2svg == "undefined")
    var	abc2svg = {}

abc2svg.swing = {
// this function is called from sndgen
    swing: function(first, voice_tb, cfmt) {
    var	v, p_v, sw, s, d, m,
	beat = 384,				// quarter note
	nv = voice_tb.length

	for (v = 0; v < nv; v++) {
		p_v = voice_tb[v]
		sw = cfmt.swing
		if (!sw && !p_v.swing)
			continue
		for (s = p_v.sym; s.next; s = s.next) {
			if (s.subtype == "swing")
				sw = s.sw
			if (!sw
			 || !s.dur || !s.next.dur
			 || s.time % beat
			 || s.dur + s.next.dur != beat)
				continue
			d = beat * sw[0]
			s.dur = d
			for (m = 0; m < s.nhd; m++)
				s.notes[m].dur = d
			s.next.time = s.time + beat * (sw[0] + sw[1])
			s = s.next
			d = beat * sw[2]
			s.dur = d
			for (m = 0; m < s.nhd; m++)
				s.notes[m].dur = d
		}
	}
    }, // swing()

    set_fmt: function(of, cmd, parm) {
    var	parse, sw, curvoice, i, s

	if (cmd == "playswing") {
		parse = this.parse,
		curvoice = this.get_curvoice()
		sw = /(\d+)\s+(\d+)\s+(\d+)/.exec(parm)

		if (sw) {
			sw = sw.splice(1)
			for (i = 0; i < 3; i++)
				sw[i] = +sw[i] / 100
		}
		if (parse.state >= 2) {
			s = this.new_block("swing")
			s.play = s.invis = 1 //true
			s.sw = sw
			if (sw)
				curvoice.swing = 1 //true
		} else {
			this.cfmt().swing = sw
		}
		return
	}
	of(cmd, parm)
    }, // set_fmt()

    set_hooks: function(abc) {
	abc.set_format = abc2svg.swing.set_fmt.bind(abc, abc.set_format)
    }
} // swing

if (!abc2svg.mhooks)
	abc2svg.mhooks = {}
abc2svg.mhooks.swing = abc2svg.swing.set_hooks
