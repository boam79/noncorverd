/**
 * X-Client-Token 인증 미들웨어
 */
export const authMiddleware = (req, res, next) => {
  // 헤더 이름은 대소문자 구분 없이 확인 (Express는 소문자로 변환)
  const token = req.headers['x-client-token'] || req.headers['X-Client-Token'];
  const expectedToken = process.env.CLIENT_OPENDATA_TOKEN;

  if (!expectedToken) {
    // fail-closed: 서버에 토큰이 설정되지 않았다면 인증을 우회시키지 않고 거부합니다.
    // (과거에는 여기서 next()로 통과시켜 운영에서 토큰 미설정 시 인증이 완전히
    //  무력화되는 문제가 있었습니다.)
    console.error('❌ CLIENT_OPENDATA_TOKEN not set in environment variables — rejecting all requests');
    return res.status(500).json({
      ok: false,
      error: {
        code: 'SERVER_MISCONFIGURED',
        message: '서버 인증 설정이 완료되지 않았습니다.',
      },
    });
  }

  if (!token || token !== expectedToken) {
    return res.status(401).json({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing X-Client-Token',
      },
    });
  }

  next();
};

