"use client"

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  qrCode: string
  size?: number
}

export function QRCodeDisplay({ qrCode, size = 256 }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
      <div className="rounded-lg overflow-hidden bg-white p-2">
        <QRCodeSVG 
          value={qrCode}
          size={size}
          level="M"
          includeMargin={true}
        />
      </div>
      <p className="mt-4 text-sm text-gray-600 text-center max-w-xs">
        Scan this QR code with WhatsApp on your phone
      </p>
      <p className="mt-2 text-xs text-gray-500 text-center">
        Open WhatsApp → Settings → Linked Devices → Link a Device
      </p>
    </div>
  )
}
