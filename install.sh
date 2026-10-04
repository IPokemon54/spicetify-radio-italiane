#!/usr/bin/env bash
set -euo pipefail

release_url="https://github.com/IPokemon54/spicetify-radio-italiane/releases/latest/download/Radio-Italiane-Windows-v3.zip"
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)"

if [[ ! -f "$script_dir/manifest.json" ]]; then
  command -v curl >/dev/null || { echo "Errore: curl non è installato." >&2; exit 1; }
  command -v unzip >/dev/null || { echo "Errore: unzip non è installato." >&2; exit 1; }
  temp_dir="$(mktemp -d)"
  trap 'rm -rf "$temp_dir"' EXIT
  echo "Download di Radio on Spotify..."
  curl -fL "$release_url" -o "$temp_dir/radio-on-spotify.zip"
  unzip -q "$temp_dir/radio-on-spotify.zip" -d "$temp_dir/release"
  installer="$(find "$temp_dir/release" -name install.sh -type f -print -quit)"
  [[ -n "$installer" ]] || { echo "Errore: install.sh non trovato nella release." >&2; exit 1; }
  bash "$installer"
  exit
fi

command -v spicetify >/dev/null || { echo "Errore: installa prima Spicetify." >&2; exit 1; }
command -v node >/dev/null || { echo "Errore: Node.js 18 o superiore è necessario su Linux/macOS." >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "Errore: FFmpeg è necessario. macOS: brew install ffmpeg; Linux: installalo dal gestore pacchetti." >&2; exit 1; }
node_major="$(node -p 'Number(process.versions.node.split(`.`)[0])')"
(( node_major >= 18 )) || { echo "Errore: serve Node.js 18 o superiore." >&2; exit 1; }

config_path="$(spicetify -c | tail -n 1 | tr -d '\r')"
[[ -f "$config_path" ]] || { echo "Errore: configurazione Spicetify non trovata." >&2; exit 1; }
target="$(dirname "$config_path")/CustomApps/radio-italiane"
mkdir -p "$target"
if [[ "$(cd "$script_dir" && pwd -P)" != "$(cd "$target" && pwd -P)" ]]; then
  cp -R "$script_dir"/. "$target"/
fi
bridge="$target/bridge"
chmod +x "$target/install.sh" "$bridge/start-service.sh"

port="$(node -e 'const s=require("node:net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"
key="$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')"
printf '{"port":%s,"key":"%s"}\n' "$port" "$key" > "$bridge/config.json"
printf 'globalThis.RI_BRIDGE = {"base":"http://127.0.0.1:%s","key":"%s"};\n' "$port" "$key" > "$target/bridge-config.js"

node_path="$(command -v node)"
if [[ "$(uname -s)" == "Darwin" ]]; then
  agent="$HOME/Library/LaunchAgents/io.github.ipokemon54.radio-on-spotify.plist"
  mkdir -p "$(dirname "$agent")"
  xml_escape(){ printf '%s' "$1" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'; }
  xml_node="$(xml_escape "$node_path")"; xml_server="$(xml_escape "$bridge")"
  cat > "$agent" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>io.github.ipokemon54.radio-on-spotify</string>
<key>ProgramArguments</key><array><string>$xml_node</string><string>$xml_server/server.cjs</string></array>
<key>WorkingDirectory</key><string>$xml_server</string>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>$xml_server/service.log</string>
<key>StandardErrorPath</key><string>$xml_server/service-error.log</string>
</dict></plist>
EOF
  launchctl bootout "gui/$UID/io.github.ipokemon54.radio-on-spotify" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/$UID" "$agent"
else
  service_dir="$HOME/.config/systemd/user"; service="$service_dir/radio-on-spotify.service"
  mkdir -p "$service_dir"
  cat > "$service" <<EOF
[Unit]
Description=Radio on Spotify bridge
[Service]
ExecStart=$node_path "$bridge/server.cjs"
WorkingDirectory=$bridge
Restart=on-failure
RestartSec=2
[Install]
WantedBy=default.target
EOF
  if systemctl --user daemon-reload >/dev/null 2>&1 && systemctl --user enable radio-on-spotify.service >/dev/null 2>&1 && systemctl --user restart radio-on-spotify.service >/dev/null 2>&1; then :; else
    mkdir -p "$HOME/.config/autostart"
    cat > "$HOME/.config/autostart/radio-on-spotify.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Radio on Spotify bridge
Exec="$bridge/start-service.sh"
X-GNOME-Autostart-enabled=true
EOF
    RADIO_NODE="$node_path" "$bridge/start-service.sh"
  fi
fi

healthy=false
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$port/health?key=$key" 2>/dev/null | grep -q '"ok":true'; then healthy=true; break; fi
  sleep 0.25
done
if [[ "$healthy" != true ]]; then
  echo "Errore: il bridge non è partito. Controlla $bridge/service-error.log" >&2
  exit 1
fi

spicetify config custom_apps radio-italiane
spicetify apply
echo "Radio on Spotify installata. Bridge verificato e avvio automatico configurato."
