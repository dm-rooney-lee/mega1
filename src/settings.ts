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
 * 이번 세션에서 조절했지만 디스크에 반영하지 못한 필드만 담는다 —
 * `persist()`가 저장에 실패한 그 필드만 추가하고, 성공하면 전부 비운다.
 * `current()`가 디스크 값 위에 이걸 덮어써서 반영한다.
 *
 * "실패한 필드만"이 핵심이다. 실패할 때마다 병합된 전체 객체를 통째로
 * 담으면, 그 안에 들어있던 다른 필드의 disk-read 스냅샷이 계속 남아 있다가
 * 나중에 그 필드가 성공적으로 저장될 때 다시 튀어나와 — 그 사이 다른 탭이
 * 저장한 값을 덮어써버린다. 실패한 필드 하나만 기억해두면 그런 일이 없다.
 *
 * 매번 디스크에서 새로 읽는 이유: 값을 한 번 캐시해두고 계속 재사용하면, 다른
 * 탭에서 그 사이 저장한 값(또는 이 세션이 이미 성공적으로 저장한 값)을 다음
 * 조절이 조용히 덮어써버린다.
 */
let unsaved: Partial<AudioSettings> = {};

function current(): AudioSettings {
  return { ...loadFromStorage(), ...unsaved };
}

/**
 * 저장에 성공하면 `unsaved`를 비운다 — 이번에 쓴 값은 `current()`(디스크 +
 * 그때까지의 unsaved)를 그대로 반영하므로, 그 스냅샷 전체가 이제 디스크와
 * 일치해 더 기억해둘 필요가 없다. 실패하면(프라이빗 브라우징 등) 지금 바꾸려던
 * 그 필드만 `unsaved`에 남겨, 이번 세션 동안은 방금 조절한 값이 유지된다.
 */
function persist(field: keyof AudioSettings, value: number): void {
  const settings = { ...current(), [field]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    unsaved = {};
  } catch {
    unsaved = { ...unsaved, [field]: value };
  }
}

export function getBgmVolume(): number {
  return current().bgm;
}

export function getSfxVolume(): number {
  return current().sfx;
}

export function setBgmVolume(value: number): void {
  persist("bgm", clamp01(value));
}

export function setSfxVolume(value: number): void {
  persist("sfx", clamp01(value));
}
