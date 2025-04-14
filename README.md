# Hustle - A Multiplayer Card Game

Hustle is a real-time multiplayer card game built with React, TypeScript, Node.js, and Socket.IO. Players can create or join rooms, start games, and play with friends in real-time.

## Features

- 🎮 Real-time multiplayer gameplay
- 🏠 Create and join game rooms
- 👥 Support for 2-4 players
- 🃏 Drag and drop card interactions
- 🔄 Real-time game state synchronization
- 🎨 Modern UI with Chakra UI

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Chakra UI
  - React DnD (Drag and Drop)
  - Socket.IO Client

- **Backend:**
  - Node.js
  - Express
  - Socket.IO
  - TypeScript

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hustle.git
   cd hustle
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up the card images**
   - Place card images in the `public/cards` directory
   - Images should be named in the format `{value}_of_{suit}.png` (e.g., `1_of_hearts.png`)
   - Include a `back.png` for the card backs

4. **Start the development servers**

   In one terminal:
   ```bash
   # Start the server
   cd server
   npm run dev
   ```

   In another terminal:
   ```bash
   # Start the client
   cd client
   npm run dev
   ```

5. **Open the application**
   - The client will be available at `http://localhost:5173`
   - The server will run on `http://localhost:3001`

## Game Rules

1. **Setup:**
   - Each player receives 3 face-down cards and 9 cards in their hand
   - Players take turns placing cards on their face-down cards

2. **Gameplay:**
   - Players can place cards from their hand onto their face-down cards
   - Placed cards are visible to all players
   - The game continues until all players have placed their cards

3. **Winning:**
   - The player with the highest total value of face-up cards wins

## Project Structure

```
hustle/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main application component
│   └── public/             # Static assets
│       └── cards/          # Card images
├── server/                 # Node.js backend
│   ├── src/
│   │   └── index.ts        # Server entry point
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 