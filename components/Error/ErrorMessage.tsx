import { getErrorInfo } from '@/lib/utils/errorHandler';

interface ErrorMessageProps {
  message: string;
  error?: unknown;
  onRetry?: () => void;
}

export function ErrorMessage({ message, error, onRetry }: ErrorMessageProps) {
  const errorInfo = error ? getErrorInfo(error) : null;
  const displayMessage = errorInfo?.userMessage || message;

  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-error-600 font-medium mb-2">{displayMessage}</p>
        {errorInfo && (
          <p className="text-sm text-gray-500 mb-4">
            오류 코드: {errorInfo.code}
          </p>
        )}
        {onRetry && errorInfo?.retryable && (
          <button
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

