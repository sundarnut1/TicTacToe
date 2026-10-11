// JavaScript source code

// 000000111 = 7 (0x7)
// 000111000 = 56 (0x38)
// 111000000 = 448 (0x1c0)
// 001001001 = 73 (0x49)
// 010010010 = 146 (0x92)
// 100100100 = 292 (0x124)
// 100010001 = 273 (0x111)
// 001010100 = 84 (0x54)
var winPositions = [0x7,0x38,0x49,0x54,0x92,0x111,0x124,0x1c0];

var gameMask = 0; // What squares are occupied on the board?
var playerMask = 0; // What squares are occupied by the player?
var botMask = 0; // What squares are occupied by the bot?

var onButtons = false; // Whether the user has moved the mouse on top of the buttons
var buttonIndex = 0; // Which button is pressed? 
var winFlag = 0; // 1 - Player won, 2 - Bot won, 3 - Draw

var imageLink = 'x.svg'; // Show X as the default image
var staticImageLink = 'x.filled.svg'; // X filled image - what is for the user (assuming she is X)
var botImageLink = 'o.filled.svg'; // O filled image - what is for the bot (assuming it is O)

var gameReset = false; // The game has been reset by the user pressing that button
var gameStarted = false; // Game has started
var gameFinished = false; // Game has finished

// How many moves have occured?
var moveCount = 0;

var mouseFlag = 0; // If 1, then inside X. If 2, then inside O.
// If 3 then inside Hint, 4 - Reset, 5 - Quit

var mouseButtonFlag = 0; // Has the button been pressed?
var playerIsX = false; // Is the player playing as X?
var playerChoosingX = 0;  // 0 - nothing selected, X - 1, O - 2
var focusSquare = -1; // What is the square in focus?
var mouseDownSquare = -1; // Which square did the mouse go down?
var mouseUpSquare = -2; // Which square did the mouse come up?

var canvas_x = 0;
var canvas_y = 0;

// Play the game
function playGame() {
  
    // Show X and 0 buttons
    renderChoice();

    var canvas = document.getElementById("t3Canvas");

    // Add listeners
    canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", doMouseUp, false);
    canvas.addEventListener("mouseout", doMouseOut, false);
}

// Allow user to select X or 0 via this method
function renderChoice() {

    // console.log("In renderChoice()");

    gameReset = false;
    gameStarted = false;
    gameFinished = false;
    playerIsX = false;
    playerChoosingX = 0;

    var canvas = document.getElementById("t3Canvas");
    var context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    showXRaised(canvas, context);
    showORaised(canvas, context);
}

// Show the game grid
function renderGrid() {

    // console.log("In renderGrid(), playerIsX is " + playerIsX);

    gameMask = 0;
    playerMask = 0;
    botMask = 0;
    onButtons = false;
    buttonIndex = 0;
    moveCount = 0;
    winFlag = 0;
    mouseFlag = 0;
    focusSquare = -1;
    gameFinished = false;

    mouseDownSquare = -1;
    mouseUpSquare = -2;

    var canvas = document.getElementById("t3Canvas");
    var context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.moveTo(100, 50);
    context.lineTo(100, 345);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(200, 50);
    context.lineTo(200, 345);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(0, 150);
    context.lineTo(300, 150);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(0, 250);
    context.lineTo(300, 250);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    // Show top buttons
    showTopButtons(canvas, context);

    // Make the bot play first
    if (playerIsX === false) {
        makeNextMove(canvas, context);
    }
}

