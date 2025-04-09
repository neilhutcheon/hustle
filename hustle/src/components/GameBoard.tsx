import { Box, VStack, Text, HStack, Image, Stack } from '@chakra-ui/react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Player, Card } from '../types/game';
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface GameBoardProps {
  currentPlayer: Player | undefined;
  roomPlayers: Player[];
  isCurrentTurn: boolean;
  roomCode: string;
  socket: Socket | null;
}

interface DraggableCardProps {
  card: Card;
  index: number;
  isFaceUp: boolean;
  onCardDrop?: (draggedCard: Card, targetCard: Card, targetIndex: number) => void;
  isCovered?: boolean;
  coveringCards?: Card[];
}

const DraggableCard = ({ card, index, isFaceUp, onCardDrop, isCovered, coveringCards }: DraggableCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { card, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: (item: { card: Card; index: number }) => {
      if (onCardDrop) {
        onCardDrop(item.card, card, index);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const cardImage = isFaceUp 
    ? `/cards/${card.value}_of_${card.suit}.png`
    : '/cards/back.png';

  return (
    <Box
      ref={(node: HTMLElement | null) => drag(drop(node))}
      key={index}
      position="relative"
      cursor={isCovered ? 'default' : 'pointer'}
      opacity={isDragging ? 0.5 : 1}
      transform={isOver ? 'scale(1.1)' : 'none'}
      transition="all 0.2s"
      _hover={{ transform: isCovered ? 'none' : 'translateY(-10px)' }}
    >
      <Image
        src={cardImage}
        alt={isFaceUp ? `${card.value} of ${card.suit}` : 'Face down card'}
        width="100px"
        height="140px"
        objectFit="contain"
      />
      {isCovered && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.5)"
          borderRadius="md"
        />
      )}
      {coveringCards && coveringCards.map((card, i) => (
        <Box
          key={i}
          position="absolute"
          top={`${(i + 1) * 10}px`}
          left={`${(i + 1) * 10}px`}
          zIndex={i + 1}
        >
          <Image
            src={`/cards/${card.value}_of_${card.suit}.png`}
            alt={`${card.value} of ${card.suit}`}
            width="100px"
            height="140px"
            objectFit="contain"
          />
        </Box>
      ))}
    </Box>
  );
};

const GameBoard = ({ currentPlayer, roomPlayers, isCurrentTurn, roomCode, socket }: GameBoardProps) => {
  const [localRoomPlayers, setLocalRoomPlayers] = useState(roomPlayers);

  useEffect(() => {
    setLocalRoomPlayers(roomPlayers);
  }, [roomPlayers]);

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available');
      return;
    }

    socket.on('roomUpdated', ({ room }) => {
      setLocalRoomPlayers(room.players);
    });

    // Cleanup socket listener
    return () => {
      socket.off('roomUpdated');
    };
  }, [socket]);

  const handleCardDrop = (draggedCard: Card, targetCard: Card, targetIndex: number) => {
    if (!socket || !currentPlayer) {
      console.log('Socket or currentPlayer not available:', { socket, currentPlayer });
      return;
    }

    console.log('Attempting to place card:', draggedCard, 'on face-down card:', targetCard, 'at index:', targetIndex);

    // Only allow placing cards on face-down cards that aren't already covered
    if (!targetCard.isFaceUp) {
      // Immediately update the local state
      const updatedPlayers = localRoomPlayers.map(player => {
        if (player.id === currentPlayer.id) {
          // Remove the card from hand
          const updatedHand = player.hand.filter(
            card => !(card.value === draggedCard.value && card.suit === draggedCard.suit)
          );
          
          // Add the card to the face-down card's covering cards
          const updatedFaceDownCards = [...player.faceDownCards];
          if (!updatedFaceDownCards[targetIndex].coveringCards) {
            updatedFaceDownCards[targetIndex].coveringCards = [];
          }
          updatedFaceDownCards[targetIndex].coveringCards?.push({
            ...draggedCard,
            isFaceUp: true
          });

          return {
            ...player,
            hand: updatedHand,
            faceDownCards: updatedFaceDownCards
          };
        }
        return player;
      });

      setLocalRoomPlayers(updatedPlayers);

      console.log('Emitting placeCard event');
      socket.emit('placeCard', { 
        roomCode, 
        faceDownCardIndex: targetIndex, 
        coveringCard: {
          value: draggedCard.value,
          suit: draggedCard.suit,
          isFaceUp: true
        }
      }, (response: { room?: any; error?: string }) => {
        console.log('Place card response:', response);
        if (response.error) {
          console.error('Error placing card:', response.error);
          // Revert the local state if there was an error
          setLocalRoomPlayers(roomPlayers);
        }
      });
    } else {
      console.log('Cannot place card on face-up card');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack gap={8} width="100%">
        {/* Opponents' cards */}
        <HStack gap={4} wrap="wrap" justify="center">
          {localRoomPlayers
            .filter(player => player.id !== currentPlayer?.id)
            .map(player => (
              <VStack key={player.id} gap={2}>
                <Text fontWeight="bold">
                  {player.name} ({player.hand.length} cards)
                </Text>
                <HStack>
                  {player.faceDownCards.map((card, index) => (
                    <DraggableCard
                      key={index}
                      card={card}
                      index={index}
                      isFaceUp={false}
                      isCovered={card.coveringCards && card.coveringCards.length > 0}
                      coveringCards={card.coveringCards}
                    />
                  ))}
                </HStack>
              </VStack>
            ))}
        </HStack>

        {/* Current player's cards */}
        {currentPlayer && (
          <VStack gap={4}>
            <Text fontSize="xl" fontWeight="bold">
              Your Cards
            </Text>
            <HStack gap={2} wrap="wrap" justify="center">
              {localRoomPlayers
                .find(player => player.id === currentPlayer.id)
                ?.hand.map((card, index) => (
                  <DraggableCard
                    key={index}
                    card={card}
                    index={index}
                    isFaceUp={true}
                    onCardDrop={handleCardDrop}
                  />
                ))}
            </HStack>
            <Text>Face down cards:</Text>
            <HStack gap={2} wrap="wrap" justify="center">
              {localRoomPlayers
                .find(player => player.id === currentPlayer.id)
                ?.faceDownCards.map((card, index) => (
                  <DraggableCard
                    key={index}
                    card={card}
                    index={index}
                    isFaceUp={false}
                    onCardDrop={handleCardDrop}
                    isCovered={card.coveringCards && card.coveringCards.length > 0}
                    coveringCards={card.coveringCards}
                  />
                ))}
            </HStack>
          </VStack>
        )}

        {/* Game status */}
        <Text fontSize="lg" color={isCurrentTurn ? 'green.400' : 'gray.400'}>
          {isCurrentTurn ? "It's your turn!" : "Waiting for other players..."}
        </Text>
      </VStack>
    </DndProvider>
  );
};

export default GameBoard; 