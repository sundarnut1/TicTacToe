///-----------------------------------------------------------------
/// Namespace: TicTacToeSample1
/// Description: GameManager class to handle all the code related to managing a game of Tic-Tac-Toe
///     and figuring out the next move, based on what the user has clicked.
/// Author: Sundar Krishnamurthy sundar_k@hotmail.com
/// Date: 01/14/2011
/// Notes:
///   Revision History:
///   Name:           Date:        Description:
///
///-----------------------------------------------------------------

namespace TicTacToeSample1
{
    #region Using directives
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Net;
    using System.Windows;
    using System.Windows.Controls;
    using System.Windows.Documents;
    using System.Windows.Ink;
    using System.Windows.Input;
    using System.Windows.Media;
    using System.Windows.Media.Animation;
    using System.Windows.Shapes;
    #endregion

    #region GameManager class
    /// <summary>
    /// Main manager class that plays tic-tac-toe with the human opponent. It has logic to figure out which move is
    /// optimal for the next turn, and when the game gets over based on success conditions.
    /// </summary>
    public class GameManager : IStateChangeSubscriber
    {
        #region Members
        /// <summary>Constant for all bits set on the board</summary>
        private const Int16 board = 511;

        /// <summary>Flag to determine if player is X (true) or 0 (false)</summary>
        private bool playerIsX;

        /// <summary>Gets whether the game is initialized or finished/unstarted</summary>
        private bool isInitialized;

        /// <summary>Incremented everytime we read a square configuration from xaml file - ideally, reach 9</summary>
        private int index;

        /// <summary>Number of moves that have been made at this point in time</summary>
        private int moves;

        /// <summary>Bitmask for the player's positions</summary>
        private Int16 playerMask;

        /// <summary>Bitmask for the manager's positions</summary>
        private Int16 managerMask;

        /// <summary>Array of 9 option squares to be read from xaml</summary>
        private OptionSquare[] optionSquares;

        /// <summary>Array of eight bitmasks that represent victory for a player</summary>
        private Int16[] winOutcomes;

        /// <summary>GameHost instance that hosts the game</summary>
        private IGameHost gameHost;

        /// <summary>Random object for next moves</summary>
        private Random random;
        #endregion

        #region Constructor
        /// <summary>
        /// Create GameManager instance, with specified gameHost
        /// </summary>
        /// <param name="gameHost">GameHost that is creating this Manager</param>
        internal GameManager(IGameHost gameHost)
        {
            // Set member reference
            this.gameHost = gameHost;

            // Default number of elements to 9 - always this number for TicTacToe
            this.optionSquares = new OptionSquare[9];

            // Get a random number object seeded with millisecond value of now
            this.random = new Random(DateTime.Now.Millisecond);

            // 8-element array of winning positions/outcomes - 3 horizontal, 3 vertical, 2 diagonal
            this.winOutcomes = new Int16[8];

            #region Assign standard outcomes
            winOutcomes[0] = 0x07;  // 000000111 = 7
            winOutcomes[1] = 0x38;  // 000111000 = 56
            winOutcomes[2] = 0x1c0; // 111000000 = 448
            winOutcomes[3] = 0x49;  // 001001001 = 73
            winOutcomes[4] = 0x92;  // 010010010 = 146
            winOutcomes[5] = 0x124; // 100100100 = 292
            winOutcomes[6] = 0x111; // 100010001 = 273
            winOutcomes[7] = 0x54;  // 001010100 = 84
            #endregion
        }
        #endregion

        #region Properties
        /// <summary>
        /// Gets whether the player is playing X
        /// </summary>
        public bool PlayerIsX
        {
            get { return this.playerIsX; }
        }

        /// <summary>
        /// Gets or sets whether the game is initialized and ready
        /// </summary>
        public bool IsInitialized
        {
            get { return this.isInitialized; }
            set { this.isInitialized = value; }
        }
        #endregion

        #region Methods
        /// <summary>
        /// Assign Next Square in array-of-9 to this OptionSquare element
        /// </summary>
        /// <param name="optionSquare">OptionSquare instance</param>
        public void AssignNextSquare(OptionSquare optionSquare)
        {
            // Verify that we have not yet reached 9
            Debug.Assert(this.index < 9,
                "Cannot assign more than 9 squares in a game of Tic-Tac-Toe");

            // Verify that the index in array matches SquarePosition on OptionSquare instance
            Debug.Assert(this.index == optionSquare.SquarePosition,
                string.Format("Index must match with squarePosition, different values found! index: {0} squarePosition: {1}", this.index, optionSquare.SquarePosition));

            // Set subscriber reference of OptionSquare to this GameManager
            optionSquare.Subscriber = this;

            // Set optionSquare to element at this index in array
            this.optionSquares[this.index] = optionSquare;

            // Increment - ready for next assignment
            this.index++;
        }

