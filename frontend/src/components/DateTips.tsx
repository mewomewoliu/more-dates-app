const TIPS: Record<string, Array<{ name: string; emoji: string }>> = {
  food: [
    { name: 'Cook a new recipe together', emoji: '🍳' },
    { name: 'Visit a farmers market', emoji: '🥬' },
    { name: 'Try a new restaurant', emoji: '🍽️' },
    { name: 'Wine & cheese night', emoji: '🍷' },
    { name: 'Bake something sweet', emoji: '🧁' },
  ],
  outdoors: [
    { name: 'Sunset picnic', emoji: '🌅' },
    { name: 'Hiking trail', emoji: '🥾' },
    { name: 'Beach walk', emoji: '🌊' },
    { name: 'Botanical garden', emoji: '🌸' },
    { name: 'Stargazing', emoji: '✨' },
  ],
  culture: [
    { name: 'Museum visit', emoji: '🏛️' },
    { name: 'Live music show', emoji: '🎵' },
    { name: 'Art gallery tour', emoji: '🎨' },
    { name: 'Watch a classic film', emoji: '🎬' },
    { name: 'Improv comedy show', emoji: '🎭' },
  ],
  fun: [
    { name: 'Escape room', emoji: '🔐' },
    { name: 'Mini golf', emoji: '⛳' },
    { name: 'Bowling night', emoji: '🎳' },
    { name: 'Pottery class', emoji: '🏺' },
    { name: 'Board game café', emoji: '🎲' },
  ],
  romantic: [
    { name: 'Candlelit dinner at home', emoji: '🕯️' },
    { name: 'Slow dance to a playlist', emoji: '💃' },
    { name: 'Write letters to each other', emoji: '💌' },
    { name: 'Spa evening at home', emoji: '🛁' },
    { name: 'Recreate your first date', emoji: '💕' },
  ],
  other: [
    { name: 'Thrift store adventure', emoji: '🛍️' },
    { name: 'Drive-in movie', emoji: '🚗' },
    { name: 'Bookstore browsing', emoji: '📚' },
    { name: 'Sunrise coffee walk', emoji: '☕' },
    { name: 'Volunteer together', emoji: '🤝' },
  ],
}

interface Props {
  category: string
  onSelect: (name: string, emoji: string, category: string) => void
}

export default function DateTips({ category, onSelect }: Props) {
  const ideas = TIPS[category] ?? TIPS.fun

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="tips-label">Suggestions</div>
      <div className="tips-row">
        {ideas.map((idea) => (
          <button
            key={idea.name}
            className="suggestion-chip"
            onClick={() => onSelect(idea.name, idea.emoji, category)}
          >
            <span>{idea.emoji}</span>
            <span>{idea.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
