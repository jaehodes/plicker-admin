'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { selectClass, secondaryButtonClass } from '../components/Modal';
import { BALANCE_TYPES, BALANCE_TYPE_SHORT_LABELS, type Counts } from '../types/agency';
import { kstToday } from '../utils/kstDate';
import { getMonthlySettlement, type MonthlySettlement, type SettlementAccount } from './actions';

const cardClass = 'bg-white rounded-xl border border-slate-200 overflow-hidden';
const thClass = 'px-3 py-2 font-medium';
const tdNum = 'px-3 py-2 text-right tabular-nums';

const zero = (): Counts => ({ quiz1: 0, quiz2: 0, direction: 0 });
const add = (a: Counts, b: Counts): Counts => ({ quiz1: a.quiz1 + b.quiz1, quiz2: a.quiz2 + b.quiz2, direction: a.direction + b.direction });
const sum = (c: Counts) => c.quiz1 + c.quiz2 + c.direction;

/** "2026-11-01" → "11월 1일" */
const monthDay = (date: string) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;

interface Totals {
  counts: Counts;
  amounts: Counts;
}

/**
 * 대리점 월 정산. 일자별로 확정한 값(plink-api order_settlement_items)만 더하므로 확정한 금액은 단가를 바꿔도 변하지 않는다.
 * - tier-1 행: 하위 계정(tier-2와 그 아래 tier-3) 발주 합계. tier-1은 발주하지 않지만 본인 발주가 있으면 함께 더한다.
 * - 펼친 행: 계정이 직접 발주한 물량. 펼친 행을 모두 더하면 tier-1 행과 같다.
 */
