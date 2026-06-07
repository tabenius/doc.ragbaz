---
title: Migrate
sidebar_position: 4
description: Backup, restore, and reinstall helper for host migration.
---

# Migrate

Path: `infra/migrate`

`migrate` is a host migration utility centered on `migrate.py`.

## Scope

The script and supporting files indicate a workflow for:

- collecting package and config state,
- backing up selected directories,
- streaming archives to a remote host,
- generating cloud-init seed data,
- and restoring data after reinstall.

## Notable files

- `migrate.py`
- `backup_list.txt`
- `user-data`
- `meta-data`
- `seed.iso`
- `setup.sh`

## Current interpretation

This is operationally significant infrastructure for rebuilding or moving a host while preserving key state.
