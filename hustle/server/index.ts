import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  isFaceUp?: boolean;
  coveringCards?: Card[];
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hand: Card[];
  faceDownCards: Card[];
}

interface Room {
  id: string;
  code: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentPlayer?: string;
  deck?: Card[];
  gameStarted: boolean;
  currentTurn: string;
}

const rooms: Map<string, Room> = new Map();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createDeck(): Card[] {
  const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (let value = 1; value <= 13; value++) {
      deck.push({ suit, value });
    }
  }
  
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function dealCards(room: Room): Room {
  const deck = createDeck();
  const updatedRoom = { ...room, deck, status: 'playing' as const };
  
  // Deal 3 face-down cards and 9 hand cards to each player
  updatedRoom.players = updatedRoom.players.map(player => {
    const faceDownCards = deck.splice(0, 3).map(card => ({ ...card, isFaceUp: false }));
    const hand = deck.splice(0, 9).map(card => ({ ...card, isFaceUp: true }));
    return {
      ...player,
      faceDownCards,
      hand
    };
  });

  // Set the first player as current player
  updatedRoom.currentPlayer = updatedRoom.players[0].id;
  
  return updatedRoom;
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ playerName }, callback) => {
    try {
      console.log('Received createRoom request from:', socket.id, 'with name:', playerName);
      const roomCode = generateRoomCode();
      const room: Room = {
        id: socket.id,
        code: roomCode,
        players: [{
          id: socket.id,
          name: playerName,
          isHost: true,
          hand: [],
          faceDownCards: []
        }],
        status: 'waiting',
        gameStarted: false,
        currentTurn: ''
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      console.log('Created room:', roomCode, 'for player:', playerName);
      
      callback({ room });
    } catch (error) {
      console.error('Error in createRoom:', error);
      callback({ error: 'Failed to create room' });
    }
  });

  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    try {
      console.log('Received joinRoom request for room:', roomCode, 'from player:', playerName);
      const room = rooms.get(roomCode);
      
      if (!room) {
        console.log('Room not found:', roomCode);
        callback({ error: 'Room not found' });
        return;
      }

      if (room.players.length >= 4) {
        console.log('Room is full:', roomCode);
        callback({ error: 'Room is full' });
        return;
      }

      const newPlayer: Player = {
        id: socket.id,
        name: playerName,
        isHost: false,
        hand: [],
        faceDownCards: []
      };

      room.players.push(newPlayer);

      socket.join(roomCode);
      console.log('Player joined room:', playerName, 'in room:', roomCode);
      io.to(roomCode).emit('roomUpdated', { room });
      
      callback({ room });
    } catch (error) {
      console.error('Error in joinRoom:', error);
      callback({ error: 'Failed to join room' });
    }
  });

  socket.on('startGame', ({ roomCode }, callback) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        callback({ error: 'Player not found' });
        return;
      }

      if (!player.isHost) {
        callback({ error: 'Only the host can start the game' });
        return;
      }

      if (room.players.length < 2) {
        callback({ error: 'Need at least 2 players to start the game' });
        return;
      }

      // Initialize the game
      room.gameStarted = true;
      room.currentTurn = room.players[0].id; // Start with the first player

      // Deal cards to each player
      const deck = createDeck();
      const shuffledDeck = shuffleArray(deck);

      room.players.forEach(player => {
        player.hand = [];
        player.faceDownCards = [];
        
        // Deal 3 face-down cards to each player
        for (let i = 0; i < 3; i++) {
          const card = shuffledDeck.pop();
          if (card) {
            player.faceDownCards.push({ ...card, isFaceUp: false });
          }
        }
        
        // Deal 3 cards to each player's hand
        for (let i = 0; i < 9; i++) {
          const card = shuffledDeck.pop();
          if (card) {
            player.hand.push({ ...card, isFaceUp: true });
          }
        }
      });

      // Update the room and notify all players
      rooms.set(roomCode, room);
      io.to(roomCode).emit('roomUpdated', { room });
      
      callback({ room });
    } catch (error) {
      console.error('Error starting game:', error);
      callback({ error: 'Failed to start game' });
    }
  });

  socket.on('placeCard', ({ roomCode, faceDownCardIndex, coveringCard }, callback) => {
    console.log('Received placeCard request for room:', roomCode);
    console.log('Face down card index:', faceDownCardIndex);
    console.log('Covering card:', coveringCard);
    
    try {
      const room = rooms.get(roomCode);
      if (!room) {
        console.log('Room not found:', roomCode);
        callback({ error: 'Room not found' });
        return;
      }

      const player = room.players.find(p => p.id === socket.id);
      if (!player) {
        console.log('Player not found in room');
        callback({ error: 'Player not found' });
        return;
      }

      // Find and remove the card from player's hand
      const cardIndex = player.hand.findIndex(
        card => card.value === coveringCard.value && card.suit === coveringCard.suit
      );
      if (cardIndex === -1) {
        console.log('Card not found in player hand');
        callback({ error: 'Card not found in hand' });
        return;
      }

      const [placedCard] = player.hand.splice(cardIndex, 1);
      console.log('Removed card from hand:', placedCard);
      
      // Add the card to the face-down card's covering cards and ensure it's visible
      if (!player.faceDownCards[faceDownCardIndex].coveringCards) {
        player.faceDownCards[faceDownCardIndex].coveringCards = [];
      }
      const visibleCard = { ...placedCard, isFaceUp: true };
      player.faceDownCards[faceDownCardIndex].coveringCards?.push(visibleCard);
      console.log('Added card to face-down card:', player.faceDownCards[faceDownCardIndex]);

      // Update the room and notify all players
      rooms.set(roomCode, room);
      io.to(roomCode).emit('roomUpdated', { room });
      console.log('Room updated and broadcasted');
      
      callback({ room });
    } catch (error) {
      console.error('Error placing card:', error);
      callback({ error: 'Failed to place card' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle player disconnection and room cleanup
    rooms.forEach((room, code) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          io.to(code).emit('playerLeft', { room });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 