// Most important method, track mouse movement
function doMouseMove(event) {

    var canvas = document.getElementById("t3Canvas");
    canvasLocation = canvas.getBoundingClientRect();

    canvas_x = parseInt(event.x - canvasLocation.left);
    canvas_y = parseInt(event.y - canvasLocation.top);
    var canvas_offset_y = canvas_y - 50;

    var txtCoord = document.getElementById("txtCoord");
    txtCoord.value = canvas_x + " " + canvas_y;

    var context = canvas.getContext('2d');

    var x_offset = parseInt(canvas_x / 100);
    var y_offset = parseInt(canvas_offset_y / 100);

    var x_mod = canvas_x % 100;
    var y_mod = canvas_y % 100;

    var squareNumber = y_offset * 3 + x_offset;

    var txtCoord = document.getElementById("txtCoord");
    txtCoord.value = "x: " + canvas_x + " y: " + canvas_y;

    // Game has not started as yet, you have X and 0 buttons
    if (!gameStarted) {

        // Check if user is hovering on x
        if ((canvas_x > 40) && (canvas_y > 100) &&
            (canvas_x < 140) && (canvas_y < 200)) {

            // First time user has moved inside X - set mouseFlag to 1
            if (mouseFlag != 1) {

                // Reset button display for 0
                if (mouseFlag == 2) {
                    showORaised(canvas, context);
                }

                // If button has been pressed, show it depressed, else highlighted
                if (mouseButtonFlag == 1) {
                    showXDepressed(canvas, context);
                } else {
                    showXHighlighted(canvas, context);
                }
          
                mouseFlag = 1;
            }
        } else if ((canvas_x > 160) && (canvas_y > 100) &&
            (canvas_x < 260) && (canvas_y < 200)) {

            // First time user has moved inside 0 - set mouseFlag to 2
            if (mouseFlag != 2) {

                // Reset display for X
                if (mouseFlag == 1) {
                    showXRaised(canvas, context);
                }

                // If button has been pressed, show it depressed, else highlighted
                if (mouseButtonFlag == 1) {
                    showODepressed(canvas, context);
                } else {
                    showOHighlighted(canvas, context);
                }

                mouseFlag = 2;
            }
        } else if (mouseFlag == 1) {
          // User moved away from X, raise it
          showXRaised(canvas, context);
          mouseFlag = 0;
        } else if (mouseFlag == 2) {
          // User moved away from 0, raise it
          showORaised(canvas, context);
          mouseFlag = 0;
        }
    } else {
        // Main game - it has not been finished. User is in lower grid
        if ((canvas_y > 50) && (!gameFinished)) {
            // If user is moving mouse around - check which square is she on
            // User must not be on buttons, and check if we have moved across squares
            if ((squareNumber != focusSquare) || (onButtons)) {
                // User had a valid square she was hovering on, clear that focusSquare
                if (focusSquare != -1) {
                    var bitPosition = 1 << focusSquare;

                    // This square was not set prior, clear it
                    if ((gameMask & bitPosition) == 0) {
                        clearFocusSquare(canvas, context);
                    }
                }

                // Reset onButtons if user was earlier on it
                if (onButtons) {
                    onButtons = false;
                }

                // Find the bit value and display this if this is not set on the board
                var squareNumberMask = 1 << squareNumber;

                // Not yet set
                if ((gameMask & squareNumberMask) == 0) {
                    var imageObj = new Image();

                    // Display image in this position
                    imageObj.onload = function() {
                        context.drawImage(imageObj, x_offset * 100,  y_offset * 100 + 50);
                    };

                    imageObj.src = imageLink;
                }

                // Set focusSquare to be this square
                focusSquare = squareNumber;
            }
        } else {
            // User is moving over the buttons
            if (!onButtons) {
                onButtons = true;

                if (focusSquare >= 0) {
                    clearFocusSquare(canvas, context);
                }
            }

            focusSquare = -1;

            // User is on the Hint button
            if ((canvas_x > 5) && (canvas_x < 95) && (canvas_y > 5) && (canvas_y < 35)) {
                // Set mouseFlag to 3 if not so
                if (mouseFlag != 3) {

                    // Change color of Reset/Quit buttons to regular if either was highlighted
                    if (mouseFlag == 4) {
                        showResetRaised(canvas, context);
                    } else if (mouseFlag == 5) {
                        showQuitRaised(canvas, context);
                    }

                    // Check if user is dragging the mouse around
                    if (mouseButtonFlag == 1) {
                        showHintDepressed(canvas, context);
                    } else {
                        showHintHighlighted(canvas, context);
                    }

                    mouseFlag = 3;
                }
            } else if (mouseFlag == 3) {
                  // Reset Hint button if user moved out
                  showHintRaised(canvas, context);
                  mouseFlag = 0;
            }

            // User is on the Reset button
            if ((canvas_x > 105) && (canvas_x < 195) && (canvas_y > 5) && (canvas_y < 35)) {
                // Set mouseFlag to 4 if not so
                if (mouseFlag != 4) {

                    // Change color of Hint/Quit buttons to regular if either was highlighted
                    if (mouseFlag == 3) {
                        showHintRaised(canvas, context);
                    } else if (mouseFlag == 5) {
                        showQuitRaised(canvas, context);
                    }

                    // Check if user is dragging the mouse around
                    if (mouseButtonFlag == 1) {
                        showResetDepressed(canvas, context);
                    } else {
                        showResetHighlighted(canvas, context);
                    }
          
                    mouseFlag = 4;
                }
            } else if (mouseFlag == 4) {
                  // Reset Reset button if user moved out
                  showResetRaised(canvas, context);
                  mouseFlag = 0;
            }

            // User is on the Quit button
            if ((canvas_x > 205) && (canvas_x < 295) && (canvas_y > 5) && (canvas_y < 35)) {
                // Set mouseFlag to 5 if not so
                if (mouseFlag != 5) {

                    // Change color of Hint/Reset buttons to regular if either was highlighted
                    if (mouseFlag == 3) {
                        showHintRaised(canvas, context);
                    } else if (mouseFlag == 4) {
                        showResetRaised(canvas, context);
                    }

                    // Check if user is dragging the mouse around
                    if (mouseButtonFlag == 1) {
                        showQuitDepressed(canvas, context);
                    } else {
                        showQuitHighlighted(canvas, context);
                    }
          
                    mouseFlag = 5;
                }
            } else if (mouseFlag == 5) {
                  // Reset Quit button if user moved out
                  showQuitRaised(canvas, context);
                  mouseFlag = 0;
            }            
        }
    }
}

