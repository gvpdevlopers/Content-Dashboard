export default function AdCreditBreakdown({ order }) {
  if (!order.adCreditTotal) return null;
  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return (
    <div className="my-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
      <p>Ad credit applied: {money(order.adCreditTotal)}</p>
      <p className="mt-1 text-xs">
        Meta: {money(order.adCreditApplied?.metaAds)} · Google: {money(order.adCreditApplied?.googleAds)}
      </p>
      <p className="mt-1 text-xs">Subtotal before ad credit: {money(order.subtotalBeforeAdCredit)}. Credit covers ad spend only.</p>
      {order.adCreditReleased && <p className="mt-1 text-xs">This credit was returned after cancellation.</p>}
    </div>
  );
}
