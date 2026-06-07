---
title: Topology
sidebar_position: 6
description: Live component, port, and protocol map of the konsonans host.
---

# Konsonans Topology

A map of what runs on the **konsonans** host (Oslo, `91.190.155.197`), the ports
each component listens on, the protocols in use, and how requests are routed.

- **Solid arrows** are confirmed routes (from the HAProxy config and the
  Compose files).
- **Dashed arrows** are *plausible* connections — intended or inferred dataflow
  that is not pinned to a single config line.

```mermaid
flowchart TB
    NET(["Internet"]) -->|"HTTPS 443"| CF{{"Cloudflare proxy<br/>*.ragbaz.xyz · ragbaz.cc"}}
    CF -->|"HTTPS 443 → origin"| HAP

    subgraph konsonans["konsonans · 91.190.155.197"]
        HAP[["HAProxy frontend<br/>:80 / :443 (TLS ragbaz.xyz.pem)"]]

        subgraph web["Web / docs backends"]
            REG[("ragbaz-registry<br/>Docker Registry v2 · :5000")]
            OFFER["offer nginx · :8889<br/>(Atlas build)"]
            DOC["doc nginx · :8890<br/>(Atlas build)"]
            CADDY["caddy1 tenant gateway · :4555"]
            VVITE["vrak Vite · :4444"]
            VAPI["vrak API · :5555"]
            FWK["fwknopd · :8181"]
        end

        subgraph gk["Gatekeeper — secure WP runtime (ragbaz.cc)"]
            GW["rust-gateway<br/>HTTP :8080"]
            WP[("WordPress php-fpm<br/>:9000 · GraphQL + wp-json")]
            SF["storefront (Next.js)<br/>:3000"]
        end

        subgraph mail["Mail stack (mail-* containers)"]
            PFX["Postfix MTA<br/>SMTP 25→2225 · 587→5587 · 465→4465"]
            DOV[("Dovecot<br/>IMAPS :993")]
            DKIM["OpenDKIM"]
            SNAP["SnappyMail webmail<br/>:8888 / :8443"]
        end

        subgraph mg["mailguard / Proton bridge"]
            MUI["mailguard-ui console<br/>HTTP + WS :3000"]
            MBE["mailguard backend<br/>:4000 GraphQL/REST/JMAP/MCP<br/>SMTP proxy :2025"]
            PB[("ProtonMail Bridge<br/>SMTP :1025 · IMAP :1143")]
        end

        DISC["discord-bot<br/>notify :9999"]
    end

    HAP -->|"registry.ragbaz.cc/.xyz"| REG
    HAP -->|"ragbaz.cc + *.ragbaz.cc"| GW
    HAP -->|"app/my/*.ragbaz.xyz tenants"| CADDY
    HAP -->|"vrak /api/"| VAPI
    HAP -->|"vrak.ragbaz.xyz"| VVITE
    HAP -->|"offer.ragbaz.xyz"| OFFER
    HAP -->|"doc.ragbaz.xyz"| DOC
    HAP -->|"UA: fwknop SPA"| FWK
    HAP -->|"SMTP 25/465/587"| PFX

    GW -->|"HTTP :9000 GraphQL"| WP
    GW -->|"HTTP :3000"| SF
    PFX --- DKIM
    PFX -->|"deliver"| DOV
    SNAP -->|"IMAP"| DOV

    MUI -->|"WS /ws/tui"| MBE
    MBE -->|"SMTP :1025 / IMAP :1143"| PB
    PB -.->|"ProtonMail API"| CF

    SF -.->|"GraphQL :9000"| WP
    CADDY -.->|"tenant WP upstreams"| WP
    MBE -.->|"outgoing intercept :2025"| PFX
    PFX -.->|"relay out"| PB
    DISC -.->|"health / mail events"| MBE
    DISC -.->|"app events"| GW
```

## Routing table (HAProxy `konsonans` frontend)

| Host / match | Backend | Target |
|---|---|---|
| `registry.ragbaz.cc` / `registry.ragbaz.xyz` | `ragbaz_registry` | `127.0.0.1:5000` |
| `ragbaz.cc` + `*.ragbaz.cc` | `secure_wp_backend` | `127.0.0.1:8080` (gatekeeper) |
| `app.ragbaz.xyz`, `my.ragbaz.xyz`, `*.ragbaz.xyz` | `app/wp/tenant_backend` | `127.0.0.1:4555` (caddy) |
| `vrak.ragbaz.xyz` + `/api/` | `vrakAPI` | `127.0.0.1:5555` |
| `vrak.ragbaz.xyz` | `vrak_app` | `127.0.0.1:4444` |
| `offer.ragbaz.xyz` | `offer_backend` | `127.0.0.1:8889` |
| `doc.ragbaz.xyz` | `doc_backend` | `127.0.0.1:8890` |
| User-Agent `fwknop` | `fwknop` | `127.0.0.1:8181` |
| SMTP `:25` / `:465` / `:587` | mail frontends | `:2225` / `:4465` / `:5587` |

The wildcard cert `ragbaz.xyz.pem` terminates TLS for every `*.ragbaz.xyz`
subdomain; DNS is Cloudflare-proxied to the konsonans origin.
