#!/usr/bin/env bash
# Moves an issue on the MiAtlas67 board (GitHub Project #1 of rggentil). Needs gh with the "project" scope.
# Usage: bash scripts/board.sh <issue-number> <Backlog|Ready|In progress|In review|Done>
set -euo pipefail
declare -A OPT=([Backlog]=159c531a [Ready]=a10b90c8 ["In progress"]=36e8ee4b ["In review"]=fe8d30c0 [Done]=b288131e)
id=$(gh project item-list 1 --owner rggentil --limit 200 --format json --jq ".items[] | select(.content.number==$1) | .id")
gh project item-edit --id "$id" --project-id PVT_kwHOAf1-BM4Br-D0 --field-id PVTSSF_lAHOAf1-BM4Br-D0zhqOR3w \
  --single-select-option-id "${OPT[$2]}" > /dev/null
echo "#$1 -> $2"
