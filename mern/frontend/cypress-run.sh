#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
rm -f vite-output.log

# Kill any existing vite/node processes on ports 5173-5180
for port in 5173 5174 5175 5176 5177 5178 5179 5180; do
  lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

# Start vite and allow it to choose an open port if 5173 is busy
vite --host 127.0.0.1 --port 5173 2>&1 | tee vite-output.log &
VITE_PID=$!

ACTUAL_PORT=5173
for i in {1..30}; do
  if grep -q '127\.0\.0\.1:[0-9]\+' vite-output.log; then
    ACTUAL_PORT=$(grep -oP '127\.0\.0\.1:\K\d+' vite-output.log | head -1)
    break
  fi
  sleep 1
done

echo "Vite is running on port $ACTUAL_PORT"

# Wait until the server is ready
for i in {1..30}; do
  if curl -sSf "http://127.0.0.1:$ACTUAL_PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

CYPRESS_BASE_URL="http://127.0.0.1:$ACTUAL_PORT" npx cypress run

kill "$VITE_PID" 2>/dev/null || true
