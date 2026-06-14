#!/usr/bin/env bash
set -euo pipefail
cd /data/src/doc.ragbaz.cc
echo "[1/4] npm ci";    npm ci
echo "[2/4] make build"; make -C deploy build
echo "[3/4] make deploy"; make -C deploy deploy
echo "[4/4] verify";     docker ps --filter name=doc-ragbaz-cc --format '{{.Names}} {{.Status}} {{.Ports}}'
sleep 2; echo -n "healthz: "; curl -s localhost:8890/healthz || echo "(no response)"
echo "DEPLOY-DONE"
