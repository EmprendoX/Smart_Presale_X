# Environment Variables

This document describes all environment variables needed for Smart Pre-Sale.

## Required Variables (Supabase Mode)

When `USE_SUPABASE=true`, these variables are required:

### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://your-project.supabase.co`
- **Where to get it**: Supabase Dashboard → Settings → API → Project URL

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key (safe to expose in client-side code)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get it**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key (KEEP SECRET - server-side only)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get it**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **⚠️ WARNING**: This key bypasses Row Level Security. Never expose it to the client!

### `USE_SUPABASE`
- **Description**: Enable Supabase mode
- **Values**: `true` or `false`
- **Default**: `false` (uses JSON files)

## Optional Variables

### Tenant Configuration

#### `DEFAULT_TENANT_ID`
- **Description**: Default tenant ID (used when no tenant is specified)
- **Default**: `tenant_default`

#### `DEFAULT_TENANT_SLUG`
- **Description**: Default tenant slug (used for routing and subdomain detection)
- **Default**: `smart-presale`

#### `TENANT_BASE_DOMAIN`
- **Description**: Base domain for multi-tenant subdomain routing (e.g., `smartpresale.app`)
- **Default**: Empty (not using subdomain-based tenancy)

### Stripe Payment Configuration

These are optional. If not configured, the app will use a mock payment driver for testing.

#### `STRIPE_SECRET_KEY`
- **Description**: Stripe secret key for payment processing
- **Example**: `sk_test_51AbCdEf...` (test) or `sk_live_51AbCdEf...` (production)
- **Where to get it**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

#### `STRIPE_WEBHOOK_SECRET`
- **Description**: Stripe webhook secret for verifying webhook signatures
- **Example**: `whsec_1234567890abcdef...`
- **Where to get it**: [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Add endpoint → Copy signing secret

#### `STRIPE_CONNECT_ACCOUNT_ID`
- **Description**: Stripe Connect account ID (for multi-vendor/marketplace scenarios)
- **Default**: Empty (not using Stripe Connect)

## Example `.env.local` File

Create a `.env.local` file in the project root with:

```env
# Supabase Configuration
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Tenant Configuration (optional)
DEFAULT_TENANT_ID=tenant_default
DEFAULT_TENANT_SLUG=smart-presale
TENANT_BASE_DOMAIN=

# Stripe Configuration (optional - for real payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CONNECT_ACCOUNT_ID=
```

## Security Notes

1. **Never commit `.env.local` to version control** - It's already in `.gitignore`
2. **For production**, set these variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - Other platforms: Check their documentation
3. **The `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client**
4. **Use test keys (`sk_test_*`) for development**, live keys (`sk_live_*`) for production
5. **Rotate keys regularly** if they are exposed or compromised

