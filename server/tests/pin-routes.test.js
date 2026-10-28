const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

test("employee selection and PIN secrets remain behind authentication and appropriate role guards", () => {
  const filename = path.resolve(__dirname, "../routes/codRoutes.js"), localRequire = createRequire(filename);
  const routes = [], router = { get: (...args) => routes.push(args), post: (...args) => routes.push(args) };
  const protect = () => {}, admin = () => {}, staff = () => {}, module = { exports: {} };
  const mocks = { express: { Router: () => router }, "../middleware/auth": protect, "../middleware/admin": admin, "../middleware/orderStaff": staff };
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : localRequire(id), module, module.exports);
  for (const [route, guard] of [["/employees", admin], ["/assigned", staff], ["/generate", admin], ["/disable", admin]]) {
    const registered = routes.find(([name]) => name === route);
    assert.equal(registered[1], protect); assert.equal(registered[2], guard);
  }
  assert.equal(routes.find(([name]) => name === "/verify")[1], protect);
});
