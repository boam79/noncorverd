export type OpendataRouteKey = 'regions' | 'hospitals' | 'pricing';

const requestCounts = new Map<string, number>();

/**
 * 집계용(메모리). 서버리스 인스턴스별로 분리될 수 있으니 운영 관측은 외부 로그·APM을 함께 쓰는 것이 좋습니다.
 */
export function recordOpendataRequest(route: OpendataRouteKey, httpStatus: number): void {
  const key = `${route}:${httpStatus}`;
  requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
}

export function getOpendataMetricsSnapshot(): {
  generatedAt: string;
  requestCounts: Record<string, number>;
} {
  return {
    generatedAt: new Date().toISOString(),
    requestCounts: Object.fromEntries(requestCounts.entries()),
  };
}

/** Vitest 등에서만 사용 */
export function __resetOpendataMetricsForTests(): void {
  requestCounts.clear();
}