// User pressed the mouse down
function doMouseDown(event) {

    // console.log("In doMouseDown()");

    var canvas = document.getElementById("t3Canvas");
    var context = canvas.getContext('2d');

    if (!gameStarted) {

        if (mouseFlag == 1) {
            playerChoosingX = 1;
            showXDepressed(canvas, context);
        } else if (mouseFlag == 2) {
            playerChoosingX = 2;
            showODepressed(canvas, context);          
        }

        mouseButtonFlag = 1;
    } else {
        // console.log("focusSquare is " + focusSquare);

        if (focusSquare >= 0) {
            var bitPosition = 1 << focusSquare;

            if ((gameMask & bitPosition) > 0) {
                // console.log("bitPosition already set, gameMask: " + gameMask + ", bitPosition = " + bitPosition);
            } else {
                mouseDownSquare = focusSquare;
                // console.log("Setting mouseDownSquare = " + mouseDownSquare);
            }
            mouseButtonFlag = 1;

            return;
        }

        if (mouseFlag == 3) {
            mouseDownSquare = 11;
            showHintDepressed(canvas, context);
        } else if (mouseFlag == 4) {
            mouseDownSquare = 12;
            showResetDepressed(canvas, context);
        } else if (mouseFlag == 5) {
            mouseDownSquare = 13;
            showQuitDepressed(canvas, context);
        }

        if ((mouseFlag > 2) && (mouseFlag < 6)) {
            mouseButtonFlag = 1;
            // console.log("Setting mouseButtonFlag to 1");
            // console.log("mouseDownSquare is " + mouseDownSquare);
        }
    }
}

function doMouseUp(event) {

    // console.log("In doMouseUp()");

    var canvas = document.getElementById("t3Canvas");
    var context = canvas.getContext('2d');

    if (!gameStarted) {

        if ((mouseFlag == 1) && (playerChoosingX == 1)) {

            gameStarted = true;
            playerIsX = true;

            imageLink = 'x.svg';
            staticImageLink = 'x.filled.svg';
            botImageLink = 'o.filled.svg';
        } else if ((mouseFlag == 2) && (playerChoosingX == 2)) {

            gameStarted = true;
            playerIsX = false;

            imageLink = 'o.svg';
            staticImageLink = 'o.filled.svg';
            botImageLink = 'x.filled.svg';
        }

        mouseButtonFlag = 0;
        // console.log("Setting mouseButtonFlag to 0");

        if (gameStarted == true) {
            renderGrid();
        }
    } else {
        // console.log("mouseFlag is " + mouseFlag + " and mouseButtonFlag is " + mouseButtonFlag);

        if (mouseButtonFlag == 1) {

           if (canvas_y > 50) {

              mouseUpSquare = focusSquare;
              // console.log("mouseDownSquare is " + mouseDownSquare + " and mouseUpSquare is " + mouseUpSquare);

              if (mouseDownSquare == mouseUpSquare) {
                    var bitPosition = 1 << focusSquare;

                    // console.log("Setting bitPosition " + bitPosition + ", focusSquare is " + focusSquare);

                    gameMask |= bitPosition;
                    playerMask |= bitPosition;

                    moveCount++;

                    mouseDownSquare = -1;
                    mouseUpSquare = -2;

                    showFinalMove(canvas, context);

                    focusSquare = -1;

                    // Think of what you need to do next
                    makeNextMove(canvas, context);
               }
            }

            if ((mouseFlag == 3) && (mouseDownSquare == 11)) {
                // console.log("Voila Hint");
                mouseDownSquare = -1;
                showHintHighlighted(canvas, context);
                processNextHint();
            } else if ((mouseFlag == 4) && (mouseDownSquare == 12)) {
                // console.log("Voila Reset");
                gameReset = true;
                mouseDownSquare = -1;
                renderGrid();
            } else if ((mouseFlag == 5) && (mouseDownSquare == 13)) {
                // console.log("Voila Quit");
                mouseDownSquare = -1;
                playGame();
            }

            mouseButtonFlag = 0;
            // console.log("Setting mouseButtonFlag to 0 (2)");
        }
    }
}

