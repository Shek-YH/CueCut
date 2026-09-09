import { useState } from 'react';
import { sfxRegistry } from '../../sfx/registry';
import type { ProjectStore } from '../../project/store';

const categories = [
  ['recommended', 'AI 推荐', 4],
  ['favorite', '★ 收藏', 2],
  ['recent', '最近使用', 12],
  ['emphasis', '强调 Pop', 42],
  ['transition', '转场 Whoosh', 55],
  ['data', '数字 Data', 31],
  ['impact', '冲击 Impact', 27],
  ['digital', '科技 Digital', 46],
  ['playful', '趣味 Playful', 38],
  ['ambient', '氛围 Ambient', 21],
] as const;

function Waveform() {
  return <div className="wave"><i /><i /><i /><i /><i /><i /></div>;
}

export function SfxLibrary({ store, selectedEffectId }: { store?: ProjectStore; selectedEffectId?: string }) {
  const [category, setCategory] = useState('recommended');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(sfxRegistry.filter((sound) => sound.isFavorite).map((sound) => sound.sfxId)));
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [selectedSfxId, setSelectedSfxId] = useState('soft-pop-03');
  const visibleSounds = category === 'recent'
    ? recentIds.map((id) => sfxRegistry.find((sound) => sound.sfxId === id)).filter((sound): sound is (typeof sfxRegistry)[number] => Boolean(sound))
    : sfxRegistry.filter((sound) => {
    if (category === 'favorite') return favoriteIds.has(sound.sfxId);
    if (category === 'recommended') return sound.sfxId === 'soft-pop-03' || sound.sfxId === 'studio-whoosh-02' || sound.sfxId === 'glass-ding-01' || sound.sfxId === 'digital-count-04';
    return sound.intentCategory === category;
  });

  const toggleFavorite = (sfxId: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(sfxId)) next.delete(sfxId);
      else next.add(sfxId);
      return next;
    });
  };

  const replaceCurrentEffect = () => {
    if (!store || !selectedEffectId) return;
    store.updateEffect(selectedEffectId, (effect) => ({ ...effect, sfx: { sfxId: selectedSfxId, offsetSec: 0.06, gain: 0.7 } }));
  };

  return (
    <div className="view sfxview active" data-testid="sfx-view">
      <aside className="cat">
        <div className="phead cat-head"><strong>音效分组</strong><span className="tiny">INTENT</span></div>
        {categories.map(([id, label, count]) => (
          <button aria-label={label} className={'catItem' + (category === id ? ' active' : '')} key={id} onClick={() => setCategory(id)} type="button">
            <span>{label}</span><span className="count">{id === 'favorite' ? favoriteIds.size : id === 'recent' ? recentIds.length : count}</span>
          </button>
        ))}
      </aside>
      <main className="sfxlist">
        <div className="sfxhead">
          <strong className="sfx-title">{categories.find(([id]) => id === category)?.[1]}</strong>
          <select className="btn" aria-label="音效风格"><option>Style: Studio</option><option>Minimal</option><option>Glass</option><option>Sci-Fi</option><option>Cinematic</option></select>
          <span className="spacer" />
          <input className="search sfx-search" placeholder="搜索音效" />
        </div>
        <div className="sfxbody">
          {visibleSounds.map((sound) => (
            <div className={'sound' + (sound.sfxId === selectedSfxId ? ' selected' : '')} key={sound.sfxId} onClick={() => setSelectedSfxId(sound.sfxId)}>
              <Waveform />
              <div><div className="sname">{sound.title}</div><div className="stags">{sound.tags.join(' · ')} · {sound.stylePack}</div></div>
              <button className="btn sound-play" onClick={() => setRecentIds((current) => [sound.sfxId, ...current.filter((id) => id !== sound.sfxId)].slice(0, 20))} type="button" aria-label={'试听 ' + sound.title}>▶</button>
              <button className={'star' + (favoriteIds.has(sound.sfxId) ? ' on' : '')} onClick={() => toggleFavorite(sound.sfxId)} type="button" aria-label="★">★</button>
            </div>
          ))}
        </div>
      </main>
      <aside className="sfxdetail">
        <div className="phead detail-head"><strong>当前音效</strong><span className="tiny">PREVIEW</span></div>
        <div className="favNote">★ 收藏不仅是快捷入口，也会成为下一期 Director 的弱偏好信号；只有语义匹配时才加权。</div>
        <div className="igroup"><div className="ititle"><span>Soft Pop 03</span><span className="tiny">STUDIO</span></div><div className="field"><label htmlFor="sfx-volume"><span>音量</span><b>70%</b></label><input id="sfx-volume" type="range" defaultValue="70" /></div><div className="field"><label htmlFor="sfx-offset"><span>偏移</span><b>+0.06s</b></label><input id="sfx-offset" type="range" defaultValue="56" /></div></div>
        <button className="btn wide" type="button">▶ 试听</button>
        <button className="btn primary wide" onClick={replaceCurrentEffect} type="button">替换当前 Effect 的音效</button>
      </aside>
    </div>
  );
}
