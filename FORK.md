# abc2svg-cantoreshu — what this fork changes

An unofficial git mirror and fork of
[abc2svg](https://chiselapp.com/user/moinejf/repository/abc2svg) by
Jean-François Moine, maintained for [cantores.hu](https://cantores.hu).

Upstream is LGPL-3.0-or-later, and so is this fork. Upstream's copyright
notices are kept as they are; the modifications below are the only differences
and are themselves LGPL-3.0-or-later.

This file is the "prominent notice of modification" that
[the license](LICENSE) asks for.

## Modifications

### 2026-09-10 — syllables on their notes, and the hyphen between them (`core/`)

Three faults in how a `w:` line is laid out under the music, all of them
harmless at the 14pt or so upstream is tuned for and all of them ruinous at a
singable size.

**A syllable was not centered on its notehead.** `ly_set()` puts `.4` of its
width to the left of the note rather than half, and then not more than `14`
units whatever the body size. Anything wider than 35 units — at 36pt that is
every syllable there is — therefore hangs to the right of its note by the rest:
`nagy` stood 24 units past the note it belongs to. Now it is `w * .5`, with no
cap. A prefix that `abc2svg.lypre` matches — a verse number, an opening
bracket — still hangs to the left of the note, and what follows it is what gets
centered.

**The hyphen was not centered between the syllables.** `out_hyph()` reckons
with a hyphen `8` units wide and offsets the single one it draws by `(w - 8) /
2 + 2`. Eight units is the hyphen's width at about 14pt and nothing else, so
at 36pt the hyphen was set 4.6 units right of the middle and printed into the
following syllable. It is now centered on `cwidf('-')`, the hyphen's own width
in the lyric font, and the run of them a long gap gets is repeated every four
bodies — which is upstream's 56 units at that same 14pt.

**A hyphen was dropped wherever the lyrics drove the spacing.** `ly_set()`
reserves *no* room between two syllables of a word: it adds a space after every
syllable except one that a hyphen follows, where the comment reads `(no space
for a hyphen)`. The spacing therefore sets the two syllables touching. Then,
at drawing time, `draw_lyric_line()` looks for room for the hyphen it never
asked for, does not find it — the gap it measures is 1.3 units, whatever the
line does — and *glues the two syllables into one word*, printed at the first
one's place. The threshold it fails against is `font.swfac`, the size times
1.1, a whole em and more that no syllabic setting ever leaves. Justification
cannot save it: it runs before the drawing, but on a gap the spacing was told
to make zero. The reported case, a Hungarian hymn at 36pt, came out as `Áldjad
ember e nagy Jódat, Kenyérszínben Megváltódat.`, no syllable but the first of
each word under its own note.

The pull-the-syllables-together rule is wanted, but only as the last resort it
reads as, and what settles it is the noteheads. The syllables are what the
spacing carries: two of them may not be set one over another, so the notes are
moved apart to hold them. The hyphen between two syllables of a word is not.
It is set in the room the spacing happens to leave, and where that is too
little the hyphen goes and the syllables are pulled into one word — rather than
the noteheads coming off their own advance to hold a stroke.

What "too little" means is **the room a hyphen is given**: its own width and a
twentieth of that of air on either side. The glyph carries side bearings inside
that width already, so the air here is only what keeps them from reading as
none; asking for much more glues a syllable on a line that had room for the
hyphen all along. That, and not upstream's whole em, is what
`draw_lyric_line()` requires before printing one. The hyphen is measured
through `strwh()`, the way the syllables themselves are, so on a page that lets
abc2svg measure (one that sets `abc2svg.el`) the room and what goes in it are
the same face.

Justification is what most often leaves the room, and it runs after the spacing
and before the drawing — which is the order upstream had wrong, the syllables
being pulled together on a gap the spacing was told to make zero and the line
opened up afterwards. A hyphen on a stretched line is now kept even where the
spacing could not have paid for it; a hyphen on a line at its natural advance
is dropped as soon as it would push the next note. Four notes and two words,
`E F G G` under `Áld-jad em-ber`, on a page four times as wide as they need:

| | 12pt | 15pt | 16pt | 24pt | 48pt |
| --- | --- | --- | --- | --- | --- |
| the line at its own width | `Áld-jad em-ber` | `Áld-jad em-ber` | `Áldjad ember` | `Áldjad ember` | `Áldjad ember` |
| the line stretched to the page | `Áld-jad em-ber` | `Áld-jad em-ber` | `Áld-jad em-ber` | `Áld-jad em-ber` | `Áld-jad em-ber` |

and three notes under one word, `C D E` / `Meg-vál-tó`, unstretched: `Meg - vál
- tó` to 12pt, then `Megvál - tó` at 16pt — the dropped hyphen giving its room
back to the one after it — and `Megváltó` from 20pt on.

| Parameter | What it sets |
| --- | --- |
| `%%lyrichyphenmin` | room bought outright between the syllables of a word, as a length (`20`, `0.5cm`, `6pt`). The spacing then spreads the notes for the hyphen too, unit for unit, and no hyphen is dropped. It is a floor under the room a hyphen must have to be printed as well. `0`, the default, buys nothing: the notes keep their advance and the hyphens take what is left over |

Where the line is tighter than the room:

* short of it but over `.6` of it, the stroke would still be seen whole — the
  ink of a hyphen is about two thirds of the width it advances, the rest being
  its side bearings — and gluing would take the syllable further from its note
  than closing that air does, so the gap is opened and the hyphen kept. The
  band is aretino-chant's, from `emitAlignedSyllables()`;
* under that, there is no room for the hyphen at all: it goes, and the
  syllables are set as one word. That gives back the room it would have taken,
  so the next hyphen of the word may still be printed.

A hymnal wants the other bargain, and pays for it in width: the reported hymn
at 36pt keeps 8 of its 24 hyphens on 5 systems as it stands, and every syllable
under its own note on 6 systems with `%%lyrichyphenmin 14.5` — the hyphen's own
room at that size.

Touches `core/format.js` (default, `set_format`), `core/lyrics.js`
(`hyphen_room`, `ly_set`, `draw_lyric_line`) and `core/svg.js` (`out_hyph`).
Covered by `test/hyphens.test.mjs`; `test/preview.html` has a slider for
`%%lyrichyphenmin` and a switch between the two ways abc2svg gets its string
widths, which is the difference the hyphens are most visible in.

*Known, not fixed:* on a page that does not set `abc2svg.el` before loading the
engine — `test/preview.html` did not either, until this change — `strwh()`
binds to its guessing form for the life of the page and every string is the
built-in Times table times `1.1`. Syllables then come out about
a tenth too wide, which inflates the note spacing by as much and throws the
hyphen to the right of the gap it is centered in — the layout is right, the
widths it was given are not. Measuring with a canvas, the way `lyric_ascent()`
already measures the ascent, would settle it for every page; it is not done
here.

*Not a fault, though it reads as one:* on a line at its own width the gaps
between the noteheads follow the widths of the syllables under them, so three
quarter notes under `Meg-vál-tó` at 40pt are spaced 69 and 44 apart — `Meg` is
half again as wide as `tó`, and each syllable is centered on its note. The same
line stretched to the page comes out 161 and 161: justification takes the
lyrics' minimums as the floor they are and shares the rest evenly.

*Known, not fixed:* on a line whose width is decided by the lyrics, `set_lines()`
can still choose a break one bar too far and abc2svg reports `Line too much
shrunk`. Its budget for a line is `x` of the last bar minus `x` of the first
symbol, which leaves out that first symbol's own left space — and that left
space is now a real half-syllable rather than a capped 14 units, so where the
fault still shows on the reported hymn at 36pt and from 40pt up. The fix is to
take the first symbol's `wl` off `xmax` in `set_lines()`, which changes where
every score breaks its lines, lyrics or not, and so is not made here.

*Possible improvements, not made:*

* **`%%lyrichyphenmin` does two jobs.** It is the width the spacing buys
  between two syllables of a word, and it is also a floor under the room
  `draw_lyric_line()` requires before it will print a hyphen. That is what
  makes the guarantee hold — buy 20 units and 20 is exactly what is asked for,
  so no hyphen is dropped — but it means a value below what the face's own
  hyphen wants reads oddly: at 24pt, `%%lyrichyphenmin 5` buys 5 units and the
  drawing wants 8.8, so `Meg-vál` keeps its hyphen and `vál-tó` glues. Letting
  the drawing always require the face's room alone, and leaving the directive
  to mean only the width bought, would give the directive one meaning and would
  print a hyphen on a squeezed line where today it glues.
* **A glued word stays anchored at its first syllable.** When the hyphens of a
  word go, the syllables are set as one word at the place of the first — which
  is upstream's behaviour and is why `Megváltó` at 24pt runs from 107 to about
  202 while its three noteheads stand at 135, 176 and 203, the last syllable
  some 30 units left of the note it belongs to. Centering the glued word across
  the notes it covers would put it under its own music.

### 2026-09-10 — `%%lyricfirstskipfac` and `%%lyricskipfac` (`core/`)

The vertical advance between lyric lines was the literal `1.1` inside
`draw_lyrics()`, which is closure-local and so reachable neither from a module
hook nor from the ABC source. Split into two format parameters, and the gap
between the music and the first lyric line re-derived from engraving practice
rather than from that constant:

| Parameter | What it sets |
| --- | --- |
| `%%lyricfirstskipfac` | the clearance between the lowest ink of the line and the top of the letters of the first `w:` line, counted in beam gaps — `1` is the engraved default |
| `%%lyricskipfac` | advance from one `w:` line to the next, as a multiple of the line's measured height — `1.2` is the engraved default |

`%%lineskipfac` applies only to `%%text`/`%%words`/history blocks, never to
`w:` lines, and `%%vocalspace` is only a floor under the staff-to-first-lyric
gap: it can push lyrics down but never pull them closer than the lowest stem
hangs, so in practice anything under ~15pt does nothing at all.

The rule the parameter implements is the engraved one. Lyrics are always
raster-parallel, so the **deepest ink of a line sets the lyric plane for the
whole line**: if a single note dips low, the top of the letters of *its*
syllable goes one beam gap under it, and that plane then holds for every
syllable in the line. With nothing hanging below the staff, the staff itself
is the ink — abc2svg keeps 2.02 units under the bottom line even for a
stemless note, and that is the minimum the rule ever gives.

The unit is the gap between two beams. `draw_beams()` advances `bshift` 3.5
from beam to beam and divides its `bh` 1.8 thickness by the graphic scale, so
the gap is `3.5 − 1.8 / scale` in the staff's own units — 1.7 at the default
scale, but not a constant. `beam_gap()` converts that into the unscaled units
the lyrics are set in, through the voice scale and `%%staffscale` both, and
clamps at 0: abc2svg holds the beams to a constant thickness however small the
staff, so under about `.52` they would touch. The factor scales it, so `2` is
two beam gaps and
`0` sets the letters right against the ink, touching it. Both parameters take
`0` as the real setting it is rather than as an absent one; a negative is
refused by `set_format()`, which shares its numeric branch with `%%scale` and
the rest.

Between stanzas the engraved rule is different again: the advance is the body
of **one size grade larger**, so that ascenders and descenders pass each other
without touching. On the hand-setting scale that is borgis 9 → garmond 10
(1.111), garmond → cicero (1.200), cicero → mittel (1.167); in millimetres,
3.76 / 4.51 / 5.26, against a recommended 3.5–5 / 4.5–5 / 5–5.5 for the three
sizes. Every computed value falls inside its own range, and `1.2` sits inside
all three, so that is the default here — upstream's `1.1` is below the
recommendation for every size.

Two things were wrong with upstream's own gap. It is measured in the *line
box*, which is between 1.26 em (Merriweather) and 1.36 em (Alegreya) tall at
the same nominal size, so one setting reads differently in every face; and the
box is not the ink, so a syllable set under a note that hangs low is written
over. Measuring the face's real ascent fixes the first, and clearing the ink
rather than the staff line fixes the second.

Two earlier shapes of this patch are worth recording, because both look
reasonable and neither works. Anchoring the first baseline on the bottom staff
line gives a beautifully even page, but cannot be made safe: even music that
stays high leaves ink some 8 units below the line, so a fixed anchor is either
far below everything or written over by something, and no tolerance constant
splits the difference — pushing a low `A,` clear needs over `.43` of an ascent,
leaving an ordinary hymn's deepest system alone needs under `.61`, and in that
window the note moves two units when it needs sixteen. Clearing each syllable
against `y_get()` individually is worse still: it breaks the raster-parallel
rule and leaves a ragged lyric line.

`lyric_ascent()` measures the top of the letters with a canvas
`measureText("Áy")`, taking `actualBoundingBoxAscent` — the ink of an accented
capital, the tallest thing a lyric line puts above the baseline. It does *not*
take `fontBoundingBoxAscent`, which is the face's design box: that is drawn to
hold every glyph and diacritic the face defines, and in an old-style face such
as EB Garamond it stands well above where the letters reach, leaving a gap that
no setting of the factor could close. The design box is the fallback when a
browser reports no ink metric, and `.78` of the line height the fallback beyond
that — outside a browser, or when the measurement throws — that being the ascent abc2svg itself
assumes in its `a_h * .22` baseline offset. A measurement is cached only once
`document.fonts.check()` says the face is really loaded, so a render started
while a webfont is still in flight cannot pin the fallback metrics. Because a
headless render always takes the fallback, `test/preview.html` is the only way
to see the distances the application will actually get.

A staff that already carries a lyric voice takes the upstream path for the next
one (`draw_all_lyrics()` passes `lyst_tb[st].lyd`): there the incoming `y` is
the previous voice's lyrics rather than the music, and those must be stacked
under with a full advance instead of cleared.

Touches `core/format.js` (defaults, `set_format`) and `core/lyrics.js`
(`lyric_ascent`, `draw_lyrics`, `draw_all_lyrics`).
Covered by `test/lyrics.test.mjs`; `test/preview.html` shows it with real
font metrics.

### 2026-09-10 — `modules/huchords.js`, Hungarian chord-symbol spelling

Hungarian chord charts spell B natural as `H` and B flat as `B`. abc2svg parses
and transposes chord roots as English note names and spells the result relative
to the destination key, so a semitone up comes out as `B#` or `Cb` — not how a
chord chart reads. The module wraps `gch_build` through `abc2svg.mhooks` (after
the closure-local `gch_tr1` has run) and rewrites every root and slashed bass
note onto the fixed palette `C Db D Eb E F Gb G Ab A Bb H` by pitch class.

It answers to no `%%` directive, so it cannot be loaded on demand like the
other modules: it is concatenated into `abc2svg-1.js` by `build` and
`build.ninja`. The `H` → English `B` rewrite on the way *in* belongs to the
calling application.

This one is specific to cantores.hu and is not proposed upstream.

### 2026-09-10 — `tools/jsmin-node.js`, minify with nodeJS

The build minifies with the `jsmin` binary, or else with `qjs` running the
`jsmin.js` that ships here, or else with `uglifyjs`. A machine with nodeJS but
neither QuickJS nor a global `uglifyjs` fell through to no minification at all
— `abc2svg-1.js` came out at 540K instead of 327K, silently. The shim supplies
the four QuickJS globals `jsmin.js` uses so the same minifier runs under node.
Tried after `jsmin` and `qjs` and before `uglifyjs`, so a machine that has
either of those is unaffected.

### `Scc1t2/` removed

Upstream ships 5 MB of base64 SoundFont data derived from the Creative /
HammerSound GM soundfont, whose redistribution terms are not stated anywhere in
the tree. It is not needed by any default build target, and cantores.hu does
not use abc2svg playback, so it is deleted from this branch. It remains in the
`upstream` branch and in history, which mirror fossil faithfully; get it from
upstream if you want playback.

## Tracking upstream

`upstream` is a pristine mirror of fossil `trunk`, one git commit per fossil
check-in, each carrying its `FossilOrigin-Name:` trailer. Local work lives on
`main` as merges of `upstream` plus the commits above. See
[tools/README.md](tools/README.md).

    tools/update-from-upstream.sh --merge

## Using it from an application

Published as **`@cantoreshu/abc2svg`**. It is not an ES or CommonJS module: the
core assigns the global `abc2svg` and is meant to be served as a file and
loaded with a plain `<script src>`, so the package has no `main` and no
`exports` — take the files by path:

    node_modules/@cantoreshu/abc2svg/abc2svg-1.js

The optional modules (`clip-1.js`, `MIDI-1.js`, …) are shipped too, but the
core only ever asks for one if the page has installed a real `abc2svg.loadjs`;
the built-in one is a no-op that reports failure. The `abcweb-*` wrappers
provide one, `abc2svg-1.js` alone does not.

The package version is the *fork's* own and does not track upstream's — the
built file self-reports the upstream release it was made from as
`abc2svg.version`, and `package.json` records it under `upstream.version`.
Assert on `abc2svg.version` if a consumer needs to pin the engine.

`prepare` runs `./build`, so a git dependency builds on install and a registry
publish carries the built files.

## Building and testing

`./build`, or `ninja` / `samu`. See section 3 of the
[README](README.md). Built files are git-ignored.

    npm test        # builds, then runs test/*.test.mjs against abc2svg-1.js

The tests engrave with the built file in a `vm` and read the geometry back out
of the SVG. There is no DOM there, so `lyric_ascent()` always takes its
fallback — open `test/preview.html` off the disk for a live render with real
font metrics, sliders for both factors, and the measured ascent printed next to
the fallback.
