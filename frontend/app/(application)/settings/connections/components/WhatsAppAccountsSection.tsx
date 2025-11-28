"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WhatsAppSessionCard } from './WhatsAppSessionCard'
import { useWhatsAppAccounts } from '@/hooks/whatsapp/useWhatsAppAccounts'
import { useWhatsAppSessions } from '@/hooks/whatsapp/useWhatsAppSessions'
import { 
  Smartphone, 
  Plus, 
  Loader2,
  AlertCircle
} from 'lucide-react'

interface WhatsAppAccountsSectionProps {
  workspaceId?: string
}

export function WhatsAppAccountsSection({ workspaceId }: WhatsAppAccountsSectionProps) {
  const { accounts, isLoading: accountsLoading, createAccount } = useWhatsAppAccounts()
  const { sessions, isLoading: sessionsLoading, createSession, destroySession, isSocketConnected } = useWhatsAppSessions()
  
  const [showNewAccountForm, setShowNewAccountForm] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName.trim()) return

    setIsCreating(true)
    
    try {
      const account = await createAccount(newAccountName.trim(), workspaceId)
      
      if (account) {
        await createSession(account.id)
        setNewAccountName('')
        setShowNewAccountForm(false)
      }
    } catch (error) {
      console.error('Error during account creation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const getAccountName = (session: typeof sessions[0]) => {
    // First try to find matching account by id
    const account = accounts.find(a => a.id === session.account_id)
    if (account?.label) return account.label
    
    // Fallback: check if session itself has label (same table)
    const sessionWithLabel = session as typeof session & { label?: string }
    if (sessionWithLabel.label) return sessionWithLabel.label
    
    return 'WhatsApp Account'
  }

  if (accountsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">WhatsApp Connections</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your WhatsApp accounts to start sending messages
          </p>
        </div>
        <Button
          onClick={() => setShowNewAccountForm(!showNewAccountForm)}
          disabled={isCreating}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Socket Status */}
      {!isSocketConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">
              Real-time connection is not active. QR codes may not update automatically.
            </p>
          </div>
        </div>
      )}

      {/* New Account Form */}
      {showNewAccountForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label htmlFor="account_name" className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <Input
                id="account_name"
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Main Business Account"
                required
                disabled={isCreating}
              />
              <p className="mt-1 text-xs text-gray-500">
                Give this WhatsApp connection a memorable name
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating || !newAccountName.trim()} className="bg-green-600 hover:bg-green-700">
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Create & Connect
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewAccountForm(false)
                  setNewAccountName('')
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No WhatsApp Connections
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add your first WhatsApp account to start sending messages
          </p>
          <Button
            onClick={() => setShowNewAccountForm(true)}
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <WhatsAppSessionCard
              key={session.id}
              session={session}
              accountName={getAccountName(session)}
              onDestroy={destroySession}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          How to connect WhatsApp:
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Click "Add Account" and give it a name</li>
          <li>A QR code will appear</li>
          <li>Open WhatsApp on your phone</li>
          <li>Go to Settings → Linked Devices → Link a Device</li>
          <li>Scan the QR code displayed here</li>
          <li>Your WhatsApp will be connected!</li>
        </ol>
      </div>
    </div>
  )
}
