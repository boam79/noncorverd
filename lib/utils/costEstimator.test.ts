import { describe, expect, it } from 'vitest';
import {
  calculateEstimatedTotalForHospital,
  calculateEstimatedTotalsByHospital,
  getItemQuantity,
} from '@/lib/utils/costEstimator';
import type { HospitalPricing } from '@/types';

describe('getItemQuantity', () => {
  it('defaults to 1 when the quantity is not set', () => {
    expect(getItemQuantity({}, '초음파')).toBe(1);
  });

  it('floors fractional quantities', () => {
    expect(getItemQuantity({ 초음파: 2.9 }, '초음파')).toBe(2);
  });

  it('clamps negative quantities to 0', () => {
    expect(getItemQuantity({ 초음파: -3 }, '초음파')).toBe(0);
  });

  it('treats NaN/Infinity as the default of 1', () => {
    expect(getItemQuantity({ 초음파: NaN }, '초음파')).toBe(1);
    expect(getItemQuantity({ 초음파: Infinity }, '초음파')).toBe(1);
  });
});

describe('calculateEstimatedTotalForHospital', () => {
  const hospital: HospitalPricing = {
    hospitalId: 'h1',
    hospitalName: '병원',
    items: [
      { id: '1', name: '초음파', price: 10000 },
      { id: '2', name: '엑스레이', price: 5000 },
    ],
  };

  it('sums price * default quantity (1) when no quantities are given', () => {
    expect(calculateEstimatedTotalForHospital(hospital, {})).toBe(15000);
  });

  it('applies custom quantities per item name', () => {
    expect(
      calculateEstimatedTotalForHospital(hospital, { 초음파: 3, 엑스레이: 0 })
    ).toBe(30000);
  });

  it('returns 0 for a hospital with no items', () => {
    expect(
      calculateEstimatedTotalForHospital({ hospitalId: 'h2', hospitalName: '병원2', items: [] }, {})
    ).toBe(0);
  });
});

describe('calculateEstimatedTotalsByHospital', () => {
  it('computes totals keyed by hospitalId for multiple hospitals', () => {
    const pricingData: HospitalPricing[] = [
      { hospitalId: 'h1', hospitalName: 'A', items: [{ id: '1', name: 'x', price: 1000 }] },
      { hospitalId: 'h2', hospitalName: 'B', items: [{ id: '1', name: 'x', price: 2000 }] },
    ];
    expect(calculateEstimatedTotalsByHospital(pricingData, { x: 2 })).toEqual({
      h1: 2000,
      h2: 4000,
    });
  });
});
