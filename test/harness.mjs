// Test harness for the abc2svg-cantoreshu fork.
//
// Evaluates the *built* abc2svg-1.js in a fresh vm context per render, so a
// test sees exactly the file the package ships - not the sources it was made
// from.  Run `./build` first (`npm test` does).
//
// There is no DOM here, so lyric_ascent() cannot measure a real face and
// always takes its .78-of-the-line-height fallback.  That is what makes the
// numbers below reproducible; for real metrics, open test/preview.html.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const ENGINE = readFileSync(
	fileURLToPath(new URL('../abc2svg-1.js', import.meta.url)), 'utf8')

/** Point size the fixtures engrave their lyrics at. */
export const LYRIC_SIZE = 36

/** What lyric_ascent() returns with no DOM: .78 of the line height. */
export const FALLBACK_ASCENT = LYRIC_SIZE * .78		// 28.08

/** Engrave `directives + tune` and return the whole SVG. */
export function engrave(directives, tune, opts = {}) {
	const sandbox = { abc2svg: {} }
	vm.createContext(sandbox)
	vm.runInContext(ENGINE, sandbox)

	let svg = ''
	const abc = new sandbox.abc2svg.Abc({
		img_out: (str) => { svg += str },
		errmsg: (msg) => { if (opts.errors) opts.errors.push(msg) },
		read_file: () => null
	})
	abc.tosvg('test',
		'%%pagewidth 642.52px\n%%pagescale 1\n'
		+ `%%vocalfont "Merriweather" ${LYRIC_SIZE}\n`
		+ '%%musicspace 0\n%%topspace 0\n%%vocalspace 0\n'
		+ directives + tune)
	return svg
}

/**
 * Per system, the baseline of each lyric line, as a distance below that
 * system's bottom staff line.
 *
 * abc2svg wraps a system's music in a <g> translated to the staff's bottom
 * line, so a lyric <text>'s own y is that distance already.
 *
 * @return {Array<Array<number>>} one array of baselines per engraved system
 */
export function lyricBaselines(directives, tune) {
	const systems = []

	for (const [, body] of engrave(directives, tune)
				.matchAll(/<g transform="translate\(0,[\d.]+\)">([\s\S]*?)<\/g>/g)) {
		const ys = [...new Set([...body.matchAll(
			/<text class="f\d+" x="[\d.]+" y="([-\d.]+)"/g)].map((m) => +m[1]))]
		if (ys.length)
			systems.push(ys)
	}
	return systems
}

/** The first lyric baseline of every system. */
export function firstBaselines(directives, tune) {
	return lyricBaselines(directives, tune).map((ys) => ys[0])
}

/**
 * Every laid-out string in engraving order.  abc2svg numbers its font classes
 * per tune, so a fixture that wants only its chord symbols back must carry no
 * title and no lyrics.
 */
export function texts(directives, tune) {
	return [...engrave(directives, tune)
			.matchAll(/<text class="f\d+"[^>]*>([^<]*)/g)].map((m) => m[1])
}

/** Baselines are sums of float text heights, so compare them as such. */
export function near(actual, expected, what) {
	if (Math.abs(actual - expected) >= 0.11)
		throw new Error(`${what}: ${actual} vs ${expected}`)
}
