---
title: "DetCordon — Containment Assurance"
sidebar_position: 11.1
description: "Reviewer checklist mapping DetCordon's non-negotiable containment rules to implementation evidence, generated-artifact checks, residual risks, and non-goals."
---

# DetCordon — Containment Assurance

This document is the reviewer checklist for DetCordon's containment claim. It
maps the non-negotiable rules in `AGENTS.md` and `doc/architecture.md` to
implementation evidence, generated-artifact checks, residual risks, and
explicit non-goals. It is written for buyer diligence and operator review; it
does not contain secrets, sample bodies, or live infrastructure values.

See the [DetCordon product page](/products/detcordon) for architecture and
commercial position, or [request a pilot](mailto:sales@ragbaz.cc?subject=DetCordon%20pilot%20request).

## Summary Claim

DetCordon is designed to let hostile web malware succeed inside a disposable
sandbox while keeping evidence flow one-way:

- Hostile HTTP traffic reaches the victim through a detection-only tap.
- The victim writes only to sandbox-scoped ephemeral storage.
- Events leave over UDP; sample bodies leave over a separate write-only TCP
  upload path.
- The sink stores samples by sha256, encrypted to an analyst public key, with
  no decryption key on the sink host.
- The sink host is assumed to be a separate machine from the sandbox host.

The current automated checks prove important generated-artifact invariants for
Docker and Firecracker deployments. They do not prove kernel isolation, network
device correctness on a live host, or operational discipline after manual
operator changes.

## Assets and Trust Boundaries

- Sandbox host: protected from hostile web code in the victim by Docker
  internal networking, tmpfs writes, AppArmor, nftables default-drop, and
  Firecracker guest isolation where used.
- Sink host: protected from direct query or control by sandbox malware through
  the separate-host requirement, one-way UDP/TCP receiver roles, and generated
  checks that keep sink services out of sandbox artifacts.
- Sample bodies: protected from disclosure or accidental execution through age
  encryption, content-addressed filenames, mode `0400`, no file extension, and
  an analyst-only private key.
- Event telemetry: protected from silent loss or tampering by sink-side append
  logs. UDP loss is tolerated, but demo/evidence work should assert expected
  events.
- Dashboard: protected from remote exposure by a localhost default. Remote
  access requires an explicit tunnel or authenticated reverse proxy.

## Evidence Map

- Victim bind-mounts nothing host-side.
  Evidence: Docker victim writes to a constrained tmpfs; Firecracker guest
  writes stay inside the guest/rootfs runtime path.
  Check: `docker_generated_artifacts_preserve_containment_invariants` asserts
  no victim `volumes:` block and a tmpfs-only victim write path.
- Sandbox egress is default-drop.
  Evidence: generated Docker hardening and Firecracker nftables allow only
  sink UDP, sink TCP, and DNS.
  Check: Docker and Firecracker generated-artifact tests assert `policy drop;`
  plus explicit UDP/TCP/DNS allows.
- WAF never blocks.
  Evidence: shipped ModSecurity config keeps `SecRuleEngine DetectionOnly`;
  docs require observation over prevention.
  Check: `shipped_modsecurity_config_is_detection_only` asserts DetectionOnly
  and rejects `SecRuleEngine On`.
- Samples leave write-only.
  Evidence: `waf` receives only `SINK_ADDR` for UDP events; `waf-extractor`
  receives only `SINK_TCP_ADDR` for sample upload.
  Check: Docker and Firecracker tests assert the WAF lacks `SINK_TCP_ADDR` and
  the extractor does not leak sample bytes over the event channel.
- Sink stores encrypted sha256 files.
  Evidence: `waf-sink` hashes the body itself, encrypts with age, writes
  `samples/<sha256>`, and chmods `0400`.
  Check: `waf-sink` tests cover encrypted content-addressed storage, non-raw
  body storage, manifest entry, dedup, and Unix mode `0400`.
- Sink guard is expected with sink.
  Evidence: deploy generator emits `waf-sink.service`,
  `waf-sink-guard.service`, and a sample allowlist under `dist/sink/`.
  Check: Docker and Firecracker tests assert sink units are emitted under sink
  artifacts and not under sandbox artifacts.
- eBPF host-pid mode is opt-in.
  Evidence: standing docs require cgroup-scoped observation by default;
  host-pid mode needs explicit operator action.
  Check: documented rule in `AGENTS.md`; not yet covered by a dedicated
  generated-artifact assertion.
