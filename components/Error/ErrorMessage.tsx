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
      ? 'border-blue-200 bg-blue-50/80'
      : errorInfo?.severity === 'warning'
        ? 'border-amber-200 bg-amber-50/80'
        : 'border-red-100 bg-red-50/50';

  return (
    <div className="text-center py-12 animate-fade-in">
      <div className={`max-w-md mx-auto rounded-2xl border px-6 py-8 ${borderClass}`}>
        <div className="text-5xl mb-3" aria-hidden="true">
          {errorInfo?.severity === 'info' ? 'ℹ️' : '⚠️'}
        </div>
        <p
          className={`font-medium mb-2 text-base ${
            errorInfo?.severity === 'info'
              ? 'text-blue-900'
              : errorInfo?.severity === 'warning'
                ? 'text-amber-900'
                : 'text-red-800'
          }`}
        >
          {displayMessage}
        </p>
        {errorInfo && (
          <div className="text-sm text-gray-600 mb-3 space-y-1">
            <p>
              코드 <span className="font-mono text-gray-800">{errorInfo.code}</span>
              {errorInfo.category ? (
                <>
                  {' '}
                  · {categoryLabel[errorInfo.category] ?? errorInfo.category}
                </>
              ) : null}
            </p>
            {errorInfo.hint && (
              <p className="text-xs text-gray-500 leading-relaxed">{errorInfo.hint}</p>
            )}
          </div>
        )}
        {onRetry && errorInfo?.retryable && (
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 touch-target transition-colors shadow-md hover:shadow-lg"
            aria-label="다시 시도"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
