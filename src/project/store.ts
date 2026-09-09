import { projectCompositionSchema, type EffectInstance, type ProjectComposition } from './schema';

type Listener = () => void;

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class ProjectStore {
  private snapshot: ProjectComposition;
  private readonly undoStack: ProjectComposition[] = [];
  private readonly redoStack: ProjectComposition[] = [];
  private readonly listeners = new Set<Listener>();

  constructor(initial: ProjectComposition) {
    this.snapshot = projectCompositionSchema.parse(initial);
  }

  getSnapshot(): ProjectComposition {
    return this.snapshot;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  cloneEffectDraft(effectId: string): EffectInstance {
    const effect = this.snapshot.effects.find((item) => item.effectId === effectId);
    if (!effect) {
      throw new Error(`Effect not found: ${effectId}`);
    }
    return clone(effect);
  }

  applyEffectDraft(draft: EffectInstance): void {
    const next = clone(this.snapshot);
    const index = next.effects.findIndex((item) => item.effectId === draft.effectId);
    if (index < 0) {
      throw new Error(`Effect not found: ${draft.effectId}`);
    }
    next.effects[index] = clone(draft);
    next.effects = next.effects.map((effect) =>
      effect.effectId === 'video' ? { ...effect, zIndex: 0, userFlags: { ...effect.userFlags, locked: true } } : effect,
    );
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  updateEffect(effectId: string, updater: (effect: EffectInstance) => EffectInstance): void {
    const draft = this.cloneEffectDraft(effectId);
    this.applyEffectDraft(updater(draft));
  }

  setVideoSourceName(sourceFileName: string | null): void {
    const next = clone(this.snapshot);
    next.project.video.sourceFileName = sourceFileName;
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  setVideoReference(reference: { name: string; size: number; lastModified: number; type: string } | undefined): void {
    const next = clone(this.snapshot);
    next.project.video.mediaReference = reference ? clone(reference) : undefined;
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  setSubtitles(subtitles: ProjectComposition['subtitles']): void {
    const next = clone(this.snapshot);
    next.subtitles = clone(subtitles);
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  updateSubtitle(subtitleId: string, updater: (subtitle: ProjectComposition['subtitles'][number]) => ProjectComposition['subtitles'][number]): void {
    const next = clone(this.snapshot);
    const index = next.subtitles.findIndex((subtitle) => subtitle.id === subtitleId);
    if (index < 0) throw new Error(`Subtitle not found: ${subtitleId}`);
    next.subtitles[index] = clone(updater(next.subtitles[index]!));
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  deleteSubtitle(subtitleId: string): void {
    const next = clone(this.snapshot);
    const index = next.subtitles.findIndex((subtitle) => subtitle.id === subtitleId);
    if (index < 0) throw new Error(`Subtitle not found: ${subtitleId}`);
    next.subtitles.splice(index, 1);
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  duplicateSubtitle(subtitleId: string): string {
    const next = clone(this.snapshot);
    const index = next.subtitles.findIndex((subtitle) => subtitle.id === subtitleId);
    if (index < 0) throw new Error(`Subtitle not found: ${subtitleId}`);
    const source = next.subtitles[index]!;
    let copyId = `${subtitleId}-copy`;
    let suffix = 2;
    while (next.subtitles.some((subtitle) => subtitle.id === copyId)) copyId = `${subtitleId}-copy-${suffix++}`;
    next.subtitles.splice(index + 1, 0, { ...clone(source), id: copyId });
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
    return copyId;
  }

  updateSoundEvent(eventId: string, updater: (event: ProjectComposition['soundEvents'][number]) => ProjectComposition['soundEvents'][number]): void {
    const next = clone(this.snapshot);
    const index = next.soundEvents.findIndex((event) => event.eventId === eventId);
    if (index < 0) next.soundEvents.push(clone(updater({ eventId, sfxId: 'soft-pop-03', timeSec: 0, gain: 0.7 })));
    else next.soundEvents[index] = clone(updater(next.soundEvents[index]!));
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  deleteSoundEvent(eventId: string): void {
    const next = clone(this.snapshot);
    const index = next.soundEvents.findIndex((event) => event.eventId === eventId);
    if (index < 0) throw new Error(`SFX event not found: ${eventId}`);
    next.soundEvents.splice(index, 1);
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  deleteEffect(effectId: string): void {
    const next = clone(this.snapshot);
    const index = next.effects.findIndex((effect) => effect.effectId === effectId);
    if (index < 0) throw new Error(`Effect not found: ${effectId}`);
    next.effects.splice(index, 1);
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  duplicateEffect(effectId: string): string {
    const next = clone(this.snapshot);
    const index = next.effects.findIndex((effect) => effect.effectId === effectId);
    if (index < 0) throw new Error(`Effect not found: ${effectId}`);
    const source = next.effects[index]!;
    let copyId = `${effectId}-copy`;
    let suffix = 2;
    while (next.effects.some((effect) => effect.effectId === copyId)) copyId = `${effectId}-copy-${suffix++}`;
    next.effects.splice(index + 1, 0, { ...clone(source), effectId: copyId, userFlags: { ...source.userFlags, manual: true } });
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
    return copyId;
  }

  setVideoMetadata(metadata: { sourceFileName: string; durationSec: number; fps: number; canvasWidth: number; canvasHeight: number }): void {
    const next = clone(this.snapshot);
    next.project.video.sourceFileName = metadata.sourceFileName;
    next.project.durationSec = metadata.durationSec;
    next.project.fps = metadata.fps;
    next.project.canvasWidth = metadata.canvasWidth;
    next.project.canvasHeight = metadata.canvasHeight;
    next.project.aspectRatio = aspectRatio(metadata.canvasWidth, metadata.canvasHeight);
    const minimumRange = Math.min(0.01, metadata.durationSec / 2);
    const clampRange = (startSec: number, endSec: number) => {
      const start = Math.min(Math.max(0, startSec), Math.max(0, metadata.durationSec - minimumRange));
      return { startSec: start, endSec: Math.min(metadata.durationSec, Math.max(start + minimumRange, endSec)) };
    };
    next.effects = next.effects.map((effect) => ({ ...effect, time: clampRange(effect.time.startSec, effect.time.endSec) }));
    next.segments = next.segments.map((segment) => ({ ...segment, ...clampRange(segment.startSec, segment.endSec) }));
    next.subtitles = next.subtitles.map((subtitle) => ({ ...subtitle, ...clampRange(subtitle.startSec, subtitle.endSec) }));
    const parsed = projectCompositionSchema.parse(next);
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  replaceComposition(composition: ProjectComposition): void {
    const parsed = projectCompositionSchema.parse(clone(composition));
    this.undoStack.push(this.snapshot);
    this.redoStack.length = 0;
    this.snapshot = parsed;
    this.notify();
  }

  undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push(this.snapshot);
    this.snapshot = previous;
    this.notify();
  }

  redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(this.snapshot);
    this.snapshot = next;
    this.notify();
  }

  undoDepth(): number {
    return this.undoStack.length;
  }

  redoDepth(): number {
    return this.redoStack.length;
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

function aspectRatio(width: number, height: number): string {
  let left = Math.round(width);
  let right = Math.round(height);
  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return Math.round(width / left) + ':' + Math.round(height / left);
}

export function createProjectStore(initial: ProjectComposition): ProjectStore {
  return new ProjectStore(initial);
}
