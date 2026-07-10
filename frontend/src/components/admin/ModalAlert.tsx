import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

interface ModalAlertProps {
  message: string | null
  type: 'success' | 'error' | null
  onClose: () => void
}

export default function ModalAlert({ message, type, onClose }: ModalAlertProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        const closeTimer = setTimeout(onClose, 300)
        return () => clearTimeout(closeTimer)
      }, 10000) // 10 seconds
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [message, onClose])

  if (!message) return null

  const bgClass = type === 'success' 
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'

  const Icon = type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-semibold transition-all duration-300 mb-4 ${bgClass} ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 text-left">{message}</div>
      <button 
        type="button" 
        onClick={() => {
          setVisible(false)
          setTimeout(onClose, 300)
        }} 
        className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-black/5 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}
