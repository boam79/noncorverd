/**
 * X-Client-Token 인증 미들웨어
 */
export const authMiddleware = (req, res, next) => {
  // 헤더 이름은 대소문자 구분 없이 확인 (Express는 소문자로 변환)
  const token = req.headers['x-client-token'] || req.headers['X-Client-Token'];
  const expectedToken = process.env.CLIENT_OPENDATA_TOKEN;
  
  // 디버깅용 로그
  console.log('🔐 Auth Middleware:', {
    receivedToken: token ? `${token.substring(0, 10)}...` : 'missing',
    expectedToken: expectedToken ? `${expectedToken.substring(0, 10)}...` : 'missing',
    headers: Object.keys(req.headers).filter(h => h.toLowerCase().includes('client')),
  });

  if (!expectedToken) {
    console.warn('⚠️  CLIENT_OPENDATA_TOKEN not set in environment variables');
    return next(); // 개발 환경에서는 토큰이 없어도 통과
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

