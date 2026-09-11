// %%lyricfirstskipfac and %%lyricskipfac - see FORK.md.
//
// The numbers are the fallback-ascent ones the vm harness produces; a browser
// measures the real face and moves them.  test/preview.html is for that.

import test from 'node:test'
import assert from 'node:assert/strict'

import { FALLBACK_ASCENT, fakeDocument, firstBaselines, lyricBaselines, near,
	noteXs, syllables, engrave }
	from './harness.mjs'

test('a final slurred syllable has a valid position at its notehead', () => {
	for (const scale of [1, 0.7, 1.5]) {
		const errors = []
		const svg = engrave(`%%staffscale ${scale}\n`,
			'X:1\nK:F\nC D (E F)\nw: One to three\n', { errors })
		assert.deepEqual(errors, [])
		assert.doesNotMatch(svg, /NaN|Infinity/)
		const lyrics = [...svg.matchAll(/<text class="f\d+" x="([\d.]+)"[^>]*>(One|to|three)<\/text>/g)]
		assert.deepEqual(lyrics.map(m => m[2]), ['One', 'to', 'three'])
		assert.ok(+lyrics[2][1] > +lyrics[1][1], 'three follows to')
		if (scale == 1) {
			const stems = [...svg.matchAll(/class="sW" d="([^"]+)"/g)]
				.flatMap(m => [...m[1].matchAll(/M([\d.]+) /g)])
			near(+lyrics[2][1], +stems[2][1] - 3.5 - 3.7,
				'three starts at the left edge of E with its stem up')
		}
	}
})

for (const music of ['(cd)e', 'c-ce', '(cde)', 'c-c-c', '(c2d)e', 'c2-c2e']) {
	test(`lyrics start at the left note of ${music}`, () => {
		const tune = `X:1\nK:C\nL:1/4\n${music}|\nw: Alle _ _\n`
		const errors = []
		const [notes] = noteXs('', tune, { errors })
		const [line] = syllables('', tune, { errors })
		assert.deepEqual(errors, [])
		const headLeft = music.includes('2') ? 3.8 : 3.7
		near(line[0].x, notes[0] - headLeft, 'left edge of the first notehead')
	})
}

test('a syllable after a slur or tie remains centered', () => {
	for (const music of ['(cd)e', 'c-ce']) {
		const tune = `X:1\nK:C\nL:1/4\n${music}|\nw: la _ la\n`
		const [notes] = noteXs('', tune)
		const [line] = syllables('', tune)
		near(line[0].x, notes[0] - 3.7, 'slur or tie start')
		assert.ok(line[1].x < notes[2] - 1, 'following syllable is centered')
	}
})

/** The gap between two beams, the unit the clearance is counted in. */
const BEAM_GAP = 1.7

/** The body size the fixtures set their lyrics at (harness LYRIC_SIZE). */
const BODY = 36

// Nothing here reaches far below the staff, so it shows the ordinary case.
const HIGH = 'X:1\nK:C\nL:1/4\ncdec|cdec|\n'
	+ 'w: la la la la la la la la\nw: ti ti ti ti ti ti ti ti\n'

// One low note under one syllable: the case the .35 clearance drew over.
const LOW = 'X:1\nK:C\nL:1/4\nA,\nw: D\n'

// A whole note on a space, no stem: nothing at all below the bottom line.
const NO_INK = 'X:1\nK:C\nL:1/4\nc4|\nw: la\n'

// Its systems dip to different depths, so it shows the distance following the
// music.  Under upstream's own rule this hymn was the reported fault.
const HYMN = 'X:1\nK:Eb\nL:1/4\n'
	+ 'E F G G | G A c2 | B4 | E F G G | G A B2 | G4 | B B c B | A G F G |'
	+ ' B A G2 | F4 | B B c B | A G F G | A G F2 | E4 |]\n'
	+ 'w: Áld-jad em-ber e nagy Jó-dat, Ke-nyér-szín-ben Meg-vál-tó-dat.'
	+ ' Itt je-len van szent tes-té-vel é-des Jé-zus, Je-len va-gyon szent'
	+ ' vé-ré-vel ál-dott Jé-zus.\n'

test('the letters clear the lowest ink by one beam gap', () => {
	near(firstBaselines('%%lyricfirstskipfac 1\n', LOW)[0],
		16.02 + FALLBACK_ASCENT + BEAM_GAP, 'the low note')
	near(firstBaselines('%%lyricfirstskipfac 1\n', HIGH)[0],
		6.02 + FALLBACK_ASCENT + BEAM_GAP, 'ordinary music')
})

// The staff is ink too, so a line with nothing hanging below it measures from
// the bottom of the staff - which is the minimum the whole rule ever gives.
// abc2svg keeps 2.02 units of its own under the bottom line even for a
// stemless note, and that is the floor the clearance is added to.
test('with nothing below the staff, the staff itself is the ink', () => {
	const min = 2.02 + FALLBACK_ASCENT + BEAM_GAP

	near(firstBaselines('%%lyricfirstskipfac 1\n', NO_INK)[0], min,
		'a stemless note clears the staff only')
	for (const tune of [HIGH, LOW, HYMN])
		for (const base of firstBaselines('%%lyricfirstskipfac 1\n', tune))
			if (base < min - 0.11)
				throw new Error(`${base} is above the minimum ${min}`)
})

