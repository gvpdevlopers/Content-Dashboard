const mongoose = require("mongoose");
const Package = require("../models/Package");
const Service = require("../models/Service");
const User = require("../models/User");
const { canClientOrderService } = require("../utils/serviceAccess");
const { inspectConfiguration, invalid, plain } = require("../utils/packageConfiguration");
const id = (value) => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
const normalizeSlug = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const packageServices = (value) => {
  if (!Array.isArray(value) || !value.length || value.length > 50) throw invalid("Select between 1 and 50 package services.");
  const seen = new Set();
  return value.map((entry) => {
    if (!id(entry?.serviceId)) throw invalid("Every package service must have a valid service ID.");
    const serviceId = String(entry.serviceId).toLowerCase();
    if (seen.has(serviceId)) throw invalid("A service cannot appear twice in one package.");
    seen.add(serviceId);
    const quantity = Number(entry.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw invalid("Package quantities must be whole numbers between 1 and 100.");
    if (entry.formData !== undefined && !plain(entry.formData)) throw invalid("Service configuration must be an object.");
    return { service: serviceId, quantity, pricingOptionId: String(entry.pricingOptionId || ""), formData: entry.formData || {} };
  });
};

const validatePackageServices = async (entries) => {
  const services = await Service.find({ _id: { $in: entries.map((entry) => entry.service) }, isActive: true });
  const byId = new Map(services.map((service) => [String(service._id), service]));
  if (services.length !== entries.length) throw invalid("Packages can only include active services.");
  return entries.map((entry) => {
    const stored = byId.get(entry.service);
    if (!["content", "seo", "development"].includes(stored.serviceGroup || "content")) throw invalid("Invalid service group.");
    try {
      const { amount } = inspectConfiguration(stored, entry);
      return { ...entry, serviceSnapshot: { _id: stored._id, name: stored.name, slug: stored.slug, category: stored.category,
        serviceGroup: stored.serviceGroup, basePrice: Number(stored.basePrice || 0), configuredPrice: amount, isActive: true } };
    } catch (error) { throw invalid(`${stored.name}: ${error.message}`); }
  });
};

const canView = (user, item) => {
  if (!item?.isActive || user?.role !== "client" || user.isActive === false) return false;
  if (item.visibility === "selected" && !item.clients.some((client) => String(client._id || client) === String(user._id))) return false;
  return item.services.every((entry) => canClientOrderService(user, entry.serviceSnapshot));
};
const publicPackage = (item) => ({
  _id: item._id, slug: item.slug, name: item.name, description: item.description,
  pricingMode: item.pricingMode, price: item.price, comparisonPrice: item.comparisonPrice,
  services: item.services.map((entry) => ({ serviceId: entry.service, quantity: entry.quantity,
    pricingOptionId: entry.pricingOptionId, formData: entry.formData || {}, service: entry.serviceSnapshot })),
});
const handleError = (res, error) => res.status(error.code === 11000 ? 409 : error.statusCode || (["ValidationError", "CastError"].includes(error.name) ? 400 : 500))
  .json({ success: false, message: error.code === 11000 ? "Package slug already exists." : error.message || "Unable to process package." });

const listAdminPackages = async (req, res) => {
  try { return res.json({ success: true, packages: await Package.find({}).sort({ updatedAt: -1 }).populate("clients", "name email isActive") }); }
  catch (error) { return handleError(res, error); }
};

const eligibleClients = async (req, res) => {
  try {
    const entries = packageServices(req.body.services);
    const services = await Service.find({ _id: { $in: entries.map((entry) => entry.service) }, isActive: true });
    if (services.length !== entries.length) throw invalid("Select active services before assigning clients.");
    const clients = await User.find({ role: "client", isActive: true }).select("name email role isActive serviceAccess").sort({ name: 1 });
    return res.json({ success: true, clients: clients.filter((user) => services.every((service) => canClientOrderService(user, service))) });
  } catch (error) { return handleError(res, error); }
};
const previewPackage = async (req, res) => {
  try {
    const services = await validatePackageServices(packageServices(req.body.services));
    return res.json({ success: true, price: services.reduce((sum, entry) => sum + entry.serviceSnapshot.configuredPrice, 0),
      message: "Estimate before GST and coupons. Client choices at checkout may change calculated pricing." });
  } catch (error) { return handleError(res, error); }
};

const save = async (req, res, item) => {
  const previous = item?.toObject() || {};
  const body = { ...previous, ...req.body };
  const services = await validatePackageServices(packageServices(req.body.services === undefined && item
    ? item.services.map((entry) => ({ serviceId: String(entry.service), quantity: entry.quantity, pricingOptionId: entry.pricingOptionId, formData: entry.formData })) : req.body.services));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (body.slug != null && typeof body.slug !== "string") throw invalid("Enter a valid package slug.");
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : normalizeSlug(name);
  if (!name || name.length > 120) throw invalid("Package name must contain 1-120 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) throw invalid("Use a valid slug with lowercase letters, numbers and hyphens.");
  if (body.description != null && (typeof body.description !== "string" || body.description.length > 1000)) throw invalid("Description must be at most 1000 characters.");
  const pricingMode = body.pricingMode ?? "fixed";
  const visibility = body.visibility ?? "all";
  if (!["fixed", "calculated"].includes(pricingMode)) throw invalid("Select a valid pricing mode.");
  if (!["all", "selected"].includes(visibility)) throw invalid("Select a valid visibility mode.");
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") throw invalid("Active status must be a boolean.");
  const clients = body.clients ?? [];
  if (!Array.isArray(clients) || clients.some((value) => !id(String(value)))) throw invalid("Selected clients must be valid IDs.");
  const assignments = [...new Set(clients.map((value) => String(value).toLowerCase()))];
  if (visibility === "selected" && !assignments.length) throw invalid("Select at least one eligible client.");
  if (assignments.length) {
    const users = await User.find({ _id: { $in: assignments }, role: "client", isActive: true });
    if (users.length !== assignments.length) throw invalid("Selected clients must be active client accounts.");
    if (visibility === "selected" && users.some((user) => services.some((entry) => !canClientOrderService(user, entry.serviceSnapshot)))) throw invalid("Every selected client must have access to every included service.");
  }
  const price = pricingMode === "calculated" ? services.reduce((sum, entry) => sum + entry.serviceSnapshot.configuredPrice, 0) : Number(body.price);
  if (pricingMode === "fixed" && (!["string", "number"].includes(typeof body.price) || String(body.price).trim() === "") || !Number.isFinite(price) || price < 0) throw invalid("Enter a valid package price.");
  if (!Number.isSafeInteger(Math.round(price * 100)) || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) throw invalid("Package price must be a valid currency amount with at most two decimal places.");
  const comparisonPrice = body.comparisonPrice === "" || body.comparisonPrice == null ? null : Number(body.comparisonPrice);
  if (comparisonPrice !== null && (!Number.isFinite(comparisonPrice) || comparisonPrice < 0)) throw invalid("Enter a valid comparison price.");
  const values = { name, slug, description: body.description || "", services, pricingMode, price, comparisonPrice,
    visibility, clients: assignments, isActive: body.isActive ?? true, updatedBy: req.user._id };
  if (item) { Object.assign(item, values); await item.save(); }
  else item = await Package.create({ ...values, createdBy: req.user._id });
  return res.status(previous._id ? 200 : 201).json({ success: true, package: item, message: previous._id ? "Package updated." : "Package created." });
};
const createPackage = async (req, res) => { try { return await save(req, res); } catch (error) { return handleError(res, error); } };
const updatePackage = async (req, res) => {
  try {
    if (!id(req.params.id)) throw invalid("Invalid package ID.");
    const item = await Package.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Package not found." });
    if (req.body.isActive === false && Object.keys(req.body).length === 1) {
      item.isActive = false; item.updatedBy = req.user._id; await item.save();
      return res.json({ success: true, package: item, message: "Package deactivated." });
    }
    return await save(req, res, item);
  } catch (error) { return handleError(res, error); }
};
const deletePackage = async (req, res) => {
  try {
    if (!id(req.params.id)) throw invalid("Invalid package ID.");
    const item = await Package.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Package not found." });
    return res.json({ success: true, message: "Package deleted." });
  } catch (error) { return handleError(res, error); }
};
// Visibility uses current service records, so deactivations and access changes
// take effect immediately rather than trusting a stale creation-time snapshot.
const refreshServices = async (items) => {
  const services = await Service.find({ _id: { $in: items.flatMap((item) => item.services.map((entry) => entry.service)) } });
  const map = new Map(services.map((service) => [String(service._id), service]));
  return items.map((item) => ({ ...item.toObject(), services: item.services.map((entry) => ({ ...entry.toObject(), serviceSnapshot: map.get(String(entry.service))?.toObject() || {} })) }));
};
const listClientPackages = async (req, res) => {
  try { const items = await refreshServices(await Package.find({ isActive: true }).sort({ updatedAt: -1 }));
    return res.json({ success: true, packages: items.filter((item) => canView(req.user, item)).map(publicPackage) });
  } catch (error) { return handleError(res, error); }
};
const getClientPackage = async (req, res) => {
  try {
    if (!id(req.params.id)) throw invalid("Invalid package ID.");
    const stored = await Package.findOne({ _id: req.params.id, isActive: true });
    const item = stored ? (await refreshServices([stored]))[0] : null;
    if (!item || !canView(req.user, item)) return res.status(404).json({ success: false, message: "Package not found." });
    return res.json({ success: true, package: publicPackage(item) });
  } catch (error) { return handleError(res, error); }
};
module.exports = { listAdminPackages, createPackage, updatePackage, deletePackage, listClientPackages, getClientPackage, publicPackage, canView, packageServices, validatePackageServices, eligibleClients, previewPackage };
