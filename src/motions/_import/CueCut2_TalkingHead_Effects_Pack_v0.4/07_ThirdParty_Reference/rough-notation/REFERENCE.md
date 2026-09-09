# Rough Notation Reference

Repository:
https://github.com/rough-stuff/rough-notation

License:
MIT

Useful annotation types documented by the project:
- underline
- box
- circle
- highlight
- strike-through
- crossed-off
- bracket

CueCut v0.4 does NOT require Rough Notation at runtime.
The CueCut-native annotation components in `02_Text_Annotations/` are frame/progress-driven SVG implementations intended for deterministic video rendering.

If Codex decides to use Rough Notation directly, it must evaluate:
- DOM measurement requirements
- SVG creation via DOM APIs
- `getTotalLength()`
- CSS animation timing
- seek/export determinism

For CueCut rendering, the preferred architecture remains:
`timeline progress -> SVG strokeDashoffset/clip geometry -> deterministic frame`
