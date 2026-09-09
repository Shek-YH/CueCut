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

  setVideoMetadata(metadata: { sourceFileName: string; durationSec: number; fps: number; canvasWidth: number; canvasHeight: number }): void {
    const next = clone(this.snapshot);
    next.project.video.sourceFileName = metadata.sourceFileName;
    next.project.durationSec = metadata.durationSec;
    next.project.fps = metadata.fps;
    next.project.canvasWidth = metadata.canvasWidth;
    next.project.canvasHeight = metadata.canvasHeight;
    next.project.aspectRatio = aspectRatio(metadata.canvasWidth, metadata.canvasHeight);
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
