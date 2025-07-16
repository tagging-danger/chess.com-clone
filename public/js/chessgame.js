const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    // Flip the board for black
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");    
    } else {
        boardElement.classList.remove("flipped");
    }
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", 
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square.type, square.color);
                // Only allow dragging if it's the player's turn and the piece matches their color
                pieceElement.draggable = playerRole === square.color && chess.turn() === playerRole;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    const sourceSquare = String.fromCharCode(97 + source.col) + (8 - source.row);
    const targetSquare = String.fromCharCode(97 + target.col) + (8 - target.row);
    const move = `${sourceSquare}${targetSquare}`;

    console.log(`Attempting move: ${move}`); 

    const moveResult = chess.move({ from: sourceSquare, to: targetSquare });
    if (moveResult) {
        console.log(`Move successful: ${moveResult.san}`); 
        renderBoard();
        socket.emit("move", move);
    } else {
        console.log("Invalid move: ", move);
    }
};

const getPieceUnicode = (type, color) => {
    if (color === 'w') {
        switch (type) {
            case 'p': return '♙';
            case 'r': return '♖';
            case 'n': return '♘';
            case 'b': return '♗';
            case 'q': return '♕';
            case 'k': return '♔';
            default: return '';
        }
    } else {
        switch (type) {
            case 'p': return '♙'; 
            case 'r': return '♜';
            case 'n': return '♞';
            case 'b': return '♝';
            case 'q': return '♛';
            case 'k': return '♚';
            default: return '';
        }
    }
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    console.log(`Updating board state with FEN: ${fen}`); 
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    console.log(`Received move: ${move}`);
    chess.move(move);
    renderBoard();
});

renderBoard();
