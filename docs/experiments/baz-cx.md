---
sidebar_label: BAZ.CX exchange connector
description: BAZ.CX — Python exchange connector with Binance, Kraken, and CCXT relay for real-time market data.
---

# BAZ.CX — exchange connector

**Location:** `/data/src/experiments/BAZ.CX/`

## Overview

BAZ.CX is the real-time cryptocurrency exchange connector for the BAZ platform. It connects to major exchanges via WebSocket and REST, normalises market data into a common schema, and streams it to BAZ.Palantir over WebSocket.

```
Binance  ──WS──┐
Kraken   ──WS──┤
Coinbase ──REST─┤──▶ BAZ.CX ──WS──▶ BAZ.Palantir
Bybit    ──REST─┤              (:8000 → :8080)
Bitfinex ──REST─┘
```

## Stack

| Layer | Library | Purpose |
|-------|---------|---------|
| HTTP/WS server | FastAPI + uvicorn | REST endpoints + WebSocket push |
| Exchange WS | `python-binance`, `kraken-ws` | Real-time exchange feeds |
| Exchange REST | [CCXT](https://github.com/ccxt/ccxt) | Unified REST polling relay |
| Async | asyncio | Background per-stream tasks |
| Testing | pytest | 8 tests against live exchange APIs |

## Streams

BAZ.CX pre-warms **20 streams** across 5 exchanges:

| Exchange | Connection | Streams |
|----------|-----------|---------|
| Binance | WebSocket | `aggTrade` (BTC/USDT, ETH/USDT), `bookTicker` (BTC/USDT), `kline_1m` (BTC/USDT) |
| Kraken | WebSocket | `ticker` (BTC/USD, ETH/USD), `OHLC-1` (BTC/USD) |
| Coinbase | CCXT REST poll | OHLC (BTC/USD, ETH/USD) — 1m interval |
| Bybit | CCXT REST poll | OHLC (BTC/USDT, ETH/USDT) — 1m interval |
| Bitfinex | CCXT REST poll | OHLC (BTC/USD, ETH/USD) — 1m interval |

No API keys required — all data comes from free public endpoints.

## Data schema

All streams normalise to a common schema before forwarding:

```python
@dataclass
class Tick:
    exchange: str
    symbol: str
    price: float
    volume: float
    timestamp: int
    bid: float | None = None
    ask: float | None = None

@dataclass
class Candle:
    exchange: str
    symbol: str
    timeframe: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    timestamp: int
```

## Subscription API

BAZ.Palantir controls which symbols and stream types to receive:

```
WS command:  {"cmd": "subscribe",   "symbol": "BTC/USDT", "kinds": ["tick", "candle"]}
WS command:  {"cmd": "unsubscribe", "symbol": "ETH/USDT", "kinds": ["tick"]}
WS event:    {"type": "tick",   "exchange": "binance", "symbol": "BTC/USDT", ...}
WS event:    {"type": "candle", "exchange": "binance", "symbol": "BTC/USDT", ...}
```

REST fallback for snapshot data:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/streams` | GET | List active streams |
| `/subscribe` | POST | Subscribe to a stream |
| `/unsubscribe` | POST | Unsubscribe from a stream |

## Connector architecture

```
main.py
  ├── BinanceWS(exchange, symbols, kinds)
  │     asyncio tasks per (symbol, kind) via python-binance websocket
  ├── KrakenWS(exchange, symbols, kinds)
  │     asyncio tasks via kraken-ws library
  └── CCXTPoller(exchange, symbols, kinds)
        Polling loop via CCXT fetch_ohlcv every 60s
```

Each connector runs in its own asyncio task. FastAPI lifespan events start/stop all background tasks. Exceptions in one stream do not affect others.

## Deployment

```bash
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Docker:
```bash
docker build -t baz-cx .
docker run -p 8000:8000 baz-cx
```

## Testing

8 tests covering all three connector types, run against live exchange APIs:

```bash
pytest tests/ -v
```

Tests verify:
- Binance WS connection and tick receipt
- Kraken WS connection and tick/OHLC receipt
- CCXT poller fetches valid OHLC data from Coinbase, Bybit, Bitfinex
- Connection error handling and reconnection
- Data schema compliance

## WIT contract

BAZ.CX ships with WIT type definitions for the platform's data types:

```
src/wit/hft_types.py  — Python mapping of WIT records (tick, candle, position, receipt)
```

These mirror the WIT world defined by the `glither.hft` compiler (`package glither:hft`) so that BAZ.CX can act as the WASM host runtime when strategies are deployed.

See [BAZ architecture](./baz-architecture) for the full platform data-flow and the [BAZ.Palantir](../products/baz-palantir) product page for the orchestration server that BAZ.CX feeds into.
