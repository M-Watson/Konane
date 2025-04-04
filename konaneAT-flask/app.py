from flask import Flask, render_template, jsonify, request
import random
import time

app = Flask(__name__)

# Initialize Tone.js (simulated for server-side)
def play_move_sound():
    print("Playing move sound (server-side simulation)")

def play_capture_sound():
    print("Playing capture sound (server-side simulation)")

def play_game_over_sound():
    print("Playing game over sound (server-side simulation)")


def create_board():
    """Creates the Konane game board."""
    board = []
    for row in range(8):
        board.append([])
        for col in range(8):
            if (row + col) % 2 == 0:
                board[row].append('black')
            else:
                board[row].append('white')
    return board

def generate_game_id():
    """Generates a unique game ID."""
    return f"{int(time.time())}-{random.randint(0, 1000000)}"

# Global variables (game state)
game_board = []
current_player = 'black'
selected_piece = None
game_over = False
first_move = True
moves_played = 0
valid_first_moves = [
    {'row': 3, 'col': 3},
    {'row': 3, 'col': 4},
    {'row': 4, 'col': 3},
    {'row': 4, 'col': 4},
    {'row': 0, 'col': 0},
    {'row': 0, 'col': 7},
    {'row': 7, 'col': 0},
    {'row': 7, 'col': 7}
]
move_number = 1
game_moves = []
player_accounts = {
    'black': 'player1.bsky',  # Replace with actual Bluesky account
    'white': 'player2.bsky',  # Replace with actual Bluesky account
}
game_id = None

@app.route('/')
def index():
    """Renders the main game page."""
    global game_board, current_player, selected_piece, game_over, first_move, moves_played, valid_first_moves, move_number, game_moves, player_accounts, game_id
    # Initialize the game state.
    game_board = create_board()
    current_player = 'black'
    selected_piece = None
    game_over = False
    first_move = True
    moves_played = 0
    move_number = 1
    game_moves = []
    game_id = generate_game_id()
    return render_template('index.html',
                           game_board=game_board,
                           current_player=current_player,
                           game_over=game_over,
                           moves_played=moves_played,
                           move_number=move_number)  # Pass initial game state

@app.route('/reset', methods=['POST'])
def reset_game():
    """Resets the game state and returns the initial board."""
    global game_board, current_player, selected_piece, game_over, first_move, moves_played, valid_first_moves, move_number, game_moves, player_accounts, game_id
    game_board = create_board()
    current_player = 'black';
    selected_piece = None;
    game_over = False;
    first_move = True;
    moves_played = 0;
    move_number = 1;
    game_moves = [];
    game_id = generate_game_id()
    print(f'Game reset. New Game ID: {game_id}')
    return jsonify(board=game_board, current_player=current_player, message='Game reset', gameId=game_id, moveNumber=move_number)


def is_orthogonally_adjacent(row, col, previous_move_row, previous_move_col):
    """Checks if a cell is orthogonally adjacent to the previous removed cell."""
    global game_board, moves_played
    

    empty_row, empty_col = previous_move_row, previous_move_col

    adjacent = (
        (row == empty_row and abs(col - empty_col) == 1) or
        (col == empty_col and abs(row - empty_row) == 1)
    )
    print(f'Checking if ({row},{col}) is adjacent to empty cell ({empty_row},{empty_col}): {adjacent}')
    return adjacent


def check_valid_move(start_row, start_col, end_row, end_col):
    """Checks if a move is valid."""
    global game_board
    row_diff = abs(end_row - start_row)
    col_diff = abs(end_col - start_col)

    if (row_diff == 0 and col_diff == 2) or (row_diff == 2 and col_diff == 0):
        jumped_row = (start_row + end_row) // 2
        jumped_col = (start_col + end_col) // 2
        if game_board[jumped_row][jumped_col] != 'empty':
            print(
                f'Valid move: from ({start_row},{start_col}) to ({end_row},{end_col})'
            )
            return True
    print(f'Invalid move: from ({start_row},{start_col}) to ({end_row},{end_col})')
    return False


