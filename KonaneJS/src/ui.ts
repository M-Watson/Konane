import type { GameState, Position } from './game';

export function renderBoard(
    state: GameState, 
    boardElement: HTMLElement, 
    onCellClick: (row: number, col: number) => void,
    selectedPiece: Position | null
) {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateRows = `repeat(${state.rows}, minmax(0, 1fr))`;
    boardElement.style.gridTemplateColumns = `repeat(${state.cols}, minmax(0, 1fr))`;

    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cell = document.createElement('div');
            cell.className = `w-12 h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-colors`;
            
            // Checkerboard pattern for cells
            const isDark = (r + c) % 2 !== 0;
            cell.classList.add(isDark ? 'bg-gray-400' : 'bg-gray-200');

            const piece = state.board[r][c];
            if (piece !== 'empty') {
                const pieceEl = document.createElement('div');
                const isSelected = selectedPiece && selectedPiece.row === r && selectedPiece.col === c;
                
                pieceEl.className = `w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg transform transition-transform ${
                    piece === 'black' ? 'bg-black' : 'bg-white'
                } ${isSelected ? 'scale-110 ring-4 ring-yellow-400' : 'hover:scale-105'}`;
                
                cell.appendChild(pieceEl);
            } else if (selectedPiece) {
                // If a piece is selected, highlight potential jump targets?
                // For now, let's just make it clickable
            }

            cell.addEventListener('click', () => onCellClick(r, c));
            boardElement.appendChild(cell);
        }
    }
}

export function updateStatus(state: GameState, statusElement: HTMLElement, playerRole?: 'black' | 'white' | null) {
    statusElement.classList.remove('hidden');
    
    let text = "";
    if (state.phase === 'first_move_black') {
        text = "Black: Remove a piece (Center or Corner)";
    } else if (state.phase === 'first_move_white') {
        text = "White: Remove an adjacent piece";
    } else if (state.phase === 'playing') {
        text = `Current Turn: ${state.currentPlayer.charAt(0).toUpperCase() + state.currentPlayer.slice(1)}`;
    } else if (state.phase === 'game_over') {
        text = `Game Over! ${state.winner?.toUpperCase()} wins!`;
    }

    if (playerRole && state.phase !== 'game_over') {
        const isMyTurn = state.currentPlayer === playerRole || 
            (state.phase === 'first_move_black' && playerRole === 'black') ||
            (state.phase === 'first_move_white' && playerRole === 'white');
        text += isMyTurn ? " (Your Turn)" : " (Opponent's Turn)";
    }

    statusElement.textContent = text;
}

export function showGameOver(winner: 'black' | 'white' | null, modal: HTMLElement, textEl: HTMLElement) {
    if (!winner) return;
    textEl.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    modal.classList.remove('hidden');
}

export function hideGameOver(modal: HTMLElement) {
    modal.classList.add('hidden');
}
