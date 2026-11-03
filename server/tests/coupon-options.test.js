const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { getCouponTargets } = require('../utils/couponTargets');
const { applyFixedPackagePrice } = require('../utils/packagePricing');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const CouponUsage = require('../models/CouponUsage');
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file), module = { exports: {} }, real = createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, 'utf8')}\n})`, { filename })((id) => Object.hasOwn(mocks, id) ? mocks[id] : real(id), module, module.exports);
  return module.exports;
}
const id = '123456789012345678901234', optionId = '123456789012345678901235';
const user = { _id: '123456789012345678901236', role: 'client', isActive: true };
const field = { name: 'extras', label: 'Add-ons', type: 'checkbox', options: [{ value: 'voice', label: 'Voice-over', price: 200 }, { value: 'subtitles', label: 'Subtitles', price: 100 }] };
function fixture(overrides = {}) {
  const service = { _id: id, name: 'Reels', slug: 'reels', category: 'Content', isActive: true, pricingType: 'fixed', basePrice: 1000, minQuantity: 1, fields: [structuredClone(field)], pricingOptions: [], ...overrides };
  const model = { findOne: async () => service, find: (filter) => ({ select: async () => filter._id.$in.includes(id) ? [service] : [] }) };
  const controller = load('controllers/orderController.js', { '../models/Service': model, '../models/CouponClientUsage': { findOne: () => ({ lean: async () => ({ usageCount: 2 }) }) } });
  const admin = load('controllers/couponController.js', { '../models/Service': model });
  const target = (value = 'voice') => JSON.stringify(['field', 'service', 'extras', value]);
  const coupon = { code: 'VOICE20', scope: 'options', isActive: true, serviceDiscounts: [{ serviceId: id, discountPercent: 20, targets: [target()] }] };
  const process = (request = {}) => controller.processOrderServiceItem({ user, serviceId: id, formData: { extras: ['voice', 'subtitles'] }, ...request });
  const quote = (results, override = {}) => controller.calculateCouponQuote({ coupon: { ...coupon, ...override }, serviceResults: results, paymentMethod: 'online' });
  return { service, controller, admin, target, coupon, process, quote };
}
test('option discount uses backend prices, excludes other add-ons, and taxes discounted subtotal', async () => {
  const f = fixture(), result = await f.process(); assert.equal(result.success, true, result.message); assert.equal(result.amount, 1300);
  const q = f.quote([result]); assert.equal(q.discountTotal, 40); assert.equal(q.gstAmount, 226.8); assert.equal(q.finalTotal, 1486.8);
  assert.equal(q.serviceBreakdown[0].eligibleAmount, 200); assert.equal(q.serviceBreakdown[0].optionBreakdown[0].label, 'Add-ons: Voice-over');
});
test('legacy service coupons preserve percent behavior and unrelated services stay full price', async () => {
  const f = fixture(), r = await f.process(); const other = { ...r, item: { ...r.item, service: optionId } };
  const q = f.quote([r, other], { scope: undefined, serviceDiscounts: [{ serviceId: id, discountPercent: 20 }] });
  assert.equal(q.discountTotal, 260); assert.equal(q.serviceBreakdown[1].discountAmount, 0);
  const legacy = new Coupon({ code: 'OLD', serviceDiscounts: [{ serviceId: id, serviceName: 'Reels', discountPercent: 20 }] });
  assert.equal(f.controller.calculateCouponQuote({ coupon: legacy, serviceResults: [r], paymentMethod: 'online' }).discountTotal, 260);
});
test('global percentage and fixed discounts cover eligible services only; fixed is applied once', async () => {
  const f = fixture(), r = await f.process(), other = { ...r, item: { ...r.item, service: optionId } };
  assert.equal(f.quote([r, other], { scope: 'all', discountType: 'percentage', discountValue: 20 }).discountTotal, 520);
  assert.equal(f.quote([r, other], { scope: 'all', discountType: 'fixed', discountValue: 1500 }).discountTotal, 1500);
  assert.equal(f.quote([r], { scope: 'all', discountType: 'fixed', discountValue: 5000 }).discountTotal, 1300);
});
test('multiple targets are combined once and fixed discount is capped at eligible components', async () => {
  const f = fixture(), r = await f.process();
  const serviceDiscounts = [{ serviceId: id, discountPercent: 20, targets: [f.target(), f.target('subtitles'), f.target()] }];
  assert.equal(f.quote([r], { serviceDiscounts }).discountTotal, 60);
  const q = f.quote([r], { serviceDiscounts: [{ ...serviceDiscounts[0], discountType: 'fixed', discountValue: 250 }] });
  assert.equal(q.discountTotal, 250); assert.equal(q.serviceBreakdown[0].optionBreakdown.reduce((sum, line) => sum + line.discountAmount, 0), 250);
});
test('admin rejects foreign/deleted/duplicate targets and invalid discount configuration', async () => {
  const f = fixture(); const payload = { ...f.coupon, serviceDiscounts: [{ ...f.coupon.serviceDiscounts[0] }] };
  assert.equal((await f.admin.validateCouponInput(payload)).serviceDiscounts[0].discountValue, 20);
  for (const targets of [[], ['foreign'], [f.target(), f.target()]]) await assert.rejects(f.admin.validateCouponInput({ ...payload, serviceDiscounts: [{ ...payload.serviceDiscounts[0], targets }] }));
  for (const discountValue of [-1, 101, 'invalid']) await assert.rejects(f.admin.validateCouponInput({ ...payload, serviceDiscounts: [{ ...payload.serviceDiscounts[0], discountValue }] }));
  await assert.rejects(f.admin.validateCouponInput({ ...payload, scope: 'invalid' }));
  const global = await f.admin.validateCouponInput({ code: 'ALL', scope: 'all', discountType: 'fixed', discountValue: 50 }); assert.deepEqual(global.serviceDiscounts, []);
});
test('renaming a display label preserves eligibility; deleting or deselecting a target fails closed', async () => {
  const f = fixture(); f.service.fields[0].options[0].label = 'Narration';
  let r = await f.process(); assert.equal(f.quote([r]).discountTotal, 40);
  assert.match(f.quote([r]).serviceBreakdown[0].optionBreakdown[0].label, /Narration/);
  r = await f.process({ formData: { extras: ['subtitles'] } }); assert.throws(() => f.quote([r]), /does not apply/);
  f.service.fields[0].options.shift(); assert.ok(!getCouponTargets(f.service).some(t => t.key === f.target()));
});
test('pricing option uses real quantity and does not include its configurable add-ons', async () => {
  const f = fixture({ pricingOptions: [{ _id: optionId, name: 'Editing', price: 500, unit: 'reel', minQuantity: 1, isActive: true, fields: [] }] });
  const r = await f.process({ pricingOptionId: optionId, quantity: 3 }); assert.equal(r.success, true, r.message); assert.equal(r.amount, 1800);
  const q = f.quote([r], { serviceDiscounts: [{ serviceId: id, discountPercent: 20, targets: [JSON.stringify(['pricing', optionId])] }] }); assert.equal(q.discountTotal, 300);
});
test('repeatable fields and pricing options retain correct independent quantities', async () => {
  const f = fixture({ fields: [], pricingOptions: [{ _id: optionId, name: 'Editing', group: 'editing', price: 500, unit: 'reel', isActive: true }], repeatableGroups: [{ name: 'reels', label: 'Reel', minItems: 1, maxItems: 10, pricingGroups: ['editing'], requiredPricingGroups: ['editing'], fields: [field] }] });
  const r = await f.process({ formData: { reels: [1, 2].map(() => ({ pricingOptions: { editing: optionId }, pricingQuantities: { editing: 2 }, fields: { extras: ['voice'] } })) } });
  assert.equal(r.success, true, r.message);
  const q = f.quote([r], { serviceDiscounts: [{ serviceId: id, discountPercent: 20, targets: [JSON.stringify(['field', 'group:reels', 'extras', 'voice'])] }] }); assert.equal(q.discountTotal, 80);
});
test('fixed package allocation scales target amounts rather than discounting full catalogue charges', async () => {
  const f = fixture(), r = await f.process(); applyFixedPackagePrice([r], 650); const q = f.quote([r]); assert.equal(q.discountTotal, 20); assert.equal(q.originalSubtotal, 650);
});
test('expiry, global/per-client limits, inactive status and minimum spend remain enforced', async () => {
  const f = fixture();
  for (const coupon of [null, { isActive: false }, { isActive: true, expiresAt: '2000-01-01' }, { isActive: true, totalUsageLimit: 1, usageCount: 1 }, { isActive: true, perClientUsageLimit: 2 }]) await assert.rejects(f.controller.validateCouponAvailability(coupon, user._id));
  assert.throws(() => f.quote([{ amount: 100 }], { minimumOrderAmount: 101 }), /minimum order/);
  const r = await f.process({ user: { ...user, role: 'admin' } }); assert.equal(r.success, false);
});
test('coupon snapshots persist labels, keys and amounts independently of later configuration', async () => {
  const f = fixture(), r = await f.process(), q = f.quote([r]);
  const order = new Order({ couponSnapshot: q }); const usage = new CouponUsage({ serviceBreakdown: q.serviceBreakdown });
  const before = order.couponSnapshot.toObject(); f.service.fields[0].options[0].price = 9999; f.coupon.serviceDiscounts[0].discountPercent = 99;
  assert.deepEqual(order.couponSnapshot.toObject(), before);
  assert.equal(order.couponSnapshot.serviceBreakdown[0].optionBreakdown[0].discountAmount, 40);
  assert.equal(usage.serviceBreakdown[0].optionBreakdown[0].amount, 200);
});

test('ad budgets cannot become option targets and remain outside global discounts', async () => {
  const f = fixture({ slug: 'ads', fields: [{ name: 'adSpend', label: 'Ad spend', type: 'number', includeValueInPrice: true }], pricingOptions: [{ _id: optionId, name: 'Management', price: 100, unit: 'month', isActive: true }] });
  assert.deepEqual(getCouponTargets(f.service), [{ key: JSON.stringify(['pricing', optionId]), label: 'Management' }]);
  const result = { service: f.service, item: { service: id }, amount: 1100, couponEligibleAmount: 100 };
  assert.equal(f.quote([result], { scope: 'all', discountType: 'percentage', discountValue: 20 }).discountTotal, 20);
});
test('numeric fields, pricing-option fields and checkbox false follow actual pricing semantics', async () => {
  const f = fixture({ fields: [{ name: 'units', label: 'Additional work', type: 'number', includeValueInPrice: true }], pricingOptions: [{ _id: optionId, name: 'Editing', price: 500, unit: 'reel', isActive: true, fields: [{ name: 'voice', label: 'Voice', type: 'checkbox', options: [{ value: 'true', label: 'Yes', price: 200 }, { value: 'false', label: 'No', price: 50 }] }] }] });
  const r = await f.process({ pricingOptionId: optionId, formData: { units: 100, voice: false } }); assert.equal(r.success, true, r.message); assert.equal(r.amount, 600);
  assert.ok(!r.couponComponents.some(c => c.key.includes('voice')));
  const q = f.quote([r], { serviceDiscounts: [{ serviceId: id, discountPercent: 20, targets: [JSON.stringify(['field', 'service', 'units', '@value'])] }] }); assert.equal(q.discountTotal, 20);
});
