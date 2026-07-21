---
title: "DetCordon — Buyer Demo Runbook"
sidebar_position: 11.2
description: "The repeatable, synthetic-only DetCordon buyer-demo path: one command, expected output, failure triage, and a screen-recording checklist."
---

# DetCordon — Buyer Demo Runbook

This runbook is the repeatable DetCordon buyer-demo path. It uses synthetic
payloads only. Do not run live malware during this demo.

See the [DetCordon product page](/products/detcordon) for architecture, or
[request a pilot](mailto:sales@ragbaz.cc?subject=DetCordon%20pilot%20request)
to run this against real traffic on a sandbox/sink host pair.

## Containment Assumptions

- The demo is local and synthetic; it does not replace the separate
  sandbox-host and sink-host production assumption.
- ModSecurity remains `DetectionOnly`; the point is observation, not blocking.
- Sample bodies are never printed, copied into the transcript, or decrypted.
- Evidence handoff uses encrypted `samples/<sha256>` artifacts plus digests.
- Remote dashboard access is out of scope unless an authenticated tunnel or
  proxy is configured separately.

See [containment assurance](/products/detcordon/containment-assurance) for the
full reviewer checklist these assumptions are drawn from.

## Prerequisites

- Rust workspace builds on the host.
- `python3`, `bash`, and `curl` are available.
- Local ports `55140`, `55141`, `59080`, and `8080` are free.
- Run from the repository root.

## One-Command Demo

```bash
./scripts/buyer-demo.sh
```

Expected output includes:

```text
sink received 2 event(s)
event fields verified
evidence verified: 2 event(s), samples/<sha256>
artifacts preserved at /tmp/detcordon-e2e-...
events artifact: /tmp/detcordon-e2e-.../sink/events.jsonl
sample manifest: /tmp/detcordon-e2e-.../sink/samples.jsonl
sample artifact: /tmp/detcordon-e2e-.../sink/samples/<sha256>
ALL CHECKS PASSED
```

The command starts local sink, victim, and WAF tap processes; sends synthetic
HTTP traffic; uploads one synthetic sample frame; verifies evidence; tears down
the processes; and preserves the evidence directory.

## Recording Helper

```bash
./scripts/record-buyer-demo.sh
```

The recording helper writes:

- `dist/demo-recordings/<timestamp>/buyer-demo.log`
- `dist/demo-recordings/<timestamp>/evidence-export.log`
- `dist/demo-recordings/<timestamp>/README.txt`
- `dist/demo-recordings/<timestamp>/evidence/<bundle-id>/manifest.json`
- `dist/demo-recordings/<timestamp>/evidence/<bundle-id>/checksums.txt`

It runs `scripts/buyer-demo.sh`, parses the preserved sink directory, then runs
`scripts/export-evidence-bundle.py` to produce the handoff bundle.

## Manual Export

If you already have a preserved sink directory from `buyer-demo.sh`, export it:

```bash
./scripts/export-evidence-bundle.py \
  --sink-dir /tmp/detcordon-e2e-.../sink \
  --out-dir dist/evidence \
  --source-id e2e-test \
  --sandbox-id buyer-demo-synthetic
```

Expected output:

```text
bundle_path=dist/evidence/detcordon-...
manifest_sha256=<64 hex chars>
```

## Failure Triage

- `waf-sink failed to start`: check that ports `55140` and `55141` are free.
- `victim failed to start`: check that port `59080` is free and `python3`
  exists.
- `waf tap failed to start`: check that port `8080` is free and release
  binaries are buildable.
- `expected >=2 events`: inspect the preserved `waf.log`, `sink.log`, and
  `events.jsonl`; the WAF may not have reached the sink.
- `sample artifact is not age-encrypted`: treat as a containment regression;
  do not use the run for buyer evidence.
- `sample artifact contains raw sample body`: stop and investigate before
  sharing any artifacts.

## Screen-Recording Checklist

1. Start on the repo root and show `git log --oneline -3`.
2. State that the run uses synthetic payloads only.
3. State the containment assumptions above before running commands.
4. Run `./scripts/record-buyer-demo.sh`.
5. Highlight `ALL CHECKS PASSED`, `bundle_path=...`, and
   `manifest_sha256=...`.
6. Show `manifest.json` top-level fields without opening encrypted samples.
7. Do not display sample bodies, private keys, `.env` files, or host secrets.

## Teardown

`buyer-demo.sh` tears down local processes automatically. The preserved
`/tmp/detcordon-e2e-*` sink directory and `dist/demo-recordings/*` transcript
directories are review artifacts; delete them when no longer needed.
