# CueCut Real Test Readiness

**Updated:** 2026-09-08  
**Gate:** G2

Statuses mean readiness only, not test results: READY, WAITING_FOR_READINESS, BLOCKED, NOT_REQUIRED.

| Scenario ID | User capability | Test level | Required media | Required account | API Key / Token | Server/service | Model/provider | Device/OS/browser | Database/test data | License/authorization | Cost/quota | Sensitivity | Source | Owner | Deadline | Status | Fallback | Cleanup |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RT-01 | Import/play 16:9 video | Host integration | Local real MP4/MOV >=30s; supplied jj.mp4 is available but geometry must be probed | None | None | None | Browser video | Windows + Chromium | Local file | User-owned/test-authorized | Host CPU | User media | PRD §39 | R04/R07 | 2026-09-10 | READY | Synthetic 16:9 video | Revoke object URLs; do not commit media |
| RT-02 | Import 9:16 video and safe-zone layout | Host integration | ComfyUI_00001_qguot_1787042165.mp4, 1080×1920, 30fps, 62.648s | None | None | None | Browser video | Windows + Chromium | Local file | User-owned/test-authorized | Host CPU | User media | PRD §39 | R04/R07 | 2026-09-10 | READY | Synthetic portrait fixture | Revoke object URLs; keep fixture local |
| RT-03 | ASR to timestamped SRT | Real integration | jj.mp4 and ComfyUI_00001_qguot_1787042165.mp4 audio extracted locally | Alibaba Bailian account configured in local .env | Configured locally; value omitted | dashscope.aliyuncs.com recorded-speech HTTP API | qwen-audio-3.0-asr-flash | Windows host | Authorized local media | User authorization and provider terms | Real ASR results recorded; account owner checks billing/quota | Audio may be personal | PRD §27 | R03/R04 | 2026-09-12 | READY | Import/edit/export SRT locally | Delete derived audio/transcript if sensitive |
| RT-04 | One Director call and composition import | Real integration | SRT + video context + candidate index | Alibaba Bailian credential present in local .env | Configured locally; value omitted | dashscope.aliyuncs.com compatible-mode | qwen-plus | Windows + PowerShell | Synthetic candidate fixtures | User-authorized API key; product budget still owner-controlled | One initial + one explicit recovery request recorded; check account quota | Synthetic transcript/context | Director Skill §1-6 | R03/R07 | 2026-09-12 | READY | Deterministic local fallback | Store only redacted metadata |
| RT-05 | Effect Lab draft/apply/cancel | Browser E2E | Local synthetic project; real effect content | None | None | None | Local runtime | Windows + Chromium at 1920×1080, 1600×900, 1440×900 | Seed composition | Asset licenses retained | None | Local project | Prompt §6 | R02/R07 | 2026-09-10 | READY | Unit/component tests | Reset local storage between runs |
| RT-06 | SFX favorites and preference hint | Browser E2E | Licensed local SFX metadata; audio files not yet supplied | None | None | None | Local runtime | Windows + Chromium | SFX registry fixture | Only MIT/provenance-approved assets | None | Local metadata | Prompt §6 | R05/R07 | 2026-09-10 | WAITING_FOR_READINESS | Metadata-only registry and synthetic audio | Clear favorites fixture |
| RT-07 | Timeline scrub/zoom/drag/trim | Browser E2E | Local synthetic project, optionally supplied jj.mp4 | None | None | None | Browser runtime | Windows + Chromium at required viewports | Seed composition | Local test data | None | Local project | Prompt §7 | R02/R07 | 2026-09-10 | READY | Pointer interaction tests | Clear object URLs/state |
| RT-08 | Full video export | Host integration | Authorized real MP4/MOV + FX/SRT/SFX | None or prior approved provider | None | Host FFmpeg/WebCodecs | To be benchmarked | Windows host | Local project | Codec/output terms | CPU/GPU time | User media | PRD §30 | 2026-09-17 | WAITING_FOR_READINESS | Synthetic render-frame export | Delete generated exports unless requested |
| RT-09 | Transparent MOV in CapCut/Jianying | Real downstream E2E | Alpha-capable project and original video | Installed target editor | None | Host FFmpeg | ProRes 4444 or approved equivalent | Windows + CapCut/Jianying | Local exported MOV | Codec/editor usage authorized | Host storage/time | User media | Prompt §6 | R04/R07 | 2026-09-20 | BLOCKED | None that proves compatibility | Remove test export after acceptance |
| RT-10 | Initial/final diff and preference evolution | Local integration | Initial and final composition fixtures | None | None | None | Local engine | Windows + Chromium optional | Repeated contextual samples | Local project data | None | Local project | PRD §23-25 | R06/R07 | 2026-09-15 | READY | Deterministic fixture suite | Reset preference DB/fixture |

## Current missing real resources

- Independent verifier review of the real ASR result and provider billing/quota remains pending.
- Product-owner confirmation of the LLM spend/quota boundary for normal Director generation.
- Authorized local SFX audio files beyond metadata candidates.
- An installed CapCut/Jianying acceptance environment and a Product Owner test session.

RT-03 provider connectivity and one real result are recorded in `docs/evidence/WI-008-real-bailian-2026-09-08.json`; readiness and verifier acceptance remain separate. RT-04 provider connectivity is ready for qwen-plus, but its first structured-output smoke result failed local candidate conformance. qwen3.7-plus strict-schema access is blocked by AllocationQuota.FreeTierOnly.

## Talking-Head Effects Phase

| Scenario ID | User capability | Test level | Required resource | Status | Owner | Evidence |
|---|---|---|---|---|---|---|
| RT-EFX-01 | zip import/audit/license provenance | Local integration | local zip, PowerShell/Tar, no account | READY | R02/R06 | WI-015/WI-020 |
| RT-EFX-02 | registry contains official first batch | Synthetic/local integration | local source and tests | READY | R01 | WI-016 |
| RT-EFX-03 | deterministic 30fps renderer | Local render | host Canvas/Node test runtime | READY | R03 | WI-017 |
| RT-EFX-04 | library/Effect Lab/parameter Apply-Cancel | Browser E2E | Chromium, synthetic project | READY | R04 | WI-018 |
| RT-EFX-05 | Timeline edit and export plan | Host integration | local FFmpeg/fixture | READY | R05 | WI-019 |
| RT-EFX-06 | MIT/IP/no remote runtime audit | Static audit | local manifests/licenses | READY | R06 | WI-020 |
| RT-EFX-07 | full local QA matrix | Local integration + browser | existing 16:9/9:16 fixtures | READY | R07 | WI-021 |
| RT-EFX-08 | Golden Path local end-to-end | Real local E2E | local app, fixture, host renderer | READY | R00/R90 | WI-022 |
| RT-EFX-09 | Alpha MOV in CapCut/Jianying | Real downstream E2E | user-installed editor and one user session | WAITING_FOR_USER | R00 | WI-022 |
