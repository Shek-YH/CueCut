# CueCut Director Phase 1 — Selected Architecture

## Selected path

```text
Timestamped SRT
  ↓
Global/seed semantic planner
  ↓
VisualUnit[]
  ↓
Per-unit capability-aware retrieval
  ↓
DirectorInput v2 { units, candidateBundles, compact capabilities, visualContext }
  ↓
ONE Director call
  ↓
Structured Composition + SelectionTrace
  ↓
Data contract validation
  ↓
Duration / aspect / time-range validation
  ↓
Coverage / ordered structure / repetition / visual-event density linter
  ↓
Layout resolution using available visual context
  ↓
Workspace handoff
```

## Core contracts to freeze after Phase 2

### VisualUnit

```ts
interface VisualUnit {
  visualUnitId: string;
  sourceSubtitleIds: string[];
  startSec: number;
  endSec: number;
  semanticIntent: string;
  importance: number;
  structure?: {
    type: 'hook' | 'chapter' | 'argument' | 'evidence' | 'comparison' | 'ordered_process' | 'list' | 'definition' | 'conclusion' | string;
    items?: Array<{ id: string; text: string; startSec?: number; endSec?: number }>;
  };
  extractedData?: {
    numbers?: number[];
    percentages?: number[];
    labels?: string[];
    orderedItems?: string[];
  };
}
```

### EffectCapabilityCandidate

```ts
interface EffectCapabilityCandidate {
  familyId: string;
  variantId: string;
  displayName: string;
  semanticTags: string[];
  visualTags?: string[];
  contentSlots: string[];
  minDurationSec: number;
  maxDurationSec: number;
  supportedAspectRatios: string[];
  useCases?: string[];
  avoidCases?: string[];
  timingCapabilities?: string[];
  layoutCapabilities?: string[];
  dataContract: EffectDataContract;
}
```

`EffectDataContract` 必须是代码可执行的 discriminated contract；Numeric/Percentage/Ring require numeric values, List/Steps require ordered items, Quote requires quote text, Comparison requires both sides, and chart/data families require explicit provenance.

### Per-unit bundle and trace

```ts
interface CandidateBundle {
  visualUnitId: string;
  candidates: EffectCapabilityCandidate[];
  retrievalReason: string[];
}

interface SelectionTraceEntry {
  visualUnitId: string;
  semanticIntent: string;
  retrievedCandidates: string[];
  selected?: string;
  dataContractPassed: boolean;
  durationContractPassed: boolean;
}
```

## One-call and fallback policy

- `createOneCallGuard` remains the single Director provider boundary.
- Local parsing, validation, deterministic repair, and layout solving are allowed after the call; a second LLM JSON-repair call is not.
- Provider/schema failure yields `usedFallback=true`, warnings, and trace/UI visibility. It cannot satisfy real Golden acceptance.
- Numeric/data values must carry source provenance from explicit SRT, user input, or project data; semantic adjectives cannot become invented percentages.

## Layout policy

The Director supplies placement intent and relation-to-subject. A local resolver owns legal coordinates, safe margins, subtitle reserve, subject/face/no-go zones, aspect ratio, and collision policy. If real subject/face data is unavailable, the input records unavailable context and the linter reports the limitation; no coordinates are fabricated.

## Phase boundary

Phase 1 creates this design and evidence only. Phase 2 may implement the contracts and Golden Path. Phase 3 may expand manifests, adapters, UI, trace viewer, migrations, and performance only after `CORE_FREEZE.md` freezes these contracts.
