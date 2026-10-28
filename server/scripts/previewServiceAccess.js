// Read-only by design: this script has no apply or rollback mode.
const fs = require("node:fs/promises");
const path = require("node:path");
const { buildServiceAccessPreview } = require("../utils/serviceAccessPreview");

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log("Read-only preview: --preview --database NAME --output PATH. Set MIGRATION_MONGO_URI separately; .env is not loaded.");
    return;
  }
  const allowed = new Set(["--preview", "--database", "--output"]);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!allowed.has(key) || Object.hasOwn(options, key)) throw new Error("Invalid arguments");
    if (key === "--preview") options[key] = true;
    else {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error("Missing argument value");
      options[key] = value;
    }
  }
  if (!options["--preview"] || !options["--database"] || !options["--output"] || !process.env.MIGRATION_MONGO_URI) throw new Error("Explicit preview, database, output and MIGRATION_MONGO_URI are required");
  const root = path.resolve(__dirname, "../..");
  const output = path.resolve(options["--output"]);
  const relative = path.relative(root, output);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Output must be inside this repository");
  const mongoose = require("mongoose");
  const connection = await mongoose.createConnection(process.env.MIGRATION_MONGO_URI, {
    dbName: options["--database"], autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000,
  }).asPromise();
  try {
    const db = connection.db;
    // Native collections preserve the distinction between missing fields and
    // Mongoose hydration defaults. No user identity/contact data is projected.
    const [services, clients] = await Promise.all([
      db.collection("services").find({}, { projection: { _id: 1, serviceGroup: 1, isPublic: 1, isActive: 1 } }).toArray(),
      db.collection("users").find({ role: "client" }, { projection: { _id: 1, role: 1, serviceAccess: 1 } }).toArray(),
    ]);
    const [serviceCount, clientCount] = await Promise.all([
      db.collection("services").countDocuments({}), db.collection("users").countDocuments({ role: "client" }),
    ]);
    const preview = buildServiceAccessPreview({ services, clients, database: db.databaseName, serviceCount, clientCount });
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, `${JSON.stringify(preview, null, 2)}\n`, { flag: "wx" });
    console.log(JSON.stringify({ database: preview.database, counts: preview.counts, sha256: preview.sha256, readOnly: true }));
    if (preview.issues.length) process.exitCode = 2;
  } finally { await connection.close(); }
}

if (require.main === module) main().catch((error) => {
  // Do not echo connection strings or driver errors containing credentials.
  console.error(`Preview failed (${error.name}); no database records were written. Check arguments, target access and output path.`);
  process.exitCode = 1;
});
