export type Piece = 'black' | 'white' | 'empty';
export type GamePhase = 'first_move_black' | 'first_move_white' | 'playing' | 'game_over';

export interface Position {
    row: number;
    col: number;
}

export interface Move {
    from: Position;
    to: Position;
    jumped?: Position;
}

export interface GameState {
    board: Piece[][];
    rows: number;
    cols: number;
    currentPlayer: 'black' | 'white';
    phase: GamePhase;
    winner: 'black' | 'white' | null;
}

export function createBoard(rows: number, cols: number): Piece[][] {
    const board: Piece[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: Piece[] = [];
        for (let c = 0; c < cols; c++) {
            // Standard Kōnane setup: alternating colors
            // (r + c) % 2 === 0 ? black : white
            row.push((r + c) % 2 === 0 ? 'black' : 'white');
        }
        board.push(row);
    }
    return board;
}

export function getInitialValidMoves(state: GameState): Position[] {
    const moves: Position[] = [];
    const { board, rows, cols, phase } = state;

    if (phase === 'first_move_black') {
        // Black removes one piece from the middle or corners
        // Middle pieces
        const midR = Math.floor(rows / 2);
        const midC = Math.floor(cols / 2);
        
        // Let's allow center 4 if possible, or corners
        const candidates = [
            { row: midR, col: midC },
            { row: midR - 1, col: midC - 1 },
            { row: 0, col: 0 },
            { row: rows - 1, col: cols - 1 }
        ];

        candidates.forEach(pos => {
            if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
                if (board[pos.row][pos.col] === 'black') {
                    moves.push(pos);
                }
            }
        });
    } else if (phase === 'first_move_white') {
        // White removes one piece adjacent to the empty spot
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] === 'empty') {
                    const adjacents = [
                        { row: r - 1, col: c },
                        { row: r + 1, col: c },
                        { row: r, col: c - 1 },
                        { row: r, col: c + 1 }
                    ];
                    adjacents.forEach(pos => {
                        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
                            if (board[pos.row][pos.col] === 'white') {
                                moves.push(pos);
                            }
                        }
                    });
                }
            }
        }
    }
    return moves;
}

export function getValidJumps(state: GameState, player: 'black' | 'white'): Move[] {
    const moves: Move[] = [];
    const { board, rows, cols } = state;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === player) {
                const directions = [
                    { dr: -2, dc: 0, jr: -1, jc: 0 }, // Up
                    { dr: 2, dc: 0, jr: 1, jc: 0 },  // Down
                    { dr: 0, dc: -2, jr: 0, jc: -1 }, // Left
                    { dr: 0, dc: 2, jr: 0, jc: 1 }   // Right
                ];

                directions.forEach(({ dr, dc, jr, jc }) => {
                    const tr = r + dr;
                    const tc = c + dc;
                    const jur = r + jr;
                    const juc = c + jc;

                    if (tr >= 0 && tr < rows && tc >= 0 && tc < cols) {
                        const target = board[tr][tc];
                        const jumped = board[jur][juc];
                        const opponent = player === 'black' ? 'white' : 'black';

                        if (target === 'empty' && jumped === opponent) {
                            moves.push({
                                from: { row: r, col: c },
                                to: { row: tr, col: tc },
                                jumped: { row: jur, col: juc }
                            });
                        }
                    }
                });
            }
        }
    }
    return moves;
}

export function isValidMove(state: GameState, move: Move | Position): boolean {
    if (state.phase === 'first_move_black' || state.phase === 'first_move_white') {
        const pos = move as Position;
        const valid = getInitialValidMoves(state);
        return valid.some(v => v.row === pos.row && v.col === pos.col);
    } else if (state.phase === 'playing') {
        const m = move as Move;
        const valid = getValidJumps(state, state.currentPlayer);
        return valid.some(v => 
            v.from.row === m.from.row && v.from.col === m.from.col &&
            v.to.row === m.to.row && v.to.col === m.to.col
        );
    }
    return false;
}

export function applyMove(state: GameState, move: Move | Position): GameState {
    const newState = { ...state, board: state.board.map(row => [...row]) };

    if (state.phase === 'first_move_black') {
        const pos = move as Position;
        newState.board[pos.row][pos.col] = 'empty';
        newState.currentPlayer = 'white';
        newState.phase = 'first_move_white';
    } else if (state.phase === 'first_move_white') {
        const pos = move as Position;
        newState.board[pos.row][pos.col] = 'empty';
        newState.currentPlayer = 'black';
        newState.phase = 'playing';

        // Check for game over immediately after removals
        const nextMoves = getValidJumps(newState, newState.currentPlayer);
        if (nextMoves.length === 0) {
            newState.phase = 'game_over';
            newState.winner = 'white';
        }
    } else if (state.phase === 'playing') {
        const m = move as Move;
        newState.board[m.from.row][m.from.col] = 'empty';
        newState.board[m.to.row][m.to.col] = state.currentPlayer;
        if (m.jumped) {
            newState.board[m.jumped.row][m.jumped.col] = 'empty';
        }
        
        // After a jump, check if multiple jumps are possible? 
        // Standard rules: multiple jumps in same direction ARE allowed in one turn.
        // For simplicity, let's stick to single jumps per turn for now, or check if we should handle it.
        // Actually, many versions of Konane allow multiple jumps in one turn.
        // But the prompt says "Handle piece removal and jumping moves, switching turns correctly."
        
        newState.currentPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
        
        // Check for game over
        const nextMoves = getValidJumps(newState, newState.currentPlayer);
        if (nextMoves.length === 0) {
            newState.phase = 'game_over';
            newState.winner = state.currentPlayer; // Current player loses, so previous player wins
        }
    }

    return newState;
}

export function initGame(rows: number, cols: number): GameState {
    return {
        board: createBoard(rows, cols),
        rows,
        cols,
        currentPlayer: 'black',
        phase: 'first_move_black',
        winner: null
    };
}

export function getRandomMove(state: GameState): Move | Position | null {
    if (state.phase === 'first_move_black' || state.phase === 'first_move_white') {
        const valid = getInitialValidMoves(state);
        if (valid.length === 0) return null;
        return valid[Math.floor(Math.random() * valid.length)];
    } else if (state.phase === 'playing') {
        const valid = getValidJumps(state, state.currentPlayer);
        if (valid.length === 0) return null;
        return valid[Math.floor(Math.random() * valid.length)];
    }
    return null;
}
