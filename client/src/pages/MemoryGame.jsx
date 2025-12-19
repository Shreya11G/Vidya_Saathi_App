

import React, { useState, useEffect, useCallback } from 'react';
import {
Play,
RotateCcw,
Trophy,
Target,
Star,
Zap
} from 'lucide-react';

// Memory Game Component
//Flip-card memory game for stress relief and cognitive training
//Features: Multiple difficulty levels, scoring system, timer, animations


const MemoryGame = () => {
// Game state management
const [cards, setCards] = useState([]);
const [flippedCards, setFlippedCards] = useState([]);
const [gameStatus, setGameStatus] = useState('menu'); // 'menu' | 'playing' | 'completed'
const [gameStats, setGameStats] = useState({
moves: 0,
matches: 0,
timeElapsed: 0,
score: 0
});

// Difficulty and settings
const [selectedDifficulty, setSelectedDifficulty] = useState({
name: 'Easy',
gridSize: 4,
timeBonus: 100,
description: '4x4 grid - Perfect for beginners'
});

// Timer management
const [timerInterval, setTimerInterval] = useState(null);

// Available difficulty levels
const difficultyLevels = [
{
name: 'Easy',
gridSize: 4,
timeBonus: 100,
description: '4x4 grid - Perfect for beginners'
},
{
name: 'Medium',
gridSize: 6,
timeBonus: 150,
description: '6x6 grid - Good challenge'
},
{
name: 'Hard',
gridSize: 8,
timeBonus: 200,
description: '8x8 grid - Expert level'
}
];

// Card symbols and colors
const cardSymbols = [
{ symbol: '🎯', color: 'bg-red-400' },
{ symbol: '🎨', color: 'bg-blue-400' },
{ symbol: '🎵', color: 'bg-green-400' },
{ symbol: '🎪', color: 'bg-yellow-400' },
{ symbol: '🎭', color: 'bg-purple-400' },
{ symbol: '🎲', color: 'bg-pink-400' },
{ symbol: '🎸', color: 'bg-indigo-400' },
{ symbol: '🎺', color: 'bg-orange-400' },
{ symbol: '🎻', color: 'bg-teal-400' },
{ symbol: '🎹', color: 'bg-cyan-400' },
{ symbol: '🎤', color: 'bg-lime-400' },
{ symbol: '🎧', color: 'bg-emerald-400' },
{ symbol: '🎬', color: 'bg-rose-400' },
{ symbol: '🎮', color: 'bg-violet-400' },
{ symbol: '🎯', color: 'bg-amber-400' },
{ symbol: '🎊', color: 'bg-fuchsia-400' },
{ symbol: '🎉', color: 'bg-sky-400' },
{ symbol: '🎈', color: 'bg-red-500' },
{ symbol: '🎁', color: 'bg-blue-500' },
{ symbol: '🎀', color: 'bg-green-500' },
{ symbol: '🎃', color: 'bg-yellow-500' },
{ symbol: '🎄', color: 'bg-purple-500' },
{ symbol: '🎆', color: 'bg-pink-500' },
{ symbol: '🎇', color: 'bg-indigo-500' },
{ symbol: '⭐', color: 'bg-orange-500' },
{ symbol: '🌟', color: 'bg-teal-500' },
{ symbol: '✨', color: 'bg-cyan-500' },
{ symbol: '💫', color: 'bg-lime-500' },
{ symbol: '🌈', color: 'bg-emerald-500' },
{ symbol: '🔥', color: 'bg-rose-500' },
{ symbol: '⚡', color: 'bg-violet-500' },
{ symbol: '💎', color: 'bg-amber-500' }
];

// Initialize cards
const initializeGame = useCallback(() => {
const totalCards = selectedDifficulty.gridSize * selectedDifficulty.gridSize;
const pairsNeeded = totalCards / 2;


const selectedSymbols = cardSymbols
  .sort(() => Math.random() - 0.5)
  .slice(0, pairsNeeded);

const gameCards = [];
selectedSymbols.forEach((symbolData, index) => {
  for (let i = 0; i < 2; i++) {
    gameCards.push({
      id: `${index}-${i}-${Date.now()}-${Math.random()}`,
      symbol: symbolData.symbol,
      isFlipped: false,
      isMatched: false,
      color: symbolData.color
    });
  }
});

const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
setCards(shuffledCards);
setFlippedCards([]);
setGameStats({ moves: 0, matches: 0, timeElapsed: 0, score: 0 });


}, [selectedDifficulty]);

// Start game
const startGame = () => {
initializeGame();
setGameStatus('playing');
const interval = setInterval(() => {
setGameStats(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
}, 1000);
setTimerInterval(interval);
};

// Handle card click
const handleCardClick = (clickedCard) => {
if (clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) {
return;
}


const updatedCards = cards.map(card =>
  card.id === clickedCard.id ? { ...card, isFlipped: true } : card
);
setCards(updatedCards);

const newFlippedCards = [...flippedCards, { ...clickedCard, isFlipped: true }];
setFlippedCards(newFlippedCards);

if (newFlippedCards.length === 2) {
  setGameStats(prev => ({ ...prev, moves: prev.moves + 1 }));
  const [firstCard, secondCard] = newFlippedCards;

  if (firstCard.symbol === secondCard.symbol) {
    setTimeout(() => {
      setCards(prevCards =>
        prevCards.map(card =>
          card.symbol === firstCard.symbol ? { ...card, isMatched: true } : card
        )
      );
      setGameStats(prev => ({
        ...prev,
        matches: prev.matches + 1,
        score: prev.score + calculateMatchScore()
      }));
      setFlippedCards([]);
      const totalPairs = (selectedDifficulty.gridSize * selectedDifficulty.gridSize) / 2;
      if (gameStats.matches + 1 === totalPairs) completeGame();
    }, 500);
  } else {
    setTimeout(() => {
      setCards(prevCards =>
        prevCards.map(card =>
          card.id === firstCard.id || card.id === secondCard.id
            ? { ...card, isFlipped: false }
            : card
        )
      );
      setFlippedCards([]);
    }, 1000);
  }
}


};

// Score calculation
const calculateMatchScore = () => {
  const baseScore = 100;
  const difficultyMultiplier = selectedDifficulty.gridSize / 4;
  const timeBonus = Math.max(0, selectedDifficulty.timeBonus - gameStats.timeElapsed);
  return Math.round(baseScore * difficultyMultiplier + timeBonus);
};

// Complete game
const completeGame = () => {
  if (timerInterval) clearInterval(timerInterval);
  const completionBonus = Math.max(0, 1000 - (gameStats.moves * 10) - gameStats.timeElapsed);
  setGameStats(prev => ({ ...prev, score: prev.score + completionBonus }));
  setGameStatus('completed');
};

// Reset
const resetToMenu = () => {
  if (timerInterval) clearInterval(timerInterval);
  setGameStatus('menu');
  setCards([]);
  setFlippedCards([]);
};

// Format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Performance rating
const getPerformanceRating = () => {
  const totalCards = selectedDifficulty.gridSize * selectedDifficulty.gridSize;
  const optimalMoves = totalCards / 2;
  const moveEfficiency = optimalMoves / gameStats.moves;
  if (moveEfficiency > 0.8 && gameStats.timeElapsed < 120) return 3;
  if (moveEfficiency > 0.6 && gameStats.timeElapsed < 180) return 2;
  return 1;
};

// Cleanup timer
useEffect(() => {
  return () => {
  if (timerInterval) clearInterval(timerInterval);
  };
}, [timerInterval]);

return ( 
<div className="space-y-6">
{/* Header */} 
<div className="flex items-center justify-between"> 
  <div> 
    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Memory Game</h1> 
    <p className="text-[var(--text-secondary)]">Flip cards to find matching pairs and train your memory </p> 
    </div> 
    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center"> 
    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
     </div> 
    </div>
  {/* Menu */}
  {gameStatus === 'menu' && (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Memory Challenge</h2>
        <p className="text-[var(--text-secondary)]">Test your memory and concentration skills</p>
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] text-center">Choose Difficulty</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficultyLevels.map((level) => (
            <button
              key={level.name}
              onClick={() => setSelectedDifficulty(level)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedDifficulty.name === level.name
                  ? 'border-purple-500  bg-purple-900/20'
                  : 'border-gray-600 hover:border-purple-300'
              }`}
            >
              <h4 className={`font-semibold mb-1 text-[var(--text-primary)]`}>{level.name}</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-2">{level.description}</p>
              <div className="text-xs text-gray-500">
                {level.gridSize}×{level.gridSize} = {level.gridSize * level.gridSize} cards
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={startGame}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg hover:scale-105 transition"
        >
          <Play className="w-5 h-5 inline-block mr-2" />
          Start Game
        </button>
      </div>
    </div>
  )}

  {/* Playing */}
  {gameStatus === 'playing' && (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-[var(--bg-primary)] rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{gameStats.moves}</div>
              <div className="text-xs text-gray-600">Moves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{gameStats.matches}</div>
              <div className="text-xs text-gray-600">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatTime(gameStats.timeElapsed)}</div>
              <div className="text-xs text-gray-600">Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{gameStats.score}</div>
              <div className="text-xs text-gray-600">Score</div>
            </div>
          </div>
          <button
            onClick={resetToMenu}
            className="bg-[var(--bg-primary)] text-[var(--text-secondary)] px-4 py-2 rounded-lg flex items-center space-x-2 border border[var(--border-color)] hover:bg-[var(--bg-secondary)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="bg-[var(--bg-primary)] rounded-xl shadow-sm border p-6">
        <div
          className="grid gap-3 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${selectedDifficulty.gridSize}, minmax(0, 1fr))`,
            maxWidth: `${selectedDifficulty.gridSize * 80}px`
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`aspect-square rounded-lg border-2 transition transform hover:scale-105 ${
                card.isFlipped || card.isMatched
                  ? `${card.color}`
                  : 'bg-[var(--bg-secondary)]'
              } ${card.isMatched ? 'opacity-75 scale-95' : ''}`}
              disabled={card.isFlipped || card.isMatched}
            >
              <div className="flex items-center justify-center h-full">
                {card.isFlipped || card.isMatched ? (
                  <span className="text-2xl">{card.symbol}</span>
                ) : (
                  <div className="w-6 h-6 bg-[var(--bg-primary)] rounded opacity-50" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Completed */}
  {gameStatus === 'completed' && (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border p-8 text-center">
      <div className="mb-6">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h2>
        <p className="text-gray-600">You completed the {selectedDifficulty.name} level!</p>
      </div>

      <div className="flex items-center justify-center space-x-1 mb-6">
        {[...Array(3)].map((_, index) => (
          <Star
            key={index}
            className={`w-8 h-8 ${
              index < getPerformanceRating()
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <div className="text-3xl font-bold text-blue-600">{gameStats.moves}</div>
          <div className="text-sm">Total Moves</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-600">{formatTime(gameStats.timeElapsed)}</div>
          <div className="text-sm">Time Taken</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-purple-600">
            {Math.round((gameStats.matches * 2 / gameStats.moves) * 100)}%
          </div>
          <div className="text-sm">Accuracy</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-orange-600">{gameStats.score}</div>
          <div className="text-sm">Final Score</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={startGame}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg"
        >
          <Play className="w-5 h-5 inline-block mr-2" />
          Play Again
        </button>
        <button
          onClick={resetToMenu}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg"
        >
          <RotateCcw className="w-5 h-5 inline-block mr-2" />
          Change Difficulty
        </button>
      </div>
    </div>
  )}
</div>


);
};

export default MemoryGame;

