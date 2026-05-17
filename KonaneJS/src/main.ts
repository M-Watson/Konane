import './style.css';
import type { 
    GameState, 
    Position 
} from './game';
import { 
    initGame, 
    applyMove, 
    isValidMove,
    getRandomMove
} from './game';
import { 
    renderBoard, 
    updateStatus, 
    showGameOver, 
    hideGameOver 
} from './ui';
import { AtProtoGameService } from './atproto';
import type { KonaneGameRecord } from './atproto';

let state: GameState;
let selectedPiece: Position | null = null;
let isAiEnabled = false;

// Online Game State
const atProto = new AtProtoGameService();
let isOnlineGame = false;
let gameId: string | null = null;
let playerRole: 'black' | 'white' | null = null;
let opponentDid: string | null = null;
let lastMoveNumber = -1;
let pollingInterval: number | null = null;

const boardEl = document.getElementById('board')!;
const statusEl = document.getElementById('status')!;
const rowsInput = document.getElementById('rows') as HTMLInputElement;
const colsInput = document.getElementById('cols') as HTMLInputElement;
const aiToggle = document.getElementById('ai-toggle') as HTMLInputElement;
const startBtn = document.getElementById('start-btn')!;
const restartBtn = document.getElementById('restart-btn')!;
const sidebarNewGameBtn = document.getElementById('sidebar-new-game-btn')!;
const modalEl = document.getElementById('game-over-modal')!;
const winnerTextEl = document.getElementById('winner-text')!;
const configPanel = document.getElementById('config-panel')!;

// ATProto Elements
const handleInput = document.getElementById('handle') as HTMLInputElement;
const passwordInput = document.getElementById('app-password') as HTMLInputElement;
const loginBtn = document.getElementById('login-btn')!;
const logoutBtn = document.getElementById('logout-btn')!;
const loginForm = document.getElementById('login-form')!;
const userInfo = document.getElementById('user-info')!;
const displayHandle = document.getElementById('display-handle')!;
const opponentHandleInput = document.getElementById('opponent-handle') as HTMLInputElement;
const createOnlineBtn = document.getElementById('create-online-btn')!;
const joinGameIdInput = document.getElementById('join-game-id') as HTMLInputElement;
const joinOnlineBtn = document.getElementById('join-online-btn')!;

async function handleLogin() {
    try {
        const handle = handleInput.value;
        const password = passwordInput.value;
        await atProto.login(handle, password);
        
        loginForm.classList.add('hidden');
        userInfo.classList.remove('hidden');
        displayHandle.textContent = handle;
    } catch (e) {
        alert('Login failed: ' + e);
    }
}

function handleLogout() {
    atProto.userDid = null;
    loginForm.classList.remove('hidden');
    userInfo.classList.add('hidden');
    stopOnlinePolling();
}

async function startOnlineGame() {
    const oppHandle = opponentHandleInput.value;
    if (!oppHandle) return alert('Please enter opponent handle');
    
    try {
        opponentDid = await atProto.resolveHandle(oppHandle);
        gameId = crypto.randomUUID();
        playerRole = 'black'; // Creator is Black
        isOnlineGame = true;
        isAiEnabled = false;
        lastMoveNumber = 0;
        
        state = initGame(8, 8); // Fixed size for online for now
        await syncStateToAtProto();
        
        hideGameOver(modalEl);
        configPanel.querySelector('.grid')?.classList.add('hidden');
        refreshUI();
        startOnlinePolling();
        
        alert(`Game created! Share this ID with ${oppHandle}: ${gameId}`);
    } catch (e) {
        alert('Failed to start online game: ' + e);
    }
}

async function joinOnlineGame() {
    const id = joinGameIdInput.value;
    const oppHandle = opponentHandleInput.value; // Reuse this for joining too
    if (!id || !oppHandle) return alert('Please enter Game ID and Opponent Handle');
    
    try {
        opponentDid = await atProto.resolveHandle(oppHandle);
        gameId = id;
        playerRole = 'white'; // Joiner is White
        isOnlineGame = true;
        isAiEnabled = false;
        
        // Fetch latest state
        const latest = await atProto.getLatestGameState(gameId, [atProto.userDid!, opponentDid]);
        if (!latest) throw new Error('Game not found');
        
        state = {
            board: latest.board as any,
            rows: latest.board.length,
            cols: latest.board[0].length,
            currentPlayer: latest.currentPlayer,
            phase: latest.phase as any,
            winner: latest.winner as any
        };
        lastMoveNumber = latest.moveNumber;
        
        hideGameOver(modalEl);
        configPanel.querySelector('.grid')?.classList.add('hidden');
        refreshUI();
        startOnlinePolling();
    } catch (e) {
        alert('Failed to join online game: ' + e);
    }
}

