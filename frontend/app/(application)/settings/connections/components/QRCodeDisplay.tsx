"use client"

import { useState, useRef } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Download, Copy, Check } from 'lucide-react'

interface QRCodeDisplayProps {
  qrCode: string
  size?: number
  accountName?: string
}

export function QRCodeDisplay({ qrCode, size = 256, accountName = 'WhatsApp' }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Download QR as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `qr-${accountName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // Copy QR to clipboard as image
  const handleCopy = async () => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy QR:', error)
      // Fallback: download instead
      handleDownload()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
      {/* Visible SVG QR */}
      <div className="rounded-lg overflow-hidden bg-white p-2">
        <QRCodeSVG 
          value={qrCode}
          size={size}
          level="M"
          includeMargin={true}
        />
      </div>

      {/* Hidden Canvas for download/copy */}
      <div ref={canvasRef} className="hidden">
        <QRCodeCanvas
          value={qrCode}
          size={512}
          level="M"
          includeMargin={true}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
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
