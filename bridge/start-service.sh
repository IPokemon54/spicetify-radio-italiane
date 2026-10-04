#!/usr/bin/env bash
set -euo pipefail
bridge_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
pid_file="$bridge_dir/service.pid"
if [[ -f "$pid_file" ]]; then
  old_pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ "$old_pid" =~ ^[0-9]+$ ]] && ps -p "$old_pid" -o command= 2>/dev/null | grep -Fq "$bridge_dir/server.cjs"; then
    kill "$old_pid" 2>/dev/null || true
    sleep 0.4
  fi
fi
nohup "${RADIO_NODE:-node}" "$bridge_dir/server.cjs" >"$bridge_dir/service.log" 2>"$bridge_dir/service-error.log" </dev/null &
