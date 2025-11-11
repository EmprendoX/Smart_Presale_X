variable "project_name" {
  type        = string
  description = "Human friendly Supabase project name"
}

variable "organization_slug" {
  type        = string
  description = "Supabase organization slug"
}

variable "supabase_access_token" {
  type        = string
  description = "Personal access token for Supabase CLI"
  sensitive   = true
}

variable "tenant_slug" {
  type        = string
  description = "Primary tenant slug to bootstrap"
  default     = "smart-presale"
}

variable "base_domain" {
  type        = string
  description = "Base domain used for subdomain tenant detection"
  default     = ""
}

variable "supabase_region" {
  type        = string
  description = "Supabase region id"
  default     = "us-east-1"
}

variable "supabase_plan" {
  type        = string
  description = "Supabase billing plan"
  default     = "free"
}

variable "database_password" {
  type        = string
  description = "Database password to assign during creation"
  default     = "changeMe123!"
}

variable "env_file" {
  type        = string
  description = "Path to the .env file that should be updated"
  default     = ""
}

variable "supabase_url_override" {
  type        = string
  description = "Optional manual Supabase URL override"
  default     = ""
}

variable "supabase_project_ref_override" {
  type        = string
  description = "Fallback project ref when CLI output is unavailable"
  default     = ""
}

variable "deploy_target" {
  type        = string
  description = "Deployment target: none, vercel or docker"
  default     = "none"
  validation {
    condition     = contains(["none", "vercel", "docker"], var.deploy_target)
    error_message = "deploy_target must be one of: none, vercel, docker"
  }
}

variable "skip_schema_push" {
  type        = bool
  description = "Whether to skip supabase db push"
  default     = false
}
