# Flip7 Tracker

Flip7 Tracker is a web tool designed to help players of the **Flip 7** card game keep track of deck composition, manage their hand, and make informed decisions during gameplay.  
Everything works directly in your browser — no downloads or setup required.

---

## Features

- **Deck Tracking** – Shows the number of each card remaining in the deck.  
- **Hand Management** – Add and remove cards from your hand, clear it, or return cards to the deck.  
- **Probability Sorting** – View cards sorted by highest draw chance or in default numerical order.  
- **Decision Assistant** – See the top draw chances, risk level, and recommendations.  
- **Custom Deck Editing** – Adjust card counts for different Flip 7 variants.  
- **Undo & Reset** – Quickly revert mistakes or reset the game to its starting state.  
- **Persistent State** – Your game state is saved automatically in the browser so you can close and reopen without losing progress.  

---

## How to Use

### Opening the App
Simply visit the online version here:  
[https://flip7-tracker.vercel.app/](https://flip7-tracker.vercel.app/)

### Main Tabs

#### Play
- Tap **Played** to remove a card from the deck when it’s played.  
- Tap **To hand** to add a card to your hand.  
- Your current hand is shown below — tap **X** to remove individual cards.  
- Use **Clear hand** to remove all cards from your hand.  
- Use **Return to deck** to put all cards in your hand back into the deck.  
- **Undo** reverts the last action.  
- **Reset** starts over with a fresh deck.

#### Decision Assistant
- Shows the **Top 5 cards** with the highest draw probability.  
- Displays the **chance of drawing a duplicate** from your current hand.  
- Gives a recommendation: *You can draw* or *Better pass*.  
- Toggle sorting between **probability** and **default order**.

#### Settings
- Edit the number of each card remaining in the deck.  
- Restore the default deck at any time.

---

## Controls Summary

| Control            | What it Does |
|--------------------|--------------|
| **Played**         | Removes a card from the deck. |
| **To hand**        | Adds a card to your hand (removes from deck). |
| **Clear hand**     | Empties your hand without returning cards. |
| **Return to deck** | Returns all cards in your hand to the deck. |
| **Undo**           | Reverts the last change. |
| **Reset**          | Restores the deck to its starting state. |

---

## Quick Tips
- The app automatically saves progress — you can close the tab and continue later.  
- For best results, keep the **Play** tab open during the game.  
- Use **probability sorting** when you need to quickly see the most likely draws.  
- The **Decision Assistant** can help you avoid risky moves.

---

## License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for details.
