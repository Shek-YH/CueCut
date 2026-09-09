# CueCut Director Phase 3 Implementation Report

## Completed expansion

- Added UI diagnostics in `src/app/App.tsx` for `usedFallback`, warnings, and SelectionTrace.
- Fallback is displayed as `本地回退` and explicitly labeled `非 Director 成功`.
- SelectionTrace UI shows VisualUnit, semanticIntent, selected candidate, retrieved candidates, and data/duration contract state.
- The UI renders no trace panel when the API returns no trace.
- App generation tests cover both `usedFallback=false` success and visible fallback behavior.
- Builder routing is recorded as `gpt-5.6-luna` in `.ai-ledger/extensions/model-routing.json`.

## Real regression

The real `ComfyUI_00001_qguot_1787042165.mp4` regression completed one local audio extraction, one ASR call, and one Director call with `usedFallback=false` after deterministic local repairs. The generated Composition and SRT remain local ignored artifacts.

## Scope discipline

The Luna Builder only changed App/UI test scope. Frozen Director contracts were not intentionally redesigned. No push was performed.
