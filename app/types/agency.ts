/**
 * 대리점(order_users) 계정·건수·단가 타입과 라벨.
 * plink-api 문서: docs/admin-app/order-users-api.md, 설계: 모노리포 docs/balance.md
 * - 잔액은 원이 아니라 유형별 건수다. 시스템은 건수만 옮기고 돈은 오프라인으로 처리한다.
 * - API의 이름·memo·사유는 base64이며, Server Action(actions.ts)에서 복원해 넘긴다.
 */

export type BalanceType = 'quiz1' | 'quiz2' | 'direction';

export const BALANCE_TYPES: BalanceType[] = ['quiz1', 'quiz2', 'direction'];

export const BALANCE_TYPE_LABELS: Record<BalanceType, string> = {
  quiz1: '유입미션(퀴즈1)',
  quiz2: '유입미션(퀴즈2)',
  direction: '길찾기 미션',
};

export const BALANCE_TYPE_SHORT_LABELS: Record<BalanceType, string> = {
  quiz1: '퀴즈1',
  quiz2: '퀴즈2',
  direction: '길찾기',
};

export const isBalanceType = (v: unknown): v is BalanceType => v === 'quiz1' || v === 'quiz2' || v === 'direction';

/** 유형별 건수 */
export type Counts = Record<BalanceType, number>;

/** 유형별 단가(원). 정해지지 않은 유형은 null */
export type Prices = Record<BalanceType, number | null>;

export type ActorType = 'admin' | 'order_user' | 'system';

export interface AccountRef {
  id: string;
  loginId: string;
  name: string;
}

export interface AgencyUser {
  id: string;
  loginId: string;
  name: string;
  tier: number;
  parentId: string | null;
  parent: AccountRef | null;
  blocked: boolean;
  /** admin | system(CLI) | order_user(부모) */
  blockedByType: ActorType | null;
  blockedAt: string | null;
  blockedReason: string | null;
  /** 본인은 차단되지 않았지만 상위 계정이 차단됨 */
  blockedByAncestor: boolean;
  availableCounts: Counts;
  /** tier-1은 플랫폼 단가, 나머지는 부모가 정한 단가 */
  prices: Prices;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface BlockHistory {
  id: number;
  action: 'block' | 'unblock';
  reason: string | null;
  actorType: ActorType;
  actorId: string | null;
  createdAt: string;
}

export type LedgerKind =
  | 'issue' | 'transfer' | 'reclaim' | 'convert' | 'adjust'
  | 'order_charge' | 'order_refund' | 'order_adjust';

/** 한 계정의 잔액 변동 항목 */
export interface LedgerEntry {
  id: number;
  eventId: string;
  kind: LedgerKind;
  type: BalanceType;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  counterparty: AccountRef | null;
  fromPrice: number | null;
  toPrice: number | null;
  platformPrice: number;
  toType: BalanceType | null;
  toCount: number | null;
  belowCostConfirmed: boolean | null;
  orderId: string | null;
  changeRequestId: number | null;
  sourceEventId: string | null;
  memo: string | null;
  actorType: ActorType;
  actorId: string | null;
  createdAt: string;
}

/** 원장 이벤트 (보낸 쪽 → 받은 쪽). from/to가 null이면 시스템 밖(플랫폼 적립, 발주 소비) */
export interface BalanceEvent {
  id: string;
  kind: LedgerKind;
  type: BalanceType;
  count: number;
  from: AccountRef | null;
  to: AccountRef | null;
  toType: BalanceType | null;
  toCount: number | null;
  fromPrice: number | null;
  toPrice: number | null;
  platformPrice: number;
  belowCostConfirmed: boolean | null;
  orderId: string | null;
  sourceEventId: string | null;
  memo: string | null;
  actorType: ActorType;
  actorId: string | null;
  createdAt: string;
}

export interface InvertedChild {
  userId: string;
  name: string;
  price: number;
  parentId?: string;
}

export interface PriceHistory {
  id: number;
  type: BalanceType;
  price: number;
  /** 설정한 부모의 그때 단가 */
  setterPrice: number | null;
  /** 그 변경으로 역전이 생긴 자식 */
  invertedChildren: InvertedChild[];
  memo: string | null;
  actorType: ActorType;
  actorId: string | null;
  createdAt: string;
}

export type PriceChange = Partial<Record<BalanceType, { before: number | null; after: number; invertedChildren: InvertedChild[] }>>;

export type PeriodFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export const PERIOD_OPTIONS: { key: PeriodFilter | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'today', label: '오늘' },
  { key: 'yesterday', label: '어제' },
  { key: 'week', label: '이번주' },
  { key: 'month', label: '이번달' },
  { key: 'custom', label: '기간 설정' },
];

