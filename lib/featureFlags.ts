/**
 * 클라이언트에서 읽는 UI 플래그. 빌드 시 인라인됨.
 */
export function isUiV2BetaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_UI_V2_BETA === '1';
}
