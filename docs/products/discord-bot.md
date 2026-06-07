---
title: Discord Bot
sidebar_position: 12
description: Operational Discord bot and notification bridge.
---

# Discord Bot

Path: `products/discord-bot`

`discord-bot` is a small TypeScript operational bot rather than a broad consumer application.

## Scope

The repository includes:

- slash commands such as `ping`, `status`, and `graphql`,
- DM-based pairing and access control,
- a notification server that receives events and posts embeds to Discord,
- container and systemd deployment files,
- and environment-based configuration.

## Current role

The bot is best understood as an operator interface for the rest of the workspace, especially mail and application health events.

## Key files

- `src/bot.ts`
- `src/notify.ts`
- `src/commands/`
- `compose.yaml`
- `systemd/abbot.service`