async function syncStateToAtProto() {
    if (!isOnlineGame || !gameId || !atProto.userDid || !opponentDid) return;
    
    const record: KonaneGameRecord = {
        gameId,
        black: playerRole === 'black' ? atProto.userDid : opponentDid,
        white: playerRole === 'white' ? atProto.userDid : opponentDid,
        board: state.board,
        currentPlayer: state.currentPlayer,
        phase: state.phase,
        winner: state.winner,
        moveNumber: lastMoveNumber + 1,
        createdAt: new Date().toISOString()
    };
    
    await atProto.saveGameState(record);
    lastMoveNumber++;
}

function startOnlinePolling() {
    stopOnlinePolling();
    pollingInterval = window.setInterval(async () => {
        if (state.currentPlayer !== playerRole && state.phase !== 'game_over') {
            const latest = await atProto.getLatestGameState(gameId!, [atProto.userDid!, opponentDid!]);
            if (latest && latest.moveNumber > lastMoveNumber) {
                state = {
                    board: latest.board as any,
                    rows: latest.board.length,
                    cols: latest.board[0].length,
                    currentPlayer: latest.currentPlayer,
                    phase: latest.phase as any,
                    winner: latest.winner as any
                };
                lastMoveNumber = latest.moveNumber;
                refreshUI();
            }
        }
    }, 5000); // Poll every 5 seconds
}

function stopOnlinePolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

function startGame() {
    isOnlineGame = false;
    stopOnlinePolling();
    
    const rows = parseInt(rowsInput.value) || 8;
    const cols = parseInt(colsInput.value) || 8;
    isAiEnabled = aiToggle.checked;
    
    state = initGame(rows, cols);
    selectedPiece = null;
    hideGameOver(modalEl);
    
    configPanel.querySelector('.grid')?.classList.add('hidden');
    refreshUI();
}

function resetToConfig() {
    configPanel.querySelector('.grid')?.classList.remove('hidden');
    state.phase = 'game_over'; 
    hideGameOver(modalEl);
    stopOnlinePolling();
    refreshUI();
}

async function handleCellClick(row: number, col: number) {
    if (state.phase === 'game_over') return;
    if (isAiEnabled && state.currentPlayer === 'white') return; 
    if (isOnlineGame && state.currentPlayer !== playerRole) return; // Not your turn

    if (state.phase === 'first_move_black' || state.phase === 'first_move_white') {
        if (isValidMove(state, { row, col })) {
            state = applyMove(state, { row, col });
            if (isOnlineGame) await syncStateToAtProto();
            refreshUI();
            checkAiTurn();
        }
    } else if (state.phase === 'playing') {
        const piece = state.board[row][col];
        
        if (piece === state.currentPlayer) {
            selectedPiece = { row, col };
            refreshUI();
        } else if (selectedPiece && piece === 'empty') {
            const move = {
                from: selectedPiece,
                to: { row, col },
                jumped: {
                    row: (selectedPiece.row + row) / 2,
                    col: (selectedPiece.col + col) / 2
                }
            };

            if (Math.abs(selectedPiece.row - row) + Math.abs(selectedPiece.col - col) === 2 &&
                (selectedPiece.row === row || selectedPiece.col === col)) {
                
                if (isValidMove(state, move)) {
                    state = applyMove(state, move);
                    selectedPiece = null;
                    if (isOnlineGame) await syncStateToAtProto();
                    refreshUI();
                    checkAiTurn();
                }
            }
        }
    }
}

async function checkAiTurn() {
    if (isAiEnabled && state.currentPlayer === 'white' && state.phase !== 'game_over') {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const move = getRandomMove(state);
        if (move) {
            state = applyMove(state, move);
            refreshUI();
            checkAiTurn();
        }
    }
}

function refreshUI() {
    renderBoard(state, boardEl, handleCellClick, selectedPiece);
    updateStatus(state, statusEl, isOnlineGame ? playerRole : null);
    
    if (state.phase === 'game_over') {
        showGameOver(state.winner, modalEl, winnerTextEl);
        configPanel.querySelector('.grid')?.classList.remove('hidden');
    }
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
sidebarNewGameBtn.addEventListener('click', resetToConfig);

// ATProto Listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
createOnlineBtn.addEventListener('click', startOnlineGame);
joinOnlineBtn.addEventListener('click', joinOnlineGame);

// Initialize with a game
startGame();
