#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require("node:child_process");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

function printUsage() {
  console.log(`\nSmart Pre-Sale tenant bootstrap CLI\n\nUsage:\n  node scripts/tenant-bootstrap.js --project-name "Acme" --org acme-org --tenant-name "Acme Capital" --tenant-slug acme --supabase-token $SUPABASE_ACCESS_TOKEN [--base-domain smartpresale.app] [--env .env.local] [--deploy vercel|docker] [--dry-run]\n`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    switch (key) {
      case "--project-name":
        args.projectName = next;
        i += 1;
        break;
      case "--org":
      case "--organization":
        args.organization = next;
        i += 1;
        break;
      case "--tenant-name":
        args.tenantName = next;
        i += 1;
        break;
      case "--tenant-slug":
        args.tenantSlug = next;
        i += 1;
        break;
      case "--supabase-token":
        args.supabaseToken = next;
        i += 1;
        break;
      case "--base-domain":
        args.baseDomain = next;
        i += 1;
        break;
      case "--env":
        args.envFile = next;
        i += 1;
        break;
      case "--deploy":
        args.deploy = next;
        i += 1;
        break;
      case "--region":
        args.region = next;
        i += 1;
        break;
      case "--db-password":
        args.databasePassword = next;
        i += 1;
        break;
      case "--plan":
        args.plan = next;
        i += 1;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        break;
    }
  }
  return args;
}

function ensureArg(name, value) {
  if (!value) {
    console.error(`Missing required argument: ${name}`);
    printUsage();
    process.exit(1);
  }
}

function run(command, options = {}) {
  if (options.dryRun) {
    console.log(`[dry-run] ${command}`);
    return "{}";
  }
  return execSync(command, { stdio: options.inherit ? "inherit" : "pipe", env: options.env }).toString();
}

function writeEnvFile(filePath, entries) {
  const resolved = resolve(process.cwd(), filePath);
  let content = "";
  if (existsSync(resolved)) {
    content = readFileSync(resolved, "utf8");
  }

  const lines = content.split(/\r?\n/).filter(Boolean);
  const map = new Map(lines.map(line => {
    const [key, ...rest] = line.split("=");
    return [key, rest.join("=")];
  }));

  Object.entries(entries).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    map.set(key, String(value));
  });

  const nextContent = Array.from(map.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  writeFileSync(resolved, `${nextContent}\n`, "utf8");
  console.log(`Updated ${resolved}`);
}

(async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  ensureArg("--project-name", args.projectName);
  ensureArg("--org", args.organization);
  ensureArg("--tenant-name", args.tenantName);
  ensureArg("--tenant-slug", args.tenantSlug);
  ensureArg("--supabase-token", args.supabaseToken || process.env.SUPABASE_ACCESS_TOKEN);

  const supabaseToken = args.supabaseToken || process.env.SUPABASE_ACCESS_TOKEN;
  const envFile = args.envFile || ".env.local";
  const region = args.region || "us-east-1";
  const randomPassword = Math.random().toString(36).slice(2, 10);
  const dbPassword = args.databasePassword || `${randomPassword}!Ab`;
  const plan = args.plan || "free";
  const dryRun = Boolean(args.dryRun);

  const supabaseEnv = { ...process.env, SUPABASE_ACCESS_TOKEN: supabaseToken };

  console.log("➡️  Creating Supabase project...");
  const createCommand = `npx supabase projects create "${args.projectName}" --organization ${args.organization} --region ${region} --database-password ${dbPassword} --plan ${plan} --json`;
  const projectOutput = run(createCommand, { env: supabaseEnv, dryRun });

  let projectConfig = {};
  try {
    projectConfig = projectOutput ? JSON.parse(projectOutput) : {};
  } catch (error) {
    console.warn("Could not parse Supabase CLI output, continuing with manual configuration.");
  }

  const apiUrl = projectConfig.restUrl || projectConfig.apiUrl || "https://YOUR-PROJECT.supabase.co";
  const anonKey = projectConfig.anonKey || projectConfig.anon_key || "replace-with-anon-key";
  const serviceRoleKey = projectConfig.serviceRoleKey || projectConfig.service_role || "replace-with-service-role";
  const referenceId = projectConfig.projectRef || projectConfig.ref || projectConfig.reference_id || "your-project-ref";

  if (!dryRun) {
    console.log(`Supabase project ready (ref: ${referenceId}).`);
  }

  writeEnvFile(envFile, {
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    DEFAULT_TENANT_SLUG: args.tenantSlug,
    TENANT_BASE_DOMAIN: args.baseDomain || "",
    USE_SUPABASE: "true"
  });

  console.log("➡️  Seeding core schema to Supabase...");
  const dbPushCommand = `npx supabase db push --project-ref ${referenceId}`;
  run(dbPushCommand, { env: supabaseEnv, inherit: true, dryRun });

  console.log("➡️  Registering initial tenant settings...");
  const seedCommand = `npx supabase db remote commit --project-ref ${referenceId} --message "seed tenants"`;
  run(seedCommand, { env: supabaseEnv, inherit: true, dryRun });

  if (args.deploy === "vercel") {
    console.log("➡️  Deploying to Vercel...");
    const vercelEnv = {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: apiUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      DEFAULT_TENANT_SLUG: args.tenantSlug,
      TENANT_BASE_DOMAIN: args.baseDomain || ""
    };
    const vercelDeployCommand = "npx vercel deploy --prod";
    run(vercelDeployCommand, { env: vercelEnv, inherit: true, dryRun });
  } else if (args.deploy === "docker") {
    console.log("➡️  Building Docker image...");
    const dockerCommand = `docker build -t ${args.tenantSlug}-smart-presale .`;
    run(dockerCommand, { inherit: true, dryRun });
  } else {
    console.log("Skipping deployment (pass --deploy vercel|docker to trigger automation).");
  }

  console.log("✅  Tenant bootstrap complete. Review", envFile, "and commit the generated infrastructure changes.");
})();
