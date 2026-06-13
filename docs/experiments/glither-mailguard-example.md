---
sidebar_label: Example — mailguard.glith
description: The glither.mail (mailguard) worked example ruleset referenced by the compiler spec.
---

# Example — `mailguard.glith`

The `glither.mail` (mailguard) ruleset used as the worked example and first
conformance slice throughout the
[Glither WASM/WIT compiler spec](./glither-wasm-wit-compiler-spec.md). It is the
degenerate, flat-verdict dialect (`fold first-match`, no ladders): a message
settles into `delivered`/`dropped` or rests in `quarantine`.

Source: `docs/examples/mailguard.glith` in the glither repo.

```glith
#pragma dialect glither.mail ; fold first-match

/// # Mailguard policy — glither.mail
/// Flat-verdict dialect (spec §7, §11.3): a message settles into `delivered`
/// or `dropped`, or rests in `quarantine : Pending<{delivered, dropped}>`
/// awaiting an admin release or its deadline. `fold first-match` ⇒ the first
/// matching rule decides; there is no fan-out (`for`) in this dialect.

rule drop_dmarc_reject =
  msg | from.domain != dkim.domain          // ⟨select⟩
      | not sender.allowlisted               // ⟨select⟩
      | dmarc.policy == reject               // ⟨select⟩
  => into dropped (reason = dmarc_reject)

rule quarantine_spoof =
  msg | from.domain != dkim.domain          // ⟨select⟩
      | not sender.allowlisted               // ⟨select⟩
  => hold into quarantine                    // suspended: Pending<{delivered, dropped}>
       on    admin.release   into delivered
       after 72h             into dropped (reason = quarantine_timeout)

rule quarantine_executable =
  msg | attachment.ext ~ /^(?:exe|scr|js|vbs|bat)$/   // ⟨select⟩
      | not sender.allowlisted                          // ⟨select⟩
  => hold into quarantine
       on    admin.release   into delivered
       after 24h             into dropped (reason = unscanned_executable)

rule tag_external =
  msg | from.org != recipient.org           // ⟨select⟩
  => tag (label = "EXTERNAL"),
     route to inbox,
     into delivered

rule route_newsletters =
  msg | list.unsubscribe                     // ⟨select⟩
      | sender.allowlisted                    // ⟨select⟩
  => route to newsletters,
     into delivered

rule deliver_allowlisted =
  msg | sender.allowlisted                   // ⟨select⟩
  => route to inbox,
     into delivered
```
