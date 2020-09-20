// abc2svg - gchord.js - chord symbols
//
// Copyright (C) 2014-2020 Jean-Francois Moine
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

// -- parse a chord symbol / annotation --
// the result is added in the global variable a_gch
// 'type' may be a single '"' or a string '"xxx"' created by U:
function parse_gchord(type) {
    var	c, text, gch, x_abs, y_abs, type,
	i, j, istart, iend,
		ann_font = get_font("annotation"),
		h_ann = ann_font.size,
		line = parse.line

	function get_float() {
		var txt = ''

		while (1) {
			c = text[i++]
			if ("1234567890.-".indexOf(c) < 0)
				return parseFloat(txt)
			txt += c
		}
	} // get_float()

	istart = parse.bol + line.index
	if (type.length > 1) {			// U:
		text = type.slice(1, -1);
		iend = istart + 1
	} else {
		i = ++line.index		// search the ending double quote
		while (1) {
			j = line.buffer.indexOf('"', i)
			if (j < 0) {
				syntax(1, "No end of guitar chord")
				return
			}
			if (line.buffer[j - 1] != '\\')
				break
			i = j + 1
		}
		text = cnv_escape(line.buffer.slice(line.index, j))
		line.index = j
		iend = parse.bol + line.index + 1
	}

	if (curvoice.pos.gch == C.SL_HIDDEN)
		return

	if (ann_font.box)
		h_ann += 3;
	i = 0;
	type = 'g'
	while (1) {
		c = text[i]
		if (!c)
			break
		gch = {
			text: "",
			istart: istart,
			iend: iend,
			font: ann_font
		}
		switch (c) {
		case '@':
			type = c;
			i++;
			x_abs = get_float()
			if (c != ',') {
				syntax(1, "',' lacking in annotation '@x,y'");
				y_abs = 0
			} else {
				y_abs = get_float()
				if (c != ' ')
					i--
			}
			gch.x = x_abs;
			gch.y = y_abs - h_ann / 2
			break
		case '^':
		case '_':
		case '<':
		case '>':
			i++;
			type = c
			break
		default:
			switch (type) {
			case 'g':
				gch.font = get_font("gchord")
				break
			case '@':
				gch.x = x_abs;
				y_abs -= h_ann;
				gch.y = y_abs - h_ann / 2
				break
			}
			break
		}
		gch.type = type
		while (1) {
			c = text[i]
			if (!c)
				break
			switch (c) {
			case '\\':
				c = text[++i]
				if (!c || c == 'n')
					break
				gch.text += '\\'
			default:
				gch.text += c;
				i++
				continue
			case '&':			/* skip "&xxx;" */
				while (1) {
					gch.text += c;
					c = text[++i]
					switch (c) {
					default:
						continue
					case ';':
					case undefined:
					case '\\':
						break
					}
					break
				}
				if (c == ';') {
					i++;
					gch.text += c
					continue
				}
				break
			case ';':
				break
			}
			i++
			break
		}
		if (!a_gch)
			a_gch = []
		a_gch.push(gch)
	}
}

// transpose a chord symbol
var	note_names = "CDEFGAB",
	acc_name = ["bb", "b", "", "#", "##"]

	function gch_tr1(p, transp) {
	    var	i, o, n, a, ip, b40,
		csa = p.split('/')

		for (i = 0; i < csa.length; i++) {	// main and optional bass
			p = csa[i];
			o = p.search(/[ABCDEFG]/);
			if (o < 0)
				continue		// strange chord symbol!
			ip = o + 1
			a = 0
			while (p[ip] == '#') {
				a++;
				ip++
			}
			while (p[ip] == 'b') {
				a--;
				ip++
			}
			n = note_names.indexOf(p[o]) + 16
			b40 = (abc2svg.pab40(n, a) + transp + 200) % 40
			b40 = abc2svg.b40k[b40]
			csa[i] = p.slice(0, o) +
					note_names[abc2svg.b40_p[b40]] +
					acc_name[abc2svg.b40_a[b40] + 2] +
					p.slice(ip)
		}
		return csa.join('/')
	} // gch_tr1

