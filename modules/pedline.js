// pedline.js - module to draw pedal lines instead of 'Ped .. *'
//
// Copyright (C) 2020-2023 Jean-Francois Moine
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
// This module is loaded when "%%pedline" appears in a ABC source.
//
// Parameters
//	%%pedline 1

abc2svg.pedline = {
    draw_all_deco: function(of) {
    var	de, i, j, x, dp, ds,
	a_de = this.a_de()

	if (!a_de.length)
		return			// no decoration in this music line
	if (this.cfmt().pedline) {
		for (i = 0; i < a_de.length; i++) {
			de = a_de[i]
		    while (1) {
			if (de.dd.name != "ped)")
				break
			j = 0 //false
			dp = de.prev
			if (dp && dp.dd.name == "ped)") {
				ds = de.start
				while (ds.s.time == dp.s.time) {
					if (dp.s.v == ds.s.v) {
						j = 1 //true
						break
					}
				}
			}
// ( .. ) ( .. )
//		\ de
//	  \ de.start
//	\ de.prev
// \ de.prev.start
// |_____/\____|
			if (j) {
				de.defl.nost =		// /\
					dp.defl.noen = 2
				x = dp.s.x - 5		// x pedal-off - pedal-on
				de.val += de.x - x
				de.x = x
				dp.val = x - dp.x

				if (de.y > dp.y) {
					de.y = dp.y
					break
				}
				dp.y = de.y
				de = dp
			} else {
				de.x -= 3
				de.val += 10
				break
			}
		    }
		}
	}
	of()
    }, // draw_all_deco()

    out_lped: function(of, x, y, val, defl) {
	if (!this.cfmt().pedline) {
		of(x, y, val, defl)
		return
	}
	this.xypath(x, y + 8)
	if (defl.nost) {
		if (defl.nost == 2) {		// \
			this.out_svg("l2.5 6")
			val -= 2.5
		} else {
			this.out_svg("m0 6")
		}
	} else {
		this.out_svg("v6")
	}
	if (defl.noen) {
		if (defl.noen == 2) {		// /
			val -= 2.5
			this.out_svg("h" + val.toFixed(1) + 'l2.5 -6')
		} else {
			this.out_svg("h" + val.toFixed(1))
		}
	} else {
		this.out_svg("h" + val.toFixed(1) + 'v-6')
	}
	this.out_svg('"/>\n')
    }, // out_lped()

    set_fmt: function(of, cmd, param) {
	if (cmd == "pedline")
		this.cfmt().pedline = this.get_bool(param)
	else
		of(cmd, param)
    }, // set_fmt()

    set_hooks: function(abc) {
	abc.draw_all_deco = abc2svg.pedline.draw_all_deco.bind(abc, abc.draw_all_deco)
	abc.out_lped = abc2svg.pedline.out_lped.bind(abc, abc.out_lped)
	abc.set_format = abc2svg.pedline.set_fmt.bind(abc, abc.set_format)
    } // set_hooks()
} // pedline

abc2svg.modules.hooks.push(abc2svg.pedline.set_hooks)

// the module is loaded
abc2svg.modules.pedline.loaded = true
