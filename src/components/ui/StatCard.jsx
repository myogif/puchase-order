const colorStyles = {
  blue:   { border: 'border-l-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-600' },
  green:  { border: 'border-l-green-500',  bg: 'bg-green-50',  text: 'text-green-600' },
  red:    { border: 'border-l-red-500',    bg: 'bg-red-50',    text: 'text-red-600' },
  yellow: { border: 'border-l-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  purple: { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
}

export default function StatCard({ icon: Icon, label, value, color = 'blue', onClick }) {
  const styles = colorStyles[color] || colorStyles.blue

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${styles.border} p-4 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${styles.bg}`}>
            <Icon size={24} className={styles.text} />
          </div>
        )}
      </div>
    </div>
  )
}
