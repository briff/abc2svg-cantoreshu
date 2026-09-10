// modules/huchords.js - Hungarian chord-symbol spelling.  See FORK.md.
//
// The fixtures carry no title and no lyrics, so every laid-out string that
// comes back is a chord symbol.  The module spells flats as an ASCII 'b';
// abc2svg turns that into a real flat sign as it lays the chord out, which is
// why the expectations below carry the sign and not the letter.

import test from 'node:test'
import assert from 'node:assert/strict'

import { texts } from './harness.mjs'

/** Chord symbols of a one-bar tune, in engraving order. */
function spell(directives, ...gch) {
	return texts(directives, 'X:1\nK:C\nL:1/4\n'
			+ gch.map((c) => `"${c}"C`).join('') + '\n')
}

test('B is H, and B flat stays B flat', () => {
	assert.deepEqual(spell('', 'B', 'Bb'), ['H', 'B\u266d'])
})

test('the palette has no sharps but the flat names', () => {
	assert.deepEqual(spell('', 'C#', 'D#', 'F#', 'G#', 'A#'),
			['D\u266d', 'E\u266d', 'G\u266d', 'A\u266d', 'B\u266d'])
})

test('a spelling off the palette is normalised onto it', () => {
	assert.deepEqual(spell('', 'B#', 'Cb', 'E#', 'Fb'), ['C', 'H', 'F', 'E'])
})

test('double accidentals resolve by pitch class', () => {
	assert.deepEqual(spell('', 'C##', 'Dbb'), ['D', 'C'])
})

test('the chord quality after the root is left alone', () => {
	assert.deepEqual(spell('', 'Bm7', 'Bbmaj7', 'C#sus4'),
			['Hm7', 'B\u266dmaj7', 'D\u266dsus4'])
})

test('a slashed bass note is respelt too', () => {
	assert.deepEqual(spell('', 'C/B', 'Am/E#'), ['C/H', 'Am/F'])
})

test('%%transpose is normalised after abc2svg has transposed', () => {
	// a semitone up, abc2svg would spell these B# and Cb
	assert.deepEqual(spell('%%transpose 1\n', 'B', 'A#', 'E#'),
			['C', 'H', 'G\u266d'])
})
