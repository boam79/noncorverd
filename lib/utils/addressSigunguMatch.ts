/**
 * 시군구 필터: 주소 문자열에 `includes('양주시')`만 쓰면 `남양주시`에 오탐됩니다.
 * regions API의 전체 명칭(예: 경기도 양주시)을 우선하고, 없을 때만 경계 있는 일치를 씁니다.
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param address 병원 주소(yadmNm 주소 등)
 * @param officialName regions 응답 `Region.name`(예: 경기도 양주시)
 * @param cleanName 시·도 접두 제거 후(예: 양주시)
 */
export function hospitalAddressMatchesSigungu(
  address: string | undefined,
  officialName: string,
  cleanName: string
): boolean {
  if (!address) return false;
  const addr = address.replace(/\s+/g, ' ').trim();
  const official = officialName.replace(/\s+/g, ' ').trim();
  const clean = cleanName.replace(/\s+/g, ' ').trim();
  if (!clean) return false;

  if (official.length >= 3 && addr.includes(official)) {
    return true;
  }

  const addrC = addr.replace(/\s/g, '');
  const officialC = official.replace(/\s/g, '');
  if (official.length >= 3 && officialC.length >= 3 && addrC.includes(officialC)) {
    return true;
  }

  for (const part of addr.split(/\s+/)) {
    if (part === clean) return true;
  }

  // 공백 없이 붙은 주소: 앞에 다른 시군구 음절이 붙지 않도록 단어 경계(공백/문장 처음·끝)만 허용
  const re = new RegExp(`(^|\\s)${escapeRegExp(clean)}(\\s|$)`, 'u');
  if (re.test(addr)) return true;

  return false;
}
