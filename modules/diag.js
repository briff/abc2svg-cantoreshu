// diag.js - module to insert guitar chord diagrams
//
// Copyright (C) 2018-2021 Jean-Francois Moine
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
// This module is loaded when "%%diagram" or "%%setdiag" appear in a ABC source.
//
// The command %%diagram draws a chord diagram above the chord symbols.
//
// Parameters
//	%%diagram 1
//
// The command %%setdiag defines the chord diagram of a chord symbol.
//
// Parameters
//	%%setdiag <chord> <dots> <label[,pos]> <fingers> [barre=<num>-<num>]
// with
//	<chord> = chord symbol
//	<dots>  = list of diagram offset of dots on the strings - '0 or 'x': no dot
//	<label> = text to write on the left of the <pos>th fret
//				(<pos> default = 1, fret #0 is no text)
//	<fingers> = finger numbers ou 'x' (mute) or '0'/'y' (no finger)
//	barre=<num>-<num> draw a bar between the two string numbers in the first fret
//				(numbering order 654321 for E,A,D,GBe)

abc2svg.diag = {

// common diagrams - definitions adapted from Guido Gonzato and Chris Fargen
    cd: {
	C: "032010 ,0 032010",
	Cm: "003320 fr3 003420 barre=6-1",
	C7: "032310 ,0 032410",
	Cm7: "003020 fr3 x03020 barre=6-1",
	CM7: "032000 ,0 x21000",
	Csus4: "000340 fr3 x00340 barre=6-1",
	D: "000232 ,0 x00132",
	Dm: "000231 ,0 x00231",
	D7: "000212 ,0 x00312",
	Dm7: "000211 ,0 xx0211",
	DM7: "000222 ,0 xx0123",
	Dsus4: "000233 ,0 xx0123",
	E: "022100 ,0 023100",
	Em: "022000 ,0 023000",
	E7: "020100 ,0 020100",
	Em7: "020000 ,0 010000",
	EM7: "021100 ,0 031200",
	Esus4: "002200 ,0 001200",
	F: "033200 fr1 034200 barre=6-1",
	Fm: "033000 fr1 034000 barre=6-1",
	F7: "030200 fr1 030200 barre=6-1",
	Fm7: "030000 fr1 030000 barre=6-1",
	FM7: "032200 fr1 042300 barre=6-1",
	Fsus4: "003300 fr1 003400 barre=6-1",
	G: "320003 ,0 230004",
	Gm: "033000 fr3 034000 barre=6-1",
	G7: "320001 ,0 320001",
	Gm7: "030000 fr3 030000 barre=6-1",
	GM7: "320002 ,0 310002",
	Gsus4: "003300 fr3 003400 barre=6-1",
	A: "002220 ,0 002340",
	Am: "002210 ,0 002310",
	A7: "002020 ,0 002030",
	Am7: "002010 ,0 002010",
	AM7: "002120 ,0 x02130",
	Asus4: "000230 ,0 x00120",
	B: "003330 fr2 002340 barre=6-1",
	Bm: "003320 fr2 003410 barre=6-1",
	B7: "021202 ,0 x21304",
	Bm7: "003020 fr2 x03020 barre=6-1",
	BM7: "003230 fr2 x03240 barre=6-1",
	Bsus4: "000230 fr2 x00340 barre=6-1",
    }, // cch{}

// function called before tune generation
    do_diag: function() {
    var	glyphs = this.get_glyphs(),
	voice_tb = this.get_voice_tb(),
	decos = this.get_decos()

	// create the base decorations if not done yet
	if (!glyphs['fb']) {
		this.add_style("\
\n.fng {font:6px sans-serif}\
\n.frn {font:italic 7px sans-serif}")

	// fingerboard
		glyphs['fb'] = '<g id="fb">\n\
<path class="stroke" stroke-width="0.4" d="\
M-10 -34h20m0 6h-20\
m0 6h20m0 6h-20\
m0 6h20"/>\n\
<path class="stroke" stroke-width="0.5" d="\
M-10 -34v24m4 0v-24\
m4 0v24m4 0v-24\
m4 0v24m4 0v-24"/>\n\
</g>';

// fret information
		glyphs['nut'] =
			'<path id="nut" class="stroke" stroke-width="1.6" d="\
M-10.2 -34.5h20.4"/>';
		glyphs['ddot'] =
			'<circle id="ddot" class="fill" r="1.5"/>';
	}

	// convert the chord symbol to a "better known" one
	function ch_cnv(t) {
	    var	a = t.match(/[A-G][#♯b♭]?([^/]*)\/?/)	// a[1] = chord type
		if (a && a[1]) {
			a[2] = abc2svg.ch_alias[a[1]]
			if (a[2] != undefined)
				t = t.replace(a[1], a[2])
		}
		return t.replace('/', '.')
	} // ch_cnv()

	// add a decoration and display the diagram
	function diag_add(nm) {			// chord name
	    var	dc, i, l,
		d = abc2svg.diag.cd[nm]		// definition of the diagram
		if (!d)
			return		// no diagram of this chord
		d = d.split(' ')
//fixme: fb<n> n = d[2].length (4,5,6)
		dc = '<g id="' + nm + '">\n\
<use xlink:href="#fb"/>\n'
		l = d[1].split(',')	// label,position
		if (!l[0] || l[0].slice(-1) == l[1])
			dc += '<use xlink:href="#nut"/>\n'
		if (l[0])
			dc += '<text x="-20" y="' + ((l[1] || 1) * 6 - 35)
				+ '" class="frn">' + l[0] + '</text>\n'
		decos[nm] = "3 " + nm + " 40 " + (l[0] ? "30" : "10") + " 0"
		// fingers
		dc += '<text x="-12,-8,-4,0,4,8" y="-36" class="fng">'
				+ d[2].replace(/[y0]/g, ' ')
				+ '</text>\n'
		// dots
		for (i = 0; i < d[0].length; i++) {
			l = d[0][i]
			if (l && l != 'x' && l != '0')
				dc += '<use x="' + (i * 4 - 10)
					+ '" y="' + (l * 6 - 37)
					+ '" xlink:href="#ddot"/>\n'
		}
		// barre
		if (d[3]) {
			l = d[3].match(/barre=(\d)-(\d)/)
			if (l)
				dc += '<path id="barre" class="stroke"\
 stroke-width=".9" d="M' + ((6 - l[1]) * 4 - 10)
					+ '-31h' + ((l[1] - l[2]) * 4) + '"/>'
		}
		dc += '</g>'
		glyphs[nm] = dc
	} // diag_add()

    var	s, i, gch, nm

	for (s = voice_tb[0].sym; s; s = s.next) {
		if (!s.a_gch)
			continue
		for (i = 0; i < s.a_gch.length; i++) {
			gch = s.a_gch[i]
			if (!gch || gch.type != 'g' || gch.capo)
				continue
			nm = ch_cnv(gch.text)
			if (!decos[nm])		// if no decoration yet
				diag_add(nm)
			this.deco_put(nm, s)	// insert diag as decoration
		}
	}
    }, // do_diag()

    output_music: function(of) {
	if (this.cfmt().diag)
		abc2svg.diag.do_diag.call(this)
	of()
    },

    set_fmt: function(of, cmd, param) {
    var	a,
	cfmt = this.cfmt()

	switch (cmd) {
	case "diagram":
		cfmt.diag = param
		return
	case "setdiag":
		a = param.match(/(\S*)\s+(.*)/)
		abc2svg.diag.cd[a[1].replace('/', '.')] = a[2]
		return
	}
	of(cmd, param)
    },

    set_hooks: function(abc) {
	abc.output_music = abc2svg.diag.output_music.bind(abc, abc.output_music);
	abc.set_format = abc2svg.diag.set_fmt.bind(abc, abc.set_format)
    }
} // diag

abc2svg.modules.hooks.push(abc2svg.diag.set_hooks);

// the module is loaded
abc2svg.modules.diagram.loaded = true
