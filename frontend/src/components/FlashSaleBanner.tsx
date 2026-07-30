'use client'

import React, { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

export default function FlashSaleBanner({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null)
  
  useEffect(() => {
    const end = new Date(endDate).getTime()
    
    const tick = () => {
      const now = new Date().getTime()
      const distance = end - now
      
      if (distance < 0) {
        setTimeLeft(null)
        return
      }
      
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }
    
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [endDate])
  
  if (!timeLeft) return null

  return (
    <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 mt-2">
      <div className="flex items-center gap-2 text-danger font-bold text-sm">
        <Zap size={18} fill="currentColor" className="animate-pulse" />
        FLASH SALE ENDS IN:
      </div>
      <div className="flex items-center gap-2 text-danger font-black font-mono">
        {timeLeft.d > 0 && <span className="bg-danger/20 px-2 py-1 rounded">{timeLeft.d}d</span>}
        <span className="bg-danger/20 px-2 py-1 rounded">{timeLeft.h.toString().padStart(2, '0')}h</span>
        <span className="bg-danger/20 px-2 py-1 rounded">{timeLeft.m.toString().padStart(2, '0')}m</span>
        <span className="bg-danger/20 px-2 py-1 rounded">{timeLeft.s.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  )
}
