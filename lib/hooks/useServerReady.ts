'use client';

import { useState, useEffect, useRef } from 'react';

export type ServerStatus = 'idle' | 'checking' | 'ready' | 'error';

interface UseServerReadyOptions {
  /** 배너를 보여주기 시작할 지연 시간 (ms). 이 시간 이내에 응답하면 배너를 아예 표시하지 않음 */
  showBannerAfterMs?: number;
  /** 준비 완료 배너를 자동으로 숨길 시간 (ms) */
  autoDismissMs?: number;
  /** health check URL */
  healthUrl?: string;
}

export function useServerReady({
  showBannerAfterMs = 2000,
  autoDismissMs = 4000,
  healthUrl = '/api/opendata/regions',
}: UseServerReadyOptions = {}) {
  const [status, setStatus] = useState<ServerStatus>('idle');
  const [showBanner, setShowBanner] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setStatus('checking');

    // showBannerAfterMs 이후에도 응답 없으면 배너 표시
    const showTimer = setTimeout(() => {
      setShowBanner(true);
    }, showBannerAfterMs);

    // 경과 시간 카운터 (배너 표시 중일 때 초 단위 업데이트)
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);

    const controller = new AbortController();

    fetch(healthUrl, {
      method: 'GET',
      headers: { 'X-Client-Token': process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN || 'dev-client-token-12345' },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        clearTimeout(showTimer);
        if (timerRef.current) clearInterval(timerRef.current);

        const elapsed = Date.now() - startTimeRef.current;
        setElapsedMs(elapsed);
        setStatus('ready');

        // 빠르게 응답했으면 배너를 보여준 적 없으므로 그냥 종료
        if (elapsed < showBannerAfterMs) {
          setShowBanner(false);
          return;
        }

        // 느렸으면 "준비 완료" 배너를 잠깐 보여주고 자동 닫기
        setShowBanner(true);
        dismissTimerRef.current = setTimeout(() => {
          setShowBanner(false);
        }, autoDismissMs);
        
        return data;
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        clearTimeout(showTimer);
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus('error');
        setShowBanner(true);
      });

    return () => {
      controller.abort();
      clearTimeout(showTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    setShowBanner(false);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  return { status, showBanner, elapsedMs, dismiss };
}