        /// <summary>
        /// Change state on squares (lock or unlock them; based on parameter)
        /// </summary>
        /// <param name="state">lockState, whether we need to lock or unlock the item</param>
        internal void StateChangeOnSquares(SquareStates state)
        {
            // Verify all 9 array indices are property assigned
            Debug.Assert(this.index == 9, "The GameManager has not yet been completely initialized in the call to UnlockAllSquares");

            // Loop 9 times - change Locked state on all instances that are not marked as yet
            for (int i = 0; i < 9; i++)
            {
                // Only for non-marked squares, set state
                if (this.optionSquares[i].State != SquareStates.Marked)
                {
                    this.optionSquares[i].State = state;
                }
            }
        }

        /// <summary>
        /// Set player as X (done by furnishing true in parameter, false means 0)
        /// </summary>
        /// <param name="playerIsX">True means player is X, false means 0</param>
        public void SetPlayerAsX(bool playerIsX)
        {
            // Verify all 9 indices are properly assigned
            Debug.Assert(this.index == 9, "The GameManager has not yet been completely initialized in the call to SetPlayerAsX");

            // Set member boolean variable
            this.playerIsX = playerIsX;

            // Loop through, setting values on all 9 instances in array
            for (int i = 0; i < 9; i++)
            {
                this.optionSquares[i].MarkedForX = this.playerIsX;
            }
        }

        /// <summary>
        /// Begin game
        /// </summary>
        public void BeginGame()
        {
            // First off we need to make our move to begin game, if user is 0 (not X)
            if (!this.playerIsX)
            {
                // Get suggested move
                Int16 suggestedMove = this.SuggestMove(this.managerMask, this.playerMask, false);

                // Set this value on the manager bitmask
                this.managerMask |= (Int16)(1 << suggestedMove);

                // Increment to next move
                this.moves++;

                // Show status change on this square
                this.optionSquares[suggestedMove].Display(!this.playerIsX, Colors.Orange, 5.0);
            }

            // Display message for user's turn
            this.gameHost.ShowMessage("Game started... your turn");

            // Enable squares for events
            this.StateChangeOnSquares(SquareStates.Ready);
        }

        /// <summary>
        /// Get suggestion to display on message area
        /// </summary>
        public void GetSuggestion()
        {
            // Find most like square for user to make move
            Int16 suggestedSquare = this.SuggestMove(this.playerMask, this.managerMask, true);
            string displayMessage = string.Empty;

            // Simple text representation, shown on status field
            switch (suggestedSquare)
            {
                case 0:
                    displayMessage = "Top left corner";
                    break;

                case 1:
                    displayMessage = "Top center square";
                    break;

                case 2:
                    displayMessage = "Top right corner";
                    break;

                case 3:
                    displayMessage = "Center row left square";
                    break;

                case 4:
                    displayMessage = "Center row, middle square";
                    break;

                case 5:
                    displayMessage = "Center row right square";
                    break;

                case 6:
                    displayMessage = "Bottom left corner";
                    break;

                case 7:
                    displayMessage = "Bottom center square";
                    break;

                case 8:
                    displayMessage = "Bottom right corner";
                    break;
            }

            // Display message
            this.gameHost.ShowMessage(displayMessage);
        }