def move_piece(start_row, start_col, end_row, end_col):
    """Moves a piece on the board."""
    global game_board, selected_piece
    row_diff = abs(end_row - start_row)
    col_diff = abs(end_col - start_col)

    if not ((row_diff == 0 and col_diff == 2) or (row_diff == 2 and col_diff == 0)):
        return False

    jumped_row = (start_row + end_row) // 2
    jumped_col = (start_col + end_col) // 2

    if game_board[jumped_row][jumped_col] == 'empty':
        return False

    game_board[end_row][end_col] = game_board[start_row][start_col]
    game_board[start_row][start_col] = 'empty'
    game_board[jumped_row][jumped_col] = 'empty'
    play_move_sound()
    print(
        f'Piece moved from ({start_row},{start_col}) to ({end_row},{end_col}), jumped over ({jumped_row},{jumped_col})'
    )
    return True


def has_valid_moves(player):
    """Checks if a player has any valid moves."""
    global game_board
    for row in range(8):
        for col in range(8):
            if game_board[row][col] == player:
                if (
                    (row > 1 and game_board[row - 1][col] != 'empty' and game_board[row - 2][col] == 'empty') or
                    (row < 6 and game_board[row + 1][col] != 'empty' and game_board[row + 2][col] == 'empty') or
                    (col > 1 and game_board[row][col - 1] != 'empty' and game_board[row][col - 2] == 'empty') or
                    (col < 6 and game_board[row][col + 1] != 'empty' and game_board[row][col + 2] == 'empty')
                ):
                    return True
    return False


def switch_player():
    """Switches the current player."""
    global current_player
    current_player = 'white' if current_player == 'black' else 'black'
    print(f'Switching player to {current_player}')



def save_game_to_bluesky():
    """Simulates saving the game data to Bluesky."""
    global game_id, player_accounts, game_moves, game_board, gameOver, current_player
    if not game_id:
        print('Game ID is missing!')
        return

    game_data = {
        'gameId': game_id,
        'playerAccounts': player_accounts,
        'moves': game_moves,
        'board': game_board,
        'gameOver': gameOver,
        'finalPlayer': current_player
    }
    print('Game data to be saved to Bluesky:')
    print(game_data)
    return game_data



