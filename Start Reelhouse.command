#!/bin/bash
# Double-click to open Reelhouse on a Mac.
cd "$(dirname "$0")" || exit 1
echo ""
echo " ====================================="
echo "   REELHOUSE - opening the studio..."
echo " ====================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "!! Node.js is not installed."
  echo "!! Get the LTS version from https://nodejs.org , install it, then double-click this file again."
  open https://nodejs.org
  read -r -p "Press Enter to close."
  exit 1
fi

NO_OLLAMA=0
if ! command -v ollama >/dev/null 2>&1; then
  echo "!! Ollama is not installed. Stories will use the built-in demo writer for now."
  echo "!! For free AI stories, install it from https://ollama.com and run this again."
  NO_OLLAMA=1
fi

PYOK=0
command -v python3 >/dev/null 2>&1 && PYOK=1
if [ "$PYOK" = "0" ]; then
  echo "!! Python 3 is not installed, so videos will have no voices for now."
  echo "!! Get it from https://www.python.org"
fi

[ -f .env.local ] || cp .env.example .env.local

if [ ! -d node_modules ]; then
  echo "Installing the studio. The first time takes a few minutes..."
  npm install || { echo "!! Installing failed. Check your internet and try again."; read -r; exit 1; }
fi

if [ "$PYOK" = "1" ] && [ ! -f voices/en_US-lessac-medium.onnx ]; then
  echo "Downloading the voices..."
  npm run setup:voice
fi

if [ "$NO_OLLAMA" = "0" ]; then
  if ! ollama list >/dev/null 2>&1; then
    echo "Starting Ollama..."
    (open -a Ollama 2>/dev/null || nohup ollama serve >/dev/null 2>&1 &)
    sleep 5
  fi
  if ! ollama list 2>/dev/null | grep -qi "qwen2.5:7b"; then
    echo "Downloading the story AI, about 4.7 GB. This happens once and can take a while..."
    ollama pull qwen2.5:7b
  fi
fi

echo "Getting the studio ready..."
npm run build || { echo "!! The build failed. Scroll up to see why."; read -r; exit 1; }

echo ""
echo " The studio is open at http://localhost:3000"
echo " Keep this window open while autopilot is on. Close it to stop Reelhouse."
echo ""
(sleep 4 && open http://localhost:3000) &
npm run start
