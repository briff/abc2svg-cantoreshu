# abc2svg-cantoreshu — differences from upstream

This is an unofficial mirror and fork of
[abc2svg](https://chiselapp.com/user/moinejf/repository/abc2svg), maintained
for [cantores.hu](https://cantores.hu). `upstream` is a pristine, commit-for-
check-in mirror of upstream Fossil trunk; this working tree contains the
changes described here. To see the exact current delta:

```sh
git diff upstream
```

Upstream is LGPL-3.0-or-later, and so is this fork. Upstream copyright notices
remain intact. This document is the prominent notice of modification requested
by [the license](LICENSE).

## Engraving and lyrics

The fork changes lyric layout for large, singable type.

- Syllables are centered on their noteheads, without upstream's fixed-width
  cap. Recognized lyric prefixes (such as verse numbers) remain to the left.
- The first lyric line clears the lowest musical ink; subsequent stanzas use a
  measured lyric-line advance. The calculation follows staff and beam scaling,
  and uses the lyric face's measured ink ascent where a browser can provide it.
- `%%lyricfirstskipfac` sets the clearance above the first lyric line in beam
  gaps (default `1`), and `%%lyricskipfac` sets the stanza advance as a multiple
  of the measured line height (default `1.2`). Both accept `0`.
- Hyphens between syllables are drawn as short strokes, rather than taken from
  the lyric font's hyphen glyph. This makes their dimensions independent of
  font side bearings and keeps them appropriate at large lyric sizes.
- Ordinary lyric hyphens may be omitted when a line has insufficient room; the
  adjoining syllables are then rendered as one word. Hard lyric hyphens
  (`\\-`) reserve their room and are never omitted. This lets a score preserve
  an intentional compound seam.
- When omitted hyphens join Hungarian doubled digraphs, the spelling is
  repaired: for example, `asz-szony` becomes `asszony`, while a hard hyphen
  preserves a compound such as `kulcs\\-cso-mó`.

Hyphen appearance and behaviour are controlled by these fork-specific format
parameters. Lengths and thickness are multiples of the lyric font size;
`lyrichyphenpos` is in x-heights of the lyric face.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `%%lyrichyphenminlen` | `0.22` | Minimum drawable stroke length |
| `%%lyrichyphenmaxlen` | `0.44` | Maximum stroke length |
| `%%lyrichyphenwidth` | `0.055` | Stroke thickness |
| `%%lyrichyphenspace` | `0.027` | Space on either side of a stroke |
| `%%lyrichyphenpos` | `0.6` | Stroke height above the baseline |
| `%%lyrichyphenremove` | `true` | Allow ordinary hyphens to be omitted when tight |

The lyric implementation is in `core/format.js`, `core/lyrics.js`, and
`core/svg.js`. `test/lyrics.test.mjs` and `test/hyphens.test.mjs` cover it;
`test/preview.html` and `test/hyphens.html` provide browser previews using real
font metrics.

## Hungarian chord symbols

`modules/huchords.js` uses Hungarian chord-root spelling: B natural is `H` and
B flat is `B`. It rewrites generated roots and slash bass notes to
`C Db D Eb E F Gb G Ab A Bb H` after upstream transposition. The module is
linked into the core build, rather than loaded with a `%%` directive. Input
normalization from `H` to upstream's English `B` belongs to the calling
application.

## Distribution and build

- The package is published as `@cantoreshu/abc2svg`. It is a browser global,
  not an ES/CommonJS module; load `abc2svg-1.js` as a script.
- `package.json` records the upstream release as `upstream.version`; the npm
  package version is maintained independently.
- The build can minify with Node through `tools/jsmin-node.js` when neither
  `jsmin` nor QuickJS is available.
- The fork adds a Node test harness and tests for lyrics, hyphens, and Hungarian
  chord spelling. Run `npm test` to build and execute them.

## Repository maintenance

- `tools/update-from-upstream.sh --merge` updates the pristine `upstream`
  mirror from Fossil and merges it into `main`; details are in
  [tools/README.md](tools/README.md).
- Fork-specific issue templates, a `.gitignore`, and README guidance identify
  this repository and route upstream bugs appropriately.
- The `Scc1t2/` SoundFont data is omitted. It is not needed for the fork's
  default build or cantores.hu playback use; retrieve it from upstream if
  needed.
