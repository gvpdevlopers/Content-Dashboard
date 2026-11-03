const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const id = '123456789012345678901234';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
function fixture(overrides = {}, stale = false) {
  const order = { _id: id, orderNumber: 'GV-TEST', paymentStatus: 'pending', orderStatus: 'pending', amount: 100, updatedAt: new Date(), ...overrides };
  let mutation;
  const Order = { findById: () => ({ lean: async () => order }), findOneAndUpdate: (filter, update) => { mutation = { filter, update }; return { select: async () => stale ? null : { _id: id, ...update.$set } }; } };
  const filename = path.resolve(__dirname, '../controllers/orderArchiveController.js'), module = { exports: {} }, realRequire = createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, 'utf8')}\n})`, { filename })(name => name === '../models/Order' ? Order : realRequire(name), module, module.exports);
  const call = async (body = {}, user = { _id: id, role: 'admin' }, restore = false) => { const res = response(); await module.exports[restore ? 'restoreOrder' : 'archiveOrder']({ user, params: { id }, body }, res); return res; };
  return { order, call, controller: module.exports, mutation: () => mutation };
}
test('archive rejects nonadmins and missing confirmation without writing', async () => {
  const f = fixture();
  for (const role of ['client', 'employee', undefined]) assert.equal((await f.call({ confirmation: 'GV-TEST' }, { role })).statusCode, 403);
  assert.equal((await f.call()).statusCode, 400); assert.equal(f.mutation(), undefined);
});
test('paid, active, completed, legacy progress and active PIN orders require explicit extra confirmation', async () => {
  for (const state of [{ paymentStatus: 'paid' }, { paymentStatus: 'collected' }, { paymentStatus: 'processing' }, { orderStatus: 'in_progress' }, { orderStatus: 'completed' }, { serviceProgress: { status: 'in_progress' } }, { codPinStatus: 'active' }, { items: [{ serviceProgress: { status: 'in_progress' } }] }]) {
    const f = fixture(state); assert.equal((await f.call({ confirmation: 'GV-TEST' })).body.requiresAdditionalConfirmation, true);
    assert.equal((await f.call({ confirmation: 'GV-TEST', confirmProtected: 'true' })).statusCode, 409);
    assert.equal((await f.call({ confirmation: 'GV-TEST', confirmProtected: true })).statusCode, 200);
  }
});
test('archive writes audit and visibility only, with optimistic concurrency protection', async () => {
  const f = fixture(); assert.equal((await f.call({ confirmation: 'GV-TEST' })).statusCode, 200);
  const { filter, update } = f.mutation(); assert.equal(filter.updatedAt, f.order.updatedAt); assert.equal(filter.archivedAt, null);
  assert.deepEqual(Object.keys(update.$set).sort(), ['archivedAt', 'archivedBy']);
  assert.equal(update.$push.archiveHistory.actor, id); assert.equal(update.$push.archiveHistory.snapshot.amount, 100);
  assert.equal(update.$unset, undefined);
  assert.equal((await fixture({}, true).call({ confirmation: 'GV-TEST' })).statusCode, 409);
});
test('restore requires archived state and appends an audit entry', async () => {
  assert.equal((await fixture().call({}, undefined, true)).statusCode, 409);
  const f = fixture({ archivedAt: new Date(), archivedBy: id });
  assert.equal((await f.call({}, undefined, true)).statusCode, 200);
  assert.equal(f.mutation().update.$set.archivedAt, null); assert.equal(f.mutation().update.$push.archiveHistory.action, 'restore');
});
test('both archive routes are authenticated and admin-only', () => {
  const router = require('../routes/orderRoutes');
  const protect = require('../middleware/auth'), admin = require('../middleware/admin');
  for (const [path, method] of [['/admin/:id', 'delete'], ['/admin/:id/restore', 'post']]) {
    const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route;
    assert.equal(route.stack[0].handle, protect); assert.equal(route.stack[1].handle, admin);
  }
});