        #region IStateChangeSubscriber implementation
        /// <summary>
        /// Notify this subscriber that a change has occured
        /// </summary>
        /// <param name="optionSquare">The OptionSquare instance that has a state-change occuring</param>
        public void Notify(OptionSquare optionSquare)
        {
            // Since this is a player move, set bit on the playerMask so
            this.playerMask |= (Int16)(1 << optionSquare.SquarePosition);

            // Increment to next move
            this.moves++;

            // Display the current square with X or 0, mark it as done (no more events)
            optionSquare.Display(this.playerIsX, Colors.Yellow, 5.0);

            // Define out parameters
            bool gameDrawn;
            Int16 winMask;

            // Check if the game got over with this move
            bool gameOver = this.IsGameOver(this.playerMask, this.managerMask, out winMask, out gameDrawn);

            // If user won, display message and lock board up
            if (gameOver)
            {
                // Complete the game
                this.CompleteGame(winMask, this.playerIsX, "Game over, you won!", false);
            }
            else if (!gameDrawn)
            {
                // Manager needs to make a move - get suggestion from current masks
                // forceSuggest = false makes us play like a human, not *WIN-ALWAYS*
                int suggestedMove = this.SuggestMove(this.managerMask, this.playerMask, false);

                // Set this value up in managerMask
                this.managerMask |= (Int16)(1 << suggestedMove);

                // Increment to next move
                this.moves++;

                // Display the current square with X or 0, mark it as done (no more events)
                this.optionSquares[suggestedMove].Display(!this.playerIsX, Colors.Orange, 5.0);

                // Check if the game got over with this move
                gameOver = this.IsGameOver(this.managerMask, this.playerMask, out winMask, out gameDrawn);

                // If manager won, display message and lock board up
                if (gameOver)
                {
                    // Complete the game
                    this.CompleteGame(winMask, !this.playerIsX, "Game over, you lost!", false);
                }
                else
                {
                    // Display message on status
                    this.gameHost.ShowMessage("Your turn now");
                }
            }

            // Display message that game is over if we had a draw
            if (gameDrawn)
            {
                this.CompleteGame(GameManager.board, this.playerIsX, "Game drawn, no outcome!", true);
            }
        }
        #endregion

        #region private Methods
        /// <summary>
        /// Complete the game - set parameters and change state of board and OptionSquares
        /// </summary>
        /// <param name="winMask">The mask for winning</param>
        /// <param name="playerXFlag">Which player won</param>
        /// <param name="message">Message to display</param>
        /// <param name="isDrawn">Flag to show if the game was drawn</param>
        private void CompleteGame(Int16 winMask, bool playerXFlag, string message, bool isDrawn)
        {
            // Display row/column/diagonal that caused win if not drawn
            if (!isDrawn)
            {
                this.ChangeColorsOnWin(winMask, playerXFlag);
            }

            // Set status as finished on squares - no more events
            this.StateChangeOnSquares(SquareStates.Finished);

            // Notify game-host that game is over
            this.gameHost.NotifyGameOver();

            // Display message
            this.gameHost.ShowMessage(message);
        }

