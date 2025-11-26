"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Save,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle
} from "lucide-react"

interface AIConfig {
  id?: string
  provider: string
  model: string
  api_key?: string
  has_api_key?: boolean
}

const providerModels: Record<string, { value: string; label: string; description: string }[]> = {
  google: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Best price/performance" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Most capable" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Stable & fast" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Very capable" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o", description: "Fastest GPT-4" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Best value" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Most capable" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Fast & affordable" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Best overall" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Fast & affordable" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus", description: "Most capable" },
  ],
}

const providerInfo: Record<string, { 
  name: string
  url: string
  steps: string[]
  freeCredits: string
}> = {
  google: {
    name: "Google AI Studio",
    url: "https://aistudio.google.com/app/apikey",
    steps: [
      "Click the link below to open Google AI Studio",
      "Sign in with your Google account",
      "Click 'Create API Key'",
      "Copy the key and paste it here"
    ],
    freeCredits: "Free tier available with generous limits"
  },
  openai: {
    name: "OpenAI Platform",
    url: "https://platform.openai.com/api-keys",
    steps: [
      "Click the link below to open OpenAI",
      "Sign in or create an account",
      "Go to API Keys section",
      "Click 'Create new secret key'",
      "Copy the key and paste it here"
    ],
    freeCredits: "$5 free credits for new accounts"
  },
  anthropic: {
    name: "Anthropic Console",
    url: "https://console.anthropic.com/settings/keys",
    steps: [
      "Click the link below to open Anthropic Console",
      "Sign in or create an account",
      "Go to API Keys in Settings",
      "Click 'Create Key'",
      "Copy the key and paste it here"
    ],
    freeCredits: "$5 free credits for new accounts"
  }
}

const defaultConfig: AIConfig = {
  provider: "google",
  model: "gemini-2.5-flash",
}

export function GlobalAIConfig() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [formData, setFormData] = useState<AIConfig>(defaultConfig)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsInitialLoading(true)
    try {
      const response = await ApiClient.request<any>('/api/ai/config')
      const data = response.data?.data || response.data
      
      if (data && data.id) {
        setConfig(data)
        setFormData({
          provider: data.provider || 'google',
          model: data.model || 'gemini-2.5-flash',
          api_key: data.has_api_key ? '••••••••' : '',
          has_api_key: data.has_api_key,
        })
      }
    } catch {
      // No config exists yet
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setSaveStatus('idle')
    try {
      const data = { ...formData }
      
      // Don't send placeholder api_key
      if (data.api_key === '••••••••') {
        delete data.api_key
      }
      
      await ApiClient.request('/api/ai/config', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      setSaveStatus('success')
      await loadConfig()
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Reset model when provider changes
    if (field === 'provider') {
      const models = providerModels[value]
      if (models && models.length > 0) {
        setFormData(prev => ({ ...prev, provider: value, model: models[0].value }))
      }
    }
  }

  const currentProviderInfo = providerInfo[formData.provider]

  if (isInitialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Configuration</h3>
            <p className="text-sm text-gray-600">Configure AI model for all app features</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Sparkles className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Configuration</h3>
          <p className="text-sm text-gray-600">Configure AI model for all app features</p>
        </div>
      </div>

      {/* Status indicator */}
      {config?.has_api_key && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">
            AI configured with <strong>{config.provider === 'google' ? 'Google Gemini' : config.provider === 'openai' ? 'OpenAI' : 'Anthropic'}</strong> - {config.model}
          </span>
        </div>
      )}

      {!config?.has_api_key && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Configure your API key to enable AI features
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Provider */}
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select 
            value={formData.provider} 
            onValueChange={(v) => updateField('provider', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">
                <div className="flex items-center gap-2">
                  <span>🔷</span>
                  <span>Google Gemini</span>
                  <span className="text-xs text-green-600 ml-1">Recommended</span>
                </div>
              </SelectItem>
              <SelectItem value="openai">
                <div className="flex items-center gap-2">
                  <span>🟢</span>
                  <span>OpenAI GPT</span>
                </div>
              </SelectItem>
              <SelectItem value="anthropic">
                <div className="flex items-center gap-2">
                  <span>🟠</span>
                  <span>Anthropic Claude</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label>Model</Label>
          <Select 
            value={formData.model} 
            onValueChange={(v) => updateField('model', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {providerModels[formData.provider]?.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{m.label}</span>
                    <span className="text-xs text-gray-500">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* How to get API Key - Step by step guide */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                How to get your {currentProviderInfo.name} API Key
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside mb-3">
                {currentProviderInfo.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  💰 {currentProviderInfo.freeCredits}
                </span>
              </div>
              <a 
                href={currentProviderInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Open {currentProviderInfo.name}
              </a>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input
              type={showApiKey ? "text" : "password"}
              value={formData.api_key || ''}
              onChange={(e) => updateField('api_key', e.target.value)}
              placeholder={
                formData.provider === 'google' ? 'AIza...' :
                formData.provider === 'openai' ? 'sk-...' :
                'sk-ant-...'
              }
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Your API key is encrypted and stored securely
          </p>
        </div>

        {/* Info about usage */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">This configuration is used for:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              WhatsApp Chatbot (automatic responses)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Client capture (information extraction)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Conversation analysis
            </li>
          </ul>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isLoading} 
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Error saving
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
