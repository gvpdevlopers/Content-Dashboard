// Explicit operator command; never loads application .env or uses its connection.
const fs = require("node:fs/promises");
const { validatePreview, runServiceAccessMigration } = require("../utils/serviceAccessMigration");
const help = "--mode verify|apply|rollback --database NAME --approve-sha256 HASH [--preview PATH] [--environment staging|production --backup-reference ID] [--allow-production]. Set MIGRATION_MONGO_URI separately for apply/rollback. Verify is offline.";

function parseOptions(args) {
  const allowed = new Set(["--mode", "--database", "--approve-sha256", "--preview", "--environment", "--backup-reference", "--allow-production"]);
  const options = {};
  const bad = () => { throw Object.assign(new Error("Invalid arguments. Use --help for the explicit target, preview and approval requirements."), { code: "SERVICE_ACCESS_MIGRATION_GUARD" }); };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!allowed.has(key) || Object.hasOwn(options, key)) bad();
    if (key === "--allow-production") options[key] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith("--")) bad();
      options[key] = value;
    }
  }
  const mode = options["--mode"];
  if (!["verify", "apply", "rollback"].includes(mode) ||
      !/^[a-zA-Z0-9_-]{1,63}$/.test(options["--database"] || "") ||
      !/^[a-f0-9]{64}$/.test(options["--approve-sha256"] || "")) bad();
  if ((mode === "apply" || mode === "verify") && !options["--preview"]) bad();
  if (mode === "rollback" && options["--preview"]) bad();
  if (mode !== "verify") {
    const environment = options["--environment"];
    if (!["staging", "production"].includes(environment) ||
        !/^[a-zA-Z0-9_.:-]{1,120}$/.test(options["--backup-reference"] || "") ||
        (environment === "production") !== Boolean(options["--allow-production"])) bad();
  } else if (options["--environment"] || options["--backup-reference"] || options["--allow-production"]) bad();
  return options;
}

async function main(args = process.argv.slice(2), { env = process.env, log = console.log } = {}) {
  if (!args.length || args.includes("--help")) { log(help); return; }
  const options = parseOptions(args);
  const mode = options["--mode"], database = options["--database"], approvedSha256 = options["--approve-sha256"];
  let preview;
  if (options["--preview"]) {
    const bytes = await fs.readFile(options["--preview"]);
    if (bytes.length > 8 * 1024 * 1024) throw Object.assign(new Error("Preview exceeds the 8 MiB receipt size limit; review the rollout size."), { code: "SERVICE_ACCESS_MIGRATION_GUARD" });
    preview = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
    validatePreview(preview, { database, approvedSha256 });
  }
  if (mode === "verify") {
    log(JSON.stringify({ mode, database, sha256: approvedSha256, counts: preview.counts, offline: true }));
    return;
  }
  if (!env.MIGRATION_MONGO_URI) throw Object.assign(new Error("Set MIGRATION_MONGO_URI explicitly. Application .env is not loaded."), { code: "SERVICE_ACCESS_MIGRATION_GUARD" });
  const mongoose = require("mongoose");
  const connection = await mongoose.createConnection(env.MIGRATION_MONGO_URI, {
    dbName: database, autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000,
  }).asPromise();
  try {
    const result = await runServiceAccessMigration({ db: connection.db, startSession: () => connection.startSession(),
      mode, preview, approvedSha256, environment: options["--environment"], backupReference: options["--backup-reference"] });
    log(JSON.stringify({ mode, database, receiptId: result.receipt._id, state: result.receipt.state,
      counts: mode === "apply" ? result.receipt.appliedCounts : result.receipt.rolledBackCounts, noOp: result.noOp }));
  } finally { await connection.close(); }
}

if (require.main === module) main().catch((error) => {
  // Driver/URI errors can contain credentials. Only known, local guard messages
  // may be printed. A connection loss after commit has an unknown outcome:
  // retry with the same approved hash and consult the authoritative DB receipt.
  console.error(error.code === "SERVICE_ACCESS_MIGRATION_GUARD" ? error.message :
    `Migration command failed (${error.name}). Check target access and transaction support. If commit status is uncertain, retry the same approved hash and check its database receipt.`);
  process.exitCode = 1;
});
module.exports = { parseOptions, main };