        /// <summary>
        /// Suggest a certain move
        /// </summary>
        /// <param name="currentMask">Mask for which move is to be suggested</param>
        /// <returns>Most optimal move (or random from a set of equally weighted moves)</returns>
        private Int16 SuggestMove(Int16 currentMask, Int16 opponentMask, bool forceSuggest)
        {
            /****
             * We kind-of micromanage the first couple of moves for the computer, so that it can proceed with the most-optimal
             * strategy going forward in the game. This whole section needs an easy optimization
             ****/
            int nextMove = -1;

            switch (this.moves)
            {
                #region First move
                case 0:
                    if (forceSuggest)
                    {
                        // Fetch one of 0, 2, 4, 6, 8 as next move
                        nextMove = this.random.Next(5) * 2;
                    }
                    else
                    {
                        // When the board is empty - always select a random square as most-optimal strategy
                        nextMove = this.random.Next(9);
                    }
                    break;
                #endregion

                #region Second move
                case 1:
                    switch (opponentMask)
                    {
                        case 16:
                            // Opponent started off with one in the center - select either any corner (most of the time, or one in the side other times)
                            if (forceSuggest)
                            {
                                // For force-suggestions, always refer most optimal move for the player - select a random corner if the center is already filled
                                int[] array = { 0, 2, 6, 8 };
                                int randIndex = this.random.Next(4);

                                nextMove = array[randIndex];
                            }
                            else
                            {
                                // Computer tries to play optimally most of the time, but still - it won't make silly mistakes
                                // Let's try not to suggest a corner straight-away but work towards trying out an approach where 20% of the
                                // time we suggest a random side (not corner square or center square)
                                int randIndex = this.random.Next(5);
                                nextMove = randIndex * 2;

                                // We can't have 4 as such - use this value to trigger and set a side-square pick-up
                                if (nextMove == 4)
                                {
                                    randIndex = this.random.Next(4);
                                    nextMove = (randIndex * 2) + 1;
                                }
                            }
                            break;

                        case 1:
                        case 4:
                        case 64:
                        case 256:
                            if (forceSuggest)
                            {
                                // Always choose center when asked for a move
                                nextMove = 4;
                            }
                            else
                            {
                                // 66.7% of the time, the computer also selects the center square but 33.3% of the time, we let the computer
                                // choose another corner, (or maybe a side-square!)
                                int[] array = { 4, 4, 9 };
                                int randIndex = this.random.Next(3);

                                nextMove = array[randIndex];

                                if (nextMove == 9)
                                {
                                    // Loop again until you don't step on the same square as opponent
                                    do
                                    {
                                        randIndex = this.random.Next(5);
                                        nextMove = randIndex * 2;
                                    }
                                    while (((Int16)(1 << nextMove)) == opponentMask);

                                    if (nextMove == 4)
                                    {
                                        // Pick one at random from 1, 3, 5 and 7
                                        randIndex = this.random.Next(4);
                                        nextMove = (randIndex * 2) + 1;
                                    }
                                }
                            }
                            break;

                        case 2:
                            // For square selected: 1
                            // Select 4 (center) as most optimal move
                            if (forceSuggest)
                            {
                                nextMove = 4;
                            }
                            else
                            {
                                // Try and select a square from (0, 2, 4) but otherwise; select any from the remaining ones
                                int randIndex = this.random.Next(4);
                                nextMove = randIndex * 2;

                                if (nextMove == 6)
                                {
                                    int[] array = { 3, 5, 6, 7, 8 };
                                    randIndex = this.random.Next(5);
                                    nextMove = array[randIndex];
                                }
                            }
                            break;

                        case 8:
                            // For square selected: 3
                            // Select 4 (center) as most optimal move
                            if (forceSuggest)
                            {
                                nextMove = 4;
                            }
                            else
                            {
                                // Try and select a square from (0, 4, 6) but otherwise; select any from the remaining ones
                                int randIndex = this.random.Next(4);
                                nextMove = randIndex * 2;

                                if (nextMove == 2)
                                {
                                    int[] array = { 1, 2, 5, 7, 8 };
                                    randIndex = this.random.Next(5);
                                    nextMove = array[randIndex];
                                }
                            }
                            break;

                        case 32:
                            // For square selected: 5
                            // Select 4 (center) as most optimal move
                            if (forceSuggest)
                            {
                                nextMove = 4;
                            }
                            else
                            {
                                // Try and select a square from (2, 4, 8) but otherwise; select any from the remaining ones
                                int randIndex = this.random.Next(1, 4);
                                nextMove = randIndex * 2;

                                if (nextMove == 6)
                                {
                                    int[] array = { 0, 1, 3, 6, 7 };
                                    randIndex = this.random.Next(5);
                                    nextMove = array[randIndex];
                                }
                            }
                            break;

                        case 128:
                            // For square selected: 7
                            // Select 4 (center) as most optimal move
                            if (forceSuggest)
                            {
                                nextMove = 4;
                            }
                            else
                            {
                                // Try and select a square from (4, 6 and 8) but otherwise; select any from the remaining ones
                                int randIndex = this.random.Next(1, 5);
                                nextMove = randIndex * 2;

                                if (nextMove == 2)
                                {
                                    int[] array = { 0, 1, 2, 3, 5 };
                                    randIndex = this.random.Next(5);
                                    nextMove = array[randIndex];
                                }
                            }
                            break;
                    }
                    break;
                #endregion

                #region Third move
                case 2:
                    switch (currentMask)
                    {
                        case 16:
                            switch (opponentMask)
                            {
                                case 1:
                                case 256:
                                    int randIndex = this.random.Next(1, 3);
                                    nextMove = (randIndex == 1) ? 2 : 6;
                                    break;

                                case 4:
                                case 64:
                                    randIndex = this.random.Next(1, 3);
                                    nextMove = (randIndex == 1) ? 0 : 8;
                                    break;

                                case 2:
                                case 8:
                                case 32:
                                case 128:
                                    int[] array = { 0, 2, 6, 8 };
                                    randIndex = this.random.Next(4);

                                    nextMove = array[randIndex];
                                    break;
                            }
                            break;
                        case 1:
                            switch (opponentMask)
                            {
                                case 2:
                                case 4:
                                case 128:
                                    nextMove = 6;
                                    break;

                                case 8:
                                case 32:
                                case 64:
                                    nextMove = 2;
                                    break;

                                case 256:
                                    // Select one of 2 or 6
                                    int randIndex = this.random.Next(1, 3);
                                    nextMove = (randIndex == 1) ? 2 : 6;
                                    break;

                                case 16:
                                    nextMove = 8;
                                    break;
                            }
                            break;

                        case 4:
                            switch (opponentMask)
                            {
                                case 1:
                                case 2:
                                case 128:
                                    nextMove = 8;
                                    break;

                                case 8:
                                case 32:
                                case 256:
                                    nextMove = 0;
                                    break;

                                case 64:
                                    // Select one of 0 or 8
                                    int randIndex = this.random.Next(1, 3);
                                    nextMove = (randIndex == 1) ? 0 : 8;
                                    break;

                                case 16:
                                    nextMove = 6;
                                    break;
                            }
                            break;

                        case 64:
                            switch (opponentMask)
                            {
                                case 1:
                                case 8:
                                case 32:
                                    nextMove = 8;
                                    break;

                                case 2:
                                case 128:
                                case 256:
                                    nextMove = 0;
                                    break;

                                case 4:
                                    // Select one of 0 or 8
                                    int randIndex = this.random.Next(1, 3);
                                    nextMove = (randIndex == 1) ? 0 : 8;
                                    break;

                                case 16:
                                    nextMove = 2;
                                    break;
                            }
                            break;

                        case 256:
                            switch (opponentMask)
                            {
                                case 4:
                                case 8:
                                case 32:
                                    nextMove = 6;
                                    break;

                                case 2:
                                case 64:
                                case 128:
                                    nextMove = 2;
                                    break;

                                case 1:
                                    // Select one of 2 or 6
                                    int randIndex = this.random.Next(1, 3);
                                    nextMove = (randIndex == 1) ? 2 : 6;
                                    break;

                                case 16:
                                    nextMove = 0;
                                    break;
                            }
                            break;

                        case 2:
                            if ((opponentMask == 1) || (opponentMask == 4))
                            {
                                nextMove = 4;
                            }
                            else if ((opponentMask == 8) || (opponentMask == 64))
                            {
                                nextMove = 0;
                            }
                            else
                            {
                                nextMove = 2;
                            }
                            break;

                        case 8:
                            if ((opponentMask == 1) || (opponentMask == 64))
                            {
                                nextMove = 4;
                            }
                            else if ((opponentMask == 2) || (opponentMask == 4))
                            {
                                nextMove = 0;
                            }
                            else
                            {
                                nextMove = 6;
                            }
                            break;

                        case 32:
                            if ((opponentMask == 4) || (opponentMask == 256))
                            {
                                nextMove = 4;
                            }
                            else if ((opponentMask == 1) || (opponentMask == 2))
                            {
                                nextMove = 2;
                            }
                            else
                            {
                                nextMove = 8;
                            }
                            break;

                        case 128:
                            if ((opponentMask == 64) || (opponentMask == 256))
                            {
                                nextMove = 4;
                            }
                            else if ((opponentMask == 1) || (opponentMask == 8))
                            {
                                nextMove = 6;
                            }
                            else
                            {
                                nextMove = 8;
                            }
                            break;
                    }
                    break;
                #endregion

                #region Fourth move - partial
                case 3:
                    // Only check for 3 is to determine if the board has a diagonal opponent-me-opponent pattern (two ways)
                    // We need to override algorithm and determine a random side-square so as to draw the game most of the times
                    // as grabbing a corner square in this scenario makes an outright victory for the opponent
                    if ((currentMask == 16) && ((opponentMask == 257) || (opponentMask == 68)))
                    {
                        int randIndex = this.random.Next(3);

                        if ((forceSuggest) || (randIndex == 2))
                        {
                            // Select one from {1, 3, 5, 7} on forceSuggest or 33.3% of the time as the manager
                            randIndex = this.random.Next(4);
                            nextMove = (randIndex * 2) + 1;
                        }
                        else if (opponentMask == 257)
                        {
                            // Capture one of the open diagonal corners
                            randIndex = this.random.Next(2);
                            nextMove = (randIndex == 1) ? 2 : 6;
                        }
                        else                         // This is for the case: if (opponentMask == 68)
                        {
                            // Capture one of the open diagonal corners for the other diagonal
                            randIndex = this.random.Next(2);
                            nextMove = (randIndex == 1) ? 0 : 8;
                        }
                    }
                    break;
                #endregion
            }

            #region All other moves
            // Proceed only if no outcome as yet - check first for winning or scuttling
            if (nextMove == -1)
            {
                // Simple algo - first check if there exists a move that we can win
                Int16 position;
                if (this.DeduceWin(currentMask, opponentMask, out position))
                {
                    nextMove = position;
                }
                else
                {
                    // Otherwise, jettison the opponent from a win - if there exists a way we can stop him or her as a computer :)
                    // Simply swap out masks from the call a few lines above and retry this to scuttle the user's chance of winning
                    if (this.DeduceWin(opponentMask, currentMask, out position))
                    {
                        nextMove = position;
                    }
                }
            }

            // If no win exists - deduce next move based on open corners and open arms
            if (nextMove == -1)
            {
                nextMove = this.DeduceNext(currentMask, opponentMask);
            }
            #endregion

            // We should always find a value
            Debug.Assert((nextMove >= 0) && (nextMove < 9), "nextMove is unset or wrongly set in SuggestMove()");

            return (Int16)nextMove;
        }

