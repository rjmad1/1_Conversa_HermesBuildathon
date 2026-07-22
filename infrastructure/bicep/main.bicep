// Conversa Enterprise Architecture — Azure Infrastructure as Code (Bicep)
// Provisions Azure Container Apps, Azure Key Vault, Azure OpenAI, Azure Service Bus, and App Insights

@description('Target Azure region for Conversa Enterprise deployment')
param location string = resourceGroup().location

@description('Environment name (staging or production)')
param environment string = 'production'

@description('Prefix for all Conversa enterprise resources')
param prefix string = 'conversa'

// 1. Azure Key Vault for Envelope KMS Secret Storage
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${prefix}-kv-${environment}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableSoftDelete: true
    enablePurgeProtection: true
    enableRbacAuthorization: true
  }
}

// 2. Azure OpenAI Service
resource openAIService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: '${prefix}-openai-${environment}'
  location: location
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: '${prefix}-openai-${environment}'
    publicNetworkAccess: 'Enabled'
  }
}

// 3. Azure Service Bus for Async Task Execution Queues
resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: '${prefix}-sb-${environment}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource taskQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'conversa-task-dispatches'
}

// 4. Azure Container Apps Environment & Container App
resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${prefix}-aca-env-${environment}'
  location: location
  properties: {
    zoneRedundant: false
  }
}

resource conversaApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-app-${environment}'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
    }
    template: {
      containers: [
        {
          name: 'conversa-app'
          image: 'ghcr.io/conversa/conversa:latest'
          resources: {
            cpu: json('1.0')
            memory: '2.0Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
        }
      ]
    }
  }
}

output appFqdn string = conversaApp.properties.configuration.ingress.fqdn
output keyVaultUri string = keyVault.properties.vaultUri
