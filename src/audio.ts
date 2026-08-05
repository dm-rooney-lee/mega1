import Phaser from "phaser";

/**
 * 게임 인스턴스 전역에 하나뿐인 Phaser 사운드 매니저를 재사용해, 씬을 오가도
 * 배경음악이 다시 시작되지 않게 한다(scene.sound와 game.sound는 같은 인스턴스).
 */
let bgm: Phaser.Sound.BaseSound | undefined;

export function startBgmOnce(scene: Phaser.Scene): void {
  if (bgm?.isPlaying) return;
  bgm = scene.sound.add("bgm", { loop: true, volume: 0.5 });
  bgm.play();
}
