import { describe, expect, it } from 'vitest';
import { packagingEffectManifestSchema } from '../../src/packaging-registry/manifest';

describe('packaging registry manifest', () => {
  it('requires capability, relation, timing, runtime, and license provenance', () => {
    const result = packagingEffectManifestSchema.safeParse({
      id: 'lower-third-clean-01', version: '1.0.0', category: 'lower-third', title: 'Clean Lower Third',
      tags: ['clean', 'business'], supportedAspectRatios: ['16:9', '9:16'], supportedZones: ['lower-left'],
      subjectRelations: ['avoid', 'foreground'], duration: { min: 2, recommended: 4, max: 8 },
      motionCapabilities: { entrance: ['slide_left'], emphasis: ['none'], exit: ['fade_out'] },
      contentSchema: { name: 'string', role: 'string' }, safeZoneAware: true, subtitleAware: true, subjectAware: true,
      runtime: 'canvas', license: 'PROJECT-LOCAL', licenseRef: 'src/motions/licenses/local.md',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a manifest without license provenance', () => {
    const result = packagingEffectManifestSchema.safeParse({ id: 'unsafe', version: '1.0.0', category: 'stat', title: 'Unsafe', tags: [], supportedAspectRatios: ['16:9'], supportedZones: ['center'], subjectRelations: ['ignore'], duration: { min: 1, recommended: 2, max: 3 }, motionCapabilities: { entrance: ['fade_in'], emphasis: ['none'], exit: ['fade_out'] }, contentSchema: {}, safeZoneAware: true, subtitleAware: true, subjectAware: true, runtime: 'canvas' });
    expect(result.success).toBe(false);
  });
});
