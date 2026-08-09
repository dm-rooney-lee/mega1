/**
 * localStorage에 저장하는 키. 테스트가 이 문자열을 다시 적지 않고 가져다 쓰도록
 * export한다 — 그래야 이 키가 바뀌어도 테스트가 조용히 다른 걸 검증하게 되지
 * 않는다.
 */
export const STORAGE_KEY = "mega1-audio-settings";

type AudioSettings = { bgm: number; sfx: number };

const DEFAULTS: AudioSettings = { bgm: 1, sfx: 1 };

/**
 * 0~1로 잘라 담는다. `Number(undefined)`처럼 진짜 숫자가 아닌 값만 기본값(1)로
 * 취급한다 — `Infinity`/`-Infinity`는 숫자이므로 그대로 두면 아래
 * `Math.min`/`Math.max`가 0과 1 경계로 정확히 잘라낸다. `!Number.isFinite`로
 * 걸러내면 `-Infinity`까지 "숫자가 아님"으로 묶여 최솟값이 아니라 최댓값(1)로
 * 잘못 잘리므로 쓰지 않는다.
 */
function clamp01(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

/**
 * localStorage 접근 자체가 예외를 던지는 환경(프라이빗 브라우징 등)과 저장된
 * JSON이 깨져 있는 경우를 모두 기본값으로 조용히 폴백한다 — src/audio.ts가
 * 오디오 실패를 조용히 넘기는 것과 같은 원칙.
 */
function loadFromStorage(): AudioSettings {
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

/**
 * 세션 동안의 값. 매번 localStorage를 다시 읽고 파싱하지 않도록 한 번만
 * `loadFromStorage()`하고 그다음부터는 이 캐시를 쓴다 — 효과음처럼 짧은
 * 간격으로 자주 조회되는 값이라 매번 왕복하면 낭비다.
 */
let cached: AudioSettings | undefined;

function current(): AudioSettings {
  cached ??= loadFromStorage();
  return cached;
}

/**
 * 캐시를 먼저 갱신한 뒤 저장을 시도한다 — 순서가 중요하다. `localStorage.setItem`이
 * 실패해도(프라이빗 브라우징 등) 캐시는 이미 새 값이므로 이번 세션 동안은 방금
 * 조절한 대로 들린다. 새로고침하면 저장된 적이 없으니 기본값부터 다시 시작한다.
 */
function persist(settings: AudioSettings): void {
  cached = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장이 막혀 있어도 게임은 계속된다 — 캐시가 이번 세션을 책임진다.
  }
}

export function getBgmVolume(): number {
  return current().bgm;
}

export function getSfxVolume(): number {
  return current().sfx;
}

export function setBgmVolume(value: number): void {
  persist({ ...current(), bgm: clamp01(value) });
}

export function setSfxVolume(value: number): void {
  persist({ ...current(), sfx: clamp01(value) });
}
