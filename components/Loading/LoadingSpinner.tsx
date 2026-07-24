export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label="로딩 중">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
    </div>
  );
}
