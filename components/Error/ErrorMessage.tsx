import { getErrorInfo } from '@/lib/utils/errorHandler';

interface ErrorMessageProps {
  message: string;
  error?: unknown;
  onRetry?: () => void;
}

const categoryLabel: Record<string, string> = {
  network: '네트워크',
  auth: '인증·권한',
  rate_limit: '요청 한도',
  server: '서버',
  timeout: '시간 초과',
  data: '데이터',
  unknown: '기타',
};

export function ErrorMessage({ message, error, onRetry }: ErrorMessageProps) {
  const errorInfo = error ? getErrorInfo(error) : null;
  const displayMessage = errorInfo?.userMessage || message;

  const borderClass =
    errorInfo?.severity === 'info'
      ? 'border-brand-200 bg-brand-50/80'
      : errorInfo?.severity === 'warning'
        ? 'border-warning-200 bg-warning-50/80'
        : 'border-error-200 bg-error-50/60';

  const titleClass =
    errorInfo?.severity === 'info'
      ? 'text-brand-900'
      : errorInfo?.severity === 'warning'
        ? 'text-warning-900'
        : 'text-error-800';

  return (
    <div className="animate-fade-in py-12 text-center">
      <div className={`mx-auto max-w-md rounded-2xl border px-6 py-8 ${borderClass}`}>
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            errorInfo?.severity === 'info'
              ? 'bg-brand-100 text-brand-700'
              : errorInfo?.severity === 'warning'
                ? 'bg-warning-100 text-warning-700'
                : 'bg-error-100 text-error-700'
          }`}
          aria-hidden="true"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {errorInfo?.severity === 'info' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            )}
          </svg>
        </div>
        <p className={`mb-2 text-base font-medium ${titleClass}`}>{displayMessage}</p>
        {errorInfo && (
          <div className="mb-3 space-y-1 text-sm text-ink-muted">
            <p>
              코드 <span className="font-mono text-ink">{errorInfo.code}</span>
              {errorInfo.category ? (
                <>
                  {' '}
                  · {categoryLabel[errorInfo.category] ?? errorInfo.category}
                </>
              ) : null}
            </p>
            {errorInfo.hint && (
              <p className="text-xs leading-relaxed text-ink-soft">{errorInfo.hint}</p>
            )}
          </div>
        )}
        {onRetry && errorInfo?.retryable && (
          <button
            type="button"
            onClick={onRetry}
            className="touch-target rounded-control bg-brand-600 px-6 py-3 text-white shadow-sm transition-colors hover:bg-brand-700"
            aria-label="다시 시도"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
