import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


function Square(props){
  return(
    <button className="square" onClick={props.onClick}>
    {props.value}
    </button>
  );
}

function calculateWinner(squares) {
  const lines = [
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

class Board extends React.Component {
  constructor(props){
    super(props);
    let j = 7*13;
    for (let i = 0; i < j; i++){
      if (i%2 == 0) {
        this.state = {
          squares: Array(i).fill("X"), xIsNext: false, 
        }
      }
      else {
        this.state = {
          squares: Array(i).fill("O"), xIsNext: true,
        }
      }


    }
  }


  handleClick(i){
    const squares = this.state.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    if (this.state.xIsNext == true){
      squares[i] = this.state.xIsNext ? ' ' : 'X';
      this.setState({squares:squares,
      xIsNext: !this.state.xIsNext,
      });
    }

    else {
      squares[i] = this.state.xIsNext ? ' ' : 'O';
      this.setState({squares:squares,
      xIsNext: !this.state.xIsNext,
      });
    }

  }

  renderRow(k,j) {
    let row = [];
    for (let i = 0; i < j; i++){
      row.push(this.renderSquare((k*j)+i));
    }
    return row;
  }


  renderSquare(i) {
    return <Square
            value={this.state.squares[i]}
            onClick={() => this.handleClick([i])}
    />;
  }


  render() {
    const winner = calculateWinner(this.state.squares);
    let status;
    if (winner){
      status = 'Winner ' + winner;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }
    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderRow(0,13)}
        </div>
        <div className="board-row">
          {this.renderRow(1,13)}
        </div>
        <div className="board-row">
          {this.renderRow(2,13)}
        </div>
        <div className="board-row">
          {this.renderRow(3,13)}
        </div>
        <div className="board-row">
          {this.renderRow(4,13)}
        </div>
        <div className="board-row">
          {this.renderRow(5,13)}
        </div>
        <div className="board-row">
          {this.renderRow(6,13)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);
