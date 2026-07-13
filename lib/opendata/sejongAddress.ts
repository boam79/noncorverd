/** 세종특별자치시 주소 판별 — `세종대로`(서울) 등 부분 문자열 오탐 방지 */

export function isSejongAddress(address?: string | null): boolean {
  const a = address == null ? '' : String(address).trim();
  if (!a) return false;
  return (
    a.includes('세종특별자치시') ||
    /(^|\s)세종시(\s|$)/.test(a) ||
    a.startsWith('세종 ')
  );
}
