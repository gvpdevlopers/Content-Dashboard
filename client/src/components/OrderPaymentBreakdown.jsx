import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

const PaymentRow = ({ label, value }) => (
  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 py-2 text-sm">
    <dt className="min-w-0 break-words text-zinc-600 [overflow-wrap:anywhere]">{label}</dt>
    <dd className="text-right font-medium tabular-nums text-zinc-900">{value}</dd>
  </div>
);

export default function OrderPaymentBreakdown({ order, formatCurrency }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const adsAmount = (order.items?.length ? order.items : [order]).reduce((total, item) => {
    if (item.serviceSnapshot?.slug !== "ads") return total;
    return total + ["metaAdsAdSpendAmount", "googleAdsAdSpendAmount"].reduce((sum, key) => sum + (Number(item.formData?.[key]) || 0), 0);
  }, 0);
  return (
    <div className="mb-4 min-w-0">
      <p className="text-xs font-medium text-zinc-600">Final Total</p>
      <p className="mt-1 break-words text-3xl font-semibold tracking-tight tabular-nums text-zinc-950">{formatCurrency(order.amount)}</p>
      <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}
        className="mt-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
        <span>{expanded ? "Hide payment breakdown" : "View payment breakdown"}</span>
        <ChevronDown aria-hidden="true" size={16} className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
      </button>
      <div id={id} aria-hidden={!expanded} inert={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <dl className="mt-2 border-t border-zinc-200 pt-3">
            <PaymentRow label="Original subtotal" value={formatCurrency(order.originalSubtotal ?? order.subtotalBeforeAdCredit ?? order.subtotal)} />
              {order?.paymentMethod === "cheque" && (
                <PaymentRow
                  label="Cheque Type"
                  value={
                    order?.chequeType === "with_gst"
                      ? "With GST"
                      : "Direct Collection"
                  }
                />
              )}
              {order?.couponSnapshot && (
                <>
                  <PaymentRow
                    label={`Coupon (${order.couponSnapshot.code})`}
                    value={`−${formatCurrency(order?.discountTotal)}`}
                  />
              {order.couponSnapshots?.length > 1 && order.couponSnapshots.map(coupon => <PaymentRow key={coupon.code} label={`${coupon.code}: ${coupon.serviceBreakdown.filter(line => line.discountAmount > 0).map(line => line.optionBreakdown?.length ? `${line.serviceName} (${line.optionBreakdown.map(option => option.label).join(", ")})` : line.serviceName).join("; ")}`} value={`-${formatCurrency(coupon.discountTotal)}`} />)}
                  {order.couponSnapshot.serviceBreakdown
                    ?.filter((entry) => entry.discountAmount > 0)
                    .map((entry) => (
                      <PaymentRow
                        key={entry.serviceId}
                        label={`${entry.serviceName} (${entry.discountType === "combined" ? "combined coupons" : entry.discountType === "fixed" ? "fixed amount" : `${entry.discountPercent}%`})${entry.optionBreakdown?.length ? ` - ${entry.optionBreakdown.map(option => option.label).join(", ")}` : ""}`}
                        value={`−${formatCurrency(entry.discountAmount)}`}
                      />
                    ))}
                </>
              )}
              {adsAmount > 0 && <PaymentRow label="Ads amount (included in subtotal)" value={formatCurrency(adsAmount)} />}
              {order.adCreditTotal > 0 && <>
                <PaymentRow label="Subtotal before ad credit" value={formatCurrency(order.subtotalBeforeAdCredit)} />
                <PaymentRow label="Ad credit applied" value={`-${formatCurrency(order.adCreditTotal)}`} />
                {Object.entries(order.adCreditApplied || {}).filter(([, amount]) => amount > 0).map(([platform, amount]) => <PaymentRow key={platform} label={`${platform === "metaAds" ? "Meta Ads" : platform === "googleAds" ? "Google Ads" : platform} credit`} value={formatCurrency(amount)} />)}
                {order.adCreditReleased && <div className="py-2 text-xs text-zinc-600"><dt>Credit adjustment</dt><dd>Returned after cancellation</dd></div>}
              </>}
              <PaymentRow
                label={order?.couponSnapshot ? "Taxable subtotal" : "Subtotal"}
                value={formatCurrency(order?.subtotal)}
              />
              <PaymentRow
                label={`GST (${Number(order?.gstRate || 0)}%)`}
                value={formatCurrency(order?.gstAmount)}
              />
              <PaymentRow
                label="Final Total"
                value={formatCurrency(order?.amount)}
              />

          </dl>
        </div>
      </div>
    </div>
  );
}
