/**
 * 전역 에러 핸들러
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // 이미 응답이 전송된 경우
  if (res.headersSent) {
    return next(err);
  }

  // 표준 응답 포맷
  res.status(err.status || 500).json({
    ok: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
};