test('a low note under a syllable is never written over', () => {
	for (const factor of [0.5, 1, 2]) {
		const base = firstBaselines(`%%lyricfirstskipfac ${factor}\n`, LOW)[0]

		// the ink of that note ends 16.02 below the bottom staff line
		assert.ok(base - FALLBACK_ASCENT >= 16.02 + BEAM_GAP * factor - 0.11,
			`factor ${factor}: ascender line at`
			+ ` ${base - FALLBACK_ASCENT}, ink at 16.02`)
	}
})

test('the factor scales the clearance, in beam gaps', () => {
	const one = firstBaselines('%%lyricfirstskipfac 1\n', HIGH)[0]
	const two = firstBaselines('%%lyricfirstskipfac 2\n', HIGH)[0]

	near(two - one, BEAM_GAP, 'one more factor is one more beam gap')
})

test('the distance follows the music, system by system', () => {
	assert.deepEqual(firstBaselines('%%lyricfirstskipfac 1\n', HYMN),
			[35.8, 33.8, 38.8, 38.8, 33.8])
})

// Engraving sets the advance between lyric lines to the body of the next size
// up in the traditional scale, so ascenders and descenders pass without
// touching: borgis 9 -> garmond 10 is 1.111, garmond -> cicero 1.200, cicero
// -> mittel 1.167.  In millimetres that is 3.76 / 4.51 / 5.26, and the same
// source recommends 3.5-5 / 4.5-5 / 5-5.5 - so 1.2 sits in every range.
test('the default advance between stanzas is one size grade', () => {
	const [[first, second]] = lyricBaselines('', HIGH)

	near(second - first, BODY * 1.2, 'garmond to cicero')
})

// The reason for the grade: a descender of one line and an ascender of the
// next - a 'j' under an 'Á' - must pass without touching.  abc2svg puts the
// baseline .22 of the body above the line box's bottom and the ascender .78
// above it, so the clearance between two stanzas is (advance - body), and at
// 1.2 that is a fifth of the body.  Upstream's 1.1 leaves half as much.
test('a descender and the next ascender pass without touching', () => {
	const [[first, second]] = lyricBaselines('', HIGH)
	const descender = first + BODY * .22		// bottom of the 'j'
	const ascender = second - BODY * .78		// top of the 'Á'

	assert.ok(ascender > descender,
		`the Á starts at ${ascender}, the j ends at ${descender}`)
	near(ascender - descender, BODY * .2, 'a fifth of the body')
})

test('%%lyricskipfac moves the stanzas apart and leaves the first line', () => {
	const [[first1, second1]] = lyricBaselines('%%lyricfirstskipfac 1\n', HIGH)
	const [[first2, second2]] =
		lyricBaselines('%%lyricfirstskipfac 1\n%%lyricskipfac 2\n', HIGH)

	near(first2, first1, 'the first line does not move')
	assert.ok(second2 > second1 + 20, 'the second line does')
})

test('the two factors answer to nothing but themselves', () => {
	const [[first, second]] =
		lyricBaselines('%%lyricfirstskipfac 0.5\n%%lyricskipfac 2\n', HIGH)
	const firstOnly = firstBaselines('%%lyricfirstskipfac 0.5\n', HIGH)[0]

	near(first, firstOnly, '%%lyricskipfac leaves the first line alone')
	assert.ok(second > first, 'and the stanza still comes after it')
})

// 0 is a real setting, not an absent one: it puts the letters right against
// what they clear.  A `|| 1` fallback would silently turn it into the default.
test('a factor of 0 lets the letters touch the ink', () => {
	near(firstBaselines('%%lyricfirstskipfac 0\n', LOW)[0],
		16.02 + FALLBACK_ASCENT, 'the ascender line rests on the ink')

	const zero = firstBaselines('%%lyricfirstskipfac 0\n', HIGH)[0]
	const one = firstBaselines('%%lyricfirstskipfac 1\n', HIGH)[0]

	near(one - zero, BEAM_GAP, '0 is a beam gap tighter than 1, not equal to it')
})

test('a stanza advance of 0 is honoured too', () => {
	const [ys] = lyricBaselines('%%lyricskipfac 0\n', HIGH)

	// both stanzas land on one baseline, so the harness dedupes them to one
	assert.equal(ys.length, 1, 'the two lyric lines coincide')
})

test('an unset factor is one beam gap', () => {
	near(firstBaselines('', HIGH)[0],
		firstBaselines('%%lyricfirstskipfac 1\n', HIGH)[0], 'unset == 1')
})

