// abc2svg - cmdline.js - command line
//
// Copyright (C) 2014-2018 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

// user definitions
var user = {
	read_file: function(fn) {	// read a file (main or included)
	    var	i,
		file = abc2svg.readFile(fn)

		if (!file)
			return file
		i = file.indexOf('\r')
		if (i >= 0) {
			if (file[i + 1] == '\n')
				file =  file.replace(/\r\n/g, '\n')	// M$
			else
				fike =  file.replace(/\r/g, '\n')	// Mac
		}

		// load the required modules (synchronous)
		abc2svg.modules.load(file)

		return file
	},
	errtxt: ''
}

	// print or store the error messages
	if (typeof abc2svg.printErr == 'function')
		user.errmsg = function(msg, l, c) { abc2svg.printErr(msg) }
	else
		user.errmsg = function(msg, l, c) { user.errtxt += msg + '\n' }

var	abc				// (global for 'toxxx.js')

// treat a file
function do_file(fn) {
    var	ext, file

	try {
		file = user.read_file(fn)
	} catch (e) {

		// get the file extension
		ext = fn.slice((fn.lastIndexOf('.') - 1 >>> 0) + 2)
		if (!ext) {
			fn += ".abc"
			try {
				file = user.read_file(fn)
			} catch (e) {
			}
		}
	}
	if (!file && fn != "default.abc") {
//		abc2svg.abort(new Error("Cannot read file '" + fn + "'"))
		user.errmsg("Cannot read file '" + fn + "'")
		return
	}
//	if (typeof(utf_convert) == "function")
//		file = utf_convert(file)

	if (fn.slice(-4) == ".mei") {
		if (!abc.mei2mus)
			abc2svg.abort(new Error("No MEI support"));
		abc.mei2mus(file)
		return
	}

	// generate
	try {
		abc.tosvg(fn, file)
	} catch (e) {
		abc2svg.abort(e)
	}
} // do_file()

function abc_cmd(cmd, args) {
	var	arg, parm, fn;

	// initialize the backend
	abc = new abc2svg.Abc(user)
	if (typeof global == "object" && !global.abc)
		global.abc = abc
	abc2svg.abc_init(args)

	// load 'default.abc'
	try {
		do_file("default.abc")
	} catch (e) {
	}

	while (1) {
		arg = args.shift()
		if (!arg)
			break
		if (arg[0] == "-") {
			if (arg[1] == "-") {
				parm = args.shift();
				parm = arg.replace('--', 'I:') + " " + parm + "\n"
				abc2svg.modules.load(parm);
				abc.tosvg(cmd, parm)
			}
		} else {
			if (fn) {
				do_file(fn);
				abc.tosvg('cmd', '%%select\n')
			}
			fn = arg
		}
	}
	if (fn)
		do_file(fn);

	abc2svg.abc_end()
}

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.user = user;
	exports.abc_cmd = abc_cmd
}