function doMouseOut(event) {

    var canvas = document.getElementById("t3Canvas");
    var context = canvas.getContext("2d");

    if (gameStarted) {
        if (focusSquare != -1) {
            clearFocusSquare(canvas, context);
            focusSquare = -1;
        }

        if (mouseFlag > 0) {
            showHintRaised(canvas, context);
            showResetRaised(canvas, context);
            showQuitRaised(canvas, context);
        }
    }
}

function makeNextMove(canvas, context) {

    if (gameFinished) {
        return;
    }

    // console.log("Inside makeNextMove(), playerMask is " + playerMask);
    // console.log("gameMask is " + gameMask + ", playerMask is " + playerMask + " and botMask is " + botMask);

    // Find out if the game has finished
    for (i = 0; i < 8; i++) {
        if ((playerMask & winPositions[i]) == winPositions[i]) {
            // console.log("Found match for " + i + ", playerMask is " + playerMask + " and winPositions[" + i + "] is " + winPositions[i]);

            winFlag = 1;
            showGameFinished(canvas, context);
            return;
        }
    }

    if (gameMask === 511) {
        winFlag = 3;
        showGameFinished(canvas, context);
        return;
    }

    var nextSquarePosition = getNextMove(canvas, context);

    if (nextSquarePosition >= 0) {
        // console.log("nextSquarePosition is " + nextSquarePosition);

        var y_offset = Math.floor(nextSquarePosition / 3);
        var x_offset = nextSquarePosition % 3;

        var imageObj = new Image();

        imageObj.onload = function() {
            context.drawImage(imageObj, x_offset * 100, y_offset *  100 + 50);
        };

        imageObj.src = botImageLink;   

        var bitPosition = 1 << nextSquarePosition;
        gameMask |= bitPosition;
        botMask |= bitPosition;

        moveCount++;     
    }

    // Find out if the game has finished
    for (i = 0; i < 8; i++) {
        if ((botMask & winPositions[i]) == winPositions[i]) {
            // console.log("Found match for " + i + ", botMask is " + playerMask + " and winPositions[" + i + "] is " + winPositions[i]);

            winFlag = 2;
            showGameFinished(canvas, context);
            break;
        }
    }

    if (gameMask === 511) {
        winFlag = 3;
        showGameFinished(canvas, context);
        return;
    }
}

