# Smart Pre-Sale Terraform Bootstrap

This template drives the CLI-based bootstrap workflow described in `docs/white-label.md`.
It wraps the Supabase CLI and deployment commands so the entire environment can be
provisioned from Terraform.

## Inputs

See [`variables.tf`](./variables.tf) for the complete list of inputs. At minimum you must
provide:

- `project_name`
- `organization_slug`
- `supabase_access_token`
- `tenant_slug`

## Usage

```bash
terraform init
terraform apply \
  -var="project_name=Acme Smart Presale" \
  -var="organization_slug=acme" \
  -var="tenant_slug=acme" \
  -var="supabase_access_token=$SUPABASE_ACCESS_TOKEN" \
  -var="deploy_target=vercel"
```

If you prefer to manage deployment manually, set `deploy_target="none"` and the plan will
stop after updating the `.env` file and pushing the schema.

The module produces the generated Supabase credentials as a sensitive output named
`supabase_env` that can be fed into CI/CD systems.
