// src/App.tsx
import { useEffect, useState } from 'react'
import { Game } from 'phaser'
import { gameConfig } from './game/config/gameConfig'
import Notebook from './components/Notebook'

export default function App() {
  const [game, setGame] = useState<Game | null>(null)
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  useEffect(() => {
    const gameInstance = new Game(gameConfig)
    setGame(gameInstance)

    const handleToggleNotebook = () => setIsNotebookOpen(prev => !prev);
    window.addEventListener('toggleNotebook', handleToggleNotebook);

    return () => {
      gameInstance.destroy(true)
      window.removeEventListener('toggleNotebook', handleToggleNotebook);
    }
  }, [])

  const handleClose = () => {
    setIsNotebookOpen(false);
    // Emit event to notify scene
    window.dispatchEvent(new CustomEvent('notebookClosed'));
  };

  return (
    <div className="relative w-full h-screen">
      <div id="phaser-game" className="absolute inset-0" />
      <Notebook 
        isOpen={isNotebookOpen}
        onClose={handleClose}
      />
    </div>
  )
}