# Scout Alpha — exchange pre-listing log

A public, timestamped log of centralised-exchange **coin-config changes**: the
moments an exchange quietly flips deposits or withdrawals on or off for a
token, which routinely happens *before* the listing announcement is published.

I run this watcher for my own trading. The log is public so anyone can check
it rather than take my word for anything.

**No returns are claimed anywhere in this repository.** See
[What this is not](#what-this-is-not).

## The numbers

Counted directly from `data/listing_events.jsonl` — rerun
[`verify.mjs`](verify.mjs) yourself to reproduce every figure below.

<!--STATS-->
| | |
|---|---|
| Events logged | **4,005** |
| Of which pre-listing config flips | **3,013** |
| Distinct tokens seen | **2,035** |
| Period covered | **2026-05-02 → 2026-08-09** (99 days) |
| Average | ~40 events/day |
| Polling interval | **300 s** (5 minutes), per exchange |
| Published with a delay of | **24h** (the live feed is the paid product) |

### Coverage by source

| Source | Events |
|---|---|
| `coin_config.mexc` | 1,232 |
| `coin_config.gate` | 1,030 |
| `coinbase` | 572 |
| `coin_config.kucoin` | 417 |
| `coin_config.binance` | 334 |
| `okx` | 178 |
| `bybit` | 150 |
| `upbit` | 59 |
| `binance` | 27 |
| `bithumb` | 6 |
<!--/STATS-->

The `coin_config.*` sources are the pre-listing watcher (deposit/withdraw state
transitions). The others are announcement feeds, which are *not* pre-listing —
they are logged for context and to make announcement timing checkable.

## What a row looks like

```json
{
  "source": "coin_config.gate",
  "coin": "OGOLD",
  "ts": 1785749424.2709816,
  "payload": {
    "exchange": "gate",
    "coin": "OGOLD",
    "is_pre_listing_signal": true,
    "deposit_enable": true,
    "withdraw_enable": false,
    "previous_deposit_enable": false,
    "previous_withdraw_enable": false,
    "ts": 1785749424.2703507
  }
}
```

`ts` is a Unix timestamp in seconds, recorded at detection time.
`is_pre_listing_signal` is set when deposits open while withdrawals stay
closed — the pattern an exchange typically shows while it is warehousing
supply ahead of a listing.

## How to score it yourself

Don't trust the framing — test it:

1. Pick any `is_pre_listing_signal: true` row and note its `ts`.
2. Find when that exchange publicly announced the listing for that token.
3. Measure the gap.

Do that across a sample and you have a lead-time distribution measured by you,
not asserted by me. If the gap is consistently zero or negative, the signal is
worthless and you should conclude that.

## What this is not

- **Not a track record, and not a claim of profit.** No win rate, no returns,
  no P&L appears here, and none should be inferred. A detection log says a
  config changed at a time — nothing about whether trading it made money.
- **Not financial advice**, and not a recommendation to buy or sell anything.
- **Not exhaustive.** It covers the exchanges listed above, at a 5-minute
  resolution. Anything between polls is missed, and exchanges change their
  endpoints without notice.
- **Not deduplicated or cleaned for you.** It is the raw log, on purpose.

## Why it's published

I sell a live version of this feed. Publishing the history is the only honest
way to let someone judge it before paying: the git history is timestamped by a
third party, so these entries can't be quietly backdated or edited after the
fact.

Contact: seekerscoutapp@gmail.com
