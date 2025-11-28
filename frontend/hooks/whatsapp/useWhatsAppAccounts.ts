import { useState, useEffect, useCallback } from 'react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'

export interface WhatsAppAccount {
  id: string
  user_id: string
  phone_number: string | null
  label: string  // Cambiado de account_name a label
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useWhatsAppAccounts() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await ApiClient.request<{ accounts: WhatsAppAccount[] }>(
        '/api/whatsapp/accounts'
      )
      setAccounts(response.data?.accounts || [])
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch WhatsApp accounts'
      setError(errorMsg)
      console.error('Error fetching accounts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createAccount = useCallback(async (accountName: string, workspaceId?: string) => {
    setIsLoading(true)
    try {
      const payload: { label: string; workspace_id?: string } = { label: accountName };
      if (workspaceId) {
        payload.workspace_id = workspaceId;
      }
      
      const response = await ApiClient.request<{ account: WhatsAppAccount }>(
        '/api/whatsapp/accounts',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )
      
      if (response.data?.account) {
        setAccounts(prev => [...prev, response.data!.account])
        toast.success('Success', 'WhatsApp account created successfully')
        return response.data.account
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create account'
      toast.error('Error', errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteAccount = useCallback(async (accountId: string) => {
    setIsLoading(true)
    try {
      await ApiClient.request(`/api/whatsapp/accounts/${accountId}`, {
        method: 'DELETE'
      })
      
      setAccounts(prev => prev.filter(acc => acc.id !== accountId))
      toast.success('Success', 'Account deleted successfully')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete account'
      toast.error('Error', errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    isLoading,
    error,
    fetchAccounts,
    createAccount,
    deleteAccount
  }
}
