'use client'

import { useState } from 'react'

export default function ProductGallery({ images, name }: { images: string[], name: string }) {
  const [selected, setSelected] = useState(images[0] || '')

  if (images.length === 0) {
    return (
      <div className="glass rounded-3xl aspect-square overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-card-dark">
        <span className="text-6xl text-muted/30">📦</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="glass rounded-3xl aspect-square overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-card-dark relative group border border-border shadow-sm">
        <img 
          src={selected} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(img)}
              className={`w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-card-dark border-2 transition-all hover:scale-105 cursor-pointer shrink-0 ${
                selected === img ? 'border-primary shadow-sm scale-95' : 'border-border opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`${name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
