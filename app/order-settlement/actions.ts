'use server';

import { externalApiGet } from '../lib/external-api';
import { DecodeBase64 } from '../utils/base64Utils';
import type { BalanceType, Counts } from '../types/agency';

/**
 * 대리점 정산 Server Action (plink-api /api/admin-app/order-settlement, docs/admin-app/order-settlement-api.md)
 * 일자별로 확정한 값의 월 합계다. 계정별 값은 본인 발주분이고 tier-1 합계는 화면이 parentId로 묶는다.
 */

export interface SettlementAccount {
  id: string;
  loginId: string;
  name: string;
  tier: number;
  parentId: string | null;
  blocked: boolean;
  counts: Counts;
  amounts: Counts;
}

export interface MonthlySettlement {
  month: string;
  days: number;
  confirmedDays: number;
  lastConfirmedDate: string | null;
  prices: Partial<Record<BalanceType, number[]>>;
  accounts: SettlementAccount[];
}

export interface SettlementResult {
  ok: boolean;
  error: string | null;
  data: MonthlySettlement | null;
}

export async function getMonthlySettlement(month: string): Promise<SettlementResult> {
  const res = await externalApiGet<MonthlySettlement & { ret?: number; error?: string }>('/api/admin-app/order-settlement', { month });
  if (res.error || !res.data || res.data.ret !== 0) {
    return { ok: false, error: res.error || res.data?.error || '정산 자료를 불러오지 못했습니다.', data: null };
  }
  const { month: m, days, confirmedDays, lastConfirmedDate, prices, accounts } = res.data;
  return {
    ok: true,
    error: null,
    data: {
      month: m,
      days,
      confirmedDays,
      lastConfirmedDate,
      prices,
      accounts: accounts.map((a) => ({ ...a, name: DecodeBase64(a.name ?? '') })),
    },
  };
}
