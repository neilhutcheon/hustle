import { useState, useEffect } from 'react';
import { Box, Button, Container, Heading, Input, VStack, Text } from '@chakra-ui/react';
import { useColorModeValue } from './components/ui/color-mode';
import { Toaster, toaster } from "./components/ui/toaster"
import { useSocket } from './hooks/useSocket';
import { Room, Player, Card } from './types/game';
import GameBoard from './components/GameBoard';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const { socket } = useSocket('http://localhost:3001');

  useEffect(() => {
    if (socket) {
      socket.on('roomUpdated', ({ room }: { room: Room }) => {
        console.log('Room updated:', room);
        console.log('Game started:', room.gameStarted);
        setRoom(room);
      });

      return () => {
        socket.off('roomUpdated');
      };
    }
  }, [socket]);

  const handleCreateRoom = async () => {
    if (!socket) {
      toaster.create({
        title: 'Error',
        description: 'Not connected to server',
      });
      return;
    }

    setIsCreatingRoom(true);
    try {
      socket.emit('createRoom', { playerName }, (response: { room?: Room; error?: string }) => {
        if (response.error) {
          toaster.create({
            title: 'Error',
            description: response.error,
          });
        } else if (response.room) {
          console.log('Room created:', response.room);
          setRoom(response.room);
        }
      });
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!socket) {
      toaster.create({
        title: 'Error',
        description: 'Not connected to server',
      });
      return;
    }

    setIsJoiningRoom(true);
    try {
      socket.emit('joinRoom', { roomCode, playerName }, (response: { room?: Room; error?: string }) => {
        if (response.error) {
          toaster.create({
            title: 'Error',
            description: response.error,
          });
        } else if (response.room) {
          console.log('Room joined:', response.room);
          setRoom(response.room);
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleStartGame = async () => {
    if (!socket || !room) return;
    console.log('Starting game');
    try {
      socket.emit('startGame', { roomCode: room.code }, (response: { room?: Room; error?: string }) => {
        if (response.error) {
          toaster.create({
            title: 'Error',
            description: response.error,
          });
        } else if (response.room) {
          console.log('Game started:', response.room);
          setRoom(response.room);
        }
      });
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.900', 'gray.50');

  return (
      <Box p={4}>
        <Toaster/>
        {!room ? (
          <Box bg={bgColor} minH="100vh" color={textColor}>
            <Container maxW="container.md" py={10}>
              <VStack gap={8}>
                <Heading>Hustle</Heading>
                <Input
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxW="300px"
                />
                <VStack gap={4} w="100%">
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!socket || !playerName}
                    color={textColor}
                  >
                    {socket ? 'Create New Room' : 'Connecting...'}
                  </Button>
                  <Input
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    maxW="300px"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!socket || !playerName || !roomCode}
                    color={textColor}
                  >
                    {socket ? 'Join Room' : 'Connecting...'}
                  </Button>
                </VStack>
              </VStack>
            </Container>
          </Box>
        ) : (
          <VStack gap={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Room Code: {room.code}
            </Text>
            <Text>Players:</Text>
            <VStack>
              {room.players.map((player: Player) => (
                <Text key={player.id}>
                  {player.name} {player.isHost ? '(Host)' : ''}
                </Text>
              ))}
            </VStack>
            {room.players.find((p: Player) => p.id === socket?.id)?.isHost && !room.gameStarted && (
              <Button
                colorScheme="green"
                onClick={handleStartGame}
                color={textColor}
              >
                Start Game
              </Button>
            )}
            {room.gameStarted && (
              <GameBoard
                currentPlayer={room.players.find((p: Player) => p.id === socket?.id)}
                roomPlayers={room.players}
                isCurrentTurn={room.currentTurn === socket?.id}
                roomCode={room.code}
                socket={socket}
              />
            )}
          </VStack>
        )}
      </Box>
  );
}

export default App; 