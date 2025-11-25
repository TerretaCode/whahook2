"use client"

import { ShoppingCart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EcommerceConnectionsSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">E-commerce Connections</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your online store (WooCommerce, PrestaShop, Shopify)
          </p>
        </div>
        <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled>
          <Plus className="w-4 h-4 mr-2" />
          Connect Store
        </Button>
      </div>

      {/* Empty State */}
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No E-commerce Connections
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Connect your online store to sync products and orders
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Coming Soon:</strong> Full e-commerce integration with WooCommerce, PrestaShop, and Shopify
          </p>
        </div>
      </div>
    </div>
  )
}
