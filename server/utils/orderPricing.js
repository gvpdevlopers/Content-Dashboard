const {
  ONLINE_GST_RATE,
  MONTH_END_GST_RATE,
  CHEQUE_DIRECT_COLLECTION_GST_RATE,
} = require("../config/paymentPricing");

const getGstRate = (paymentMethod, chequeType) => {
  if (paymentMethod === "month_end") return MONTH_END_GST_RATE;
  if (
    paymentMethod === "online" ||
    (paymentMethod === "cheque" && chequeType === "with_gst")
  ) {
    return ONLINE_GST_RATE;
  }

  if (paymentMethod === "cheque" && chequeType === "direct_collection") {
    return CHEQUE_DIRECT_COLLECTION_GST_RATE;
  }

  return 0;
};

const getPaymentPricingConfig = () => ({
  month_end: MONTH_END_GST_RATE,
  cod: 0,
  online: ONLINE_GST_RATE,
  chequeWithGst: ONLINE_GST_RATE,
  chequeDirectCollection: CHEQUE_DIRECT_COLLECTION_GST_RATE,
});

const calculateOrderTotals = (subtotal, gstRate) => {
  const roundedSubtotal = roundCurrency(subtotal);
  const gstAmount = roundCurrency(roundedSubtotal * (gstRate / 100));

  return {
    subtotal: roundedSubtotal,
    gstRate,
    gstAmount,
    amount: roundCurrency(roundedSubtotal + gstAmount),
  };
};

const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

module.exports = {
  getGstRate,
  getPaymentPricingConfig,
  calculateOrderTotals,
};