export default function OrderSettlementClient() {
  const thisMonth = kstToday().slice(0, 7);
  const [month, setMonth] = useState(thisMonth); // YYYY-MM
  // 결과에 요청 월을 붙여 두고, 지금 월과 다르면 불러오는 중으로 본다
  const [result, setResult] = useState<{ month: string; data: MonthlySettlement | null; error: string | null } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    getMonthlySettlement(month)
      .then((r) => !cancelled && setResult({ month, data: r.data, error: r.error }))
      .catch(() => !cancelled && setResult({ month, data: null, error: '정산 자료를 불러오지 못했습니다.' }));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const current = result?.month === month ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  const { tier1s, childrenOf, totalsOf, grand } = useMemo(() => {
    const accounts = data?.accounts ?? [];
    const childrenOf = new Map<string, SettlementAccount[]>();
    for (const a of accounts) {
      if (!a.parentId) continue;
      childrenOf.set(a.parentId, [...(childrenOf.get(a.parentId) ?? []), a]);
    }
    const totals = new Map<string, Totals>();
    const totalOf = (a: SettlementAccount): Totals => {
      const cached = totals.get(a.id);
      if (cached) return cached;
      let t: Totals = { counts: a.counts, amounts: a.amounts };
      for (const c of childrenOf.get(a.id) ?? []) {
        const ct = totalOf(c);
        t = { counts: add(t.counts, ct.counts), amounts: add(t.amounts, ct.amounts) };
      }
      totals.set(a.id, t);
      return t;
    };
    const tier1s = accounts.filter((a) => a.tier === 1);
    const grand = tier1s.reduce<Totals>((g, a) => {
      const t = totalOf(a);
      return { counts: add(g.counts, t.counts), amounts: add(g.amounts, t.amounts) };
    }, { counts: zero(), amounts: zero() });
    return { tier1s, childrenOf, totalsOf: totalOf, grand };
  }, [data]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const expandable = tier1s.filter((a) => (childrenOf.get(a.id) ?? []).length > 0);
  const allExpanded = expandable.length > 0 && expandable.every((a) => expanded.has(a.id));

  const colCount = 1 + (BALANCE_TYPES.length + 1) * 2;

  const numCells = (t: Totals, muted = false) => {
    const cell = (v: number, key: string) => (
      <td key={key} className={`${tdNum} ${v === 0 ? 'text-slate-300' : muted ? 'text-slate-600' : ''}`}>{v === 0 ? '-' : v.toLocaleString()}</td>
    );
    return (
      <>
        {BALANCE_TYPES.map((type) => (
          <Fragment key={type}>
            {cell(t.counts[type], `${type}-c`)}
            {cell(t.amounts[type], `${type}-a`)}
          </Fragment>
        ))}
        {cell(sum(t.counts), 'sum-c')}
        {cell(sum(t.amounts), 'sum-a')}
      </>
    );
  };

  const accountLabel = (a: SettlementAccount) => (
    <>
      <span className="font-medium text-gray-900">{a.name}</span>
      <span className="ml-1.5 text-xs text-slate-400">{a.loginId}</span>
      <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">tier-{a.tier}</span>
      {a.blocked && <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">차단</span>}
    </>
  );

  const priceText = (prices: number[] | undefined) => (prices && prices.length > 0 ? `${prices.join('·')}원` : '-');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대리점 정산</h1>
          <p className="text-sm text-slate-500 mt-1">
            하위 계정이 발주한 물량 중 수행이 완료된 건수와 금액(건수 × 그날 플랫폼 단가)입니다. 하루 단위로 확정되며, 확정한 값은 단가를 바꿔도 변하지 않습니다.
          </p>
        </div>
        <input type="month" value={month} max={thisMonth} onChange={(e) => setMonth(e.target.value)} className={selectClass} aria-label="정산 월" />
      </div>

      {data && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-slate-500">확정</span>{' '}
            <span className={`font-semibold ${data.confirmedDays === data.days ? 'text-emerald-600' : 'text-amber-600'}`}>
              {data.confirmedDays}/{data.days}일
            </span>
            {data.confirmedDays < data.days && (
              <span className="ml-2 text-xs text-slate-400">
                {data.lastConfirmedDate ? `${monthDay(data.lastConfirmedDate)}까지 확정. ` : ''}전날 기록은 매일 04시 이후 확정됩니다.
              </span>
            )}
          </div>
          <div className="text-slate-500">
            적용 단가{' '}
            {BALANCE_TYPES.map((type, i) => (
              <span key={type}>
                {i > 0 && ' · '}
                {BALANCE_TYPE_SHORT_LABELS[type]} <span className="text-gray-900">{priceText(data.prices[type])}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-900">tier-1별 정산</span>
          {expandable.length > 0 && (
            <button
              type="button"
              className={`${secondaryButtonClass} !px-3 !py-1 !text-xs`}
              onClick={() => setExpanded(allExpanded ? new Set() : new Set(expandable.map((a) => a.id)))}
            >
              {allExpanded ? '모두 접기' : '모두 펼치기'}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th rowSpan={2} className={`${thClass} text-left align-bottom`}>대리점</th>
                {BALANCE_TYPES.map((type) => (
                  <th key={type} colSpan={2} className={`${thClass} text-center border-l border-slate-200`}>{BALANCE_TYPE_SHORT_LABELS[type]}</th>
                ))}
                <th colSpan={2} className={`${thClass} text-center border-l border-slate-200`}>합계</th>
              </tr>
              <tr>
                {[...BALANCE_TYPES, 'sum'].map((key) => (
                  <Fragment key={key}>
                    <th className={`${thClass} text-right border-l border-slate-200`}>건수</th>
                    <th className={`${thClass} text-right`}>금액(원)</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!data ? (
                <tr>
                  <td colSpan={colCount} className={`px-4 py-8 text-center ${error ? 'text-red-500' : 'text-slate-400'}`}>{error ?? '불러오는 중...'}</td>
                </tr>
              ) : tier1s.length === 0 ? (
                <tr><td colSpan={colCount} className="px-4 py-8 text-center text-slate-400">대리점이 없습니다</td></tr>
              ) : (
                <>
                  {tier1s.map((t1) => {
                    const tier2s = childrenOf.get(t1.id) ?? [];
                    const open = expanded.has(t1.id);
                    return (
                      <Fragment key={t1.id}>
                        <tr className={tier2s.length > 0 ? 'cursor-pointer hover:bg-slate-50' : ''} onClick={tier2s.length > 0 ? () => toggle(t1.id) : undefined}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="inline-block w-4 text-slate-400">{tier2s.length > 0 ? (open ? '▾' : '▸') : ''}</span>
                            {accountLabel(t1)}
                          </td>
                          {numCells(totalsOf(t1))}
                        </tr>
                        {open && sum(t1.counts) > 0 && (
                          <tr className="bg-slate-50/60">
                            <td className="pl-10 pr-3 py-1.5 whitespace-nowrap text-xs text-slate-500">본인 발주</td>
                            {numCells({ counts: t1.counts, amounts: t1.amounts }, true)}
                          </tr>
                        )}
                        {open &&
                          tier2s.map((t2) => (
                            <Fragment key={t2.id}>
                              <tr className="bg-slate-50/60">
                                <td className="pl-10 pr-3 py-1.5 whitespace-nowrap">{accountLabel(t2)}</td>
                                {numCells({ counts: t2.counts, amounts: t2.amounts }, true)}
                              </tr>
                              {(childrenOf.get(t2.id) ?? []).map((t3) => (
                                <tr key={t3.id} className="bg-slate-50/60">
                                  <td className="pl-16 pr-3 py-1.5 whitespace-nowrap">
                                    <span className="text-slate-300 mr-1">└</span>
                                    {accountLabel(t3)}
                                  </td>
                                  {numCells({ counts: t3.counts, amounts: t3.amounts }, true)}
                                </tr>
                              ))}
                            </Fragment>
                          ))}
                      </Fragment>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-3 py-2">합계</td>
                    {numCells(grand)}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {data && expandable.length > 0 && (
          <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
            펼친 행은 각 계정이 직접 발주한 물량입니다(tier-2 행에 하위 tier-3 발주는 들어가지 않습니다).
          </p>
        )}
      </div>
    </div>
  );
}
