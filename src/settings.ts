/** localStorage에 저장하는 키. 값이 없거나 깨져 있으면 기본값(100%)으로 취급한다. */
const STORAGE_KEY = "mega1-audio-settings";

type AudioSettings = { bgm: number; sfx: number };

const DEFAULTS: AudioSettings = { bgm: 1, sfx: 1 };

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

/**
 * localStorage 접근 자체가 예외를 던지는 환경(프라이빗 브라우징 등)과 저장된
 * JSON이 깨져 있는 경우를 모두 기본값으로 조용히 폴백한다 — src/audio.ts가
 * 오디오 실패를 조용히 넘기는 것과 같은 원칙.
 */
function load(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      bgm: clamp01(Number(parsed.bgm)),
      sfx: clamp01(Number(parsed.sfx)),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장이 막혀 있어도 게임은 계속된다 — 이번 세션 동안은 메모리 값이 아니라
    // 매번 load()가 기본값을 돌려주므로, 조절은 되지만 새로고침하면 초기화된다.
  }
}

export function getBgmVolume(): number {
  return load().bgm;
}

export function getSfxVolume(): number {
  return load().sfx;
}

export function setBgmVolume(value: number): void {
  save({ ...load(), bgm: clamp01(value) });
}

export function setSfxVolume(value: number): void {
  save({ ...load(), sfx: clamp01(value) });
}
