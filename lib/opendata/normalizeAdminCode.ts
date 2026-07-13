/** 행정 시군구 코드를 6자리로 정규화 (12자리·하이픈 등 입력 대응) */

export function normalizeAdminSigunguCode(code?: string | null): string | undefined {
  if (!code) return undefined;
  const digits = String(code).replace(/\D/g, '');
  if (!digits) return undefined;
  const six = digits.slice(0, 6);
  return six.length === 6 ? six : six.padEnd(6, '0').slice(0, 6);
}