        /// <summary>
        /// Deduce a win based on two squares being set and the third one open/empty from the myriad
        /// combinations and possibilities in the grid (Total: 24)
        /// </summary>
        /// <param name="currentMask">Mask for which a win is being deduced</param>
        /// <param name="opponentMask">Opponent mask</param>
        /// <param name="position">Position where we need to make a move to win</param>
        /// <returns>True if a win is found, false otherwise</returns>
        private bool DeduceWin(Int16 currentMask, Int16 opponentMask, out Int16 position)
        {
            bool winFound = false;
            position = -1;

            // First set of 9 lookups - check for 3 bits with any two matching - walk thrice, three-times for each row
            Int16 tripleBits = 0x07;
            int start = 1;
            int counter = 0;

            do
            {
                // Loop three times to check each set of three bits for a missing bit
                for (int i = 0; i < 3; i++)
                {
                    // This operation extracts three bits, and then XORing it with the opposite should yield the missing bit
                    if ((((currentMask & tripleBits) ^ start) == tripleBits) && ((opponentMask & start) == 0))
                    {
                        winFound = true;
                        break;
                    }

                    // Move on to next power
                    start <<= 1;
                    counter++;
                }

                // Break out if you found a match
                if (winFound)
                {
                    position = (Int16)counter;
                    return winFound;
                }

                // Shift these bits 3 places left for the next row
                tripleBits <<= 3;
            }
            while (tripleBits <= 0x1c0);

            // Second set of 9 lookups for columns - check for 3 bits with any two matching - walk thrice, three-times for each row
            tripleBits = 0x49;
            start = 1;
            Int16[] array = { 0, 3, 6, 1, 4, 7, 2, 5, 8 };
            counter = 0;

            do
            {
                // Loop three times to check each set of three bits for a missing bit
                for (int i = 0; i < 3; i++)
                {
                    // This operation extracts three bits, and then XORing it with the opposite should yield the missing bit
                    if ((((currentMask & tripleBits) ^ start) == tripleBits) && ((opponentMask & start) == 0))
                    {
                        winFound = true;
                        break;
                    }

                    // Move on to next power - shift bits thrice left
                    start <<= 3;
                    counter++;
                }

                // Break out if you found a match
                if (winFound)
                {
                    position = array[counter];
                    return winFound;
                }

                if (tripleBits == 0x49)
                {
                    start = 2;
                }
                else if (tripleBits == 0x92)
                {
                    start = 4;
                }

                // Shift these bits 1 place left for the next column
                tripleBits <<= 1;
            }
            while (tripleBits <= 0x124);

            tripleBits = 0x111;
            start = 1;
            counter = 0;

            do
            {
                // Loop three times to check one set of three bits for one diagonal
                for (int i = 0; i < 3; i++)
                {
                    // This operation extracts three bits, and then XORing it with the opposite should yield the missing bit
                    if ((((currentMask & tripleBits) ^ start) == tripleBits) && ((opponentMask & start) == 0))
                    {
                        winFound = true;
                        if (tripleBits == 0x111)
                        {
                            // For the 2nd quadrant diagonal, the values are 0, 4 and 8
                            position = (Int16)(counter * 4);
                        }
                        else
                        {
                            // For the 1st quadrant diagonal, the values are 2, 4 and 6
                            position = (Int16)(counter * 2);
                        }
                        return winFound;
                    }

                    // Move on to next power - shift bits four times left
                    if (tripleBits == 0x111)
                    {
                        start <<= 4;
                    }
                    else
                    {
                        // Shift two bits to the left for the other diagonal
                        start <<= 2;
                    }
                    counter++;
                }

                // Switch diagonals, reset other variables
                if (tripleBits == 0x111)
                {
                    tripleBits = 0x54;
                    start = 4;
                    counter = 1;
                }
                else if (tripleBits == 0x54)
                {
                    tripleBits = 0;
                }
            }
            while (tripleBits > 0);

            // We found a valid position for a win - set return flag so
            if (position >= 0)
            {
                winFound = true;
            }

            return winFound;
        }

