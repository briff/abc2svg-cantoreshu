// %%lyrichyphenmin, and the room a hyphen is given - see FORK.md.
//
// The headless harness measures strings with abc2svg's own Times tables, so
// the numbers here are the fallback ones; what is asserted is the shape of the
// layout - which syllables and hyphens come out, and in what order - not the
// widths of a particular face.

import test from 'node:test'
import assert from 'node:assert/strict'

import { noteXs, syllables, syllableText } from './harness.mjs'

/**
 * The advance of a hyphen at `size`, in the Times widths abc2svg measures
 * with when there is no DOM to ask: .333 of the body, times the 1.1 the
 * engine puts on every string of a face it has no real metrics for.
 */
const hyphenWidth = (size) => .333 * 1.1 * size

/**
 * The room a hyphen is set in: its own width and a twentieth of it of air on
 * either side.  The glyph carries side bearings inside that width already, so
 * this is only what keeps them from reading as none.
 */
const hyphenRoom = (size) => hyphenWidth(size) * 1.1

/** The vocal font at `size`, which is all most of these fixtures set. */
const at = (size, family = 'serif') => `%%vocalfont "${family}" ${size}\n`

/**
 * The directives of a score that buys the room outright, so that the spacing
 * spreads the notes for the hyphens and none of them is ever dropped.  A
 * hymnal is set this way.
 */
const keepHyphens = (size, family = 'serif') =>
	at(size, family) + `%%lyrichyphenmin ${hyphenRoom(size)}\n`

// The reported fault.  Its lyrics are wide enough to drive the spacing, which
// is the case upstream's rule fails in: it asks for a whole em between the
// syllables before it will print a hyphen, which no syllabic setting leaves,
// so the hyphens are dropped and the syllables glued into one word.  Nothing
// but the first syllable of each word then stands under its own note.
const HYMN = 'X:1\nK:Eb\nL:1/4\n'
	+ 'E F G G | G A c2 | B4 | E F G G | G A B2 | G4 | B B c B | A G F G |'
	+ ' B A G2 | F4 | B B c B | A G F G | A G F2 | E4 |]\n'
	+ 'w: Áld-jad em-ber e nagy Jó-dat, Ke-nyér-szín-ben Meg-vál-tó-dat.'
	+ ' Itt je-len van szent tes-té-vel é-des Jé-zus, Je-len va-gyon szent'
	+ ' vé-ré-vel ál-dott Jé-zus.\n'

/** The syllables of the hymn, in order, with nothing glued. */
const SYL = ('Áld jad em ber e nagy Jó dat, Ke nyér szín ben Meg vál tó dat.'
	+ ' Itt je len van szent tes té vel é des Jé zus, Je len va gyon szent'
	+ ' vé ré vel ál dott Jé zus.').split(' ')

/** Three notes and one word: the smallest case the rule shows itself in. */
const WORD = 'X:1\nK:Eb\nL:1/4\nC D E\nw: Meg-vál-tó\n'

/** The syllables engraved, hyphens and line-break repeats dropped. */
function syl(directives, tune = HYMN) {
	return syllableText(directives, tune).filter((t) => !/^-+$/.test(t))
}

test('every syllable of the hymn stands on its own', () => {
	assert.deepEqual(syl(keepHyphens(36)), SYL)
})

// The hyphen goes between the two syllables, so all three are in order and
// none of them shares a place with another.
test('a hyphen is set between the syllables it joins', () => {
	const line = syllables(keepHyphens(36),
		'X:1\nK:C\nL:1/4\ncdec|\nw: Áld-jad em-ber\n')[0]

	assert.deepEqual(line.map((s) => s.t), ['Áld', '-', 'jad', 'em', '-', 'ber'])
	for (let i = 1; i < line.length; i++)
		assert.ok(line[i].x > line[i - 1].x,
			`${line[i].t} at ${line[i].x} is not past`
			+ ` ${line[i - 1].t} at ${line[i - 1].x}`)
})

// The size of the lyrics is what upstream's threshold - a whole em and more -
// is measured against, so the fault grows with it.  A score that has bought
// the room keeps every hyphen at every size.
test('the room bought keeps the hyphens at any lyric size', () => {
	for (const size of [10, 14, 24, 36, 48])
		assert.deepEqual(syl(keepHyphens(size)), SYL, `at ${size}pt`)
})

