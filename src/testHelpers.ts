/**
 * 메모리 기반 가짜 Storage. 이 프로젝트의 vitest 기본 환경(node)에는 전역
 * localStorage가 없어(Node 24로 확인, jsdom도 미설치) 테스트마다 이걸 주입한다.
 * `settings.test.ts`와 `audio.test.ts`가 함께 쓴다.
 */
export function fakeLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  } as Storage;
}
