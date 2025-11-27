/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { ChatbotSettingsProps } from "./types"
import {
  BotSection,
  BusinessSection,
  ProductsSection,
  ShippingSection,
  BehaviorSection,
  AvailabilitySection,
  ConversationSection,
  EscalationSection,
  AdditionalSection,
  VisitorDataSection
} from "./components"

export function WebChatbotSettingsTab({ 
  formData, 
  updateField, 
  onFormDataChange: _onFormDataChange,
  sessionId: _sessionId,
  widgetId: _widgetId,
  ecommerceConnections = []
}: ChatbotSettingsProps) {
  // Section collapse states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bot: true,
    visitorData: false,
    business: false,
    products: false,
    shipping: false,
    behavior: false,
    availability: false,
    conversation: false,
    escalation: false,
    additional: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Helper to update nested objects
  const updateNestedField = (parent: string, field: string, value: any) => {
    const current = formData[parent] || {}
    updateField(parent, { ...current, [field]: value })
  }

  // Helper to add item to array
  const addToArray = (field: string, item: any) => {
    const current = formData[field] || []
    updateField(field, [...current, item])
  }

  // Helper to remove item from array
  const removeFromArray = (field: string, index: number) => {
    const current = formData[field] || []
    updateField(field, current.filter((_: any, i: number) => i !== index))
  }

  // Helper to update item in array
  const updateArrayItem = (field: string, index: number, value: any) => {
    const current = formData[field] || []
    const updated = [...current]
    updated[index] = value
    updateField(field, updated)
  }

  // Common props for all sections
  const sectionProps = {
    formData,
    updateField,
    updateNestedField,
    addToArray,
    removeFromArray,
    updateArrayItem,
    ecommerceConnections
  }

  return (
    <div className="space-y-4">
      {/* 🤖 TU BOT - Always visible */}
      <BotSection formData={formData} updateField={updateField} />

      {/* 👤 DATOS DEL VISITANTE - Web specific */}
      <VisitorDataSection 
        formData={formData}
        updateField={updateField}
        isOpen={openSections.visitorData}
        onToggle={() => toggleSection('visitorData')}
      />

      {/* 🏢 TU NEGOCIO */}
      <BusinessSection 
        {...sectionProps}
        isOpen={openSections.business}
        onToggle={() => toggleSection('business')}
      />

      {/* 🛒 PRODUCTOS */}
      <ProductsSection 
        {...sectionProps}
        isOpen={openSections.products}
        onToggle={() => toggleSection('products')}
      />

      {/* 📦 ENVÍOS Y PAGOS */}
      <ShippingSection 
        {...sectionProps}
        isOpen={openSections.shipping}
        onToggle={() => toggleSection('shipping')}
      />

      {/* 🎯 COMPORTAMIENTO DEL BOT */}
      <BehaviorSection 
        {...sectionProps}
        isOpen={openSections.behavior}
        onToggle={() => toggleSection('behavior')}
      />

      {/* ⏰ DISPONIBILIDAD */}
      <AvailabilitySection 
        formData={formData}
        updateField={updateField}
        isOpen={openSections.availability}
        onToggle={() => toggleSection('availability')}
      />

      {/* 💬 CONVERSACIÓN */}
      <ConversationSection 
        {...sectionProps}
        isOpen={openSections.conversation}
        onToggle={() => toggleSection('conversation')}
      />

      {/* 🚨 ESCALACIÓN */}
      <EscalationSection 
        {...sectionProps}
        isOpen={openSections.escalation}
        onToggle={() => toggleSection('escalation')}
      />

      {/* ➕ INFORMACIÓN ADICIONAL */}
      <AdditionalSection 
        formData={formData}
        updateField={updateField}
        isOpen={openSections.additional}
        onToggle={() => toggleSection('additional')}
      />
    </div>
  )
}
