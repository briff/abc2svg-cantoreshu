// modules/huchords.js - Hungarian chord-symbol spelling.  See FORK.md.
//
// The fixtures carry no title and no lyrics, so every laid-out string that
// comes back is a chord symbol.  Accidentals reach the module as an ASCII 'b'
// and '#'; abc2svg turns those into real flat and sharp signs - and a double
// accidental into a glyph reference - as it lays the chord out, which is why
// the expectations below carry the signs and not the letters.

import test from 'node:test'
import assert from 'node:assert/strict'

import { chordSymbols, texts } from './harness.mjs'

/** Chord symbols of a one-bar tune, in engraving order. */
function spell(directives, ...gch) {
	return texts(directives, tune(gch))
}

/** The same chord symbols as the play accompaniment reads them. */
function sound(directives, ...gch) {
	return chordSymbols(directives, tune(gch)).map((c) => c.otext)
}

function tune(gch) {
	return 'X:1\nK:C\nL:1/4\n'
		+ gch.map((c) => `"${c}"C`).join('') + '\n'
}

test('B is H, and B flat stays B flat', () => {
	assert.deepEqual(spell('', 'B', 'Bb'), ['H', 'B♭'])
})

test('what the tune spells is kept as written', () => {
	assert.deepEqual(spell('', 'C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Gb'),
			['C♯', 'D♯', 'F♯', 'G♯', 'A♯',
			 'D♭', 'G♭'])
})

test('a spelling no chart carries is the tune\'s to make too', () => {
	assert.deepEqual(spell('', 'B#', 'Cb', 'E#', 'Fb'),
			['B♯', 'C♭', 'E♯', 'F♭'])
})

test('double accidentals are left alone as well', () => {
	assert.deepEqual(spell('', 'C##', 'Dbb'),
			['C&#x1d12a;', 'D&#x1d12b;'])
})

test('the chord quality after the root is left alone', () => {
	assert.deepEqual(spell('', 'Bm7', 'Bbmaj7', 'C#sus4'),
			['Hm7', 'B♭maj7', 'C♯sus4'])
})

test('a slashed bass note gets the same treatment', () => {
	assert.deepEqual(spell('', 'C/B', 'Am/E#'), ['C/H', 'Am/E♯'])
})

test('a transposed root off the palette is renamed onto it', () => {
	// a semitone up, abc2svg spells these B#, A## and E##
	assert.deepEqual(spell('%%transpose 1\n', 'B', 'A#', 'E#'),
			['C', 'H', 'F♯'])
})

test('a transposed root a chart can carry passes through', () => {
	// a semitone up, abc2svg spells these C#, F# and D#
	assert.deepEqual(spell('%%transpose 1\n', 'C', 'F', 'D'),
			['C♯', 'F♯', 'D♯'])
})

test('transposition onto B natural writes H', () => {
	// a semitone up abc2svg spells Bb as B, and a semitone down C as B
	assert.deepEqual(spell('%%transpose 1\n', 'Bb'), ['H'])
	assert.deepEqual(spell('%%transpose -1\n', 'C'), ['H'])
})

test('a transposed root keeps the side its accidentals came from', () => {
	// five semitones up, abc2svg spells Cb as Fb and A# as D#
	assert.deepEqual(spell('%%transpose 5\n', 'Cb', 'A#'), ['E', 'D♯'])
})

// -- %%huchords: the tune writes its chord symbols in Hungarian --

test('without the directive an H is no note name at all', () => {
	// nothing here knows the letter: it is engraved as it was written,
	// abc2svg does not transpose it, and the accompaniment cannot play it
	assert.deepEqual(spell('', 'H', 'Hm7'), ['H', 'Hm7'])
	assert.deepEqual(spell('%%transpose 1\n', 'H'), ['H'])
	assert.deepEqual(sound('', 'H'), ['H'])
})

test('%%huchords reads H as B natural and a plain B as B flat', () => {
	assert.deepEqual(spell('%%huchords 1\n', 'H', 'Hm7', 'B', 'Bmaj7'),
			['H', 'Hm7', 'B\u266d', 'B\u266dmaj7'])
})

test('%%huchords leaves a B carrying an accidental alone', () => {
	// 'Bb' is unambiguous whichever notation wrote it
	assert.deepEqual(spell('%%huchords 1\n', 'Bb', 'B#'),
			['B\u266d', 'B\u266f'])
})

test('%%huchords reads the slashed bass note too', () => {
	assert.deepEqual(spell('%%huchords 1\n', 'C/H', 'F/B', 'H7/D'),
			['C/H', 'F/B\u266d', 'H7/D'])
})

test('a Hungarian chord symbol transposes', () => {
	// H is B natural, so a semitone up it is C; B is B flat, so it is H
	assert.deepEqual(spell('%%huchords 1\n%%transpose 1\n', 'H', 'B', 'H7/D'),
			['C', 'H', 'C7/D\u266f'])
})

test('the play accompaniment is handed the English name', () => {
	assert.deepEqual(sound('%%huchords 1\n', 'H', 'B', 'H7/D', 'F/B'),
			['B', 'Bb', 'B7/D', 'F/Bb'])
})

test('%%huchords holds for one tune only', () => {
	const two = 'X:1\n%%huchords 1\nK:C\nL:1/4\n"B"C\n\n'
		+ 'X:2\nK:C\nL:1/4\n"B"C\n'

	assert.deepEqual(texts('', two), ['B\u266d', 'H'])
})

test('%%huchords can be turned off inside a tune', () => {
	assert.deepEqual(texts('%%huchords 1\n',
			'X:1\nK:C\nL:1/4\n"B"C[I:huchords 0]"B"C\n'),
			['B\u266d', 'H'])
})