function getNextMove(canvas, context) {

    var nextSquarePosition = canGameBeFinished(botMask, false);

    if (nextSquarePosition >= 0) {
        console.log("Voila! Bot can win!");
        return nextSquarePosition;
    }

    nextSquarePosition = canGameBeFinished(playerMask, false);

    if (nextSquarePosition >= 0) {
        console.log("Voila! User can win!");
        return nextSquarePosition;
    }

    if (moveCount === 0) {
        // Choose a random number
        var randomNumber = Math.floor(Math.random() * 10) % 6;

        // Choose a corner if it is an even number (0, 2, 4) - 50% of the time we will start with one of these 
        if (randomNumber % 2 === 0) {
            // Choose one of 0, 2, 6, 8 - corner positions
            var numbers = [0, 2, 6, 8];
            var oneOfThese = Math.floor(Math.random() * 10) % 4;

            nextSquarePosition = numbers[oneOfThese];
        } else if (randomNumber === 3) {
            // Choose one of the middle edge squares - one of 1, 3, 5, 7
            // We will choose an edge center square 16.67% of the time

            // Choose from 1, 3, 5 and 7
            randomNumber = Math.floor(Math.random() * 10) % 4;

            nextSquarePosition = (2 * randomNumber) + 1;
        } else {
            // For 1 and 5 options, choose the center square - 4
            // This will be chosen 33% of the time
            nextSquarePosition = 4;
        }

        var y_offset = Math.floor(nextSquarePosition / 3);
        var x_offset = nextSquarePosition % 3;

        var imageObj = new Image();

        imageObj.onload = function() {
            context.drawImage(imageObj, x_offset * 100,  y_offset * 100 + 50);
        };

        imageObj.src = botImageLink;   

        var bitPosition = 1 << nextSquarePosition;
        gameMask |= bitPosition;
        botMask |= bitPosition;

        moveCount++;
    } else if (moveCount === 1) {
        // Find out where did the user make a move
        console.log("User moved " + playerMask);

        // Option one - user chose a corner square (very probable)
        // Options 1) Choose the opposite corner square (30%),
        // 2) Choose an adjacent corner edge square (30%)
        // Choose the center square (30%)
        // Choose a random side center square (10%)
        if ((playerMask == 1) || (playerMask == 4) || (playerMask == 64) || (playerMask == 256)) {

            var randomNumber = Math.floor(Math.random() * 10) % 10;

            if (randomNumber == 0) {

                // Choose from 1, 3, 5 and 7
                randomNumber = Math.floor(Math.random() * 10) % 4;

                nextSquarePosition = (2 * randomNumber) + 1;
            } else if (randomNumber % 3 == 0) {

                nextSquarePosition = 4;

            } else if ((randomNumber + 1) % 3 == 0) {

                switch (playerMask) {
                    case 1:
                        nextSquarePosition = 8;
                        break;
                    case 4:
                        nextSquarePosition = 6;
                        break;
                    case 64:
                        nextSquarePosition = 2;
                        break;
                    case 256:
                        nextSquarePosition = 0;
                        break;
                }
            } else {
                randomNumber = Math.floor(Math.random() * 10) % 2;

                switch (playerMask) {

                    case 1:
                    case 256:
                        nextSquarePosition = (randomNumber % 2 == 0) ? 2 : 6;
                        break;
                    case 4:
                    case 64:
                        nextSquarePosition = (randomNumber % 2 == 0) ? 0 : 8;
                        break;
                }
            }
        } else if (playerMask == 16) {

            // For center squares, 90% of the time, choose a corner square at random
            var randomNumber = Math.floor(Math.random() * 10) % 10;

            // 10% of the time, choose a random side square, duh!
            if (randomNumber == 0) {
                // Choose from 1, 3, 5 and 7
                randomNumber = Math.floor(Math.random() * 10) % 4;

                nextSquarePosition = (2 * randomNumber) + 1;
            } else {
                // Choose one of 0, 2, 6, 8 - corner positions
                var numbers = [0, 2, 6, 8];
                var oneOfThese = Math.floor(Math.random() * 10) % 4;

                nextSquarePosition = numbers[oneOfThese];
            }
        } else {
            // User chose a center edge square! Duh!!!
            console.log("User chose an odd center edge square!");

            // For center squares, 90% of the time, choose a corner square at random
            var randomNumber = Math.floor(Math.random() * 10) % 2;

            // 50% of the time, choose the center square!
            if (randomNumber == 0) {
                nextSquarePosition = 4;
            } else {
                // Choose one of 0, 2, 6, 8 - corner positions
                var numbers = [0, 2, 6, 8];
                var oneOfThese = Math.floor(Math.random() * 10) % 4;

                nextSquarePosition = numbers[oneOfThese];
            }            
        }
    } 

    if (nextSquarePosition == -1) {
        // Check other moves that can be made
        if ((gameMask & 16) == 0) {
            if ((gameMask & 1) == 0) {
                nextSquarePosition = 0;
            } else if ((gameMask & 4) == 0) {
                nextSquarePosition = 2;
            } else if ((gameMask & 64) == 0) {
                nextSquarePosition = 6;
            } else if ((gameMask & 256) == 0) {
                nextSquarePosition = 8;
            } else {
                nextSquarePosition = 4;
            }
        } else if ((gameMask & 1) == 0) {
            nextSquarePosition = 0;
        } else if ((gameMask & 4) == 0) {
            nextSquarePosition = 2;
        } else if ((gameMask & 64) == 0) {
            nextSquarePosition = 6;
        } else if ((gameMask & 256) == 0) {
            nextSquarePosition = 8;
        } else if ((gameMask & 2) == 0) {
            nextSquarePosition = 1;
        } else if ((gameMask & 8) == 0) {
            nextSquarePosition = 3;
        }  else if ((gameMask & 32) == 0) {
            nextSquarePosition = 5;
        } else if ((gameMask & 128) == 0) {
            nextSquarePosition = 7;
        }
    }

    return nextSquarePosition;
}

