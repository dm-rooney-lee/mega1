import { describe, expect, it } from "vitest";
import { standOnSurface } from "./mount";

/**
 * Stands in for a sprite drawn from an oversized texture: `height` is in texture
 * pixels while `displayHeight` is the logical size it occupies. Mounting is
 * correct exactly when it reads the latter — reading `height` is what left the
 * turret hanging in mid-air.
 */
function spriteAt(displayHeight: number) {
  return {
    displayHeight,
    height: displayHeight * 4,
    x: 0,
    y: 0,
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    },
  };
}

describe("standOnSurface", () => {
  it("[Happy] 밑동이 표면에 닿도록 중심을 절반 높이만큼 올린다", () => {
    const sprite = spriteAt(30);
    standOnSurface(sprite, 600, 496);
    expect(sprite.x).toBe(600);
    expect(sprite.y + sprite.displayHeight / 2).toBe(496);
  });

  it("[Boundary] 텍스처 높이가 아니라 논리 높이를 쓴다", () => {
    const sprite = spriteAt(30);
    standOnSurface(sprite, 0, 400);
    // 텍스처 높이(120)를 썼다면 340이 되어 45px 공중에 뜬다.
    expect(sprite.y).toBe(385);
  });

  it("[Boundary] 높이가 0이면 표면에 그대로 놓는다", () => {
    const sprite = spriteAt(0);
    standOnSurface(sprite, 10, 200);
    expect(sprite.y).toBe(200);
  });
});
