'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, Target, ArrowRight } from 'lucide-react'

interface Segment {
  id: string
  name: string
  description: string
  icon: string
  count: number
  filters: Record<string, any>
}

interface SegmentSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  segments: Segment[]
  onSelectSegment: (segment: Segment) => void
}

export function SegmentSelector({
  open,
  onOpenChange,
  segments,
  onSelectSegment
}: SegmentSelectorProps) {
  const t = useTranslations('campaigns')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t('selectSegment')}
          </DialogTitle>
          <DialogDescription>
            {t('selectSegmentDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {segments.map((segment) => (
            <Card
              key={segment.id}
              className="cursor-pointer hover:border-green-500 hover:shadow-md transition-all"
              onClick={() => onSelectSegment(segment)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{segment.icon}</span>
                    {segment.name}
                  </CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {segment.count}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {segment.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  {t('createCampaignWith')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {segments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{t('noSegments')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
