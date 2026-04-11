import type { Page } from '@playwright/test';

/**
 * Playwright가 Next만 띄울 때 클라이언트가 `localhost:3001/opendata`로 가면 시도 목록이 비어
 * 비교 플로우 E2E가 실패합니다. 공통 응답을 네트워크 레벨에서 고정합니다.
 */
export async function installComparisonFlowMocks(page: Page): Promise<void> {
  await page.route(/\/opendata\/regions/, async (route) => {
    const url = new URL(route.request().url());
    const sidoParam = url.searchParams.get('sido');
    const body =
      sidoParam === '11'
        ? JSON.stringify({
            ok: true,
            data: [{ code: '111100000000', name: '종로구' }],
          })
        : JSON.stringify({
            ok: true,
            data: [{ code: '11', name: '서울특별시' }],
          });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    });
  });

  await page.route(/\/opendata\/hospitals/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: [
          {
            id: 'e2e-mock-1',
            name: 'E2E모의종합병원가',
            address: '서울특별시 종로구 청와대로 1',
            type: '종합병원',
            clCdNm: '종합병원',
            departments: ['내과', '외과'],
          },
          {
            id: 'e2e-mock-2',
            name: 'E2E모의종합병원나',
            address: '서울특별시 종로구 세종대로 1',
            type: '종합병원',
            clCdNm: '종합병원',
            departments: ['내과'],
          },
        ],
      }),
    });
  });

  await page.route(/\/opendata\/pricing/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let hospitalIds: string[] = [];
    try {
      const json = route.request().postDataJSON() as {
        hospitalIds?: string[];
      };
      hospitalIds = json.hospitalIds ?? [];
    } catch {
      hospitalIds = [];
    }
    const data = hospitalIds.map((id, idx) => ({
      hospitalId: id,
      hospitalName: `E2E병원${idx + 1}`,
      items: [
        { id: 'it1', name: '초음파', price: 120000 + idx * 5000, code: 'P1' },
        { id: 'it2', name: '초음파진단', price: 80000, code: 'P2' },
      ],
      averagePrice: 100000 + idx * 1000,
      totalItems: 2,
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data }),
    });
  });
}

/** 관심 분야(산부인과) + 추천 버튼 E2E용 */
export async function installObstetricsRecommendMocks(page: Page): Promise<void> {
  await page.route(/\/opendata\/regions/, async (route) => {
    const url = new URL(route.request().url());
    const sidoParam = url.searchParams.get('sido');
    const body =
      sidoParam === '11'
        ? JSON.stringify({
            ok: true,
            data: [{ code: '111100000000', name: '종로구' }],
          })
        : JSON.stringify({
            ok: true,
            data: [{ code: '11', name: '서울특별시' }],
          });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    });
  });

  await page.route(/\/opendata\/hospitals/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: [
          {
            id: 'mock-ob-1',
            name: '모의산부인과병원',
            address: '서울특별시 종로구',
            type: '병원',
            departments: ['산부인과'],
          },
          {
            id: 'mock-ob-2',
            name: '모의테스트산부인과',
            address: '서울특별시 종로구',
            type: '병원',
            departments: [],
            dgsbjtCdRaw: '05',
          },
        ],
      }),
    });
  });

  await page.route(/\/opendata\/pricing/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: [
          {
            hospitalId: 'mock-ob-1',
            hospitalName: '모의산부인과병원',
            items: [
              { id: 'i1', name: '초음파', price: 50000, code: 'X1' },
              { id: 'i2', name: '산전검사', price: 70000, code: 'X2' },
            ],
            averagePrice: 60000,
            totalItems: 2,
          },
          {
            hospitalId: 'mock-ob-2',
            hospitalName: '모의테스트산부인과',
            items: [{ id: 'i1', name: '초음파', price: 55000, code: 'X1' }],
            averagePrice: 55000,
            totalItems: 1,
          },
        ],
      }),
    });
  });
}
