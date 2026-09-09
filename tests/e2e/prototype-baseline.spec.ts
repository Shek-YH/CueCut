import { test } from '@playwright/test';

test.use({ viewport: { width: 1920, height: 1080 } });

const prototypeUrl = 'file:///F:/CCPJ/CueCut3/CueCut_UI_Prototype_V4_Director_EffectLab.html';

test('captures local prototype baseline views', async ({ page }) => {
  await page.goto(prototypeUrl);
  await page.screenshot({ path: 'docs/evidence/prototype-baselines/01-edit-workspace.png', fullPage: true });

  await page.locator('.navitem[data-view="lab"]').click();
  await page.screenshot({ path: 'docs/evidence/prototype-baselines/02-effect-lab.png', fullPage: true });

  await page.locator('.navitem[data-view="sfx"]').click();
  await page.screenshot({ path: 'docs/evidence/prototype-baselines/03-sfx-library.png', fullPage: true });

  await page.locator('.navitem[data-view="learn"]').click();
  await page.screenshot({ path: 'docs/evidence/prototype-baselines/04-preference-evolution.png', fullPage: true });
});