function canGameBeFinished(mask, isPlayer) {

    console.log("In canGameBeFinished()");

    var nextSquarePosition = -1;
    var player = "Bot";

    if (isPlayer) {
        player = "Player";
    }

    // Find out if bot can win now, beating the player
    // First row - two there, one missing
    // Bit shift thrice left to get other rows
    var flag = true;
    var nextMask = 3;
    var emptySquare = 4;
    var position = 2;

    do {
        if (((mask & nextMask) == nextMask) && ((gameMask & emptySquare) == 0)) {
            nextSquarePosition = position;
            flag = false;
        }
        nextMask <<= 3;
        emptySquare <<= 3;
        position += 3;

        if (nextMask > 192) {
            flag = false;
        }
    } while (flag);

    // No positions found until now
    if (nextSquarePosition == -1) {
        // Find out if bot can win now, beating the player
        // First row - corners there, center missing
        // Bit shift to get other rows
        flag = true;
        nextMask = 5;
        emptySquare = 2;
        position = 1;

        do {
            if (((mask & nextMask) == nextMask) && ((gameMask & emptySquare) == 0)) {
                nextSquarePosition = position;
                flag = false;
            }
            nextMask <<= 3;
            emptySquare <<= 3;
            position += 3;

            if (nextMask > 320) {
                flag = false;
            }
        } while (flag);
    }
  
    // No positions found until now
    if (nextSquarePosition == -1) {
        // Find out if bot can win now, beating the player
        // First row - first corner absent, 
        // Bit shift to get other rows
        flag = true;
        nextMask = 6;
        emptySquare = 1;
        position = 0;

        do {
            if (((mask & nextMask) == nextMask) && ((gameMask & emptySquare) == 0)) {
                nextSquarePosition = position;
                flag = false;
            }
            nextMask <<= 3;
            emptySquare <<= 3;
            position += 3;

            if (nextMask > 384) {
                flag = false;
            }
        } while (flag);
    }

    // No positions found until now
    if (nextSquarePosition == -1) {
        // Find out if bot can win now, beating the player
        // First column - bottom corner absent, 
        // Bit shift to get other rows
        flag = true;
        nextMask = 9;
        emptySquare = 64;
        position = 6;

        do {
            if (((mask & nextMask) == nextMask) && ((gameMask & emptySquare) == 0)) {
                nextSquarePosition = position;
                flag = false;
            }
            nextMask <<= 1;
            emptySquare <<= 1;
            position += 1;

            if (nextMask > 36) {
                flag = false;
            }
        } while (flag);
    }

    // No positions found until now
    if (nextSquarePosition == -1) {
        // Find out if bot can win now, beating the player
        // First column - center square absent, 
        // Bit shift to get other rows
        flag = true;
        nextMask = 65;
        emptySquare = 8;
        position = 3;

        do {
            if (((mask & nextMask) == nextMask) && ((gameMask & emptySquare) == 0)) {
                nextSquarePosition = position;
                flag = false;
            }
            nextMask <<= 1;
            emptySquare <<= 1;
            position += 1;

            if (nextMask > 260) {
                flag = false;
            }
        } while (flag);
    }

    // No positions found until now
    if (nextSquarePosition == -1) {
        // Find out if bot can win now, beating the player
        // First column - first square absent, 
        // Bit shift to get other rows
        flag = true;
        nextMask = 72;
        emptySquare = 1;
        position = 0;

        do {
            if (((mask & nextMask) == nextMask) && ((gameMask & emptySquare) == 0)) {
                nextSquarePosition = position;
                flag = false;
            }
            nextMask <<= 1;
            emptySquare <<= 1;
            position += 1;

            if (nextMask > 288) {
                flag = false;
            }
        } while (flag);
    }

    // No positions found until now
    if (nextSquarePosition == -1) {

        // Take six stabs, checking each diagonal thrice for two like owns
        if (((mask & 17) == 17) && ((gameMask & 256) == 0)) {
            nextSquarePosition = 8;
            console.log(player + " can win, at position: " + nextSquarePosition + "!");
        } else if (((mask & 257) == 257) && ((gameMask & 16) == 0)) {
            nextSquarePosition = 4;
            console.log(player + " can win, at position: " + nextSquarePosition + "!");
        } else if (((mask & 272) == 272) && ((gameMask & 1) == 0)) {
            nextSquarePosition = 0;
            console.log(player + " can win, at position: " + nextSquarePosition + "!");
        } else if (((mask & 20) == 20) && ((gameMask & 64) == 0)) {
            nextSquarePosition = 6;
            console.log(player + " can win, at position: " + nextSquarePosition + "!");
        } else if (((mask & 68) == 68) && ((gameMask & 16) == 0)) {
            nextSquarePosition = 4;
            console.log(player + " can win, at position: " + nextSquarePosition + "!");
        } else if (((mask & 80) == 80) && ((gameMask & 4) == 0)) {
            nextSquarePosition = 2;
            console.log(player + " can win, at position: " + nextSquarePosition + "!");
        }
    }

    if (nextSquarePosition == -1) {
        console.log("Not found valid position as yet!");
    }

    return nextSquarePosition;
}

