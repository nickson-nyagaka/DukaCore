'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Clock } from 'lucide-react'

export function FlashSaleCardTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  
  useEffect(() => {
    const end = new Date(endDate).getTime()
    
    const tick = () => {
      const now = new Date().getTime()
      const distance = end - now
      
      if (distance <= 0) {
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
    <div className="bg-gradient-to-r from-pink-600/30 via-pink-500/20 to-purple-600/25 border border-pink-500/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 text-[11px] font-bold text-pink-300 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-1 text-pink-400 font-extrabold shrink-0">
        <Clock size={12} className="animate-spin text-pink-400" style={{ animationDuration: '4s' }} />
        <span>Ends in:</span>
      </div>
      <div className="flex items-center gap-1 font-mono font-black text-pink-200">
        {timeLeft.d > 0 && <span className="bg-pink-950/70 border border-pink-500/30 px-1.5 py-0.5 rounded">{timeLeft.d}d</span>}
        <span className="bg-pink-950/70 border border-pink-500/30 px-1.5 py-0.5 rounded">{timeLeft.h.toString().padStart(2, '0')}h</span>
        <span className="text-pink-400">:</span>
        <span className="bg-pink-950/70 border border-pink-500/30 px-1.5 py-0.5 rounded">{timeLeft.m.toString().padStart(2, '0')}m</span>
        <span className="text-pink-400">:</span>
        <span className="bg-pink-950/70 border border-pink-500/30 px-1.5 py-0.5 rounded">{timeLeft.s.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  )
}

export default function FlashSaleBanner({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  
  useEffect(() => {
    const end = new Date(endDate).getTime()
    
    const tick = () => {
      const now = new Date().getTime()
      const distance = end - now
      
      if (distance <= 0) {
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
    <div className="bg-gradient-to-r from-pink-600/30 via-pink-500/25 to-purple-600/30 border border-pink-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mt-3 shadow-lg shadow-pink-500/10 animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
          <Zap size={20} className="fill-pink-400 animate-pulse text-pink-300" />
        </div>
        <div>
          <div className="text-sm font-black text-pink-300 tracking-wide uppercase flex items-center gap-1.5">
            <span>⚡ Flash Sale!!!</span>
            <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-extrabold uppercase shadow-sm">
              Limited Time
            </span>
          </div>
          <p className="text-xs text-pink-200/70">Special promotional price ending soon</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm font-black font-mono">
        {timeLeft.d > 0 && (
          <div className="flex flex-col items-center">
            <span className="bg-pink-950/70 text-pink-200 border border-pink-500/40 px-2.5 py-1.5 rounded-xl shadow-inner text-base">
              {timeLeft.d}
            </span>
            <span className="text-[9px] text-pink-300 font-sans font-bold uppercase mt-0.5">Days</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="bg-pink-950/70 text-pink-200 border border-pink-500/40 px-2.5 py-1.5 rounded-xl shadow-inner text-base">
            {timeLeft.h.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-pink-300 font-sans font-bold uppercase mt-0.5">Hours</span>
        </div>
        <span className="text-pink-400 font-bold text-lg -mt-3">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-pink-950/70 text-pink-200 border border-pink-500/40 px-2.5 py-1.5 rounded-xl shadow-inner text-base">
            {timeLeft.m.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-pink-300 font-sans font-bold uppercase mt-0.5">Mins</span>
        </div>
        <span className="text-pink-400 font-bold text-lg -mt-3">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-pink-950/70 text-pink-200 border border-pink-500/40 px-2.5 py-1.5 rounded-xl shadow-inner text-base">
            {timeLeft.s.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-pink-300 font-sans font-bold uppercase mt-0.5">Secs</span>
        </div>
      </div>
    </div>
  )
}
