const mongoose = require("mongoose");
const Service = require("../models/Service");
const services = require("../utils/initialSeoDevelopmentServices");

function validateTarget(uri, database, environment = process.env.NODE_ENV, allowRemoteDevelopment = false) {
  if (environment === "production") throw new Error("Production seeding is prohibited.");
  let target;
  try { target = new URL(uri); } catch { throw new Error("Set SEO_DEVELOPMENT_SEED_URI to an explicit local MongoDB URI."); }
  const local = target.protocol === "mongodb:" && ["127.0.0.1", "localhost", "[::1]"].includes(target.hostname);
  const explicitRemote = allowRemoteDevelopment && ["development", "test"].includes(environment) && ["mongodb:", "mongodb+srv:"].includes(target.protocol);
  if (!local && !explicitRemote) {
    throw new Error("Only a single loopback MongoDB host is allowed; remote databases are prohibited.");
  }
  const name = decodeURIComponent(target.pathname.slice(1)) || "test";
  if (!database || name !== database || !/(?:^|[_-])(dev|development|local|test)(?:$|[_-])/i.test(name) || /prod/i.test(name)) {
    throw new Error("Explicit --database must match the URI and contain a dev, development, local or test name segment (never prod).");
  }
  return name;
}

async function seedServices({ model = Service, apply = false } = {}) {
  // Validate every input before writing anything. Existing documents are never saved.
  const documents = await Promise.all(services.map(async (input) => {
    const document = new model(input);
    await document.validate();
    return document.toObject();
  }));
  const report = [];
  if (apply) await model.collection.createIndex({ slug: 1 }, { unique: true });
  for (const document of documents) {
    const existing = await model.findOne({ slug: document.slug }).lean();
    let status = existing ? "preserved" : "would-create";
    if (!existing && apply) {
      const now = new Date();
      try {
        const result = await model.updateOne({ slug: document.slug }, {
          $setOnInsert: { ...document, createdAt: now, updatedAt: now },
        }, { upsert: true, timestamps: false, setDefaultsOnInsert: false });
        status = result.upsertedCount ? "created" : "preserved";
      } catch (error) {
        if (error.code !== 11000 || !await model.exists({ slug: document.slug })) throw error;
        status = "preserved";
      }
    }
    const stored = await model.findOne({ slug: document.slug }).lean();
    report.push({ slug: document.slug, name: stored?.name ?? document.name, status,
      serviceGroup: stored?.serviceGroup ?? document.serviceGroup,
      isActive: stored?.isActive ?? document.isActive,
      groupMatches: !stored || stored.serviceGroup === document.serviceGroup });
  }
  return report;
}

async function main(args = process.argv.slice(2), env = process.env) {
  if (args.some((arg, index) => !["--apply", "--database", "--allow-remote-development"].includes(arg) && args[index - 1] !== "--database")) throw new Error("Use [--apply] --database <development-database> [--allow-remote-development].");
  const database = args[args.indexOf("--database") + 1];
  validateTarget(env.SEO_DEVELOPMENT_SEED_URI, args.includes("--database") ? database : undefined, env.NODE_ENV, args.includes("--allow-remote-development"));
  const connection = mongoose.createConnection();
  try {
    await connection.openUri(env.SEO_DEVELOPMENT_SEED_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false, autoCreate: false });
    const model = connection.model("Service", Service.schema);
    const report = await seedServices({ model, apply: args.includes("--apply") });
    console.log(JSON.stringify({ database, mode: args.includes("--apply") ? "apply" : "preview", report }, null, 2));
    return report;
  } finally { await connection.close(); }
}
if (require.main === module) main().catch(() => { console.error("Seed failed. Verify the explicit development URI, database name, connectivity and schema. Production mode is prohibited; remote development requires an explicit opt-in."); process.exitCode = 1; });
module.exports = { main, seedServices, validateTarget };
