'use client';

import { useServerReady } from '@/lib/hooks/useServerReady';

export function ServerStatusBanner() {
  const { status, showBanner, elapsedMs, dismiss } = useServerReady({
    showBannerAfterMs: 2000,  // 2초 이상 걸리면 배너 표시
    autoDismissMs: 4000,      // 준비 완료 후 4초 뒤 자동 닫기
  });

  if (!showBanner) return null;

  const seconds = Math.floor(elapsedMs / 1000);

  if (status === 'checking') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* 스피너 */}
          <div className="flex-shrink-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">서버를 시작하는 중입니다...</p>
            <p className="text-xs text-amber-100">
              무료 플랜 서버가 절전 상태에서 깨어나고 있습니다.
              {seconds > 0 && ` (${seconds}초 경과, 최대 1분 소요)`}
            </p>
          </div>
          {/* 진행 바 */}
          <div className="flex-shrink-0 hidden sm:block w-24 bg-amber-400 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-1000"
              style={{ width: `${Math.min((seconds / 60) * 100, 95)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white shadow-lg animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* 체크 아이콘 */}
          <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">서버가 준비되었습니다!</p>
            <p className="text-xs text-green-100">이제 사용하셔도 됩니다.</p>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-green-100 hover:text-white transition-colors p-1"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="flex-shrink-0 text-lg">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">서버 연결에 문제가 발생했습니다.</p>
            <p className="text-xs text-red-100">잠시 후 페이지를 새로고침해 주세요.</p>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-red-100 hover:text-white transition-colors p-1"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