        /// <summary>
        /// Deduce the next move
        /// </summary>
        /// <param name="currentMask">Current mask</param>
        /// <param name="opponentMask">Opponent mask</param>
        /// <returns>The position for next move</returns>
        private Int16 DeduceNext(Int16 currentMask, Int16 opponentMask)
        {
            // Default initialize nextMove to -1
            Int16 nextMove = -1;

            // Simply pick up any corner-square that satisfies this condition - it is
            // unmarked and you can reach it via an empty intervening one.
            // Twelve conditions exist, otherwise simply pick up an empty square
            // Horizontal arm - check if we can propogate forward on two empty squares
            if ((((currentMask & 0x07) ^ 0x06) == 0x07) && ((opponentMask & 0x06) == 0))
            {
                nextMove = 2;
            }
            else if ((((currentMask & 0x49) ^ 0x48) == 0x49) && ((opponentMask & 0x48) == 0))
            {
                nextMove = 6;
            }
            else if ((((currentMask & 0x111) ^ 0x110) == 0x111) && ((opponentMask & 0x110) == 0))
            {
                // Inner check to claim center if we already have a corner captured with a blank forward
                if (((((currentMask & 0x92) ^ 0x90) == 0x92) && ((opponentMask & 0x90) == 0)) ||
                    ((((currentMask & 0x38) ^ 0x30) == 0x38) && ((opponentMask & 0x30) == 0)))
                {
                    nextMove = 4;
                }
                else
                // Claim corner
                {
                    nextMove = 8;
                }
            }
            else if ((((currentMask & 0x07) ^ 0x03) == 0x07) && ((opponentMask & 0x03) == 0))
            {
                nextMove = 0;
            }
            else if ((((currentMask & 0x54) ^ 0x50) == 0x54) && ((opponentMask & 0x50) == 0))
            {
                // Inner check to claim center if we already have a corner captured with a blank forward
                if (((((currentMask & 0x92) ^ 0x90) == 0x92) && ((opponentMask & 0x90) == 0)) ||
                    ((((currentMask & 0x38) ^ 0x18) == 0x38) && ((opponentMask & 0x18) == 0)))
                {
                    nextMove = 4;
                }
                else
                {
                    nextMove = 6;
                }
            }
            else if ((((currentMask & 0x124) ^ 0x120) == 0x124) && ((opponentMask & 0x120) == 0))
            {
                nextMove = 8;
            }
            else if ((((currentMask & 0x49) ^ 0x09) == 0x49) && ((opponentMask & 0x09) == 0))
            {
                nextMove = 0;
            }
            else if ((((currentMask & 0x54) ^ 0x14) == 0x54) && ((opponentMask & 0x14) == 0))
            {
                // Inner check to claim center if we already have a corner captured with a blank forward
                if (((((currentMask & 0x92) ^ 0x12) == 0x92) && ((opponentMask & 0x12) == 0)) ||
                    ((((currentMask & 0x38) ^ 0x30) == 0x38) && ((opponentMask & 0x30) == 0)))
                {
                    nextMove = 4;
                }
                else
                {
                    nextMove = 2;
                }
            }
            else if ((((currentMask & 0x1c0) ^ 0x180) == 0x1c0) && ((opponentMask & 0x180) == 0))
            {
                nextMove = 8;
            }
            else if ((((currentMask & 0x124) ^ 0x24) == 0x124) && ((opponentMask & 0x24) == 0))
            {
                nextMove = 2;
            }
            else if ((((currentMask & 0x111) ^ 0x11) == 0x111) && ((opponentMask & 0x11) == 0))
            {
                // Inner check to claim center if we already have a corner captured with a blank forward
                if (((((currentMask & 0x92) ^ 0x12) == 0x92) && ((opponentMask & 0x12) == 0)) ||
                       ((((currentMask & 0x38) ^ 0x18) == 0x38) && ((opponentMask & 0x18) == 0)))
                {
                    nextMove = 4;
                }
                else
                {
                    nextMove = 0;
                }
            }
            else if ((((currentMask & 0x1c0) ^ 0xc0) == 0x1c0) && ((opponentMask & 0x1c0) == 0))
            {
                nextMove = 6;
            }
            else
            {
                // Check if we can grab the 2-4-6 diagonal if the center square is ours
                if ((((currentMask & 0x54) ^ 0x44) == 0x54) && ((opponentMask & 0x44) == 0))
                {
                    // To select either 2 or 6 - use the two squares to make a call
                    int randIndex = this.random.Next(2);
                    nextMove = (randIndex == 1) ? (Int16)2 : (Int16)6;
                }
                else
                {
                    // Simply pick up the next free square :(, this is most likely a draw
                    Int16 nextSquare = 1;
                    Int16 counter = 0;
                    bool loopUntilFree = true;
                    do
                    {
                        if (((currentMask & nextSquare) == 0) && ((opponentMask & nextSquare) == 0))
                        {
                            loopUntilFree = false;
                        }
                        else
                        {
                            counter++;
                            nextSquare <<= 1;
                        }
                    }
                    while (loopUntilFree);

                    nextMove = counter;
                }
            }

            Debug.Assert((nextMove >= 0) && (nextMove < 9), "nextMove needs to be set correctly within DeduceNext()");

            return nextMove;
        }

