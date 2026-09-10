// abc2svg - lyrics.js - lyrics
//
// Copyright (C) 2014-2026 Jean-François Moine
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

// parse a symbol line (s:)
function get_sym(p, cont) {
	var s, c, i, j, d

	if (curvoice.ignore)
		return

	// get the starting symbol of the lyrics
	if (cont) {					// +:
		s = curvoice.sym_cont
		if (!s) {
			syntax(1, "+: symbol line without music")
			return
		}
	} else {
		if (curvoice.sym_restart) {		// new music
			curvoice.sym_start = curvoice.sym_restart;
			curvoice.sym_restart = null
		}
		s = curvoice.sym_start
		if (!s)
			s = curvoice.sym
		if (!s) {
			syntax(1, "s: without music")
			return
		}
	}

	/* scan the symbol line */
	i = 0
	while (1) {
		while (p[i] == ' ' || p[i] == '\t')
			i++;
		c = p[i]
		if (!c)
			break
		switch (c) {
		case '|':
			while (s && s.type != C.BAR)
				s = s.next
			if (!s) {
				syntax(1, "Not enough measure bars for symbol line")
				return
			}
			s = s.next;
			i++
			continue
		case '!':
		case '"':
			j = ++i
			i = p.indexOf(c, j)
			if (i < 0) {
				syntax(1, c == '!' ?
					"No end of decoration" :
					"No end of chord symbol/annotation");
				i = p.length
				continue
			}
			d = p.slice(j - 1, i + 1)
			break
		case '*':
			break
		default:
			d = c.charCodeAt(0)
			if (d < 128) {
				d = char_tb[d]
				if (d.length > 1
				 && (d[0] == '!' || d[0] == '"')) {
					c = d[0]
					break
				}
			}
			syntax(1, errs.bad_char, c)
			break
		}

		/* store the element in the next note */
		while (s && s.type != C.NOTE)
			s = s.next
		if (!s) {
			syntax(1, "Too many elements in symbol line")
			return
		}
		switch (c) {
		default:
//		case '*':
			break
		case '!':
			a_dcn.push(d.slice(1, -1))
			deco_cnv(s, s.prev)
			break
		case '"':
			parse.line.index = j + 2	// (+ 's:')
			parse_gchord(d)
			if (a_gch)			// if no error
				csan_add(s)
			break
		}
		s = s.next;
		i++
	}
	curvoice.sym_cont = s
}

