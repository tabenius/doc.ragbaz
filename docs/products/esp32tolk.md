---
title: ESP32Tolk
sidebar_position: 13
description: ESP32-based translation device firmware.
---

# ESP32Tolk

Path: `products/esp32tolk`

`ESP32Tolk` is firmware for an ESP32-based speech translation device.

## Scope

The README describes a pipeline for:

- I2S microphone capture,
- speech-to-text,
- translation,
- text-to-speech,
- playback through DAC or Bluetooth,
- and runtime configuration via a device-hosted web UI.

## Current status

The core STT, translation, and TTS modules are still mocked. The surrounding firmware, settings flow, hardware assumptions, and UI scaffolding are in place.

## Why it matters

This is a real product concept, not just a library demo. Its viability depends on replacing mocked AI stages with one stable production path and validating it on actual hardware.