        #region Deduce if the game is over
        /// <summary>
        /// Finds out if the currentMask represents a game that is over (won).
        /// </summary>
        /// <param name="currentMask">Current bitmask for player/manager</param>
        /// <param name="opponentMask">Current opponent bitmask</param>
        /// <param name="winPattern">Winning pattern on board</param>
        /// <param name="gameDrawn">Out parameter that is set if the game is drawn (no result)</param>
        /// <returns>True if the currentMask represents a victory</returns>
        private bool IsGameOver(Int16 currentMask, Int16 opponentMask, out Int16 winPattern, out bool gameDrawn)
        {
            // Return parameter
            bool gameWon = false;

            // Default initialize out parameter to false
            gameDrawn = false;

            // Default initialize winPattern to -1
            winPattern = -1;

            // Cycle through 8 outcomes defined, finding a match
            for (int i = 0; i < 8; i++)
            {
                // Match is the winOutcomes[i] being a part of currentMask
                if ((currentMask & this.winOutcomes[i]) == this.winOutcomes[i])
                {
                    gameWon = true;
                    winPattern = this.winOutcomes[i];
                    break;
                }
            }

            // If gameWon is false, check if the board is filled (game drawn)
            if (!gameWon)
            {
                // Simple way - Bitwise OR both player masks should equal the board
                if ((currentMask | opponentMask) == GameManager.board)
                {
                    gameDrawn = true;
                }
            }

            return gameWon;
        }
        #endregion

