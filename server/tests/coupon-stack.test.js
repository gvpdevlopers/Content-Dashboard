const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCouponStack } = require('../controllers/orderController');
const { normalizeCouponCodes } = require('../utils/couponCodes');
const { reduceCouponComponents } = require('../utils/couponStack');
const id = '123456789012345678901234';
const service = { name: 'Reels', _id: id };
const result = () => ({ item: { service: id }, service, amount: 2500, couponEligibleAmount: 2500, couponComponents: [{ key: 'voice', label: 'Voice-over', amount: 2500 }] });
const percent = { code: 'SERVICE20', serviceDiscounts: [{ serviceId: id, discountPercent: 20 }] };
const fixed = { code: 'VOICE1000', scope: 'options', serviceDiscounts: [{ serviceId: id, discountType: 'fixed', discountValue: 1000, targets: ['voice'] }] };
const quote = (coupons, serviceResults = [result()]) => calculateCouponStack({ coupons, serviceResults, paymentMethod: 'online' });
test('service percentage followed by fixed option discount uses remaining charges and final GST', () => {
  const input = result(); const saved = structuredClone(input);
  const q = quote([percent, fixed], [input]);
  assert.equal(q.discountTotal, 1500); assert.equal(q.taxableSubtotal, 1000); assert.equal(q.gstAmount, 180); assert.equal(q.finalTotal, 1180);
  assert.deepEqual(q.coupons.map(c => c.discountTotal), [500, 1000]);
  assert.equal(q.coupons[1].serviceBreakdown[0].optionBreakdown[0].amount, 2000);
  assert.deepEqual(input, saved);
});
test('coupon order is deterministic and overlapping options never discount more than remaining charge', () => {
  assert.equal(quote([fixed, percent]).discountTotal, 1300);
  const q = quote([percent, { ...fixed, serviceDiscounts: [{ ...fixed.serviceDiscounts[0], discountValue: 5000 }] }]);
  assert.equal(q.taxableSubtotal, 0); assert.equal(q.discountTotal, 2500);
  assert.throws(() => quote([percent, { ...percent, code: 'FREE', serviceDiscounts: [{ serviceId: id, discountPercent: 100 }] }, fixed]), /VOICE1000/);
});
test('minimum spend is checked against original basket for every coupon', () => {
  assert.equal(quote([percent, { ...fixed, minimumOrderAmount: 2500 }]).discountTotal, 1500);
  assert.throws(() => quote([percent, { ...fixed, minimumOrderAmount: 2501 }]), /minimum order/);
});
test('option-first discount cannot discount unrelated services and broad coupons exclude ad budget', () => {
  const unrelated = { item: { service: 'other' }, service: { name: 'Other' }, amount: 1100, couponEligibleAmount: 100, couponComponents: [] };
  const q = quote([fixed, { code: 'ALL20', scope: 'all', discountType: 'percentage', discountValue: 20 }], [result(), unrelated]);
  assert.equal(q.coupons[0].serviceBreakdown[1].discountAmount, 0);
  assert.equal(q.coupons[1].serviceBreakdown[1].discountAmount, 20);
  assert.equal(q.discountTotal, 1320);
});
test('legacy single code and array normalization reject duplicates, invalid input and excess codes', () => {
  assert.deepEqual(normalizeCouponCodes(undefined, ' old20 '), ['OLD20']);
  assert.deepEqual(normalizeCouponCodes([' first ', 'SECOND']), ['FIRST','SECOND']);
  for (const values of [['A1','a1'], ['bad code'], [null], 'CODE', ['A1','A2','A3','A4','A5','A6']]) assert.throws(() => normalizeCouponCodes(values));
});
test('whole-service allocation conserves every paise across option balances', () => {
  const components = [{ key: 'a', amount: .5 }, { key: 'b', amount: .5 }];
  const reduced = reduceCouponComponents(components, 1, { discountAmount: .01 }, 'service');
  assert.equal(reduced[0].amount + reduced[1].amount, .99);
});
