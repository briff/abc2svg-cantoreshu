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
| `%%lyricfirstskipfac` | advance from the music down to the *first* `w:` line, counted from the lowest ink of the staff — under `1` is the only way to get lyrics really tight |
| `%%lyricskipfac` | advance from one `w:` line to the next |

`%%lineskipfac` applies only to `%%text`/`%%words`/history blocks, never to
`w:` lines, and `%%vocalspace` is only a floor under the staff-to-first-lyric
gap: it can push lyrics down but never pull them closer than the lowest stem
hangs, so in practice anything under ~15pt does nothing at all.

Touches `core/format.js` (defaults, `set_format`) and `core/lyrics.js`
(`draw_lyrics`).

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
