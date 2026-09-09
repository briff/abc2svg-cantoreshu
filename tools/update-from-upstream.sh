#!/usr/bin/env bash
#
# Update this fork from the upstream abc2svg Fossil repository.
#
# Upstream development happens in Fossil, not git:
#
#     https://chiselapp.com/user/moinejf/repository/abc2svg
#
# This script keeps a fossil clone and a fossil->git mirror in .upstream/, and
# reflects upstream's trunk into the local 'upstream' branch, one git commit per
# fossil check-in.  Each imported commit carries a "FossilOrigin-Name:" trailer
# holding its fossil check-in hash.
#
#   tools/update-from-upstream.sh            refresh the 'upstream' branch
#   tools/update-from-upstream.sh --merge    ...and merge it into the current branch
#   tools/update-from-upstream.sh --show-cert  print the upstream server's TLS cert
#
# Local work lives on 'main' (or any branch of your own) and is carried forward
# with a merge; the 'upstream' branch itself must stay a pristine mirror.

set -euo pipefail

UPSTREAM_URL=${ABC2SVG_UPSTREAM_URL:-https://chiselapp.com/user/moinejf/repository/abc2svg}
UPSTREAM_BRANCH=${ABC2SVG_UPSTREAM_BRANCH:-upstream}

do_merge=0
strict_tls=0
offline=0
force_import=0

usage() {
	# the header comment block, minus the shebang and the '#' markers
	sed -e '1d' -e '/^[^#]/,$d' "$0" | sed -e 's/^# \{0,1\}//' -e 's/^#$//'
	cat <<'EOF'

Options:
  --merge            merge the refreshed 'upstream' branch into the current branch
  --strict-tls       require normal certificate validation (no pinned fingerprint)
  --offline          skip the network; re-export from the existing fossil clone
  --force-import     allow a non-fast-forward move of the 'upstream' branch
  --show-cert        show the upstream server's certificate and exit
  -h, --help         this text

Environment:
  ABC2SVG_UPSTREAM_URL      upstream fossil URL (default: chiselapp abc2svg)
  ABC2SVG_UPSTREAM_CACHE    cache directory (default: <repo>/.upstream)
  ABC2SVG_UPSTREAM_BRANCH   mirror branch name (default: upstream)
EOF
}

die() { printf '\n%s: %s\n' "${0##*/}" "$*" >&2; exit 1; }
note() { printf '==> %s\n' "$*"; }

tmpdir=$(mktemp -d)
cleanup() { if [ -n "$tmpdir" ]; then rm -rf "$tmpdir"; fi; }
trap cleanup EXIT

while [ $# -gt 0 ]; do
	case $1 in
	--merge) do_merge=1 ;;
	--strict-tls) strict_tls=1 ;;
	--offline) offline=1 ;;
	--force-import) force_import=1 ;;
	--show-cert) show_cert=1 ;;
	-h | --help) usage; exit 0 ;;
	*) die "unknown option '$1' (try --help)" ;;
	esac
	shift
done

for tool in git fossil; do
	command -v "$tool" >/dev/null || die "'$tool' is not installed (apt install $tool)"
done

repo_root=$(git rev-parse --show-toplevel) || die "not inside a git repository"
cache=${ABC2SVG_UPSTREAM_CACHE:-$repo_root/.upstream}
fossil_repo=$cache/abc2svg.fossil
mirror=$cache/git-mirror
pin_file=$repo_root/tools/upstream-cert.sha256

