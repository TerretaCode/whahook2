"use client"

import Image from 'next/image'

interface QRCodeDisplayProps {
  qrCode: string
  size?: number
}

export function QRCodeDisplay({ qrCode, size = 256 }: QRCodeDisplayProps) {
  // El qrCode ya viene como data URL (imagen PNG en base64) del backend
  // Solo necesitamos mostrarlo como imagen
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
      <div className="relative rounded-lg overflow-hidden" style={{ width: size, height: size }}>
        <Image 
          src={qrCode} 
          alt="WhatsApp QR Code"
          width={size}
          height={size}
          className="rounded-lg"
          unoptimized // Necesario para data URLs
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