/* -- parse a lyric (vocal) line (w:) -- */
function get_lyrics(p, cont) {
    var s, word, i, j, ly, dfnt, ln, c, cf

	if (curvoice.ignore)
		return
	if ((curvoice.pos.voc & 0x07) != C.SL_HIDDEN)
		curvoice.have_ly = true

	// get the starting symbol of the lyrics
	if (cont) {					// +:
		s = curvoice.lyric_cont
		if (!s) {
			syntax(1, "+: lyric without music")
			return
		}
		if (p[0] == '~') {			// +:~next~words
			while (!s.a_ly)
				s = s.prev
			ly = s.a_ly[curvoice.lyric_line]
			p = ly.t.replace(/ /g,'~') + p
		}
		dfnt = get_font("vocal")
		if (gene.deffont != dfnt) {	// if vocalfont change
			if (gene.curfont == gene.deffont)
				gene.curfont = dfnt
			gene.deffont = dfnt
		}
	} else {
		set_font("vocal")
		if (curvoice.lyric_restart) {		// new music
			curvoice.lyric_start = s = curvoice.lyric_restart;
			curvoice.lyric_restart = null;
			curvoice.lyric_line = 0
		} else {
			curvoice.lyric_line++;
			s = curvoice.lyric_start
		}
		if (!s)
			s = curvoice.sym
		if (!s) {
			syntax(1, "w: without music")
			return
		}
	}

	/* scan the lyric line */
	i = 0
	cf = gene.curfont
	while (1) {
		while (p[i] == ' ' || p[i] == '\t')
			i++
		if (!p[i])
			break
		ln = 0
		j = parse.istart + i + 2	// start index
		switch (p[i]) { 
		case '|':
			while (s && s.type != C.BAR)
				s = s.next
			if (!s) {
				syntax(1, "Not enough measure bars for lyric line")
				return
			}
			s = s.next;
			i++
			continue
		case '-':
			if (ly?.ln != 3)
				word = '-', ln = 2
			else
				word = '_', ln = 3
			break
		case '_':
			if (ly && ly.ln && ly.ln != 3)
				word = '-', ln = 2
			else
				word = '_', ln = 3
			break
		case '*':
			word = ""
			break
		default:
			word = "";
			while (1) {
				if (!p[i])
					break
				switch (p[i]) {
				case '_':
				case '*':
				case '|':
					i--
				case ' ':
				case '\t':
					break
				case '~':
					word += ' '
					i++
					continue
				case '-':
					ln = 1		// start of line
					break
				case '\\':
					if (!p[++i])
						continue
					word += p[i++]
					continue
				case '$':
					word += p[i++]
					c = p[i]
					if (c == '0')
						gene.curfont = gene.deffont
					else if (c >= '1' && c <= '9')
						gene.curfont = get_font("u" + c)
					// fall thru
				default:
					word += p[i++]
					continue
				}
				break
			}
			break
		}

		/* store the word in the next note */
		while (s && s.type != C.NOTE)
			s = s.next
		if (!s) {
			syntax(1, "Too many words in lyric line")
			return
		}
		if (word
		 && (s.pos.voc & 0x07) != C.SL_HIDDEN) {
			ly = {
				t: word,
				font: cf,
				istart: j,
				iend: j + word.length
			}
			if (ln)
				ly.ln = ln
			if (!s.a_ly)
				s.a_ly = []
			s.a_ly[curvoice.lyric_line] = ly
			cf = gene.curfont
		}
		s = s.next;
		i++
	}
	curvoice.lyric_cont = s
}

// install the words under a note
// (this function is called during the generation)
function ly_set(s) {
    var	i, j, ly, d, s1, s2, p, w, spw, xx, sz, shift, dw, r,
	s3 = s,				// start of the current time sequence
	wx = 0,
	wl = 0,
	n = 0,
	dx = 0,
	a_ly = s.a_ly,
	align = 0

	// get the available horizontal space before the next lyric words
	for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
		if (s2.seqst) {
			dx += s2.shrink
			n++			// number of symbols without word
		}
		if (s2.bar_type) {		// stop on a bar
			dx += 3			// and take some of its spacing
			break
		}
		if (!s2.a_ly)
			continue
		i = s2.a_ly.length
		while (--i >= 0) {
			ly = s2.a_ly[i]
			if (!ly)
				continue
			if (!ly.ln || ly.ln < 2)
				break
		}
		if (i >= 0)
			break
	}

	// define the offset of the words
	for (i = 0; i < a_ly.length; i++) {
		ly = a_ly[i]
		if (!ly)
			continue
		gene.curfont = ly.font
		ly.t = str2svg(ly.t)
		p = ly.t.replace(/<[^>]*>/g, '')	// remove the XML tags
		if (ly.ln >= 2) {
			ly.shift = 0
			continue
		}
		spw = cwid(' ') * ly.font.swfac
		w = ly.t.wh[0]
		r = abc2svg.lypre.exec(p)
		if (s.type == C.GRACE) {		// %%graceword
			shift = s.wl
		} else if (r) {
			r = r[0]
			if (p[0] == '(') {
				sz = spw
			} else {
				set_font(ly.font)
				if (p[r.length] == ' '
				 || r.slice(-1) == ':')
					sz = strwh(p.slice(0, r.length))[0]
				else
					sz = w * .2
			}
			shift = (w - sz) * .4
			if (shift > 14)
				shift = 14
			shift += sz
			if (p[0] >= '0' && p[0] <= '9') {
				if (shift > align)
					align = shift
			}
		} else {
			shift = w * .4
			if (shift > 14)
				shift = 14
		}
		ly.shift = shift
		if (shift > wl)
			wl = shift		// max left space
	    if (ly.ln != 1)			// (no space for a hyphen)
		w += spw			// space after the syllable
		w -= shift			// right width
		if (w > wx)
			wx = w			// max width
	}

	// set the left space
	while (!s3.seqst)
		s3 = s3.ts_prev
	if (s3.ts_prev && s3.ts_prev.bar_type)
		wl -= 4			// don't move too much the measure bar
	if (s3.wl < wl) {
		s3.shrink += wl - s3.wl
		s3.wl = wl
	}

	// if not room enough, shift the following notes to the right
	dx -= 6
	if (dx < wx && s2) {
		dx = (wx - dx) / n
		s1 = s.ts_next
		while (1) {
			if (s1.seqst) {
				s1.shrink += dx
				s3.wr += dx	// (needed for end of line)
				s3 = s1
			}
			if (s1 == s2)
				break
			s1 = s1.ts_next
		}
	}

	if (align > 0) {
		for (i = 0; i < a_ly.length; i++) {
			ly = a_ly[i]
			if (ly && ly.t[0] >= '0' && ly.t[0] <= '9')
				ly.shift = align
		}
	}
} // ly_set()

