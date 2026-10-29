const Wallet = require("../models/AdCreditWallet");
const Entry = require("../models/AdCreditEntry");
const { calculateOrderTotals } = require("./orderPricing");
const PLATFORMS = ["metaAds", "googleAds"];
const creditError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const toPaise = (value) => {
  if (!["number", "string"].includes(typeof value) || value === "") throw creditError("Enter a valid credit amount.");
  const amount = Number(value);
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(paise) ||
      Math.abs(amount * 100 - paise) > 0.000001) throw creditError("Amounts must be non-negative with at most two decimals.");
  return paise;
};
const plain = (value) => value instanceof Map ? Object.fromEntries(value) : value || {};
const adBudgets = (order) => {
  const budgets = { metaAds: 0, googleAds: 0 };
  const items = order.items?.length ? order.items : [order];
  for (const item of items) {
    if (item.serviceSnapshot?.slug !== "ads") continue;
    const data = plain(item.formData);
    let itemBudget = 0;
    for (const platform of PLATFORMS) {
      const value = data[`${platform}AdSpendAmount`];
      if (value === undefined || value === "") continue;
      const amount = toPaise(value);
      budgets[platform] += amount;
      itemBudget += amount;
      if (!Number.isSafeInteger(budgets[platform])) throw creditError("Ad spend is too large.");
    }
    if (item.amount !== undefined && itemBudget > toPaise(item.amount)) {
      throw creditError("Stored ad spend exceeds the charged service amount. Review this order before issuing credit.");
    }
  }
  return budgets;
};
const normalizeCredit = (input) => {
  if (input === undefined) return { metaAds: 0, googleAds: 0 };
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some((key) => !PLATFORMS.includes(key))) throw creditError("Invalid ad credit selection.");
  return Object.fromEntries(PLATFORMS.map((platform) => [platform, toPaise(input[platform] ?? 0)]));
};
const getBalances = async (client) => {
  const wallets = await Wallet.find({ client });
  const result = { metaAds: 0, googleAds: 0 };
  for (const wallet of wallets) result[wallet.platform] = wallet.balancePaise;
  return result;
};
const quoteCredit = async ({ client, items, input, subtotal, gstRate }) => {
  const requested = normalizeCredit(input);
  const hasCredit = PLATFORMS.some((platform) => requested[platform] > 0);
  if (!hasCredit) return { requested, total: 0, totals: calculateOrderTotals(subtotal, gstRate) };
  const budgets = adBudgets({ items });
  const available = hasCredit ? await getBalances(client) : { metaAds: 0, googleAds: 0 };
  for (const platform of PLATFORMS) {
    if (requested[platform] > budgets[platform]) throw creditError("Ad credit can only cover the matching platform's ad spend.");
    if (requested[platform] > available[platform]) throw creditError("Your ad credit balance changed. Refresh and try again.", 409);
  }
  const totalPaise = requested.metaAds + requested.googleAds;
  if (totalPaise > toPaise(subtotal)) throw creditError("Ad credit exceeds the payable subtotal.");
  return { requested, total: totalPaise / 100,
    totals: calculateOrderTotals((toPaise(subtotal) - totalPaise) / 100, gstRate) };
};
const spendCredit = async ({ client, order, requested, session, actor }) => {
  for (const platform of PLATFORMS) {
    const amountPaise = requested[platform];
    if (!amountPaise) continue;
    const wallet = await Wallet.findOneAndUpdate({ _id: `${client}:${platform}`,
      balancePaise: { $gte: amountPaise } }, { $inc: { balancePaise: -amountPaise } }, { session, returnDocument: "after" });
    if (!wallet) throw creditError("Insufficient ad credit. Refresh your balance and try again.", 409);
    await Entry.create([{ client, order, platform, kind: "applied", amountPaise, actor,
      note: "Applied to the ad spend of this order." }], { session });
  }
};
module.exports = { PLATFORMS, toPaise, plain, adBudgets, normalizeCredit, getBalances,
  quoteCredit, spendCredit, creditError };
