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

The unit is the gap between two beams, `BEAM_GAP` — 1.7, from `draw_beams()`'s
`bshift` 3.5 less `bh` 1.8. The factor scales it, so `2` is two beam gaps and
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

`lyric_ascent()` measures the baseline-to-ascender height with a canvas
`measureText("Áy")`, and falls back to `.78` of the line height outside a
browser or when the measurement throws — that being the ascent abc2svg itself
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
