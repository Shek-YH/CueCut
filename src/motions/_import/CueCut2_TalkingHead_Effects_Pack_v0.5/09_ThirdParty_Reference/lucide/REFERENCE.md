# Lucide Reference

Repository:
https://github.com/lucide-icons/lucide

License:
ISC for Lucide; a subset of icons derived from Feather remains under MIT as documented in the repository LICENSE.

Why it is useful for CueCut:
- broad icon coverage
- consistent stroke visual language
- easy React integration
- useful for Download / Upload / Copy / Link / Check / Alert / Cursor / Keyboard / AI-tool cards

This v0.5 pack does NOT copy Lucide icon source files.
`00_shared/CueCutIcon.tsx` contains a small CueCut-native set of generic inline SVG primitives so the pack has no required icon runtime dependency.

Codex may choose one of two strategies:
1. Keep the built-in CueCut SVG primitives for deterministic, dependency-light rendering.
2. If CueCut3 already uses Lucide, map `IconName` to existing Lucide components instead of adding another icon system.
