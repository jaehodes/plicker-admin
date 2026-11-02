import type { Metadata } from "next";
import Layout from "../components/Layout";
import { requireAuth } from "../lib/auth-server";
import OrderSettlementClient from "./OrderSettlementClient";

export const metadata: Metadata = {
  title: '대리점 정산 - 플링크 관리자',
  description: '플링크 대리점 월 정산',
  robots: "noindex, nofollow",
};

export default async function OrderSettlementPage() {
  await requireAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <OrderSettlementClient />
      </div>
    </Layout>
  );
}
