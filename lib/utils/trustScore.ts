import type { HospitalPricing } from '@/types';

export interface TrustScoreResult {
  score: number;
  label: string;
  hints: string[];
}

/**
 * 공공 비급여 데이터의 표시용 신뢰도(휴리스틱). 법적·의학적 품질을 보증하지 않습니다.
 */
export function computeHospitalDataTrust(pricing: HospitalPricing): TrustScoreResult {
  const hints: string[] = [];
  let score = 0;
  const items = pricing.items || [];
  const n = items.length;

  if (n === 0) {
    return {
      score: 0,
      label: '낮음',
      hints: ['비급여 항목이 없습니다. 기관 미등록 또는 API 미제공일 수 있습니다.'],
    };
  }

  score += 22;
  hints.push(`항목 ${n}건`);

  if (n >= 20) {
    score += 18;
    hints.push('항목 수 풍부');
  } else if (n >= 8) {
    score += 12;
  } else if (n >= 3) {
    score += 6;
  }

  const withCode = items.filter((x) => x.code && String(x.code).trim()).length;
  if (n > 0 && withCode / n >= 0.25) {
    score += 20;
    hints.push('행정 코드 비율 양호');
  }

  const withDates = items.filter((x) => x.startDate || x.endDate).length;
  if (n > 0 && withDates / n >= 0.35) {
    score += 18;
    hints.push('적용기간 정보 충분');
  }

  if ((pricing.averagePrice ?? 0) > 0) {
    score += 12;
    hints.push('평균가 제공');
  }

  const capped = Math.min(100, Math.round(score));
  let label = '보통';
  if (capped >= 72) label = '높음';
  else if (capped >= 42) label = '양호';

  return { score: capped, label, hints };
}
