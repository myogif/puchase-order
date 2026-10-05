import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const typeConfig = {
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-800', iconColor: 'text-green-500' },
  error:   { icon: XCircle,     bg: 'bg-red-50',   border: 'border-red-400',   text: 'text-red-800',   iconColor: 'text-red-500' },
  info:    { icon: Info,         bg: 'bg-blue-50',  border: 'border-blue-400',  text: 'text-blue-800',  iconColor: 'text-blue-500' },
}

export default function Toast({ message, type = 'success', onClose }) {
  const config = typeConfig[type] || typeConfig.success
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-[slideIn_0.2s_ease-out] ${config.bg} ${config.border}`}>
      <Icon size={20} className={`shrink-0 ${config.iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{message}</p>
      <button onClick={onClose} className={`shrink-0 p-0.5 rounded hover:bg-black/5 ${config.text}`}>
        <X size={16} />
      </button>
    </div>
  )
}