// A word broken over a line break keeps its hyphen on both sides: the tail of
// the word starts the next system with one before it.
test('a word broken over a system keeps its hyphen', () => {
	const systems = syllables(keepHyphens(36), HYMN)
	let broken = 0

	for (const line of systems.slice(1))
		if (line[0].t == '-') {
			broken++
			assert.ok(line[1] && line[1].x > line[0].x,
				'the syllable follows the hyphen')
		}
	assert.ok(broken > 0, 'the hymn does break a word over a system')
})

// -- what the noteheads are moved for, and what they are not --
//
// The syllables: two of them may not be set one over another, so the spacing
// carries them.  The hyphen between two of them: no.  It is set in the room
// the spacing happens to leave, and where that is too little it goes and the
// two syllables are pulled into one word - the setting giving in rather than
// the noteheads coming off their advance to hold a stroke.
//
// Four notes and two words on a page four times as wide as they need.  The
// music's own advance carries `Áld-jad` up to about 15pt; past that the
// hyphen would have to push the second notehead, so it is dropped instead.

const SHORT = 'X:1\nK:Eb\nL:1/4\nE F G G |\nw: Áld-jad em-ber\n'

test('a hyphen that would spread the noteheads is dropped first', () => {
	const at16 = (tune) =>
		syllableText(at(16, 'Liberation Serif'), tune).flat().join(' ')

	assert.equal(syllableText(at(12, 'Liberation Serif'), SHORT)
			.flat().join(' '), 'Áld - jad em - ber',
		'at 12pt the advance of a crotchet holds both hyphens')
	assert.equal(at16(SHORT), 'Áldjad ember',
		'at 16pt it holds neither, and the words are set whole')
	assert.equal(at16(WORD), 'Megvál - tó',
		'the room a dropped hyphen gives back may still hold the next')
})

// But where the notes are spread already - by justification, which runs after
// the spacing and before the drawing - the hyphen costs nothing and is kept.
// The same four notes, the same sizes, on a line stretched to the page.
test('a hyphen the line has room for is kept, however large the lyrics', () => {
	for (const size of [12, 16, 20, 24, 36, 48])
		assert.deepEqual(syllableText('%%stretchlast 1\n'
						+ at(size, 'Liberation Serif'),
					SHORT).flat()
				.map((t) => /^-+$/.test(t) ? '-' : t),
			['Áld', '-', 'jad', 'em', '-', 'ber'], `at ${size}pt`)
})

// Two notes, two syllables of the same width, one hyphen: whatever that width
// is, if each syllable is centered on its notehead then the space left between
// them is centered between the noteheads too - so a hyphen centered in that
// space stands exactly midway between the two notes.  Nothing here needs to
// know how wide 'la' is, and the reading catches both faults at once: a
// syllable set off its note (upstream takes .4 of the width to the left of the
// note, and never more than 14 units) moves the hyphen off the midpoint, and
// so does a hyphen set off the middle of the gap (upstream offsets it by 8
// units and 2, which is its own width only at about 14pt).
test('the hyphen stands midway between the two noteheads', () => {
	for (const size of [10, 14, 24, 36, 48]) {
		const directives = keepHyphens(size, 'Liberation Serif')
		const tune = 'X:1\nK:C\nL:1/4\ncc|\nw: la-la\n'
		const [notes] = noteXs(directives, tune)
		const line = syllables(directives, tune)[0]
		const hyphen = line.find((s) => s.t == '-')

		assert.equal(notes.length, 2, 'two noteheads')
		assert.ok(hyphen, `at ${size}pt the hyphen is printed`)
		assert.ok(Math.abs(hyphen.x + hyphenWidth(size) / 2
					- (notes[0] + notes[1]) / 2) < .11,
			`at ${size}pt the hyphen is centered on`
			+ ` ${hyphen.x + hyphenWidth(size) / 2},`
			+ ` the notes on ${(notes[0] + notes[1]) / 2}`)
	}
})