function gch_transp(s) {
    var	gch,
	i = s.a_gch.length

	while (--i >= 0) {
		gch = s.a_gch[i]
		if (gch.type == 'g')
			gch.text = gch_tr1(gch.text, curvoice.vtransp)
	}
}

// -- build the chord symbols / annotations --
// (possible hook)
Abc.prototype.gch_build = function(s) {

	/* split the chord symbols / annotations
	 * and initialize their vertical offsets */
	var	gch, wh, xspc, ix,
		pos = curvoice.pos.gch == C.SL_BELOW ? -1 : 1,
		y_above = 0,
		y_below = 0,
		y_left = 0,
		y_right = 0,
		GCHPRE = .4;		// portion of chord before note

	s.a_gch = a_gch;
	a_gch = null

	if (curvoice.vtransp)
		gch_transp(s)

	// change the accidentals in the chord symbols,
	// convert the escape sequences in annotations, and
	// set the offsets
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.type == 'g') {
			if (cfmt.chordnames) {
				gch.otext = gch.text;	// save for %%diagram
				gch.text = gch.text.replace(/[A-G]/g,
					function(c){return cfmt.chordnames[c]})
				if (cfmt.chordnames.B == 'H')
					gch.text = gch.text.replace(/Hb/g, 'Bb')
			}
			gch.text = gch.text.replace(/##|#|=|bb|b|  /g,
				function(x) {
					switch (x) {
					case '##': return "&#x1d12a;"
					case '#': return "\u266f"
					case '=': return "\u266e"
					case 'b': return "\u266d"
					case '  ': return '  '
					}
					return "&#x1d12b;"
				});
		} else {
			if (gch.type == '@'
			 && !user.anno_start && !user.anno_stop) {
				gch.wh = [0, 0]
				continue		/* no width */
			}
		}

		/* set the offsets and widths */
		set_font(gch.font);
		wh = strwh(gch.text);
		gch.wh = wh
		if (gch.font.box)
			wh[1] += 2
		switch (gch.type) {
		case '@':
			break
		case '^':			/* above */
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_above -= wh[1];
			gch.y = y_above
			break
		case '_':			/* below */
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			y_below -= wh[1];
			gch.y = y_below
			break
		case '<':			/* left */
			gch.x = -(wh[0] + 6);
			y_left -= wh[1];
			gch.y = y_left + wh[1] / 2
			break
		case '>':			/* right */
			gch.x = 6;
			y_right -= wh[1];
			gch.y = y_right + wh[1] / 2
			break
		default:			// chord symbol
			xspc = wh[0] * GCHPRE
			if (xspc > 8)
				xspc = 8;
			gch.x = -xspc;
			if (pos < 0) {		/* below */
				y_below -= wh[1];
				gch.y = y_below
			} else {
				y_above -= wh[1];
				gch.y = y_above
			}
			break
		}
	}

	/* move upwards the top and middle texts */
	y_left /= 2;
	y_right /= 2
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		switch (gch.type) {
		case '^':			/* above */
			gch.y -= y_above
			break
		case '<':			/* left */
			gch.y -= y_left
			break
		case '>':			/* right */
			gch.y -= y_right
			break
		case 'g':			// chord symbol
			if (pos > 0)
				gch.y -= y_above
			break
		}
	}
}

