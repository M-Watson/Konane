# KonaneJS

A modern, lightweight Single Page Application (SPA) implementation of the traditional Hawaiian board game **Kōnane**. Built with Vanilla TypeScript, Vite, and Tailwind CSS.

## Table of Contents
1. [About the Game](#about-the-game)
2. [Rules of Kōnane](#rules-of-kōnane)
3. [Implementation Overview](#implementation-overview)
4. [Tutorial: Core Logic](#tutorial-core-logic)
    - [State Management](#state-management)
    - [Board Generation](#board-generation)
    - [Move Validation](#move-validation)
    - [AI Opponent](#ai-opponent)
5. [Getting Started](#getting-started)

---

## About the Game
Kōnane is a strategic two-player board game often compared to checkers or draughts. It is traditionally played on a "papamū" (stone board) using black "ʻiliʻili" (basalt) and white "pōhaku" (coral) pieces. Unlike checkers, the goal is not necessarily to capture all of the opponent's pieces, but to be the **last player able to make a valid move**.

## Rules of Kōnane
1.  **Setup:** The board starts completely filled with alternating black and white pieces.
2.  **Phase 1 (Black):** The first player (Black) removes one of their pieces from either the exact center of the board or one of the four corners.
3.  **Phase 2 (White):** The second player (White) removes one of their pieces that is orthogonally adjacent to the empty spot created by Black.
4.  **Phase 3 (Jumping):** 
    *   Players take turns jumping one of their pieces over an opponent's piece into an empty spot.
    *   Jumps must be horizontal or vertical (orthogonal).
    *   Captured pieces are removed from the board.
    *   In this implementation, players perform single jumps per turn.
5.  **Winning:** If it is your turn and you have no valid jumps remaining, you lose. The last player to make a move wins.

---

## Implementation Overview
This version of Kōnane is designed as a modular SPA:
- **Build Tool:** [Vite](https://vitejs.dev/) for fast bundling and development.
- **Language:** **TypeScript** for strict typing and reliable logic.
- **Styling:** **Tailwind CSS** for a responsive, utility-first UI.
- **Architecture:** 
    - `game.ts`: Pure logic and state transitions (The "Engine").
    - `ui.ts`: Dynamic DOM rendering and visual updates (The "View").
    - `main.ts`: Event orchestration and AI handling (The "Controller").

---

## Tutorial: Core Logic

### State Management
We define the game state using clear TypeScript interfaces. This ensures that every part of our application knows exactly what data it's working with.

```typescript
export type Piece = 'black' | 'white' | 'empty';
export type GamePhase = 'first_move_black' | 'first_move_white' | 'playing' | 'game_over';

export interface GameState {
    board: Piece[][];
    rows: number;
    cols: number;
    currentPlayer: 'black' | 'white';
    phase: GamePhase;
    winner: 'black' | 'white' | null;
}
```

### AT Protocol Multiplayer (New)
The game state layer has been extended to support decentralized multiplayer via the **AT Protocol (Bluesky)**. This allows two players to play across the internet without a centralized game server. State is stored directly in each player's account repository.

#### Lexicon Definition: `app.konane.game`
This custom lexicon defines how Kōnane game records are stored on the AT Protocol.

```json
{
  "lexicon": 1,
  "id": "app.konane.game",
  "defs": {
    "main": {
      "type": "record",
      "description": "A record representing a state transition in a Kōnane game.",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["gameId", "black", "white", "board", "currentPlayer", "phase", "moveNumber", "createdAt"],
        "properties": {
          "gameId": { "type": "string", "format": "uuid" },
          "black": { "type": "string", "format": "did" },
          "white": { "type": "string", "format": "did" },
          "board": { 
            "type": "array", 
            "items": { "type": "array", "items": { "type": "string" } } 
          },
          "currentPlayer": { "type": "string", "enum": ["black", "white"] },
          "phase": { "type": "string" },
          "winner": { "type": "string", "nullable": true },
          "moveNumber": { "type": "integer" },
          "createdAt": { "type": "string", "format": "datetime" }
        }
      }
    }
  }
}
```

#### How Online Play Works:
1.  **Authentication:** Players log in using their Bluesky handle and an [App Password](https://bsky.app/settings/app-passwords).
2.  **State Sync:** When a player makes a move, a new `app.konane.game` record is pushed to their personal data repository (PDS).
3.  **Polling:** The opponent's client polls the repositories of both players for the latest record associated with the `gameId`. The record with the highest `moveNumber` is used as the current state.
4.  **Security:** Moves are signed by the player's private key (handled by the PDS), ensuring that only the authorized players can "write" to the game state.

### Board Generation
Generating the board involves creating a 2D array and populating it with alternating colors based on the row and column indices.

```typescript
export function createBoard(rows: number, cols: number): Piece[][] {
    const board: Piece[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: Piece[] = [];
        for (let c = 0; c < cols; c++) {
            // (r + c) % 2 determines the alternating pattern
            row.push((r + c) % 2 === 0 ? 'black' : 'white');
        }
        board.push(row);
    }
    return board;
}
```

### Move Validation
Kōnane has two distinct types of moves: the initial removals and the subsequent jumps. Our validator checks the game phase to apply the correct rules.

**Jump Logic Snippet:**
```typescript
// Check directions: Up, Down, Left, Right
const directions = [
    { dr: -2, dc: 0, jr: -1, jc: 0 }, 
    { dr: 2, dc: 0, jr: 1, jc: 0 },
    // ...
];

if (target === 'empty' && jumped === opponent) {
    // This is a valid jump move
}
```

### AI Opponent
The AI in this version is a "Random Mover." It scans the board for all valid moves for its turn and selects one at random. While simple, it provides a functional opponent for testing and casual play.

```typescript
export function getRandomMove(state: GameState): Move | Position | null {
    if (state.phase === 'playing') {
        const valid = getValidJumps(state, state.currentPlayer);
        if (valid.length === 0) return null;
        return valid[Math.floor(Math.random() * valid.length)];
    }
    // ...
}
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation
1.  Navigate to the `KonaneJS` directory:
    ```bash
    cd KonaneJS
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Development
Start the local development server:
```bash
npm run dev
```

### Production Build
Create an optimized production bundle in the `dist/` folder:
```bash
npm run build
```
