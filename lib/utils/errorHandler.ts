/**
 * 클라이언트 사이드 에러 핸들링 유틸리티
 */

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export function getErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    // 네트워크 에러
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: '네트워크 연결을 확인해주세요.',
        retryable: true,
      };
    }

    // 타임아웃 에러
    if (error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: error.message,
        userMessage: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        retryable: true,
      };
    }

    // 일반 에러
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: '알 수 없는 오류',
    userMessage: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryable: true,
  };
}

/**
 * 에러 로깅 (향후 Sentry 연동 시 사용)
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context);
  }
  // TODO: Sentry.captureException(error, { extra: context });
}