/* -- draw the lyrics under (or above) notes -- */
/* (the staves are not yet defined) */
function draw_lyric_line(p_voice, j, y) {
    var	p, lastx, w, s, ly, lyl, ln,
	lflag, x0, shift,
	hyflag = {}

	// output a syllable
	function out_ly(s, w, p) {
		if (user.anno_start || user.anno_stop) {
		    var	s2 = {
				p_v: s.p_v,
				st: s.st,
				istart: s.a_ly[j].istart,
				iend: s.a_ly[j].iend,
				ts_prev: s,
				ts_next: s.ts_next,
				x: lastx,
				y: y,
				ymn: y,
				ymx: y + gene.curfont.size,
				wl: 0,
				wr: w
			}
			anno_start(s2, 'lyrics')
		}
		xy_str(lastx, y, p)
		anno_stop(s2, 'lyrics')
	} // out_ly()

	function set_hy(v) {
		if (v) {
			hyflag.s = s
			hyflag.p = p
			hyflag.w = w
		} else {
			hyflag.s = null
			hyflag.p = ""
			hyflag.w = 0
		}
	} // set_hy()

	for (s = p_voice.sym; /*s*/; s = s.next)
		if (s.type != C.CLEF
		 && s.type != C.KEY && s.type != C.METER)
			break
	x0 = s.x - s.wl - 10
	lastx = 0
	set_hy(0)
	if (p_voice.hy_st & (1 << j)) {
		hyflag.s = s
		p_voice.hy_st &= ~(1 << j)
	}
	for ( ; s; s = s.next) {
		if (s.a_ly)
			ly = s.a_ly[j]
		else
			ly = null
		if (!ly) {
			switch (s.type) {
			case C.REST:
			case C.MREST:
				if (lflag) {
					out_wln(lflag, y, x0 - lflag)
					lflag = 0
					lastx = s.x + s.wr
				}
			}
			continue
		}
		if (ly.font != gene.curfont)		/* font change */
			gene.curfont = ly.font
		p = ly.t;
		ln = ly.ln || 0
		w = p.wh[0]
		shift = ly.shift

		if (ln == 3) {				// if '_'
			if (!lflag)
				lflag = x0 + 3
			x0 = s.x - shift + w
			continue
		}
		if (lflag) {
			out_wln(lflag, y, x0 - lflag)
			lflag = 0
		}
		x0 = s.x - shift
		if (ln == 1				// first '-'
		 && !hyflag.s) {
			set_hy(1)
			lastx = x0
			continue
		}
		if (ln == 2)				// more '-'
			continue
		if (hyflag.s) {
			if (x0 - hyflag.w - lastx > gene.curfont.swfac) {
				if (!lastx)
					lastx = x0 - ly.font.size
				out_ly(hyflag.s, hyflag.w, hyflag.p)
				lastx += hyflag.w
				out_hyph(lastx, y, x0 - lastx)
				set_hy(0)
				lastx = x0
			} else {
				x0 = lastx
			}
			p = hyflag.p + p		// concatenate
			w += hyflag.w
			set_hy(ln)			// (set or reset)
			if (ln)
				continue
		}
		lastx = x0
		out_ly(s, w, p)
		x0 += w
	}
	if (hyflag.s) {
		out_ly(hyflag.s, hyflag.w, hyflag.p)
		lastx += hyflag.w
		x0 = realwidth - 10
		if (x0 < lastx + 10)
			x0 = lastx + 10;
		out_hyph(lastx, y, x0 - lastx)
		if (p_voice.s_next && p_voice.s_next.fmt.hyphencont)
			p_voice.hy_st |= (1 << j)
	}

	/* see if any underscore in the next line */
    if (lflag) {
	for (s = p_voice.s_next; s; s = s.next) {
		if (s.type == C.NOTE) {
			if (!s.a_ly)
				break
			ly = s.a_ly[j]
			if (ly && ly.ln == 3) {		 // '_'
				if (x0 < realwidth - 15)
					x0 = realwidth - 15
			}
			break
		}
	}
	out_wln(lflag, y, x0 - lflag)
    }
}

