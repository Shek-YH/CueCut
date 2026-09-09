export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

function parseTimestamp(value: string): number {
  const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) throw new Error('Invalid SRT timestamp: ' + value);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

function formatTimestamp(value: number): string {
  const milliseconds = Math.round(value * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1000);
  const remainder = milliseconds % 1000;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':') + ',' + String(remainder).padStart(3, '0');
}

export function parseSrt(input: string): TranscriptSegment[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  return trimmed.split(/\r?\n\s*\r?\n/).map((block, index) => {
    const lines = block.split(/\r?\n/);
    const id = (lines[0] ?? String(index + 1)).trim() || String(index + 1);
    const timeLine = lines[1] ?? '';
    const match = timeLine.match(/^\s*(\S+)\s+-->\s+(\S+)\s*$/);
    if (!match) throw new Error('Invalid SRT timing line for segment ' + id);

    const startSec = parseTimestamp(match[1]);
    const endSec = parseTimestamp(match[2]);
    if (endSec <= startSec) throw new Error('SRT segment end must be after start for ' + id);

    return { id: 's-' + id, startSec, endSec, text: lines.slice(2).join('\n').trim() };
  });
}

export function serializeSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((segment, index) => [
      String(index + 1),
      formatTimestamp(segment.startSec) + ' --> ' + formatTimestamp(segment.endSec),
      segment.text.trim(),
    ].join('\n'))
    .join('\n\n') + (segments.length ? '\n' : '');
}

