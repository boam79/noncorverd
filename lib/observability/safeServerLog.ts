/**
 * 사용자 검색어·쿼리스트링 원문을 남기지 않고 라우트 단위로만 기록합니다.
 */
export function logRouteError(route: string, err: unknown): void {
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown';
  console.error(
    JSON.stringify({
      route,
      level: 'error',
      message: message.slice(0, 500),
    })
  );
}
