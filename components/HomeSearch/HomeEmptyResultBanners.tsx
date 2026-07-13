interface HomeEmptyResultBannersProps {
  noApiHospitalRows: boolean;
  clinicalFocusExcludedAll: boolean;
  noResultsAfterRegionOrNameFilter: boolean;
  orphanSigungu?: boolean;
  clinicalFocusLabel: string;
  allHospitalCount: number;
  onClearClinicalFocus: () => void;
  onClearSigungu?: () => void;
}

export function HomeEmptyResultBanners({
  noApiHospitalRows,
  clinicalFocusExcludedAll,
  noResultsAfterRegionOrNameFilter,
  orphanSigungu = false,
  clinicalFocusLabel,
  allHospitalCount,
  onClearClinicalFocus,
  onClearSigungu,
}: HomeEmptyResultBannersProps) {
  return (
    <>
      {orphanSigungu && (
        <div
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">선택한 시군구 코드가 목록에 없어요.</p>
          <p className="mt-1 text-amber-900/90">
            주소나 공유 링크의 시군구 값이 더 이상 유효하지 않을 수 있어요. 시군구를 다시
            고르면 목록이 갱신됩니다.
          </p>
          {onClearSigungu && (
            <button
              type="button"
              onClick={onClearSigungu}
              className="mt-3 text-sm font-semibold text-amber-950 underline decoration-amber-600"
            >
              시군구 선택 지우기
            </button>
          )}
        </div>
      )}
      {noApiHospitalRows && (
        <div
          className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
          role="status"
        >
          <p className="font-medium">이 조건으로는 아직 보여드릴 병원이 없어요.</p>
          <p className="mt-1 text-sky-900/90">
            시·군·구나 병원 이름을 조금만 바꿔 보시거나, 잠시 뒤에 다시 눌러 주세요. 등록된 병원이
            적은 지역이거나, 한 번에 가져오는 수에 제한이 있을 수 있어요.
          </p>
        </div>
      )}
      {clinicalFocusExcludedAll && (
        <div
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          <p className="font-medium">
            「{clinicalFocusLabel}」에 잘 맞는 병원을 목록에서 찾지 못했어요.
          </p>
          <p className="mt-1 text-amber-800">
            가져온 병원 {allHospitalCount}곳 가운데 조건에 딱 맞는 곳이 없었어요. 이름·진료 정보로
            추정한 부분이라 실제와 다를 수 있으니 가볍게 참고만 해 주세요.
          </p>
          <button
            type="button"
            onClick={onClearClinicalFocus}
            className="mt-3 text-sm font-semibold text-amber-950 underline decoration-amber-600 hover:text-amber-700"
          >
            관심 분야 접기
          </button>
        </div>
      )}
      {noResultsAfterRegionOrNameFilter && (
        <div
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          <p className="font-medium">
            찾아온 병원 {allHospitalCount}곳 모두, 선택하신 지역·이름 조건과는 맞지 않았어요.
          </p>
          <p className="mt-1 text-amber-800">
            시·군·구를 넓혀 보시거나, 병원 이름 검색을 짧게(또는 비우고) 다시 엔터를 눌러 보시면
            목록이 나올 수 있어요.
          </p>
        </div>
      )}
    </>
  );
}
