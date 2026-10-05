import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={48} className="text-gray-300 mb-4" />
      {title && <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>}
      {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