// The same reading for a word of its own: half of it stands left of the note.
test('a syllable is centered on its notehead', () => {
	const directives = at(36, 'Liberation Serif')
	const tune = 'X:1\nK:C\nL:1/4\ncc|\nw: la la\n'
	const [notes] = noteXs(directives, tune)
	const line = syllables(directives, tune)[0]

	assert.equal(line.length, 2, 'two syllables, no hyphen')
	assert.ok(Math.abs((notes[0] - line[0].x) - (notes[1] - line[1].x)) < .11,
		'the same syllable stands the same way under either note')

	// with a wider syllable the overhang grows by half the extra width
	const wide = syllables(directives, 'X:1\nK:C\nL:1/4\ncc|\nw: lala la\n')[0]
	const [wideNotes] = noteXs(directives, 'X:1\nK:C\nL:1/4\ncc|\nw: lala la\n')

	assert.ok(wideNotes[0] - wide[0].x > (notes[0] - line[0].x) * 1.9,
		'twice the letters, twice the overhang')
})

// -- %%lyrichyphenmin --
//
// The one directive: it buys room between the syllables of a word, and the
// spacing spreads the notes to give it.  What it buys is what the notes are
// spread by, unit for unit, which is what makes it readable as a length of the
// page rather than a knob.
test('%%lyrichyphenmin buys the room, and the notes are spread by it', () => {
	const size = 24
	const spread = (directives) => {
		const x = noteXs(at(size, 'Liberation Serif') + directives,
					WORD)[0]

		return x[1] - x[0]
	}

	assert.ok(Math.abs(spread('%%lyrichyphenmin 40\n') - spread('') - 40) < .11,
		`40 units bought spread the notes by`
		+ ` ${spread('%%lyrichyphenmin 40\n') - spread('')}`)
})

test('and it is what the hyphen is then set in', () => {
	const size = 24
	const gap = (directives) => {
		const line = syllables(at(size, 'Liberation Serif') + directives,
					WORD)[0]
		const hyphen = line.findIndex((s) => s.t == '-')

		if (hyphen < 0)
			return 0			// glued: no gap at all

		// the hyphen is centered in the gap, so the gap is what is
		// left of it on either side, twice
		return (line[hyphen + 1].x - line[hyphen].x) * 2
			- hyphenWidth(size)
	}

	assert.equal(gap(''), 0, 'unbought at this size, the word is set whole')
	assert.ok(gap('%%lyrichyphenmin 40\n') > 39.89,
		`40 units bought, ${gap('%%lyrichyphenmin 40\n')} given`)

	// below what the face's own hyphen wants, the face wins: the room is a
	// floor under the stroke and its air, and cannot ask for less
	assert.ok(gap(`%%lyrichyphenmin ${hyphenRoom(size)}\n`)
			> hyphenRoom(size) - .11,
		'the hyphen is set in the room the face wants for it')
})

test('%%lyrichyphenmin takes a unit, and refuses a negative', () => {
	const xs = (directives, errors) =>
		syllables(at(24, 'Liberation Serif') + directives,
				WORD, { errors })[0].map((s) => s.x)
	const errors = []

	assert.deepEqual(xs('%%lyrichyphenmin 0.5cm\n'), xs('%%lyrichyphenmin 18.9\n'),
		'half a centimetre is 18.9 units')
	assert.deepEqual(xs('%%lyrichyphenmin -1\n', errors), xs(''),
		'a negative leaves the default standing')
	assert.ok(errors.length, 'and is reported')
})

// The room bought is asked of the spacing, and the spacing has a page to fit
// in.  When the page cannot give it - lyrics far too big for the width - the
// hyphen is dropped and the syllables set as one word after all.  That gives
// back the room it would have taken, so the next hyphen of the word may still
// be printed.
test('with no room at all the syllables are pulled together', () => {
	const out = syllableText('%%pagewidth 300px\n' + keepHyphens(44), HYMN)
	const glued = []

	for (let i = 0; i < SYL.length - 1; i++)		// runs of 2 to 4
		for (let n = 2; n <= 4 && i + n <= SYL.length; n++)
			glued.push(SYL.slice(i, i + n).join(''))
	assert.ok(out.some((t) => glued.includes(t)),
		`no two syllables were set as one: ${out.join(' ')}`)
	assert.ok(out.some((t) => /^-+$/.test(t)),
		'and hyphens are still printed where there is room')
})
