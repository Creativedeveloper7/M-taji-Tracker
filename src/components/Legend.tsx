const Legend = () => {
  const categories = [
    { name: 'Agriculture', color: 'agriculture', emoji: '🟢' },
    { name: 'Water', color: 'water', emoji: '🔵' },
    { name: 'Health', color: 'health', emoji: '🔴' },
    { name: 'Education', color: 'education', emoji: '🔵' },
    { name: 'Infrastructure', color: 'infrastructure', emoji: '🟡' },
    { name: 'Economic', color: 'economic', emoji: '🟠' },
  ]

  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-[1000]">
      {/* Categories Legend */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <h3 className="font-heading font-semibold text-mtaji-primary mb-3 text-sm">Initiative Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: getCategoryColor(category.color) }}
              />
              <span className="text-gray-700">{category.emoji} {category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Status Legend */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <h3 className="font-heading font-semibold text-mtaji-primary mb-3 text-sm">Project Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full bg-amber-500 opacity-40 animate-ping"></div>
              <div className="relative w-5 h-5 rounded-full border-2 border-amber-500 bg-amber-500"></div>
            </div>
            <span className="text-gray-700">Active Progress</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-500"></div>
            <span className="text-gray-700">Stalled (No Changes)</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-yellow-500 bg-yellow-500"></div>
            <span className="text-gray-700">Baseline/Pending</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-5 h-5 rounded-full border-2 border-amber-700 bg-amber-700"></div>
            <span className="text-gray-700">Completed</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
          Status based on satellite analysis
        </p>
      </div>
    </div>
  )
}

const getCategoryColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    agriculture: '#52B788',
    water: '#4ECDC4',
    health: '#FF6B6B',
    education: '#4DABF7',
    infrastructure: '#FFD93D',
    economic: '#FFA94D',
  }
  return colorMap[color] || '#52B788'
}

export default Legend