        #region Change colors on winning
        /// <summary>
        /// Change colors of the respective squares on win
        /// </summary>
        /// <param name="winMask">Winning bitmask</param>
        /// <param name="playerXFlag">Whether we need to use the player's selection (X or 0)</param>
        private void ChangeColorsOnWin(int winMask, bool playerXFlag)
        {
            // Set specific squares based on winMask values
            // Horizontal one
            if (winMask == this.winOutcomes[0])
            {
                this.optionSquares[0].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[1].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[2].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Horizontal two
            else if (winMask == this.winOutcomes[1])
            {
                this.optionSquares[3].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[4].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[5].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Horizontal three
            else if (winMask == this.winOutcomes[2])
            {
                this.optionSquares[6].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[7].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[8].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Vertical one
            else if (winMask == this.winOutcomes[3])
            {
                this.optionSquares[0].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[3].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[6].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Vertical two
            else if (winMask == this.winOutcomes[4])
            {
                this.optionSquares[1].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[4].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[7].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Vertical three
            else if (winMask == this.winOutcomes[5])
            {
                this.optionSquares[2].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[5].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[8].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Diagonal one
            else if (winMask == this.winOutcomes[6])
            {
                this.optionSquares[0].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[4].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[8].Display(playerXFlag, Colors.Cyan, 8.0);
            }
            // Diagonal two
            else if (winMask == this.winOutcomes[7])
            {
                this.optionSquares[2].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[4].Display(playerXFlag, Colors.Cyan, 8.0);
                this.optionSquares[6].Display(playerXFlag, Colors.Cyan, 8.0);
            }
        }
        #endregion
        #endregion
        #endregion
    };
    #endregion
}