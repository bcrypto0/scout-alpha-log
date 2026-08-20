# Scout Alpha — exchange pre-listing log

A public, timestamped log of centralised-exchange **coin-config changes**: the
moments an exchange quietly flips deposits or withdrawals on or off for a
token. An exchange has to switch deposits on before it can run a market, so
these changes are the earliest listing-related signal its public API exposes.
How far ahead of the announcement they land is not something this repository
claims — it is what the timestamps are here to let you measure.

I built this watcher for my own trading. The log is public so anyone can check
it rather than take my word for anything.

**No returns are claimed anywhere in this repository.** See
[What this is not](#what-this-is-not).

## The numbers

Counted directly from `data/listing_events.jsonl` — rerun
[`verify.mjs`](verify.mjs) yourself to reproduce every figure below.

<!--STATS-->
| | |
|---|---|
| Events logged | **5,040** |
| Of which pre-listing config flips | **3,990** |
| Distinct tokens seen | **2,161** |
| Period covered | **2026-05-02 → 2026-08-19** (109 days) |
| Average | ~46 events/day |
| Polling interval | **300 s** (5 minutes), per exchange |
| Published with a delay of | **24h** (the live feed is the paid product) |

### Coverage by source

| Source | Events |
|---|---|
| `coin_config.gate` | 1,818 |
| `coin_config.mexc` | 1,232 |
| `coinbase` | 572 |
| `coin_config.binance` | 487 |
| `coin_config.kucoin` | 453 |
| `okx` | 202 |
| `bybit` | 176 |
| `upbit` | 65 |
| `binance` | 28 |
| `bithumb` | 7 |
<!--/STATS-->

The `coin_config.*` sources are the pre-listing watcher (deposit/withdraw state
transitions). The others are announcement feeds, which are *not* pre-listing —
they are logged for context and to make announcement timing checkable.

## What a row looks like

```json
{
  "source": "coin_config.kucoin",
  "coin": "MAN",
  "ts": 1786251388.229926,
  "payload": {
    "exchange": "kucoin",
    "coin": "MAN",
    "is_pre_listing_signal": true,
    "deposit_enable": true,
    "withdraw_enable": true,
    "previous_deposit_enable": false,
    "previous_withdraw_enable": false,
    "ts": 1786251388.2289348
  }
}
```

`ts` is a Unix timestamp in seconds, recorded at detection time.

`is_pre_listing_signal` is set on exactly one transition: an exchange switching
a coin's deposits from off to on — `previous_deposit_enable: false` →
`deposit_enable: true`. **That transition alone is the test.** The withdrawal
flags are recorded in every row for context and are *not* part of it. In this
log <!--WOPEN-->**3,734 of 3,990 flagged rows (94%) have withdrawals open**<!--/WOPEN-->,
so do not read the flag as "deposits on, withdrawals shut" — the sample row
above is the typical case, not the exception.

The reasoning is mechanical rather than clever: an exchange has to accept
deposits before it can run a market, so the deposit switch is the earliest
config change a listing forces. It is not a listing announcement and it is not
exclusive to listings — ending a maintenance window produces the identical
flag. Whether the lead is worth anything is what the timestamps are here for.

> An earlier version of this README described the flag as "deposits open while
> withdrawals stay closed". That was wrong, and 92% of the rows published here
> contradicted it. Corrected 2026-08-11.

## How to score it yourself

Don't trust the framing — test it:

1. Pick any `is_pre_listing_signal: true` row and note its `ts`.
2. Find when that exchange publicly announced the listing for that token.
3. Measure the gap.

Do that across a sample and you have a lead-time distribution measured by you,
not asserted by me. If the gap is consistently zero or negative, the signal is
worthless and you should conclude that.

**Step 2 needs data from outside this repository, and that is a real
limitation.** The `coin_config.*` sources here (mexc, gate, kucoin, binance)
barely overlap with the announcement sources here (coinbase, okx, bybit, upbit,
bithumb), so joining the two inside this file matches almost nothing — across
thousands of flags I found exactly one usable pair, and that one is a
normalisation artifact. Take the coin and timestamp from a flagged row to that exchange's own
announcements page instead. Broadening the announcement coverage to match the
config coverage is the obvious next improvement to this log.

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
