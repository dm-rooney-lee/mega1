import Phaser from "phaser";
import { SCREEN_FONT } from "./screen";
import { cameraZoom } from "../display";
import { getBgmVolume, getSfxVolume, setBgmVolume, setSfxVolume } from "../settings";
import { refreshBgmVolume } from "../audio";
import { COLORS, SCREEN_COLORS } from "../config";

/** CSS 헥스 문자열(SCREEN_COLORS)을 Phaser Shape가 원하는 숫자로 바꾼다. */
const hex = (css: string): number => Phaser.Display.Color.HexStringToColor(css).color;

const PANEL_W = 300;
const PANEL_H = 170;
const TRACK_W = 140;
const LABEL_DX = -130;
const TRACK_DX = -85;
const PCT_DX = 70;

type Row = {
  get: () => number;
  set: (value: number) => void;
  label: Phaser.GameObjects.Text;
  track: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  pct: Phaser.GameObjects.Text;
  dy: number;
  trackLeft: number;
  trackWidth: number;
};

/**
 * 볼륨 설정 오버레이. `MenuScene`/`GameScene`/`GameOverScene`/`WinScene`이
 * 톱니바퀴를 누르면 자신을 `scene.pause()`한 뒤
 * `scene.run("SettingsScene", { returnKey: this.scene.key })`로 이 씬을 그
 * 위에 띄운다. 닫으면 `scene.resume(returnKey)`로 정확히 그 지점에서 이어지고,
 * 이 씬 자신은 `scene.stop()`으로 완전히 정지한다 — 다음에 다시 열릴 때
 * `run()`이 "실행 중이 아님"으로 보고 새로 `create()`하므로 항상 최신 볼륨
 * 값으로 슬라이더가 그려진다.
 *
 * 카메라 배율은 1로 둔다(제목/죽음/승리 화면과 같음, screen.ts 참고) — 이
 * 화면은 어느 게임 화면 위에도 뜰 수 있어 그 화면의 카메라 배율과 무관해야
 * 한다. 대신 `layout()`이 논리 좌표를 `cameraZoom()`으로 직접 환산한다.
 */
