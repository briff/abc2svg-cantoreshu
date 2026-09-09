# Tracking upstream abc2svg

Upstream abc2svg is developed in **Fossil**, not git:
<https://chiselapp.com/user/moinejf/repository/abc2svg>.
(The `moinejf/abc2svg` repository on GitHub is a dead mirror — its description
says the project moved to chiselapp.)

This fork mirrors upstream's `trunk` into the git branch `upstream`, one git
commit per fossil check-in, and keeps local work on `main`.

    upstream:  ──…──A──B──C        pristine mirror of fossil trunk
                        \
    main:                M──…      merges of upstream + your own commits

Every mirrored commit carries the fossil check-in hash it came from:

    $ git log -1 --format='%B' upstream | grep FossilOrigin
    FossilOrigin-Name: b85beef1a2197ced3797a2f86f738a8da56f195f

## Updating

    tools/update-from-upstream.sh --merge

That pulls the fossil repository, exports new check-ins into the `upstream`
branch, and merges `upstream` into the branch you have checked out.  Without
`--merge` it only refreshes `upstream` and prints what arrived, leaving the
merge to you.  `--help` lists the rest of the options.

Requirements: `fossil` (Debian/Ubuntu: `apt install fossil`) and `git`.
The first run clones ~19 MB into `.upstream/` (git-ignored; override the
location with `ABC2SVG_UPSTREAM_CACHE`).  Deleting `.upstream/` costs nothing
but a re-clone — but note the re-clone will re-export the history from scratch,
which is not a fast-forward of `upstream`, so it then needs `--force-import`.

After an update, rebuild the distributed files as `README.md` describes
(`ninja`, or the `build` shell script).

## The pinned certificate

chiselapp.com's Let's Encrypt certificate **expired on 2026-08-31** and had not
been renewed as of 2026-09-09, so normal TLS validation of the upstream host
fails.  Rather than blindly ignoring validation, the script pins the exact
certificate: `tools/upstream-cert.sha256` holds its SHA-256 digest (recorded and
cross-checked with `openssl` on 2026-09-09), and the script answers fossil's
"accept this cert and continue (y/N/fingerprint)?" prompt with that digest.
Fossil then proceeds only on an exact match, and no exception is stored in the
fossil clone, so the pin is re-verified on every run.

Fossil also hash-verifies every artifact it receives, and the mirrored commits
record their fossil hashes, so tampering with the content would be visible.

When the host renews its certificate the sync will stop with
`SSL cert declined`.  Then:

    tools/update-from-upstream.sh --show-cert    # inspect subject/issuer/dates

and, if the new certificate looks legitimate, put its digest in
`tools/upstream-cert.sha256`.  Once the chain validates normally again you can
skip pinning entirely with `--strict-tls`, and eventually drop the pin file.

## History note

This repository began as a single squashed commit, `Import abc2svg @ 882486f5`.
When the full fossil history was imported, `main` was re-based onto it; the tree
was byte-identical to upstream at that check-in apart from two files the import
had added (`.fslckout`, a stray fossil check-out marker, and `UPSTREAM_REV`,
now redundant because each commit records its own `FossilOrigin-Name`).  The
original commit is kept as the tag `squashed-import-882486f5`.
