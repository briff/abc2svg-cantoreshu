// abc2svg - chordnames.js - change the names of the chord symbols
//
// Copyright (C) 2020 Jean-Francois Moine
// License GPL-3
//
// This module is loaded by %%chordnames.
//
// Parameters
//	%%chordnames <comma separated list of chord names>
// Each name replace one chord. The order is:
//	CDEFGAB<N.C>

abc2svg.chordnames = {

    gch_build: function(of, s) {
    var	gch, i, ix, t,
	cfmt = this.cfmt()

	if (s.a_gch && cfmt.chordnames) {
		for (ix = 0; ix < s.a_gch.length; ix++) {
			gch = s.a_gch[ix]
			t = gch.text
			if (gch.type != 'g')
				continue
			if (t == "N.C.")
				gch.text = cfmt.chordnames.Z
			else
				gch.text = t.replace(/[A-GZ]/g,
					function(c){return cfmt.chordnames[c]})
			if (cfmt.chordnames.B == 'H')	// if german 'H'
				gch.text = gch.text.replace(/Hb/g, 'Bb')
		}
	}
	of(s)
    }, // gch_build()

    set_fmt: function(of, cmd, parm) {
    var	i,
	cfmt = this.cfmt()

	if (cmd == "chordnames") {
		parm = parm.split(',')
		cfmt.chordnames = {
			Z: "N.C."
		}
		for (i = 0; i < parm.length; i++)
			cfmt.chordnames['CDEFGABZ'[i]] = parm[i]
		return
	}
	of(cmd, parm)
    }, // set_fmt()

    set_hooks: function(abc) {
	abc.gch_build = abc2svg.chordnames.gch_build.bind(abc, abc.gch_build)
	abc.set_format = abc2svg.chordnames.set_fmt.bind(abc, abc.set_format)
    } // set_hooks()
} // chordnames

abc2svg.modules.hooks.push(abc2svg.chordnames.set_hooks)
abc2svg.modules.chordnames.loaded = true
