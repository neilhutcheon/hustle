export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hand: Card[];
  faceDownCards: Card[];
}

export interface Card {
  value: string;
  suit: string;
  isFaceUp: boolean;
  coveringCards?: Card[];
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentPlayer?: string;
  deck?: Card[];
  gameStarted: boolean;
  currentTurn: string;
}

export interface GameState {
  room: Room;
  currentPlayer: string | null;
  // We'll add more game-specific state later
} 