export const LEDGER_KIND_OPTIONS: { value: 'all' | LedgerKind; label: string }[] = [
  { value: 'all', label: '전체 종류' },
  { value: 'issue', label: '적립' },
  { value: 'transfer', label: '판매' },
  { value: 'reclaim', label: '회수' },
  { value: 'convert', label: '상품 유형 전환' },
  { value: 'adjust', label: '조정' },
  { value: 'order_charge', label: '발주 차감' },
  { value: 'order_refund', label: '발주 반환' },
  { value: 'order_adjust', label: '수량 변경' },
];

/** 원장 이벤트 종류 라벨 (보낸 쪽 → 받은 쪽 관점) */
export const EVENT_KIND_LABELS: Record<LedgerKind, string> = {
  issue: '적립',
  transfer: '판매',
  reclaim: '회수',
  convert: '상품 유형 전환',
  adjust: '조정',
  order_charge: '발주 차감',
  order_refund: '발주 반환',
  order_adjust: '수량 변경',
};

/** 한 계정에서 본 원장 항목 라벨. 판매·회수는 delta 부호로 방향을 나눈다 */
export function ledgerKindLabel(e: Pick<LedgerEntry, 'kind' | 'delta'>): string {
  switch (e.kind) {
    case 'transfer': return e.delta > 0 ? '구매' : '판매';
    case 'reclaim': return e.delta > 0 ? '회수 받음' : '회수됨';
    default: return EVENT_KIND_LABELS[e.kind];
  }
}

export const ACTOR_TYPE_LABELS: Record<ActorType, string> = {
  admin: '관리자',
  order_user: '대리점',
  system: '시스템',
};

/** 계정 상태 라벨. 본인 차단이면 누가 막았는지, 아니면 상위 차단 여부 */
export function blockedLabel(u: Pick<AgencyUser, 'blocked' | 'blockedByType' | 'blockedByAncestor'>): string {
  if (u.blocked) {
    if (u.blockedByType === 'order_user') return '차단(상위 대리점)';
    if (u.blockedByType === 'system') return '차단(시스템)';
    return '차단(관리자)';
  }
  return u.blockedByAncestor ? '차단(상위 계정)' : '사용 중';
}

export const formatCount = (n: number) => `${n.toLocaleString()}건`;

export const formatPrice = (p: number | null | undefined) => (p == null ? '-' : `${p.toLocaleString()}원`);

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * KST `YY.MM.DD HH:mm`. 서버 렌더링(Docker는 UTC)과 브라우저의 로케일·시간대가 달라도 같은 문자열이 나와야
 * hydration이 어긋나지 않으므로 toLocaleString을 쓰지 않는다.
 */
export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '-';
  const d = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  if (Number.isNaN(d.getTime())) return '-';
  return `${pad2(d.getUTCFullYear() % 100)}.${pad2(d.getUTCMonth() + 1)}.${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
};

/** 로그인 ID 규칙 (plink-api와 같다): 영문 소문자/숫자로 시작, 영문 소문자·숫자·`. _ -` 3~64자 */
export const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/;

export const MIN_PASSWORD_LENGTH = 8;