function processNextHint(canvas, context) {
    var hintSquare = getNextMove(canvas, context);

    console.log("hintSquare is " + hintSquare);
}

function showFinalMove(canvas, context) {

    // console.log("In showFinalMove(), focusSquare is " + focusSquare);

    var y_offset = Math.floor(focusSquare / 3);
    var x_offset = focusSquare % 3;

    // console.log("x_offset is " + x_offset + " and y_offset is " + y_offset);

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, x_offset * 100,  y_offset * 100 + 50);
    };

    imageObj.src = staticImageLink;
}

function showGameFinished(canvas, context) {

    // console.log("In showGameFinished()");
    gameFinished = true;

    var text = "You won :)";
    var backColor = "seagreen";
    var color = "blue";
    var x1 = 70;
    var y1 = 140;
    var x2 = 160;
    var y2 = 50;

    if (winFlag == 2) {
        text = "You lost :(";
        backColor = "tomato";
    } else if (winFlag == 3) {
        text = "Game drawn!";
        backColor = "lightgray";
        x1 = 60;
        x2 = 180;
    }

    context.fillStyle = backColor;
    context.fillRect(x1, y1, x2, y2);

    context.font="30px Calibri";
    context.strokeStyle = color;
    context.textAlign = "center";
    context.strokeText(text, canvas.width/2, canvas.height/2);
}

function showXRaised(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(40, 100, 104, 104);

    context.fillStyle = "lightgray";
    context.fillRect(40, 100, 100, 100);

    context.beginPath();
    context.moveTo(142, 100);
    context.lineTo(142, 202);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(40, 202);
    context.lineTo(142, 202);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
      context.drawImage(imageObj, 40, 100);
    };

    imageObj.src = 'x.svg';
}

function showXHighlighted(canvas, context) {

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 40, 100);
    };

    imageObj.src = 'x.filled.svg';
}

function showXDepressed(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(40, 100, 104, 104);

    context.fillStyle = "lightgray";
    context.fillRect(44, 104, 100, 100);

    context.beginPath();
    context.moveTo(42, 102);
    context.lineTo(144, 102);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(42, 102);
    context.lineTo(42, 204);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(143, 102);
    context.lineTo(143, 203);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(43, 203);
    context.lineTo(143, 203);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 43, 103);
    };

    imageObj.src = 'x.filled.svg';
}

function showORaised(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(160, 100, 104, 104);

    context.fillStyle = "lightgray";
    context.fillRect(160, 100, 100, 100);

    context.beginPath();
    context.moveTo(262, 100);
    context.lineTo(262, 202);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(160, 202);
    context.lineTo(262, 202);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
      context.drawImage(imageObj, 160, 100);
    };

    imageObj.src = 'o.svg';
}

function showOHighlighted(canvas, context) {

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 160, 100);
    };

    imageObj.src = 'o.filled.svg';
}

