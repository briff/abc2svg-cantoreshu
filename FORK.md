# abc-cantoreshu — what this fork changes

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
hook nor from the ABC source. Split into two format parameters, both defaulting
to that same `1.1` so nothing moves unless asked:

| Parameter | What it sets |
| --- | --- |
| `%%lyricfirstskipfac` | where the *first* `w:` line's baseline sits below the **bottom staff line**, counted in the lyric face's own ascent — under `1` the lyrics reach up into the staff, which is the only way to get them really tight |
| `%%lyricskipfac` | advance from one `w:` line to the next |

`%%lineskipfac` applies only to `%%text`/`%%words`/history blocks, never to
`w:` lines, and `%%vocalspace` is only a floor under the staff-to-first-lyric
gap: it can push lyrics down but never pull them closer than the lowest stem
hangs, so in practice anything under ~15pt does nothing at all.

The first line is anchored on the staff line rather than advanced from the
music, because abc2svg's own rule is a collision rule, not a placement rule:
counting from the lowest ink drew the lyrics 32.1, 36.1 and 39.1 units below
the staff on the three systems of one hymn, purely because a low note here and
a hanging stem there moved the ink. Counting in the *line box* drifted a second
way, a box being between 1.26 em and 1.36 em tall for the same nominal size
depending on the face. Measuring the face's ascent and anchoring on the staff
line takes out both: a system reads the same as its neighbour, and a face the
same as the next face. The music stays a floor — ink that hangs low enough to
be written over pushes the baseline down to clear it by `.35` of an ascent.

`lyric_ascent()` measures the baseline-to-ascender height with a canvas
`measureText("Áy")`, and falls back to `.78` of the line height outside a
browser or when the measurement throws — that being the ascent abc2svg itself
assumes in its `a_h * .22` baseline offset. A measurement is cached only once
`document.fonts.check()` says the face is really loaded, so a render started
while a webfont is still in flight cannot pin the fallback metrics.

A staff that already carries a lyric voice takes the upstream path for the next
one (`draw_all_lyrics()` passes `lyst_tb[st].lyd`): there the incoming `y` is
the previous voice's lyrics rather than the music, and those must be stacked
under with a full advance instead of anchored.

Touches `core/format.js` (defaults, `set_format`) and `core/lyrics.js`
(`lyric_ascent`, `draw_lyrics`, `draw_all_lyrics`).

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

## Building

`./build`, or `ninja` / `samu`. See section 3 of the
[README](README.md). Built files are git-ignored.
