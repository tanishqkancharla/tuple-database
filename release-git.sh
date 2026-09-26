#!/usr/bin/env bash
# Build the package and commit the output to the `release` branch, whose root is
# installable directly from GitHub:
#   "tuple-database": "github:tanishqkancharla/tuple-database#<build-commit>"
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"

if [ -n "$(git status --porcelain)" ]; then
	echo "Working tree must be clean so the build matches a commit." >&2
	exit 1
fi
source_commit="$(git rev-parse HEAD)"

rm -rf build
npm run build
cp README.md build/
node -e '
const pkg = require("./package.json")
delete pkg.scripts
delete pkg.devDependencies
require("fs").writeFileSync("build/package.json", JSON.stringify(pkg, null, 2) + "\n")
'
find build -name "*.test.*" -delete
rm -rf build/test build/tools

worktree="$(mktemp -d)"
trap 'git worktree remove --force "$worktree"' EXIT
if git show-ref --verify --quiet refs/heads/release; then
	git worktree add "$worktree" release
else
	git worktree add --detach "$worktree"
	git -C "$worktree" checkout --orphan release
fi
git -C "$worktree" rm -rf --quiet . 2>/dev/null || true
cp -R build/. "$worktree"/
git -C "$worktree" add -A
git -C "$worktree" commit --quiet -m "Build $source_commit"
echo "release branch: $(git rev-parse refs/heads/release)"
