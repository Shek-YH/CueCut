import { motionRegistry, type MotionDefinition } from './registry';

const transitionCategories = new Set(['motion-layer', 'basic', 'spring', 'direction', 'rotation', 'legacy']);

export const transitionMotionRegistry: MotionDefinition[] = motionRegistry.filter((motion) => transitionCategories.has(motion.category));

export function findTransitionMotion(motionId: string): MotionDefinition | undefined {
  return transitionMotionRegistry.find((motion) => motion.motionId === motionId || motion.id === motionId);
}
