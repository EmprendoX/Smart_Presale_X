terraform {
  required_version = ">= 1.5.0"
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "3.2.1"
    }
    local = {
      source  = "hashicorp/local"
      version = "2.5.1"
    }
  }
}

provider "null" {}
provider "local" {}

locals {
  env_file_path = var.env_file != "" ? var.env_file : "${path.module}/../../.env.local"
}

resource "null_resource" "supabase_project" {
  triggers = {
    project_name = var.project_name
    org_slug     = var.organization_slug
    region       = var.supabase_region
    plan         = var.supabase_plan
  }

  provisioner "local-exec" {
    command = <<EOT
SUPABASE_ACCESS_TOKEN=${var.supabase_access_token} \
  npx supabase projects create "${var.project_name}" \
    --organization ${var.organization_slug} \
    --region ${var.supabase_region} \
    --database-password ${var.database_password} \
    --plan ${var.supabase_plan} \
    --json > ${path.module}/supabase-project.json
EOT
    interpreter = ["/bin/sh", "-c"]
  }
}

data "local_file" "supabase_project" {
  filename = "${path.module}/supabase-project.json"
  depends_on = [null_resource.supabase_project]
}

data "external" "project_config" {
  depends_on = [null_resource.supabase_project]
  program    = ["node", "-e", <<EOT
const fs = require('fs');
const file = process.argv[process.argv.length - 1];
if (!fs.existsSync(file)) {
  console.log('{}');
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const output = {
  api_url: data.restUrl || data.apiUrl || '',
  anon_key: data.anonKey || data.anon_key || '',
  service_key: data.serviceRoleKey || data.service_role || '',
  project_ref: data.projectRef || data.ref || data.reference_id || ''
};
console.log(JSON.stringify(output));
EOT
  , "${path.module}/supabase-project.json"]
}

resource "local_file" "env_file" {
  filename = local.env_file_path
  content  = <<EOT
NEXT_PUBLIC_SUPABASE_URL=${coalesce(data.external.project_config.result.api_url, var.supabase_url_override)}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${coalesce(data.external.project_config.result.anon_key, "")}
SUPABASE_SERVICE_ROLE_KEY=${coalesce(data.external.project_config.result.service_key, "")}
DEFAULT_TENANT_SLUG=${var.tenant_slug}
TENANT_BASE_DOMAIN=${var.base_domain}
USE_SUPABASE=true
EOT
  depends_on = [data.external.project_config]
}

resource "null_resource" "schema_push" {
  count = var.skip_schema_push ? 0 : 1

  provisioner "local-exec" {
    command = <<EOT
SUPABASE_ACCESS_TOKEN=${var.supabase_access_token} \
  npx supabase db push --project-ref ${coalesce(data.external.project_config.result.project_ref, var.supabase_project_ref_override)}
EOT
    interpreter = ["/bin/sh", "-c"]
  }

  depends_on = [local_file.env_file]
}

resource "null_resource" "deploy_vercel" {
  count = var.deploy_target == "vercel" ? 1 : 0

  provisioner "local-exec" {
    command = "npx vercel deploy --prod"
    environment = {
      NEXT_PUBLIC_SUPABASE_URL       = coalesce(data.external.project_config.result.api_url, var.supabase_url_override)
      NEXT_PUBLIC_SUPABASE_ANON_KEY  = coalesce(data.external.project_config.result.anon_key, "")
      SUPABASE_SERVICE_ROLE_KEY      = coalesce(data.external.project_config.result.service_key, "")
      DEFAULT_TENANT_SLUG            = var.tenant_slug
      TENANT_BASE_DOMAIN             = var.base_domain
    }
  }

  depends_on = [null_resource.schema_push]
}

resource "null_resource" "deploy_docker" {
  count = var.deploy_target == "docker" ? 1 : 0

  provisioner "local-exec" {
    command = "docker build -t ${var.tenant_slug}-smart-presale ${path.root}"
  }

  depends_on = [null_resource.schema_push]
}

output "supabase_env" {
  value = {
    NEXT_PUBLIC_SUPABASE_URL      = coalesce(data.external.project_config.result.api_url, var.supabase_url_override)
    NEXT_PUBLIC_SUPABASE_ANON_KEY = data.external.project_config.result.anon_key
    SUPABASE_SERVICE_ROLE_KEY     = data.external.project_config.result.service_key
    DEFAULT_TENANT_SLUG           = var.tenant_slug
    TENANT_BASE_DOMAIN            = var.base_domain
  }
  sensitive = true
}
