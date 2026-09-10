// %%lyricfirstskipfac and %%lyricskipfac - see FORK.md.
//
// The numbers are the fallback-ascent ones the vm harness produces; a browser
// measures the real face and moves them.  test/preview.html is for that.

import test from 'node:test'
import assert from 'node:assert/strict'

import { FALLBACK_ASCENT, firstBaselines, lyricBaselines, near }
	from './harness.mjs'

// Nothing here reaches far below the staff, so it shows the ordinary case.
const HIGH = 'X:1\nK:C\nL:1/4\ncdec|cdec|\n'
	+ 'w: la la la la la la la la\nw: ti ti ti ti ti ti ti ti\n'

// One low note under one syllable: the case the .35 clearance drew over.
const LOW = 'X:1\nK:C\nL:1/4\nA,\nw: D\n'

// Its systems dip to different depths, so it shows the distance following the
// music.  Under upstream's own rule this hymn was the reported fault.
const HYMN = 'X:1\nK:Eb\nL:1/4\n'
	+ 'E F G G | G A c2 | B4 | E F G G | G A B2 | G4 | B B c B | A G F G |'
	+ ' B A G2 | F4 | B B c B | A G F G | A G F2 | E4 |]\n'
	+ 'w: Áld-jad em-ber e nagy Jó-dat, Ke-nyér-szín-ben Meg-vál-tó-dat.'
	+ ' Itt je-len van szent tes-té-vel é-des Jé-zus, Je-len va-gyon szent'
	+ ' vé-ré-vel ál-dott Jé-zus.\n'

test('at a factor of 1 the ascender line rests on the lowest ink', () => {
	near(firstBaselines('%%lyricfirstskipfac 1\n', LOW)[0], 44.1,
		'the low note is cleared by a full ascent')
	near(firstBaselines('%%lyricfirstskipfac 1\n', HIGH)[0], 36.1,
		'ordinary music is cleared by a full ascent too')
})

test('a low note under a syllable is never written over', () => {
	for (const factor of [0.5, 1, 2]) {
		const base = firstBaselines(`%%lyricfirstskipfac ${factor}\n`, LOW)[0]

		// the ink of that note ends 16.02 below the bottom staff line
		assert.ok(base - FALLBACK_ASCENT * factor >= 16.02 - 0.11,
			`factor ${factor}: ascender line at`
			+ ` ${base - FALLBACK_ASCENT * factor}, ink at 16.02`)
	}
})

test('the factor scales the clearance, in ascents', () => {
	const one = firstBaselines('%%lyricfirstskipfac 1\n', HIGH)[0]
	const half = firstBaselines('%%lyricfirstskipfac 0.5\n', HIGH)[0]

	near(one - half, FALLBACK_ASCENT * .5, 'half a factor is half an ascent')
})

test('the distance follows the music, system by system', () => {
	assert.deepEqual(firstBaselines('%%lyricfirstskipfac 1\n', HYMN),
			[36.1, 32.1, 39.1, 39.1, 32.1])
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

test('an unset factor is upstream\'s own 1.1', () => {
	near(firstBaselines('', HIGH)[0],
		firstBaselines('%%lyricfirstskipfac 1.1\n', HIGH)[0],
		'unset == 1.1')
})
