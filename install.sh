#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

link() {
  local source="$1" destination="$2"
  if [[ -d "$destination" && ! -L "$destination" ]]; then
    printf 'Cannot replace existing directory: %s\n' "$destination" >&2
    return 1
  fi
  ln -sfn -- "$source" "$destination"
}

mkdir -p -- "$HOME/.agents" "$HOME/.codex" "$HOME/.claude"

shopt -s dotglob nullglob
for source in "$repo_dir"/*; do
  name="${source##*/}"
  [[ "$name" == .git ]] && continue
  link "$source" "$HOME/.agents/$name"
  link "$source" "$HOME/.codex/$name"
  link "$source" "$HOME/.claude/$name"
done

printf 'Linked %s into %s/.agents, .codex, and .claude.\n' "$repo_dir" "$HOME"
