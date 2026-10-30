# This script commits your changes to your branch then overwrites the published branch with them.
# public/js is gitignored; the force-add puts the fresh bundle in the commit gh-pages is split from.

set -ex

MESSAGE=${1:-Deploy}
npm run build

git add .
git add --force public
git commit -m "$MESSAGE"
git push

git push origin `git subtree split --prefix public master`:refs/heads/gh-pages --force