var lyric_asc_tb = {}		// ascent per font

// -- baseline to ascender height of a font --
// (measured in a browser - elsewhere, the .78 that abc2svg itself assumes
//  in its a_h * .22 baseline offset)
function lyric_ascent(font, a_h) {
    var	c, m,
	f = st_font(font),
	r = lyric_asc_tb[f]

	if (r != undefined)
		return r
	r = a_h * .78
	if (typeof document != "undefined" && document.createElement) {
	    try {
		c = document.createElement("canvas").getContext("2d");
		c.font = f;
		m = c.measureText("\u00c1y")
		if (m.fontBoundingBoxAscent)
			r = m.fontBoundingBoxAscent
		else if (m.actualBoundingBoxAscent)
			r = m.actualBoundingBoxAscent

		// cache only a really loaded face, so that a render started
		// while a webfont is in flight cannot pin the fallback metrics
		if (document.fonts && document.fonts.check(f))
			lyric_asc_tb[f] = r
	    } catch (e) {
	    }
	}
	return r
} // lyric_ascent()

function draw_lyrics(p_voice, nly, a_h, y,
				incr,	/* 1: below, -1: above */
				std) {	/* a lyric voice is already under the staff */
	var	j, top, asc, yg, yl,
		sc = staff_tb[p_voice.st].staffscale,
		lsf = tsfirst.fmt.lyricskipfac || 1.1,	// between lyric lines
		lff = tsfirst.fmt.lyricfirstskipfac || 1.1;	// staff to first line

	set_font("vocal")
	if (incr > 0) {				/* under the staff */
		if (std) {

			// the incoming y is the previous voice's lyrics, not
			// the music: stack under them with a full advance
			y *= sc;
			y -= a_h[0] * lff
		} else {

			// anchor the baseline on the bottom staff line, and
			// keep the lowest ink as a floor under it
			asc = lyric_ascent(gene.curfont, a_h[0]);
			yg = y * sc - asc * .35;
			yl = -tsfirst.fmt.vocalspace * sc - asc * lff;
			y = (yl < yg ? yl : yg) - a_h[0] * .22
		}
		for (j = 0; j < nly; j++) {
			if (j)
				y -= a_h[j] * lsf;
			draw_lyric_line(p_voice, j,
				y + a_h[j] * .22)	// (descent)
		}
		return y / sc
	}

	/* above the staff */
	top = staff_tb[p_voice.st].topbar + tsfirst.fmt.vocalspace
	if (y < top)
		y = top;
	y *= sc
	for (j = nly; --j >= 0;) {
		draw_lyric_line(p_voice, j, y + a_h[j] * .22)
		y += a_h[j] * lsf
	}
	return y / sc
}