export class SettingsScene extends Phaser.Scene {
  private returnKey = "MenuScene";
  private rows: Row[] = [];
  private draggingRow: Row | null = null;
  private dim!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super("SettingsScene");
  }

  init(data: { returnKey: string }): void {
    this.returnKey = data.returnKey;
  }

  create(): void {
    this.rows = [];
    this.draggingRow = null;

    this.dim = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.55).setOrigin(0, 0);

    this.panel = this.add
      .rectangle(0, 0, 1, 1, hex(SCREEN_COLORS.TITLE_SKY), 1)
      .setStrokeStyle(4, hex(SCREEN_COLORS.PROMPT));
    // 클릭이 패널 바깥(딤 배경)에 떨어졌을 때만 닫히게 하려면 패널도 인터랙티브
    // 대상에 포함되어야 한다 — 리스너는 없어도, currentlyOver에 잡히는 것만으로
    // "패널 안쪽 클릭"과 "바깥 클릭"을 구분할 수 있다(아래 pointerdown 참고).
    this.panel.setInteractive();

    this.title = this.add
      .text(0, 0, "SETTINGS", { fontFamily: SCREEN_FONT, color: SCREEN_COLORS.PROMPT })
      .setOrigin(0.5);

    this.hint = this.add
      .text(0, 0, "ESC or click outside to close", {
        fontFamily: SCREEN_FONT,
        color: SCREEN_COLORS.MUTED,
      })
      .setOrigin(0.5);

    this.rows = [
      this.buildRow(
        -15,
        "BGM",
        getBgmVolume,
        (v) => {
          setBgmVolume(v);
          refreshBgmVolume();
        },
        COLORS.PLAYER,
      ),
      this.buildRow(25, "SFX", getSfxVolume, setSfxVolume, COLORS.GOAL),
    ];

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });

    // 슬라이더 드래그: 트랙/손잡이의 pointerdown이 draggingRow를 잡고, 씬 전체의
    // pointermove가 값을 갱신하고, pointerup이 놓는다.
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingRow) return;
      this.applyPointerToRow(this.draggingRow, pointer.x);
    });
    this.input.on("pointerup", () => {
      this.draggingRow = null;
    });

    // 패널 바깥(딤 배경)을 클릭하면 닫는다. currentlyOver가 비어 있다는 것은
    // 트랙·손잡이·패널 중 어느 것도 그 클릭 위치에 없었다는 뜻이다 — dim 자체를
    // 인터랙티브로 만들지 않는 이유는, 그러면 dim과 패널/트랙이 동시에
    // "클릭됨" 상태가 되어 슬라이더를 만지자마자 닫혀버리는 순서 문제가 생기기
    // 때문이다(패널·트랙만 인터랙티브로 두면 이 모호함이 없다).
    this.input.on(
      "pointerdown",
      (_pointer: Phaser.Input.Pointer, currentlyOver: unknown[]) => {
        if (currentlyOver.length === 0) this.close();
      },
    );

    this.input.keyboard!.once("keydown-ESC", () => this.close());
  }

  private buildRow(
    dy: number,
    labelText: string,
    get: () => number,
    set: (value: number) => void,
    fillColor: number,
  ): Row {
    const label = this.add
      .text(0, 0, labelText, { fontFamily: SCREEN_FONT, color: SCREEN_COLORS.PROMPT })
      .setOrigin(0, 0.5);
    const track = this.add
      .rectangle(0, 0, TRACK_W, 10, COLORS.BACKGROUND, 1)
      .setStrokeStyle(2, hex(SCREEN_COLORS.PROMPT))
      .setOrigin(0, 0.5);
    track.setInteractive();
    const fill = this.add.rectangle(0, 0, 1, 6, fillColor, 1).setOrigin(0, 0.5);
    const handle = this.add
      .rectangle(0, 0, 10, 18, hex(SCREEN_COLORS.PROMPT), 1)
      .setStrokeStyle(2, COLORS.OUTLINE)
      .setOrigin(0.5);
    handle.setInteractive();
    const pct = this.add
      .text(0, 0, "", { fontFamily: SCREEN_FONT, color: SCREEN_COLORS.PROMPT })
      .setOrigin(0, 0.5);

    const row: Row = { get, set, label, track, fill, handle, pct, dy, trackLeft: 0, trackWidth: 0 };

    const startDrag = (pointer: Phaser.Input.Pointer) => {
      this.draggingRow = row;
      this.applyPointerToRow(row, pointer.x);
    };
    track.on("pointerdown", startDrag);
    handle.on("pointerdown", startDrag);

    return row;
  }

  /** 포인터의 x좌표를 트랙 위 값(0~1)으로 환산해 저장하고 화면을 갱신한다. */
  private applyPointerToRow(row: Row, pointerX: number): void {
    const value = Phaser.Math.Clamp((pointerX - row.trackLeft) / row.trackWidth, 0, 1);
    row.set(value);
    this.updateRowVisual(row);
  }

  /**
   * 손잡이 위치/트랙 채움처럼 매 프레임(드래그 중 pointermove마다) 바뀌는
   * 것만 갱신한다. 손잡이 크기·테두리는 창 크기가 바뀔 때만 바뀌므로
   * `layout()`에서 한 번만 다시 계산한다 — 드래그마다 매번 `setSize`를
   * 다시 부르는 건 낭비다.
   */
  private updateRowVisual(row: Row): void {
    const value = row.get();
    const fillWidth = Math.max(1, row.trackWidth * value);
    row.fill.setSize(fillWidth, row.track.height * 0.6).setPosition(row.trackLeft, row.track.y);
    row.handle.setPosition(row.trackLeft + fillWidth, row.track.y);
    row.pct.setText(`${Math.round(value * 100)}%`);
  }

  /** 창 크기가 바뀔 때마다(그리고 시작 시 한 번) 전부 다시 배치한다. */
  private layout(): void {
    const scale = cameraZoom(this.scale.height);
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.dim.setSize(this.scale.width, this.scale.height);
    this.panel
      .setSize(PANEL_W * scale, PANEL_H * scale)
      .setStrokeStyle(4 * scale, hex(SCREEN_COLORS.PROMPT))
      .setPosition(cx, cy);
    this.title.setPosition(cx, cy - 65 * scale).setFontSize(Math.round(18 * scale));
    this.hint.setPosition(cx, cy + 65 * scale).setFontSize(Math.round(10 * scale));

    for (const row of this.rows) {
      const rowY = cy + row.dy * scale;
      const trackLeft = cx + TRACK_DX * scale;
      row.trackLeft = trackLeft;
      row.trackWidth = TRACK_W * scale;

      row.label.setPosition(cx + LABEL_DX * scale, rowY).setFontSize(Math.round(12 * scale));
      row.track
        .setSize(TRACK_W * scale, 10 * scale)
        .setStrokeStyle(2 * scale, hex(SCREEN_COLORS.PROMPT))
        .setPosition(trackLeft, rowY);
      row.handle.setSize(10 * scale, 18 * scale).setStrokeStyle(2 * scale, COLORS.OUTLINE);
      row.pct.setPosition(cx + PCT_DX * scale, rowY).setFontSize(Math.round(12 * scale));
      this.updateRowVisual(row);
    }
  }

  private close(): void {
    this.scene.resume(this.returnKey);
    this.scene.stop();
  }
}
