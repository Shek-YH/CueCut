import { motionRegistry, type MotionDefinition } from './registry';

const contentAnimationCategories = new Set(['text', 'number', 'list']);

export const contentAnimationRegistry: MotionDefinition[] = motionRegistry.filter((motion) => contentAnimationCategories.has(motion.category));

export function findContentAnimation(motionId: string): MotionDefinition | undefined {
  return contentAnimationRegistry.find((motion) => motion.motionId === motionId || motion.id === motionId);
}