// -- draw all the lyrics --
/* (the staves are not yet defined) */
function draw_all_lyrics() {
	var	p_voice, s, v, nly, i, x, y, w, a_ly, ly,
		lyst_tb = new Array(nstaff + 1),
		nv = voice_tb.length,
		h_tb = new Array(nv),
		nly_tb = new Array(nv),
		above_tb = new Array(nv),
		rv_tb = new Array(nv),
		top = 0,
		bot = 0,
		st = -1

	/* compute the number of lyrics per voice - staff
	 * and their y offset on the staff */
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		if (p_voice.st != st) {
			top = 0;
			bot = 0;
			st = p_voice.st
		}
		nly = 0
		if (p_voice.have_ly) {
			if (!h_tb[v])
				h_tb[v] = []
			for (s = p_voice.sym; s; s = s.next) {
				a_ly = s.a_ly
				if (!a_ly)
					continue
/*fixme:should get the real width*/
				x = s.x;
				w = 10
				for (i = 0; i < a_ly.length; i++) {
					ly = a_ly[i]
					if (ly) {
						x -= ly.shift;
						w = ly.t.wh[0]
						break
					}
				}
				y = y_get(p_voice.st, 1, x, w)
				if (top < y)
					top = y;
				y = y_get(p_voice.st, 0, x, w)
				if (bot > y)
					bot = y
				while (nly < a_ly.length)
					h_tb[v][nly++] = 0
				for (i = 0; i < a_ly.length; i++) {
					ly = a_ly[i]
					if (!ly)
						continue
					if (!h_tb[v][i]
					 || ly.t.wh[1] > h_tb[v][i])
						h_tb[v][i] = ly.t.wh[1]
				}
			}
		} else {
			y = y_get(p_voice.st, 1, 0, realwidth)
			if (top < y)
				top = y;
			y = y_get(p_voice.st, 0, 0, realwidth)
			if (bot > y)
				bot = y
		}
		if (!lyst_tb[st])
			lyst_tb[st] = {}
		lyst_tb[st].top = top;
		lyst_tb[st].bot = bot;
		nly_tb[v] = nly
		if (nly == 0)
			continue
		if (p_voice.pos.voc)
			above_tb[v] = (p_voice.pos.voc & 0x07) == C.SL_ABOVE
		else if (voice_tb[v + 1]
/*fixme:%%staves:KO - find an other way..*/
		      && voice_tb[v + 1].st == st
		      && voice_tb[v + 1].have_ly)
			above_tb[v] = true
		else
			above_tb[v] = false
		if (above_tb[v])
			lyst_tb[st].a = true
		else
			lyst_tb[st].b = true
	}

	/* draw the lyrics under the staves */
	i = 0
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		if (!p_voice.have_ly)
			continue
		if (above_tb[v]) {
			rv_tb[i++] = v
			continue
		}
		st = p_voice.st;
// don't scale the lyrics
		set_dscale(st, true)
		if (nly_tb[v] > 0) {
			lyst_tb[st].bot = draw_lyrics(p_voice, nly_tb[v],
							h_tb[v],
							lyst_tb[st].bot, 1,
							lyst_tb[st].lyd);
			lyst_tb[st].lyd = 1
		}
	}

	/* draw the lyrics above the staff */
	while (--i >= 0) {
		v = rv_tb[i];
		p_voice = voice_tb[v];
		st = p_voice.st;
		set_dscale(st, true);
		lyst_tb[st].top = draw_lyrics(p_voice, nly_tb[v],
						h_tb[v],
						lyst_tb[st].top, -1)
	}

	/* set the max y offsets of all symbols */
	for (v = 0; v < nv; v++) {
		p_voice = voice_tb[v]
		if (!p_voice.sym)
			continue
		st = p_voice.st;
		if (lyst_tb[st].a) {
			top = lyst_tb[st].top + 2
			for (s = p_voice.sym; s; s = s.next) {
/*fixme: may have lyrics crossing a next symbol*/
				if (s.a_ly) {
/*fixme:should set the real width*/
					y_set(st, 1, s.x - 2, 10, top)
				}
			}
		}
		if (lyst_tb[st].b) {
			bot = lyst_tb[st].bot - 2
			if (nly_tb[p_voice.v] > 0) {
				for (s = p_voice.sym; s; s = s.next) {
					if (s.a_ly) {
/*fixme:should set the real width*/
						y_set(st, 0, s.x - 2, 10, bot)
					}
				}
			} else {
				y_set(st, 0, 0, realwidth, bot)
			}
		}
	}
}
