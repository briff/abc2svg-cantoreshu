// abc2svg - jsmin-node.js - run jsmin.js under nodeJS instead of QuickJS
//
// Copyright (C) 2026 Bertalan Fodor
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
// The build minifies with the `jsmin` binary, or else with `qjs` running the
// jsmin.js that ships in this repository, or else with `uglifyjs`.  On a
// machine that has nodeJS but neither QuickJS nor a global uglifyjs, this
// shim supplies the handful of QuickJS globals jsmin.js uses so the very same
// minifier can run there.
//
//	cat file.js | node tools/jsmin-node.js [comment args...]

var	fs = require('fs'),
	path = require('path'),
	dir = path.join(__dirname, '..'),
	src = fs.readFileSync(0, 'utf8'),	// stdin
	out = []

globalThis.print = function(s) { out.push(s) }
globalThis.scriptArgs = ['jsmin.js'].concat(process.argv.slice(2))
globalThis.std = {
	err: { printf: function(s) { process.stderr.write(s) } },
	exit: function(c) { process.stderr.write('\n'); process.exit(c) },
	in: { readAsString: function() { return src } }
}

;(0, eval)(fs.readFileSync(path.join(dir, 'jsmin.js'), 'utf8'))

process.stdout.write(out.join('\n') + '\n')
