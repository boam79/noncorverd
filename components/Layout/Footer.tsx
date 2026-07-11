export function Footer() {
  return (
    <footer className="section-rule mt-auto bg-surface-muted/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 text-sm text-ink-soft sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">비급여비교</p>
            <p className="mt-1 text-xs leading-relaxed">
              공공데이터포털 API를 활용한 정보 제공 서비스. 진료·가격의 최종 확인은 해당
              의료기관에 문의하세요.
            </p>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} 비급여비교 · Boam79</p>
        </div>
      </div>
    </footer>
  );
}
