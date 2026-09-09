# xterm.js Reference

Repository:
https://github.com/xtermjs/xterm.js

License:
MIT-style permissive license

Usefulness:
- mature terminal rendering/emulation
- ANSI/terminal semantics
- potential future terminal capture/import support

For CueCut video overlays, a full terminal emulator is usually unnecessary.
The v0.6 `CueCutTerminalPanel` is intentionally lightweight and deterministic.

Use xterm.js only if future requirements include:
- real ANSI logs
- terminal replay
- complex escape sequences
- interactive capture/import
