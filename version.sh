#!/bin/bash
# scripts/version-up.sh

VERSION=$1
CLEAN_VERSION=${VERSION#v}

if [ -z "$VERSION" ]; then
  echo "버전을 입력해주세요: npm run dist v1.0.1"
  exit 1
fi

# package.json 버전 업데이트
jq --arg v "$CLEAN_VERSION" '.version=$v' package.json > package.tmp.json && mv package.tmp.json package.json

# CHANGELOG.md 파일 업데이트
conventional-changelog -p angular -i CHANGELOG.md -s

# Git 작업
git add package.json CHANGELOG.md
git commit -m "chore: bump version to $CLEAN_VERSION and update changelog"
git push origin main
git tag "v$CLEAN_VERSION"
git push origin "v$CLEAN_VERSION"

echo "✅ 버전 $VERSION 릴리즈가 완료되었습니다!"