- Time-boxed execution.
  Evidence: supervisor and generated config carry TTL defaults for
  VM/container lifecycle.
  Check: existing supervisor/runtime tests cover lifecycle behavior;
  containment pack treats this as operational evidence, not a complete proof.
- No sample body over UDP.
  Evidence: UDP is event telemetry only; TCP framing carries sample bytes.
  Check: generated-artifact tests assert channel separation; `waf-sink` TCP
  framing tests cover size bounds and malformed input rejection.
- Sink host is a different machine.
  Evidence: architecture and README require separate sandbox and sink hosts.
  Check: documented assumption only; this cannot be proven from generated
  files without environment inventory.

## Generated-Artifact Assurance

The first machine-checkable containment baseline lives in `waf-deploy` tests:

- `crates/waf-deploy/src/backend/docker.rs` checks Docker topology,
  tmpfs-only victim writes, default-drop egress, channel separation,
  AppArmor guardrails, and the generated sink allowlist shape.
- `crates/waf-deploy/src/backend/firecracker.rs` checks Firecracker topology,
  sink-service separation, nftables default-drop egress, WAF/extractor channel
  separation, guest runtime shape, and generated preflight coverage.
- `config/modsecurity.conf` is covered by a test that keeps ModSecurity in
  DetectionOnly mode.

These tests are the regression tripwire for generated deployments. If an
operator edits generated files by hand after `waf-deploy` emits them, the
operator owns a separate review step.

## Reviewer Checklist

Use this checklist before a buyer demo, pilot install, or handoff:

1. Confirm the sandbox host and sink host are different machines.
2. Regenerate deploy artifacts from the current commit, not from stale `dist/`
   output.
3. Run `cargo test -p waf-deploy` and `cargo test -p waf-sink`.
4. Confirm `config/modsecurity.conf` contains `SecRuleEngine DetectionOnly`.
5. Confirm generated sandbox nftables or hardening output has default-drop
   egress with only sink UDP, sink TCP, and DNS allowances.
6. Confirm generated sandbox artifacts do not include `waf-sink` or
   `waf-sink-guard` services.
7. Confirm the configured age recipient is a public key only; the private key
   must stay on the analyst workstation.
8. Confirm the dashboard binds to localhost or is reachable only through an
   authenticated tunnel/proxy.
9. Confirm sample evidence shared in demos is limited to sha256 digest,
   encrypted file path, manifest metadata, and redacted operator paths; never
   share sample bodies.
10. For Firecracker deployments, run the generated
    `dist/sandbox/firecracker/scripts/preflight-host.sh` on the sandbox host
    before launch.

## Residual Risks

- Separate-machine enforcement is an operational assumption. DetCordon can
  document and generate separate artifact trees, but it cannot prove physical
  or VM-host separation from the repository alone.
- The dashboard has no built-in remote authentication. It is localhost-safe by
  default; remote access needs an explicit tunnel or authenticated reverse
  proxy.
- UDP event telemetry is lossy by design. Evidence-grade demo work should
  assert expected events and sample artifacts, but production telemetry should
  still be treated as best effort unless a durable queue is added.
- The sink host is store-only with age encryption, but compromise of the sink
  can still delete or suppress future evidence unless separate archival export
  or monitoring is configured.
- Generated artifact checks do not replace live host inspection. Kernel
  version, nftables loading, AppArmor enforcement, Firecracker availability,
  and sink guard runtime state remain host-level preflight concerns.

## Non-Goals

- DetCordon is not a blocking WAF. Switching ModSecurity to blocking mode would
  weaken the malware-observation goal.
- DetCordon is not a malware decryption or reverse-engineering platform. The
  sink never receives the analyst private key.
- DetCordon is not a remote sandbox control plane yet. The dashboard is
  read-oriented and should not become a sandbox control surface without a new
  auth and audit design.
- DetCordon is not proof that arbitrary third-party payloads are safe. It is a
  containment-first observation environment with explicit operational
  assumptions.

## Related Work

- [DetCordon product page](/products/detcordon) describes the two-host
  topology and generated containment checks in full architectural context.
- [Buyer demo runbook](/products/detcordon/buyer-demo-runbook) is the
  repeatable, synthetic-only demo path that exercises these guarantees.
- `AGENTS.md` (repository-internal) holds the non-negotiable containment rules
  that this document maps to evidence.