// -- the measured path --
//
// Everything above runs headless, where lyric_ascent() takes its .78 fallback.
// A fake canvas reaches the branch a browser really uses.

test('the ink of the letters is measured, not the font design box', () => {
	const doc = fakeDocument(
		{ actualBoundingBoxAscent: 20, fontBoundingBoxAscent: 40 })

	// fontBoundingBoxAscent holds every diacritic the face defines and stands
	// far above the letters; taking it would leave a gap no factor can close
	near(firstBaselines('%%lyricfirstskipfac 0\n', LOW, { document: doc })[0],
		16.02 + 20, 'the letters, not the box')
})

test('the design box is still the fallback when there is no ink metric', () => {
	const doc = fakeDocument({ fontBoundingBoxAscent: 40 })

	near(firstBaselines('%%lyricfirstskipfac 0\n', LOW, { document: doc })[0],
		16.02 + 40, 'fontBoundingBoxAscent')
})

test('with no usable metric at all it is .78 of the body', () => {
	const doc = fakeDocument({})

	near(firstBaselines('%%lyricfirstskipfac 0\n', LOW, { document: doc })[0],
		16.02 + FALLBACK_ASCENT, 'the fallback')
})

// -- the beam gap under %%staffscale --
//
// draw_beams() advances 3.5 from beam to beam but divides the 1.8 thickness by
// the graphic scale, so the gap it draws is not a constant.  Measure it as the
// difference between two factors rather than as a baseline, which cancels the
// ink and the ascent; and multiply the factor up, because abc2svg rounds the y
// it writes to one decimal and the gap itself is smaller than that.
test('the clearance tracks the beams through %%staffscale', () => {
	for (const scale of [1, 0.7, 1.5, 0.52, 0.4]) {
		const at = (f) => firstBaselines(
			`%%staffscale ${scale}\n%%lyricfirstskipfac ${f}\n`, LOW)[0]
		const gap = (at(10) - at(0)) / 10

		// ... and abc2svg keeps the beams a constant thickness however
		// small the staff, so under about .52 they would touch
		near(gap, Math.max(0, 3.5 * scale - 1.8), `staffscale ${scale}`)
	}
})

// Compare with the emitted stem, not the padded symbol bounding box.
test('plain downward stems use their drawn tips for lyric clearance', () => {
	for (const pitch of ['B', 'c']) {
		for (const factor of [0, 1, 2]) {
			const tune = `X:1\nK:C\nL:1/4\n${pitch}\nw: la\n`
			const directives = `%%lyricfirstskipfac ${factor}\n`
			const svg = engrave(directives, tune)
			const stem = svg.match(/class="sW" d="M[\d.]+ ([\d.]+)v([\d.]+)"/)
			assert.ok(stem, 'a downward stem is drawn')
			const staff = +svg.match(/<g transform="translate\(0,([\d.]+)\)">/)[1]
			const tip = +stem[1] + +stem[2] - staff
			near(firstBaselines(directives, tune)[0] - FALLBACK_ASCENT - tip,
				factor * BEAM_GAP, 'clearance measured from the visible tip')
		}
	}
})

test('each system clears the letters it contains, including later accents', () => {
	const measured = []
	const doc = fakeDocument({})
	doc.createElement = () => ({ getContext: () => ({
		font: '',
		measureText: (text) => {
			measured.push(text)
			return { actualBoundingBoxAscent: text.includes('Á') ? 31 : 24 }
		}
	}) })
	const tune = 'X:1\nK:C\nL:1/4\nc4|\nw: Áldjad\n'
		+ 'c4|\nw: kenyér\nc4|\nw: itt\nc4|\nw: Áldjad\n'
	const bases = firstBaselines('%%barsperstaff 1\n%%lyricfirstskipfac 0\n',
		tune, { document: doc })
	assert.equal(bases.length, 4)
	near(bases[0] - bases[1], 7, 'shorter letters leave no unused accent space')
	near(bases[1], bases[2], 'equal letter heights have equal spacing')
	near(bases[0], bases[3], 'a later accent still gets its full height')
	assert.ok(measured.includes('kenyér'))
	assert.ok(measured.includes('itt'))
})

test('a tall syllable elsewhere does not add height below a low stem', () => {
	const doc = fakeDocument({})
	doc.createElement = () => ({ getContext: () => ({
		font: '',
		measureText: text => ({ actualBoundingBoxAscent: text.includes('Á') ? 31 : 18 })
	}) })
	const render = words => firstBaselines('%%lyricfirstskipfac 0\n',
		`X:1\nK:C\nL:1/4\nB c4|\nw: ${words}\n`, { document: doc })[0]
	// B's stem reaches 9 units below the staff, while c4 has no stem.
	// The staff's reserved lower edge is 2 units below its bottom line.
	near(render('v Á'), Math.max(9 + 18, 2 + 31), 'local pairs set the baseline')
	near(render('Á v'), 9 + 31, 'an accent under the stem needs more room')
	assert.ok(render('v Á') < render('Á v'), 'moving the accent changes clearance')
})
