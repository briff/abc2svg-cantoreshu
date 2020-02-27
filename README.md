## abc2svg

**abc2svg** is a set of Javascript files which permits
to edit, display, print and play music that is
written in the [ABC music notation](http://abcnotation.com/).

The **abc2svg** core is based on
[abcm2ps](https://github.com/leesavide/abcm2ps)
but it may run in any system without recompilation.

The specific features of both abcm2ps and abc2svg are described
(with abc2svg!) in
[this page](http://moinejf.free.fr/abcm2ps-doc/index.html).

### Web usage

The **abc2svg** scripts may be loaded in any web browser when
they are pointed to by `<script src=` tags in XHTML or HTML files.

These scripts may reside either in the local file system or in a HTTP/web server.
Especially, they are available in my site
[http://moinejf.free.fr/js/](http://moinejf.free.fr/js/)
and are updated when a new release is out.

There are:

- `abc2svg-1.js`  
  This script is the **abc2svg** core.  
  It contains the ABC parser and the SVG generation engine.
  It is needed for music rendering and must be followed by one of
  the following scripts: `abcweb{1,2}-1.js`, `abcemb{,1,2}` or
  `abcdoc-1.js`.

- `abcweb1-1.js`  
  This script replaces all the page body by music as SVG images.  
  It must be declared after the core.  
  The music sequences start on `X:` or `%abc` at start of line,
  and stop on any ML tag.  
  If a ABC sequence contains the characters '<', '>' or '&',
  it must be enclosed in a XML comment (inside the sequence as a comment).  
  When there are many tunes in the file, the script displays a list
  of the tunes. The list step may be bypassed when the URL of the file
  contains a regular expression as the 'hash' value ('#' followed by
  a string at the end of the URL - the string does a `--select`).  
  When one or many tunes are displayed, a menu in the top/right corner
  offers to go back to the tune list or to modify the ABC source.  
  Playing and highlighting the played notes may be offered loading
  the scripts `snd-1.js` and `follow-1.js`.  
  See [this file](http://moinejf.free.fr/abc/boyvin-2-2.html)
  for an example (you may note that this HTML file is also
  a correct ABC file).
  
- `abcweb2-1.js`  
  This script replaces the ABC sequences defined in the elements
  with the class `abc` by music as SVG images.
  It keeps the other elements as they are.  
  It must also be declared after the core.  
  If a ABC sequence contains the characters '<', '>' or '&', either
    - this sequence must be defined in a <script> tag
      (with type="text/vnd.abc" and class="abc") and also
      enclosed in a XML comment (%<![CDATA[ .. %]]>) if in a XHTML file, or
    - the characters must be replaced by their XML counterparts
      ('&amp;lt;', '&amp;gt;' or '&amp;amp;').  
  Tune selection may be done by a 'hash' value as with the previous script.
  Playing and highlighting the played notes may also be offered loading
  the scripts `snd-1.js` and `follow-1.js`.  
  See [this file](http://moinejf.free.fr/abcm2ps-doc/multicol.xhtml)
  for an example.  
  
- `snd-1.js`  
  This script may be used with `abcweb{1,2}-1.js` to play the rendered
  ABC music.  

- `follow-1.js`  
  This script may be used after `snd-1.js` (or `play-1.js` - see below)
  to highlight the notes while playing.  
  With `abcweb{1,2}-1.js`, this script also permits to start playing
  anywhere in the music.  
  See [this file](http://moinejf.free.fr/abcm2ps-doc/tabac.xhtml)
  for an example.

- `abcemb-1.js`  
  This script replaces the ABC or MEI sequences by SVG images of the music
  (the ABC sequences start on `X:` or `%abc` at start of line,
  and stop on any ML tag - see below for MEI).  
  When the URL of the (X)HTML file ends with '#' followed by a string,
  only the first tune containing this string is displayed.  
  As previously, if a ABC sequence contains the characters '<', '>' or '&',
  it must be enclosed in a XML comment (inside the sequence as a comment).  
  See the
  [%%beginml documentation](http://moinejf.free.fr/abcm2ps-doc/beginml.xhtml)
  for an example.

- `abcdoc-1.js`  
  This script is also to be used in (X)HTML pages with the core.  
  Mainly used for ABC documentation, it lets the ABC source sequences
  in the page before the SVG images.  
  See the source of
  [abcm2ps/abc2svg features](http://moinejf.free.fr/abcm2ps-doc/features.xhtml)
  for an example.

- `abcemb1-1.js`  
  This script is an old version of `abcweb1-1.js`.  
  It must use `play-1.js` for playing.

- `abcemb2-1.js`  
  This script is an old version of `abcweb2-1.js`.  
  It must use `play-1.js` for playing.
  
- `play-1.js`  
  This script must be used with `abcemb{,1,2}-1.js` for playing the
  rendered ABC music.  
  See [this file](http://moinejf.free.fr/abcm2ps-doc/au_clair.xhtml)
  for an example.

- `edit-1.xhtml`  
  This is a simple web
  [ABC editor/player](http://moinejf.free.fr/js/edit-1.xhtml).

When looking at a ABC file in a web browser, you may also use a
<a href="https://en.wikipedia.org/wiki/Bookmarklet">bookmarklet</a>
as
<a href="javascript:(function(){var%20s,n=3,d=document,b=d.body;b.innerHTML='\n%25abc-2.2\n%25%3c!--\n'+b.textContent+'%25--%3e\n';function%20f(u){s=d.createElement('script');s.src='http://moinejf.free.fr/js/'+u;s.onload=function(){if(--n==0)dom_loaded()};d.head.appendChild(s)};f('play-1.js');f('follow-1.js');f('abcemb-1.js')})();void(0)">this one</a>
for rendering all tunes, or
<a href="javascript:(function(){var%20s,n=3,d=document,b=d.body;b.innerHTML='\n%25abc-2.2\n%25%3c!--\n'+b.textContent+'%25--%3e\n';function%20f(u){s=d.createElement('script');s.src='http://moinejf.free.fr/js/'+u;s.onload=function(){if(--n==0)dom_loaded()};d.head.appendChild(s)};f('play-1.js');f('follow-1.js');f('abcemb1-1.js')})();void(0)">this one</a>
for rendering the tunes one by one.

##### Notes:
- The music is rendered as SVG images. There is one image per
  music line / text block.  
  If you want to move these images to some other files,
  each one must contain the full CSS and defs. For that, insert  
  `        %%fullsvg x`  
  in the ABC file before rendering (see the
  [fullsvg documentation](http://moinejf.free.fr/abcm2ps-doc/fullsvg.xhtml)
  for more information).

- Playing uses the HTML5 audio and/or midi APIs.

- With the editor, if you want to render ABC files
  which contain `%%abc-include`, you must:
  - load the ABC file from the browse button
  - click in the include file name
  - load the include file by the same browse button  

  Then, you may edit and save both files.  
  There may be only one included file.

- The editor comes with different ways to enter the music from the keyboard.  
  If you have a US keyboard, you may try these bookmarklets:
<a href="javascript:(function(){if(typeof%20loadjs=='function'){loadjs('abckbd-1.js')}else{alert('use%20with%20abc2svg%20editor')}})();void(0)">keyboard 1</a>
and
<a href="javascript:(function(){if(typeof%20loadjs=='function'){loadjs('abckbd2-1.js')}else{alert('use%20with%20abc2svg%20editor')}})();void(0)">keyboard 2</a>

- The .js and .xhtml file names have a suffix which is the version of
  the core interface (actually '`-1`').

### nodeJS usage

Installed via **npm**, the **abc2svg** package comes with the
command line (batch) programs `abc2svg` and `abc2odt`.

These ones may be used as **abcm2ps** to generate XHTML or ODT files.  

`abc2svg` writes to standard output:  
`        abc2svg mytunes.abc > Out.xhtml`

`abc2odt` output is `abc.odt` or the file specified
by the command line argument `-o`:  
`        abc2odt my_file.abc -o my_file.odt`

### Build

If you want to build the **abc2svg** scripts in your machine,
you must first get the files from
[chisel](https://chiselapp.com/user/moinejf/repository/abc2svg),
either as a tarball or a Zip archive
(click `Timeline` and then in the top commit),
or by cloning the repository in some directory:

> `fossil clone https://chiselapp.com/user/moinejf/repository/abc2svg abc2svg.fossil`  
> `fossil open abc2svg.fossil`

Then, building is done using the tool [ninja](https://ninja-build.org/)
or [samurai](https://github.com/michaelforney/samurai).  
You may do it:

- without minification  
  This is interesting for debug purpose, the scripts being more human friendly.

  `        NOMIN=1 samu -v`

- in a standard way with minification  
  In this case, you need the tool `uglifyjs` which comes with nodeJS
  or [JSMin](https://www.crockford.com/jsmin.html).

  `        samu -v`

If you also want to change or add music glyphs, you may edit the source
file `font/abc2svg.sfd`. In this case, you will need both `base64` and `fontforge`,
and run

`        samu -v font.js`

If you cannot or don't want to install `ninja` or `samurai`, you may build
the abc2svg files by `./build` which is a shell script.

### Batch

After building the **abc2svg** scripts, you will be able to generate music
sheets from the command line as you did with `abcm2ps`, thanks to the
following shell scripts (the result goes to stdout):  

- `abcqjs` with `qjs` 
   ([QuickJS by Fabrice Bellard and Charlie Gordon](https://bellard.org/quickjs/))
- `abcjs24` with `js24` (Mozilla JavaScript shell - Spidermonkey)
- `abcjs52` with `js52` (Mozilla JavaScript shell - Spidermonkey)
- `abcjs60` with `js60` (Mozilla JavaScript shell - Spidermonkey)
- `abcjsc` with `jsc-1` (webkitgtk2)
- `abcnode` with `node` (nodeJS)
- `abcv8` with `d8` (Google libv8)

#### backend scripts

By default, the batch scripts generate (XHTML+SVG) files.  
This output may be modified by backend scripts. These ones must appear
just after the command.  
There are:

- `toabc.js`  
  This script outputs back the (selected) ABC tunes of the ABC source file.  
  Transposition is applied.  
  The resulting file does not contain the formatting parameters.  
  Example:  
  `        abcqjs toabc.js my_file.abc --select X:2 > tune_2.abc`

- `toabw.js`  
  This script outputs a Abiword file (ABW+SVG) which may be read by some
  word processors (abiword, libreoffice...) and converted to many other
  formats by the batch function of abiword.  
  The abc2svg music font (`abc2svf.woff` or `abc2svg.ttf`) must be installed
  in the local system for displaying and/or converting the .abw file.  
  Example:  
  `        abcv8 toabw.js my_file.abc > my_file.abw`

- `tomei.js`  
  This script outputs the music as a [MEI](https://music-encoding.org/) file.  
  Indeed, only one tune may be translated from ABC to MEI (multi-tunes ABC
  generates bad MEI).

- `toodt.js`  
  This script creates an Open Document (ODT+SVG) which may be read by most
  word processors (abiword, libreoffice...).  
  It runs only with the npm script `abc2svg` and asks for the npm module
  `jszip` to be installed.  
  The output ODT document may be specified by the command line argument `-o`
  (default `abc.odt`).  
  Example:  
  `        abc2svg toodt.js my_file.abc -o my_file.odt`

- `toparam.js`  
  This script just outputs the abc2svg parameters.

#### PDF generation

`abctopdf` is a shell script which converts ABC to PDF using one of the
previous shell scripts and, either a chrome/chromium compatible web browser,
or the program [weasyprint](https://weasyprint.org/) or
the program `rsvg-convert`.

With `rsvg-convert`, the used music font must be installed and defined by
`%%musicfont <fontname>`.

Note also that, with `weasyprint` or `rsvg-convert`, the paper size is
forced to A4. Instructions for changing this size may be found in the
script source.

The output PDF document may be specified by the command line argument `-o`
(default `abc.pdf`).

Example:  
`        abctopdf my_file.abc -o my_file.pdf`

### MEI support

As an experimental feature, an extented core `mei2svg-1.js` may be generated.
This one may handle both the ABC and [MEI](https://music-encoding.org/) notations.

In browser mode, the script `abcemb-1.js` loads either abc2svg-1.js or
mei2svg-1.js after checking the music notation type (`%abc` or `X:` is ABC,
`<mei` is MEI - see
[this tune](http://moinejf.free.fr/abc/Czerny_op603_6.html) for an example).

In batch mode, the script `abcqjs` also loads the right abc2svg core
according to the source file extension (`.abc` or `.mei`).

[Jean-François Moine](http://moinejf.free.fr)
