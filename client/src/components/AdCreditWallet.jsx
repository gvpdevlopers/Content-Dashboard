import { History } from "lucide-react";
import OrderActionSection from "./OrderActionSection";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import adCreditService from "../services/adCreditService";
import useAsyncResource from "../hooks/useAsyncResource";

const platforms = { metaAds: "Meta Ads", googleAds: "Google Ads" };
const money = value => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function AdCreditWallet() {
  const [page, setPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const read = useCallback(() => adCreditService.getMine(page), [page]);
  const { data, loading, error, reload } = useAsyncResource(read);
  return (
    <section aria-label="Ad credit wallet" className="relative mb-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Your ad credit</h2>
        <button type="button" className="dashboard-action dashboard-action--secondary" disabled={loading} onClick={() => reload()}>Refresh balance</button>
      </div>
      <p className="mt-1 text-sm text-zinc-600">Unused campaign funds available for matching platform ad spend. Service fees and other charges are separate.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {loading ? <p role="status" className="mt-3 text-sm text-zinc-600">Loading wallet...</p> : data && <>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          {Object.entries(platforms).map(([key, label]) => <div key={key}><dt className="text-sm text-zinc-600">{label}</dt><dd className="mt-1 text-xl font-semibold">{money(data.available?.[key])}</dd></div>)}
        </dl>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
          <OrderActionSection title="Credit history" icon={<History size={16} aria-hidden="true" />} collapsible expanded={historyOpen} onExpandedChange={setHistoryOpen}>
          {!data.entries?.length && <p className="py-3 text-sm text-zinc-600">No credit transactions yet.</p>}
          <ul className="divide-y divide-zinc-100">
            {data.entries?.map(entry => <li key={entry.id} className="py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><span>{platforms[entry.platform]} - {entry.kind === "applied" ? "Applied" : entry.kind === "released" ? "Returned" : "Added"}</span><strong>{entry.kind === "applied" ? "-" : "+"}{money(entry.amount)}</strong></div>
              <p className="mt-1 text-xs text-zinc-600">{entry.kind === "issued" ? "Source order" : "Order"}: {entry.order?._id ? <Link className="underline" to={`/dashboard/orders/${entry.order._id}`}>{entry.order.orderNumber || entry.order._id}</Link> : "Historical order"} - {new Date(entry.createdAt).toLocaleString()}</p>
              {entry.note && <p className="mt-1 break-words text-zinc-600">{entry.note}</p>}
              {entry.actor?.name && <p className="mt-1 text-xs text-zinc-600">Recorded by {entry.actor.name}</p>}
            </li>)}
          </ul>
          {(page > 1 || data.hasMore) && <div className="mt-3 flex items-center gap-3">
            <button className="dashboard-action dashboard-action--secondary" disabled={page === 1} onClick={() => setPage(current => current - 1)}>Previous</button>
            <span className="text-sm">Page {page}</span>
            <button className="dashboard-action dashboard-action--secondary" disabled={!data.hasMore} onClick={() => setPage(current => current + 1)}>Next</button>
          </div>}
          </OrderActionSection>
        </div>
      </>}
    </section>
  );
}
