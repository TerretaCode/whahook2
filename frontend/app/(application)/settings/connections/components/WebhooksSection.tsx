"use client"

import { Webhook, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WebhooksSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
          <p className="text-sm text-gray-600 mt-1">
            Receive real-time notifications about WhatsApp events
          </p>
        </div>
        <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled>
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Empty State */}
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Webhooks Configured
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Set up webhooks to receive real-time event notifications
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Configure webhooks for message.received, message.sent, session.ready, and more
          </p>
        </div>
      </div>
    </div>
  )
}
