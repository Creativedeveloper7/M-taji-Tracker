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
    <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 z-[1000] border border-gray-100">
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

