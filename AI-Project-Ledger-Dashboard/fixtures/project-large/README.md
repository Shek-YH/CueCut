# WI-007 Large Project Fixture

This deterministic fixture is described by `fixture-manifest.json` and is materialized into an isolated temporary project by `tests/qa/wi-007-qa.test.ts`.

It contains 1,000 valid leaf tasks across 10 phases and 10,000 valid JSONL events. The test generates the seven allowlisted `.ai-ledger` files locally for each run so the repository does not carry a multi-megabyte generated payload, while the loader and watcher still process the full target dataset.
