---
title: Debian Updater
sidebar_position: 2
description: Installer script for a Debian-Updater utility.
---

# Debian Updater

Path: `infra/debian-updater`

This directory contains a single `install.sh` script for installing or updating an external Debian-Updater repository under `/opt/Debian-Updater`.

## Scope

The script:

- clones or fetches the upstream repo,
- checks out a stable tag,
- marks the main scripts executable,
- and installs a daily cron job.

## Current interpretation

This is a host-maintenance convenience project, not a standalone product developed in-tree.
