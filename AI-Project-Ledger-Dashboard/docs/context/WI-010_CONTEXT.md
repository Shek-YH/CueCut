# Context Packet｜WI-010

**Role:** R02 Backend Ledger Store fix  
**Work Item:** `WI-010` — Activity recent-events contract  
**Golden Path:** GP-04/GP-05.

R06 QA found `LedgerStore.recentEvents` truncates to 20 while PRD §14/§41 requires the latest 200 events by default. Read the existing store, WI-007 QA test and schema contract. Add a failing regression test first, change only the minimum slice to return the last 200 valid events (or fewer when the ledger has fewer), preserve event order and LKG behavior, then run focused/full/lint/build. Do not change web, migration, Skill or `.ai-ledger`; return READY_FOR_REVIEW/BLOCKED, never VERIFIED/ACCEPTED.
