import express from 'express';
import { regionsAdapter } from '../adapters/regionsAdapter.js';
import { hospitalsAdapter } from '../adapters/hospitalsAdapter.js';
import { pricingAdapter } from '../adapters/pricingAdapter.js';

const router = express.Router();

/**
 * GET /opendata/regions
 * 지역 정보 조회 (행정안전부 법정동코드)
 */
router.get('/regions', async (req, res, next) => {
  try {
    const { sido } = req.query;
    const result = await regionsAdapter.getRegions(sido);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /opendata/hospitals
 * 병원 목록 조회
 */
router.get('/hospitals', async (req, res, next) => {
  try {
    const { sido, sigungu, type } = req.query;
    const result = await hospitalsAdapter.getHospitals({ sido, sigungu, type });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /opendata/pricing
 * 비급여 가격 정보 조회
 */
router.post('/pricing', async (req, res, next) => {
  try {
    const { hospitalIds } = req.body;
    if (!Array.isArray(hospitalIds) || hospitalIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'hospitalIds must be a non-empty array',
        },
      });
    }
    const result = await pricingAdapter.getPricing(hospitalIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

