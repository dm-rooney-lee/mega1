import Phaser from "phaser";
import { SFX } from "./config";

/**
 * `Phaser.Sound.BaseSound` 대신 `sound.add()`가 실제로 돌려주는 타입을 쓴다.
 * 볼륨을 바꾸는 `setVolume`이 BaseSound 타입에는 선언되어 있지 않기 때문이다.
 */
type Bgm = ReturnType<Phaser.Scene["sound"]["add"]>;

/**
 * 게임 인스턴스 전역에 하나뿐인 Phaser 사운드 매니저가 이 음악을 보관하므로, 씬이
 * 끝나도 음악 객체는 살아남는다(scene.sound와 game.sound는 같은 인스턴스).
 *
 * 배경음악은 한 번 켜지면 멈추지 않는다. 대신 화면마다 볼륨이 달라진다 — 타이틀·
 * 게임오버·승리 화면에서는 앞에 나서고, 플레이 중에는 효과음이 들리도록 뒤로
 * 물러난다. 그 지점은 각 씬의 create()에 있다.
 */
let bgm: Bgm | undefined;

/**
 * 음악이 `volume`으로 흐르게 만든다. 아직 안 켜졌으면 켜고, 이미 흐르고 있으면
 * 볼륨만 바꾼다 — 화면이 바뀌어도 곡이 처음부터 다시 시작되지 않는다.
 */
export function playBgm(scene: Phaser.Scene, volume: number): void {
  try {
    // 한 번 만든 음악을 계속 재사용한다. 켤 때마다 새로 만들면 화면을 오갈 때마다
    // 사운드 매니저에 쓰지 않는 음악이 쌓인다.
    bgm ??= scene.sound.add("bgm", { loop: true, volume });
    if (!bgm.isPlaying) bgm.play();
    // 두 번째 호출부터는 이 줄만 일한다 — 화면이 바뀔 때마다 볼륨이 여기서 갈린다.
    bgm.setVolume(volume);
  } catch (e) {
    console.warn("[audio] bgm failed to load/play; continuing without music:", e);
  }
}

type ToneOpts = { freqStart: number; freqEnd: number; durationMs: number };
type NoiseOpts = { durationMs: number; filterFreq: number };
type JingleOpts = { notes: readonly number[]; noteDurationMs: number };

/**
 * scene.sound가 WebAudioSoundManager일 때만 그 AudioContext와 마스터 뮤트 게인
 * 노드를 반환한다. HTML5Audio/NoAudio 폴백일 때는 undefined — 효과음은 조용히
 * 생략된다(게임 진행을 막지 않는다는 기존 bgm 원칙과 동일).
 */
function webAudioTarget(
  scene: Phaser.Scene,
): { context: AudioContext; destination: AudioNode } | undefined {
  const manager = scene.sound;
  if (!("context" in manager) || !manager.context) return undefined;
  return { context: manager.context, destination: manager.masterMuteNode };
}

/** 사인파를 freqStart→freqEnd로 스윕하며 짧게 재생(점프/발사/사망 등 순음 계열). */
function playTone(scene: Phaser.Scene, opts: ToneOpts, volume: number): void {
  const target = webAudioTarget(scene);
  if (!target) return;
  try {
    const { context, destination } = target;
    const now = context.currentTime;
    const durationSec = opts.durationMs / 1000;

    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(opts.freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), now + durationSec);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + durationSec);
  } catch (e) {
    console.warn("[audio] tone synthesis failed; continuing without sound:", e);
  }
}

/** 필터링된 화이트 노이즈를 짧게 재생(대포/바위/철퇴 등 타격·마찰 계열). */
function playNoiseBurst(scene: Phaser.Scene, opts: NoiseOpts, volume: number): void {
  const target = webAudioTarget(scene);
  if (!target) return;
  try {
    const { context, destination } = target;
    const now = context.currentTime;
    const durationSec = opts.durationMs / 1000;

    const buffer = context.createBuffer(
      1,
      Math.round(context.sampleRate * durationSec),
      context.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = context.createBufferSource();
    noise.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(opts.filterFreq, now);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start(now);
    noise.stop(now + durationSec);
  } catch (e) {
    console.warn("[audio] noise synthesis failed; continuing without sound:", e);
  }
}

/** 짧은 상승 아르페지오(승리/스테이지 클리어 전용) — 음을 순서대로 재생. */
function playWinJingle(scene: Phaser.Scene, opts: JingleOpts, volume: number): void {
  opts.notes.forEach((freq, i) => {
    scene.time.delayedCall(i * opts.noteDurationMs, () => {
      playTone(scene, { freqStart: freq, freqEnd: freq, durationMs: opts.noteDurationMs }, volume);
    });
  });
}

export function playJump(scene: Phaser.Scene): void {
  playTone(scene, SFX.JUMP, SFX.MASTER_VOLUME);
}

export function playEnemyKill(scene: Phaser.Scene): void {
  playTone(scene, SFX.ENEMY_KILL, SFX.MASTER_VOLUME);
}

export function playFire(scene: Phaser.Scene): void {
  playTone(scene, SFX.FIRE, SFX.MASTER_VOLUME);
}

export function playCannonFire(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.CANNON, SFX.MASTER_VOLUME);
}

export function playShieldBlock(scene: Phaser.Scene): void {
  playTone(scene, SFX.SHIELD_BLOCK, SFX.MASTER_VOLUME);
}

export function playRockDrop(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.ROCK_DROP, SFX.MASTER_VOLUME);
}

export function playDeath(scene: Phaser.Scene): void {
  playTone(scene, SFX.DEATH, SFX.MASTER_VOLUME);
}

export function playPendulumSwing(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.PENDULUM_SWING, SFX.MASTER_VOLUME);
}

export function playWin(scene: Phaser.Scene): void {
  playWinJingle(scene, SFX.WIN, SFX.MASTER_VOLUME);
}

export function playShieldPickup(scene: Phaser.Scene): void {
  playTone(scene, SFX.SHIELD_PICKUP, SFX.MASTER_VOLUME);
}

export function playSpringBounce(scene: Phaser.Scene): void {
  playTone(scene, SFX.SPRING_BOUNCE, SFX.MASTER_VOLUME);
}
