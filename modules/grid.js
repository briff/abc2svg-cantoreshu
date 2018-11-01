// grid.js - module to insert a chord grid before or after a tune
//
// Copyright (C) 2018 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%grid" appears in a ABC source.
//
// Parameters
//	%%grid 1 | -1	(above the tune | below the tune)
//	%%gridfont font_name size (default: 'serif 16')

abc2svg.grid = {

// function called before tune generation
    do_grid: function() {
    var	C = abc2svg.C,
	tsfirst = this.get_tsfirst(),
	voice_tb = this.get_voice_tb(),
	img, font_cl, cls,
	cfmt = this.cfmt()

function get_beat(s) {
    var	beat = C.BLEN / 4

	if (!s.a_meter[0] || s.a_meter[0].top[0] == 'C' || !s.a_meter[0].bot)
		return beat;
	beat = C.BLEN / s.a_meter[0].bot[0] |0
	if (s.a_meter[0].bot[0] == 8
	 && s.a_meter[0].top[0] % 3 == 0)
		beat = C.BLEN / 8 * 3
	return beat
} // get_beat()

// generate the grid
function build_grid(chords, bars, font) {
    var	i, j, nr, line, bar, bar2, chord, cell, w, hr, x0, x, y,
	wmx = 0,
	cells = [],
	nc = chords.length % 6 == 0 ? 6 : 8;	// number of columns

	if (nc > chords.length)
		nc = chords.length;

	// build the content of the cells
	nr = 0
	for (i = 0; i < chords.length; i++) {
		if (i % nc == 0)
			nr++;			// number of rows
		chord = chords[i]
		if (chord.length == 0) {
			cell = '%'
		} else {
			cell = ''
			for (j = 0; j < chord.length; j++) {
				if (chord[j]) {
					if (j != 0)
						cell += ' / ';
					cell += chord[j]
				} else if (j == 0) {
					cell += '%'
				}
			}
		}
		bar = bars[i];
		if (bar[bar.length - 1] == ':')
			cell = '  ' + cell
		bar2 = bars[i + 1]
		if (bar2 && bar2[0] == ':')
			cell += '  ';
		cells.push(cell)

		// and find their max width
		if (bar[bar.length - 1] == ':')
			cell += '  '
		if (bar2 && bar2[0] == ':')
			cell += '  ';
		w = this.strwh(cell)[0]
		if (w > wmx)
			wmx = w
	}
	if (wmx < 20)
		wmx = 20;
	w = wmx * nc
	if (w > img.width) {
		nc /= 2;
		nr *= 2;
		w /= 2
	}

	// build the SVG image
	hr = font.size + 8;		// vert: 4 - cell - 4
	line = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	color="black" width="' + img.width.toFixed(0) +
			'px" height="' + (hr * nr + 6).toFixed(0) + 'px"'
	i = cfmt.bgcolor
	if (i)
		line += ' style="background-color: ' + i + '"';
	line += '>\n<style type="text/css">\n\
.mid {text-anchor:middle}\n'

	if (cfmt.fullsvg)
		line += '\
.stroke {stroke: currentColor; fill: none}\n\
.' + font_cl + ' {' + this.style_font(font.name + '.' + font.size) +  '}\n'
	line += '</style>\n'

	// draw the lines
	line += '<path class="stroke" d="\n';
	x0 = (img.width - w) / 2;
	y = 1
	for (j = 0; j <= nr; j++) {
		line += 'M' + x0.toFixed(2) + ' ' + y.toFixed(2) +
			'h' + w.toFixed(2)+ '\n';
		y += hr
	}
	x = x0
	for (i = 0; i <= nc; i++) {
		line += 'M' + x.toFixed(2) + ' 1v' + (hr * nr).toFixed(2) + '\n';
		x += wmx
	}
	line += '"/>\n';

	// insert the chords
	y = -1 - hr * .2
	for (i = 0; i < cells.length; i++) {
		if (i % nc == 0) {
			y += hr;			// new row
			x = x0 + wmx / 2
		}
		line += '<text class="' + cls + '" x="' +
			x.toFixed(2) + '" y="' + y.toFixed(2) + '">' +
			cells[i] + '</text>\n';
		x += wmx
	}

	// show the repeat signs
	y = -1 - hr * .2;
	x = x0
	for (i = 0; i < bars.length; i++) {
		bar = bars[i]
		if (bar[0] == ':')
			line += '<text class="' + cls + '" x="' +
				(x - 5).toFixed(2) +
				'" y="' + y.toFixed(2) +
				'" style="font-weight:bold;font-size:' +
			(font.size + 2).toFixed(2) + '">:</text>\n'
		if (i % nc == 0) {
			y += hr;			// new row
			x = x0
		}
		if (bar[bar.length - 1] == ':')
			line += '<text class="' + cls + '" x="' +
				(x + 5).toFixed(2) +
				'" y="' + y.toFixed(2) +
				'" style="font-weight:bold;font-size:' +
			(font.size + 2).toFixed(2) + '">:</text>\n'
		x += wmx
	}

	return line + '</svg>'
} // build_grid()

    var	s, beat, cur_beat, i, beat_i, p_voice, n, font, wm,
	bars = [],
	chords = [],
	chord = []

	img = this.get_img();

	// get the beat
	beat = get_beat(voice_tb[0].meter);
	wm = voice_tb[0].meter.wmeasure;

	// scan the tune
	cur_beat = beat_i = n = 0;
	bars.push('|')
	for (s = voice_tb[0].sym; s; s = s.next) {
		while (s.time > cur_beat) {
			beat_i++;
			cur_beat += beat
		}
		switch (s.type) {
		case C.NOTE:
		case C.REST:
			if (s.a_gch) {		// search a chord symbol
				for (i = 0; i < s.a_gch.length; i++) {
					if (s.a_gch[i].type == 'g') {
						if (!chord[beat_i]) {
							chord[beat_i] = s.a_gch[i].text;
							n++
						}
						break
					}
				}
			}
			break
		case C.BAR:
			if (s.time < wm) {		// if anacrusis
				if (chord.length) {
					chords.push(chord);
					bars.push(s.bar_type)
				} else {
					bars[0] = s.bar_type
				}
			} else {
				if (!s.bar_num)		// if not normal measure bar
					break
				chords.push(chord);
				bars.push(s.bar_type)
			}
			chord = [];
			cur_beat = s.time;	// synchronize in case of error
			beat_i = 0
			break
		case C.METER:
			beat = get_beat(s)
			wm = s.wmeasure
			break
		}
	}
	if (n == 0)				// no chord in this tune
		return

	if (chord.length != 0) {
		bars.push('')
		chords.push(chord)
	}

	// set the text style
	if (!this.cfmt().gridfont)
		this.param_set_font("gridfont", "serif 16");
	font = this.get_font('grid');
	font_cl = this.font_class(font)
	cls = font_cl + " mid";
	this.set_font('grid');		// (for strwh())

	// create the grid
	p_voice = voice_tb[this.get_top_v()]
	s = {
		type: C.BLOCK,
		subtype: 'ml',
		dur: 0,
		time: 0,
		p_v: p_voice,
		v: p_voice.v,
		text: build_grid.call(this, chords, bars, font)
	}

	// and insert it in the tune
	if (cfmt.grid < 0) {		// below
		for (var s2 = tsfirst; s2.ts_next; s2 = s2.ts_next)
			;
		s.time = s2.time;
		s.prev = p_voice.last_sym;
		s.ts_prev = s2;
		p_voice.last_sym.next = s;
		s2.ts_next = s
	} else {			// above
		s.time = 0;
		s.next = p_voice.sym;
		s.ts_next = tsfirst;
		tsfirst.ts_prev = s;
		tsfirst = s;
		this.set_tsfirst(s);
		p_voice.sym.prev = s;
		p_voice.sym = s
	}
    }, // do_grid()

    output_music: function(of) {
	if (this.cfmt().grid)
		abc2svg.grid.do_grid.call(this);
	of()
    },

    set_fmt: function(of, cmd, param, lock) {
	if (cmd == "grid") {
		this.cfmt().grid = param
		return
	}
	of(cmd, param, lock)
    },

    set_hooks: function(abc) {
	abc.output_music = abc2svg.grid.output_music.bind(abc, abc.output_music);
	abc.set_format = abc2svg.grid.set_fmt.bind(abc, abc.set_format)
    }
} // grid

abc2svg.modules.hooks.push(abc2svg.grid.set_hooks);

// the module is loaded
abc2svg.modules.grid.loaded = true
