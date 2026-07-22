# Conversa Enterprise Architecture — Terraform Infrastructure Configuration
# Provisions Azure Container Apps, Key Vault, Azure OpenAI, and Managed Identity

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "environment" {
  type    = string
  default = "production"
}

variable "location" {
  type    = string
  default = "eastus"
}

resource "azurerm_resource_group" "rg" {
  name     = "conversa-enterprise-rg-${var.environment}"
  location = var.location
}

resource "azurerm_key_vault" "kv" {
  name                        = "conversa-kv-${var.environment}"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = true

  sku_name = "standard"
}

data "azurerm_client_config" "current" {}

output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}
