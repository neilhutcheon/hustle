#!/bin/bash

# Array of suits
suits=("hearts" "diamonds" "clubs" "spades")

# Loop through each suit
for suit in "${suits[@]}"; do
    # Loop through values 1-13
    for value in {1..13}; do
        # Find the next unnamed card
        next_card=$(find public/cards -name "*.png" | head -n 1)
        
        if [ -n "$next_card" ]; then
            # Rename the card
            mv "$next_card" "public/cards/${value}_of_${suit}.png"
            echo "Renamed to: ${value}_of_${suit}.png"
        else
            echo "No more cards to rename"
            exit 0
        fi
    done
done

# Rename the last card to back.png
last_card=$(find public/cards -name "*.png" | head -n 1)
if [ -n "$last_card" ]; then
    mv "$last_card" "public/cards/back.png"
    echo "Renamed to: back.png"
fi 