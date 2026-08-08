/**
 * Prints what each stage's hazards can reach, so the sweep's verdict can be read
 * as numbers rather than a pass/fail. Not part of the build — run it with
 * `npx tsx src/levels/audit.report.ts` when tuning a stage.
 */
import { PLAYER } from "../config";
import { levels } from "./index";
import { hazardThreat, mountSurfaceOf, mountedOn, standingBand, surfacesOf } from "./threat";

for (const [index, level] of levels.entries()) {
  console.log(`\n=== ${index + 1}스테이지 ${level.name ?? ""}`);

  const flagOk = mountedOn(level.platforms, level.goal.x, level.goal.y);
  console.log(`  깃발 x=${level.goal.x} y=${level.goal.y} — ${flagOk ? "지면에 꽂힘" : "공중"}`);

  for (const hazard of level.hazards ?? []) {
    const surface = mountSurfaceOf(hazard);
    const mount =
      surface === null
        ? "매달림"
        : mountedOn(level.platforms, hazard.x, surface)
          ? `표면 ${surface}`
          : `표면 ${surface} 없음`;

    const threat = hazardThreat(level, hazard);
    if (!threat) {
      console.log(`  ${hazard.kind}@${hazard.x} — ${mount}, 조준식(판정 제외)`);
      continue;
    }

    const hit = surfacesOf(level.platforms)
      .filter(
        (s) =>
          Math.min(threat.right, s.right) - Math.max(threat.left, s.left) >= PLAYER.BODY_WIDTH &&
          threat.band.top < standingBand(s).bottom &&
          standingBand(s).top < threat.band.bottom,
      )
      .map((s) => `표면${s.top}`);

    console.log(
      `  ${hazard.kind}@${hazard.x} — ${mount}, 위험 ${threat.band.top.toFixed(0)}~` +
        `${threat.band.bottom.toFixed(0)} (x ${threat.left.toFixed(0)}~${threat.right.toFixed(0)}) ` +
        `→ ${hit.length ? `맞힘: ${hit.join(", ")}` : "아무도 못 맞힘"}`,
    );
  }
}