@app.route('/cell_click', methods=['POST'])
def handle_cell_click():
    """Handles a cell click event."""
    global game_board, current_player, selected_piece, game_over, first_move, moves_played, move_number, game_moves, valid_first_moves
    if game_over:
        return jsonify(
            board=game_board,
            current_player=current_player,
            game_over=game_over,
            message='Game is over',
            moveNumber=move_number,
            gameMoves = game_moves
        )

    try:
        data = request.get_json()
        row = int(data['row'])
        col = int(data['col'])
        clicked_piece = game_board[row][col]
    except (TypeError, KeyError, IndexError) as e:
        return jsonify(error=f'Invalid request: {e}')

    print(
        f'Clicked on row: {row}, col: {col}, piece: {clicked_piece}, currentPlayer: {current_player}, movesPlayed: {moves_played}, firstMove: {first_move}'
    )

    if first_move:
        if moves_played == 0 and current_player == 'black':
            # Black's first move: Check for valid first move positions
            valid_first_move_coords = [(3, 3), (3, 4), (4, 3), (4, 4), (0, 0), (0, 7), (7, 0), (7, 7)]
            if (row, col) in valid_first_move_coords and clicked_piece == 'black':
                game_board[row][col] = 'empty'
                moves_played += 1
                print(f'Black removes piece at row: {row}, col: {col}')
                move_data = {
                    'moveNumber': moves_played,
                    'player': current_player,
                    'action': 'remove',
                    'position': {
                        'row': row,
                        'col': col
                    },
                }
                game_moves.append(move_data)
                switch_player()  # Switch to white
                return jsonify(
                    board=game_board,
                    current_player=current_player,
                    firstMove=first_move,
                    movesPlayed=moves_played,
                    moveNumber=move_number,
                    gameMoves = game_moves
                )
            else:
                return jsonify(
                    board=game_board,
                    current_player=current_player,
                    firstMove=first_move,
                    movesPlayed=moves_played,
                    message="Invalid first move for Black.  Must remove from center or corner.",
                    moveNumber=move_number,
                    gameMoves = game_moves
                )

        elif moves_played == 1 and current_player == 'white':
            # White's first move: Check for orthogonal adjacency to black's removed piece
            black_removed_row = game_moves[0]['position']['row']
            black_removed_col = game_moves[0]['position']['col']
            if is_orthogonally_adjacent(row, col, black_removed_row, black_removed_col) and clicked_piece == 'white':
                game_board[row][col] = 'empty'
                moves_played += 1
                print(f'White removes piece at row: {row}, col: {col}')
                move_data = {
                    'moveNumber': moves_played,
                    'player': current_player,
                    'action': 'remove',
                    'position': {
                        'row': row,
                        'col': col
                    },
                }
                game_moves.append(move_data)
                first_move = False  # End first move phase.
                switch_player()
                return jsonify(
                    board=game_board,
                    current_player=current_player,
                    firstMove=first_move,
                    movesPlayed=moves_played,
                    moveNumber=move_number,
                    gameMoves = game_moves
                )
            else:
                return jsonify(
                    board=game_board,
                    current_player=current_player,
                    firstMove=first_move,
                    movesPlayed=moves_played,
                    message="Invalid first move for White. Must remove a piece orthogonally adjacent to Black's removed piece.",
                    moveNumber=move_number,
                    gameMoves = game_moves
                )


    elif not selected_piece:
        if clicked_piece == current_player:
            selected_piece = {'row': row, 'col': col}
            print(f'Selected piece at row: {row}, col: {col}')
            return jsonify(
                board=game_board,
                current_player=current_player,
                selected_piece=selected_piece,
                moveNumber=move_number,
                gameMoves = game_moves
            )

    else:
        if clicked_piece == 'empty':
            is_valid_move = check_valid_move(
                selected_piece['row'], selected_piece['col'], row, col
            )
            if is_valid_move:
                move_piece(selected_piece['row'], selected_piece['col'], row, col)
                move_data = {
                    'moveNumber': move_number,
                    'player': current_player,
                    'action': 'move',
                    'startPosition': {
                        'row': selected_piece['row'],
                        'col': selected_piece['col']
                    },
                    'endPosition': {
                        'row': row,
                        'col': col
                    },
                }
                game_moves.append(move_data)
                print(game_moves)
                move_number += 1
                switch_player()
                if has_valid_moves(current_player):
                    return jsonify(
                        board=game_board,
                        current_player=current_player,
                        selected_piece=selected_piece,
                        moveNumber=move_number,
                        gameMoves = game_moves
                    )
                else:
                    global gameOver
                    gameOver = True
                    play_game_over_sound()
                    save_data = save_game_to_bluesky()
                    return jsonify(
                        board=game_board,
                        current_player=current_player,
                        game_over=gameOver,
                        message=f'{current_player.upper()} wins!',
                        gameId=game_id,
                        gameData=save_data,
                        moveNumber=move_number,
                        gameMoves = game_moves
                    )
        elif clicked_piece == current_player:
            selected_piece = {'row': row, 'col': col}
            print(f'Selected piece at row: {row}, col: {col}')
            return jsonify(
                board=game_board,
                current_player=current_player,
                selected_piece=selected_piece,
                moveNumber=move_number,
                gameMoves = game_moves
            )
        else:
            selected_piece = None
            print('Invalid move, clearing selection')
            return jsonify(
                board=game_board,
                current_player=current_player,
                selected_piece=selected_piece,
                moveNumber=move_number,
                gameMoves = game_moves
            )

    return jsonify(
        board=game_board,
        current_player=current_player,
        selected_piece=selected_piece,
        firstMove=first_move,
        movesPlayed=moves_played,
        moveNumber=move_number,
        gameMoves=game_moves
    )
if __name__ == '__main__':
    app.run(debug=True)