upstream_host=${UPSTREAM_URL#*://}
upstream_host=${upstream_host%%/*}
upstream_host=${upstream_host%%:*}

# The fossil check-in hash an imported git commit came from.
fossil_rev() {
	git log -1 --format='%B' "$1" | sed -n 's/^FossilOrigin-Name: *//p' | head -1
}

show_cert() {
	command -v openssl >/dev/null || die "'openssl' is not installed"
	local pem
	pem=$(openssl s_client -connect "$upstream_host:443" -servername "$upstream_host" \
		</dev/null 2>/dev/null | openssl x509 2>/dev/null) ||
		die "could not retrieve a certificate from $upstream_host"
	[ -n "$pem" ] || die "could not retrieve a certificate from $upstream_host"
	printf 'certificate offered by %s\n' "$upstream_host"
	printf '%s\n' "$pem" | openssl x509 -noout -subject -issuer -dates |
		sed 's/^/  /'
	printf '  sha256   = %s\n' \
		"$(printf '%s\n' "$pem" | openssl x509 -outform DER | sha256sum | cut -d' ' -f1)"
	printf '  pinned   = %s\n' "$(read_pin 2>/dev/null || echo '(none)')"
}

read_pin() {
	[ -f "$pin_file" ] || die "no pinned certificate in $pin_file"
	local pin
	pin=$(sed 's/#.*//' "$pin_file" | grep -oiE '[0-9a-f]{64}' | head -1 |
		tr '[:upper:]' '[:lower:]')
	[ -n "$pin" ] || die "$pin_file contains no sha256 digest"
	printf '%s' "$pin"
}

# fossil asks "accept this cert and continue (y/N/fingerprint)?" when it cannot
# validate the chain.  Answering with the pinned fingerprint makes fossil accept
# the cert only if it matches exactly; answering "n" to "remember this exception"
# keeps the pin authoritative on every future run.  On a valid chain fossil never
# prompts and these answers are simply unused.
make_answers() {
	if [ "$strict_tls" = 1 ]; then
		: >"$tmpdir/answers"
	else
		local pin
		pin=$(read_pin)
		printf '%s\nn\n' "$pin" >"$tmpdir/answers"
	fi
}

sync_fossil() {
	if [ "$offline" = 1 ]; then
		[ -f "$fossil_repo" ] || die "--offline given but no clone at $fossil_repo"
		note "offline: using the existing clone at $fossil_repo"
		return
	fi

	local answers=$tmpdir/answers log=$tmpdir/sync.log rc=0
	make_answers

	if [ -f "$fossil_repo" ]; then
		note "pulling $UPSTREAM_URL"
		fossil pull "$UPSTREAM_URL" -R "$fossil_repo" <"$answers" >"$log" 2>&1 || rc=$?
	else
		note "cloning $UPSTREAM_URL (first run, ~19 MB)"
		mkdir -p "$cache"
		fossil clone --no-open "$UPSTREAM_URL" "$fossil_repo" <"$answers" >"$log" 2>&1 || rc=$?
	fi

	# fossil exits 0 even when it declines a certificate, so check the transcript
	# too.  "Unable to verify SSL cert" alone is informational: it is what fossil
	# prints before the prompt that our pinned fingerprint then answers.
	if [ "$rc" != 0 ] || grep -qE 'SSL cert declined|server returned an error' "$log"; then
		grep -vE '% complete' "$log" | tail -20 | sed 's/^/    /' >&2
		if grep -q 'SSL cert declined' "$log"; then
			if [ "$strict_tls" = 1 ]; then
				die "the certificate of $upstream_host did not validate.
That is expected while the host's certificate is expired; drop --strict-tls to
sync against the fingerprint pinned in ${pin_file#"$repo_root"/} instead."
			fi
			die "$upstream_host presented a certificate that does not match the pin in
    ${pin_file#"$repo_root"/}
Inspect the certificate with '${0##*/} --show-cert' and, if it is legitimate,
update the pin.  If the chain validates again, sync with --strict-tls."
		fi
		die "fossil sync failed"
	fi
	if grep -q 'Unable to verify SSL cert' "$log"; then
		note "certificate matched the pin in ${pin_file#"$repo_root"/}"
	fi
	grep -E 'Pull done|Clone done|bytes sent' "$log" | tail -2 | sed 's/^/    /'
}

if [ "${show_cert:-0}" = 1 ]; then
	show_cert
	exit 0
fi

note "repository: $repo_root"
sync_fossil

note "exporting fossil history into $mirror"
fossil git export "$mirror" --mainbranch "$UPSTREAM_BRANCH" -R "$fossil_repo" -q

current_branch=$(git symbolic-ref -q --short HEAD || echo '(detached)')
if [ "$current_branch" = "$UPSTREAM_BRANCH" ]; then
	die "'$UPSTREAM_BRANCH' is checked out; switch to your working branch first"
fi

old=$(git rev-parse -q --verify "refs/heads/$UPSTREAM_BRANCH" || true)
git fetch --no-tags "$mirror" \
	"+refs/heads/$UPSTREAM_BRANCH:refs/remotes/fossil/$UPSTREAM_BRANCH" >/dev/null 2>&1
new=$(git rev-parse "refs/remotes/fossil/$UPSTREAM_BRANCH")

if [ -n "$old" ] && [ "$old" != "$new" ] && [ "$force_import" = 0 ]; then
	git merge-base --is-ancestor "$old" "$new" ||
		die "the import is not a fast-forward of '$UPSTREAM_BRANCH'.
The mirror was probably rebuilt from scratch, or upstream history changed.
Re-run with --force-import to replace the branch (your own branches are untouched)."
fi

if [ "$old" = "$new" ]; then
	note "already up to date: $(fossil_rev "$new") ($(git log -1 --format=%ad --date=short "$new"))"
else
	git update-ref "refs/heads/$UPSTREAM_BRANCH" "$new" ${old:+"$old"}
	if [ -n "$old" ]; then
		note "$(git rev-list --count "$old..$new") new upstream check-in(s):"
		git --no-pager log --oneline --no-decorate --reverse "$old..$new" | sed 's/^/    /'
		printf '\n'
		git --no-pager diff --stat "$old" "$new" | sed 's/^/    /'
	else
		note "imported $(git rev-list --count "$new") upstream check-in(s)"
	fi
	note "'$UPSTREAM_BRANCH' is now at $(fossil_rev "$new")"
fi

if [ "$do_merge" = 1 ]; then
	if [ "$current_branch" = '(detached)' ]; then
		die "HEAD is detached; check out a branch to merge into"
	fi
	if git merge-base --is-ancestor "$new" HEAD; then
		note "$current_branch already contains $UPSTREAM_BRANCH; nothing to merge"
		exit 0
	fi
	[ -z "$(git status --porcelain --untracked-files=no)" ] ||
		die "working tree has uncommitted changes; commit or stash them before merging"
	note "merging $UPSTREAM_BRANCH into $current_branch"
	git merge --no-edit "$UPSTREAM_BRANCH" ||
		die "merge stopped with conflicts: resolve them, then 'git commit'"
elif [ "$old" != "$new" ]; then
	note "merge it into $current_branch with: git merge $UPSTREAM_BRANCH"
fi
