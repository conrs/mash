# This script commits your changes to your branch then overwrites the published branch with them.
# Not sure why we want this. 

set -ex

MESSAGE=${1:-Deploy}
yarn docker:build

git add .
git add --force public
git commit -m "$MESSAGE"
git push

git push origin `git subtree split --prefix public master`:refs/heads/gh-pages --force