// -- draw the chord symbols and annotations
// (the staves are not yet defined)
// (unscaled delayed output)
// (possible hook)
Abc.prototype.draw_gchord = function(s, gchy_min, gchy_max) {
    var	ix

	// draw the upper or lower chord symbols and annotations
	function draw1(gch, up) {
	    var	y, y2,
		h = gch.font.size,
		hbox = gch.font.box ? 2 : 0,
		w = gch.wh[0],
		yav = s.dur ?
			(((s.notes[s.nhd].pit + s.notes[0].pit) >> 1) - 18) * 3 :
			12,		// fixed offset on measure bars
		text = gch.text,
		x = s.x + gch.x

		if ((gch.type == 'g' && gch.y < 0) || gch.type == '_') {
			if (up)
				return
		} else if (!up) {
			return
		}

		use_font(gch.font);
		set_font(gch.font);
		if (w && x + w > realwidth)	// let the text inside the page
			x = realwidth - w
		switch (gch.type) {
		case '_':			/* below */
			y = y_get(s.st, 0, x, w)
			if (y > gchy_min)
				y = gchy_min
			y -= h
			y_set(s.st, 0, x, w, y - hbox)
			break
		case '^':			/* above */
			y = y_get(s.st, 1, x, w)
			if (y < gchy_max)
				y = gchy_max
			y += hbox
			y_set(s.st, 1, x, w, y + h + hbox)
			break
		case '<':			/* left */
/*fixme: what symbol space?*/
			if (s.notes[0].acc)
				x -= s.notes[0].shac;
			y = gch.y + yav - h / 2
			break
		case '>':			/* right */
			if (s.xmx)
				x += s.xmx
			if (s.dots)
				x += 1.5 + 3.5 * s.dots;
			y = gch.y + yav - h / 2
			break
		default:			// chord symbol
			if (gch.y >= 0) {
				y = y_get(s.st, 1, x, w)
				if (y < gchy_max)
					y = gchy_max
				y += hbox
				y_set(s.st, 1, x, w, y + h + hbox)
			} else {
				y = y_get(s.st, 0, x, w)
				if (y > gchy_min)
					y = gchy_min
				y -= h
				y_set(s.st, 0, x, w, y - hbox)
			}
			break
		case '@':			/* absolute */
			y = gch.y + yav
			if (y > 0) {
				y2 = y + h
				if (y2 > staff_tb[s.st].ann_top)
					staff_tb[s.st].ann_top = y2
			} else {
				if (y < staff_tb[s.st].ann_bot)
					staff_tb[s.st].ann_bot = y
			}
			break
		}
		if (user.anno_start)
			user.anno_start("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
		xy_str(x, y, text, null, null, gch.wh)
		if (user.anno_stop)
			user.anno_stop("annot", gch.istart, gch.iend,
				x - 2, y + h + 2, w + 4, h + 4, s)
	} // draw1()

	// --- draw_gchord ---
	set_dscale(s.st)
	ix = s.a_gch.length
	while (--ix >= 0)
		draw1(s.a_gch[ix], 1)		// above
	for (ix = 0; ix < s.a_gch.length; ix++)
		draw1(s.a_gch[ix])		// below
} // draw_gchord()

// draw all chord symbols
function draw_all_chsy() {
    var	i, gch, gch2, s, chsy1, w, y, bot, top,
	minmax = new Array(nstaff + 1)

	// search the vertical offset for the chord symbols
	for (i = 0; i <= nstaff; i++)
		minmax[i] = {
			ymin: 0,
			ymax: 24
		}
	for (s = tsfirst; s; s = s.ts_next) {
		if (!s.a_gch)
			continue
		if (!chsy1)
			chsy1 = s	// first chord symbol
		gch2 = null
		for (i = 0; i < s.a_gch.length; i++) {
			gch = s.a_gch[i]
			if (gch.type != 'g')
				continue
			gch2 = gch	// chord closest to the staff
			if (gch.y < 0)
				break
		}
		if (gch2) {
			w = gch2.wh[0]
			if (gch2.y >= 0) {
				y = y_get(s.st, true, s.x, w)
				if (y > minmax[s.st].ymax)
					minmax[s.st].ymax = y
			} else {
				y = y_get(s.st, false, s.x, w)
				if (y < minmax[s.st].ymin)
					minmax[s.st].ymin = y
			}
		}
	}

	// draw the chord symbols if any
	if (chsy1) {
		for (i = 0; i <= nstaff; i++) {
			bot = staff_tb[i].botbar
			if (minmax[i].ymin > bot - 4)
				minmax[i].ymin = bot - 4
			top = staff_tb[i].topbar
			if (minmax[i].ymax < top + 4)
				minmax[i].ymax = top + 4
		}
		set_dscale(-1)		/* restore the scale parameters */
		for (s = chsy1; s; s = s.ts_next) {
			if (!s.a_gch)
				continue
			self.draw_gchord(s, minmax[s.st].ymin, minmax[s.st].ymax)
		}
	}
} // draw_all_chsy()
