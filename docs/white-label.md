# White-label Tenant Bootstrap Guide

This guide walks through provisioning a dedicated Smart Pre-Sale tenant with branded styles,
Supabase infrastructure and a deployment target (Vercel or Docker).

## 1. Clone the repository

```bash
git clone https://github.com/your-org/smart-presale-x.git
cd smart-presale-x
npm install
```

## 2. Create a Supabase project

You can bootstrap the project either with Terraform or the Node.js CLI.

### Option A – Terraform automation

```bash
cd infra/terraform
terraform init
terraform apply \
  -var="project_name=Acme Smart Presale" \
  -var="organization_slug=acme" \
  -var="tenant_slug=acme" \
  -var="supabase_access_token=$SUPABASE_ACCESS_TOKEN" \
  -var="base_domain=smartpresale.app" \
  -var="deploy_target=vercel"
```

Terraform will:

1. Call the Supabase CLI to create a new project.
2. Push the schema located in `supabase/schema.sql`.
3. Write `.env.local` with Supabase credentials and tenant defaults.
4. Optionally trigger a Vercel deploy or build a Docker image depending on `deploy_target`.

### Option B – Node CLI

```bash
node scripts/tenant-bootstrap.js \
  --project-name "Acme Smart Presale" \
  --org acme \
  --tenant-name "Acme Capital" \
  --tenant-slug acme \
  --supabase-token $SUPABASE_ACCESS_TOKEN \
  --base-domain smartpresale.app \
  --deploy vercel
```

The CLI mirrors the Terraform workflow but is easier to run ad-hoc or in CI pipelines.
Use `--dry-run` to preview commands.

## 3. Configure local environment

The bootstrap tools generate a `.env.local` file similar to:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DEFAULT_TENANT_SLUG=acme
TENANT_BASE_DOMAIN=smartpresale.app
USE_SUPABASE=true
```

Commit this file only if you manage secrets via a secure store. Otherwise keep it local
and configure your hosting provider (Vercel, Docker secrets, etc.) with the same values.

## 4. Seed tenant branding

Update tenant settings through the API or directly in Supabase.

```bash
curl -X PUT https://<your-app>/api/tenants/<tenant-id>/settings \
  -H "Content-Type: application/json" \
  -d '{
    "logoUrl": "https://cdn.example.com/acme/logo.svg",
    "primaryColor": "#0047AB",
    "primaryColorForeground": "#ffffff",
    "secondaryColor": "#26D07C",
    "backgroundColor": "#F5F9FF",
    "surfaceColor": "#ffffff",
    "fontFamily": "Roboto"
  }'
```

Alternatively edit the `tenant_settings` table inside Supabase Studio.

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` (or `https://acme.localhost` if using a custom hosts entry)
with the tenant slug mapped to the base domain.

## 6. Deploy updates

- **Vercel**: `npx vercel deploy --prod`
- **Docker**: `docker build -t acme-smart-presale . && docker run --env-file .env.local -p 3000:3000 acme-smart-presale`

Ensure environment variables on the hosting platform match your `.env.local` file.

## 7. Add additional tenants

1. Insert a new row into `tenants` with a unique `slug`.
2. Insert a corresponding row into `tenant_settings` for logos and palette.
3. Point a subdomain (e.g. `beta.smartpresale.app`) or send requests with the
   `x-tenant-slug` header so the middleware resolves the tenant.
4. Repeat the bootstrap CLI with `--tenant-slug` if you need separate infrastructure.

Happy launching!
