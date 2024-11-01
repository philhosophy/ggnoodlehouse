// src/App.tsx
import { useEffect, useState } from 'react'
import { Game } from 'phaser'
import { gameConfig } from '@game/config/gameConfig'

export default function App() {
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    const gameInstance = new Game(gameConfig)
    setGame(gameInstance)

    return () => {
      gameInstance.destroy(true)
    }
  }, [])

  return (
    <div className="relative w-full h-screen">
      <div id="phaser-game" className="absolute inset-0" />
    </div>
  )
}