function showODepressed(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(160, 100, 104, 104);

    context.fillStyle = "lightgray";
    context.fillRect(164, 104, 100, 100);

    context.beginPath();
    context.moveTo(162, 102);
    context.lineTo(264, 102);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(162, 102);
    context.lineTo(162, 204);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(263, 102);
    context.lineTo(263, 203);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(163, 203);
    context.lineTo(263, 203);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 163, 103);
    };

    imageObj.src = 'o.filled.svg';
}

function clearFocusSquare(canvas, context) {

    var bitPosition = 1 << focusSquare;

    if ((gameMask & bitPosition) == 0) {

        var y_clear = parseInt(focusSquare / 3) * 100;
        var x_clear = (focusSquare % 3) * 100;

        context.fillStyle = "white";
        context.fillRect(x_clear + 10, y_clear + 60, 85, 85);
    }
}

function showTopButtons(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(5, 5, 288, 30);

    showHintRaised(canvas, context);

    if (gameReset) {
        gameReset = false;
        showResetHighlighted(canvas, context);
    } else {
        showResetRaised(canvas, context);
    }

    showQuitRaised(canvas, context);
}

function showHintRaised(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(5, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(5, 5, 88, 30);

    context.beginPath();
    context.moveTo(95, 5);
    context.lineTo(95, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(5, 37);
    context.lineTo(95, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 31, 11);
    };

    imageObj.src = 'hint.svg';
}

function showHintHighlighted(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(5, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(5, 5, 88, 30);

    context.beginPath();
    context.moveTo(95, 5);
    context.lineTo(95, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(5, 37);
    context.lineTo(95, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 31, 11);
    };

    imageObj.src = 'hint.filled.svg';
}

function showHintDepressed(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(5, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(9, 9, 88, 30);

    context.beginPath();
    context.moveTo(7, 7);
    context.lineTo(97, 7);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(7, 7);
    context.lineTo(7, 39);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(96, 7);
    context.lineTo(96, 38);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(8, 38);
    context.lineTo(96, 38);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 33, 13);
    };

    imageObj.src = 'hint.filled.svg';
}

function showResetRaised(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(105, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(105, 5, 88, 30);

    context.beginPath();
    context.moveTo(195, 5);
    context.lineTo(195, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(105, 37);
    context.lineTo(195, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 128, 11);
    };

    imageObj.src = 'reset.svg';
}

function showResetHighlighted(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(105, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(105, 5, 88, 30);

    context.beginPath();
    context.moveTo(195, 5);
    context.lineTo(195, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(105, 37);
    context.lineTo(195, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 128, 11);
    };

    imageObj.src = 'reset.filled.svg';
}

function showResetDepressed(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(105, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(109, 9, 88, 30);

    context.beginPath();
    context.moveTo(107, 7);
    context.lineTo(197, 7);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(107, 7);
    context.lineTo(107, 39);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(196, 7);
    context.lineTo(196, 38);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(108, 38);
    context.lineTo(196, 38);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 130, 13);
    };

    imageObj.src = 'reset.filled.svg';
}

function showQuitRaised(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(205, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(205, 5, 88, 30);

    context.beginPath();
    context.moveTo(295, 5);
    context.lineTo(295, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(205, 37);
    context.lineTo(295, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 231, 11);
    };

    imageObj.src = 'quit.svg';
}

function showQuitHighlighted(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(205, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(205, 5, 88, 30);

    context.beginPath();
    context.moveTo(295, 5);
    context.lineTo(295, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(205, 37);
    context.lineTo(295, 37);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 231, 11);
    };

    imageObj.src = 'quit.filled.svg';
}

function showQuitDepressed(canvas, context) {

    context.fillStyle = "white";
    context.fillRect(205, 5, 92, 34);

    context.fillStyle = "lightgray";
    context.fillRect(209, 9, 88, 30);

    context.beginPath();
    context.moveTo(207, 7);
    context.lineTo(297, 7);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(207, 7);
    context.lineTo(207, 39);
    context.lineWidth = 2;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(296, 7);
    context.lineTo(296, 38);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    context.beginPath();
    context.moveTo(208, 38);
    context.lineTo(296, 38);
    context.lineWidth = 1;
    context.strokeStyle = '#888888';
    context.stroke();

    var imageObj = new Image();

    imageObj.onload = function() {
        context.drawImage(imageObj, 233, 13);
    };

    imageObj.src = 'quit.filled.svg';
}