/**
 * 레벨 데이터의 공유 타입. 레벨 파일·씬·유틸이 공통으로 참조한다.
 * 좌표는 월드 픽셀. 발판은 왼쪽 위 모서리 + 크기로 지정.
 */
export interface Vec2 {
  x: number;
  y: number;
}

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 표면 위에 놓이는 가시. width는 32px 타일 개수. */
export interface SpikeDef {
  x: number;
  y: number;
  tiles: number;
}

/** 대포. (x, y)는 대포알이 생성되는 발사원이자 사격선 높이. */
export interface CannonDef {
  x: number;
  y: number;
  direction: "left" | "right";
  /** 미지정 시 config의 기본 발사 간격 사용. */
  intervalMs?: number;
}

export interface LevelDef {
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Vec2;
  platforms: PlatformDef[];
  enemies: Vec2[];
  spikes: SpikeDef[];
  goal: Vec2;
  /** 없으면 대포 없음. */
  cannons?: CannonDef[];
  /** 방패 아이템 스폰 위치들. */
  shields?: Vec2[];
}
