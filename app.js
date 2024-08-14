// fetch five letter words from the API
async function fetchFiveLetterWords() {
    try {
        const response = await fetch(`https://random-word-api.herokuapp.com/word?length=5&&lang=es`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const fiveLetterWords = data.map((word) => cleanString(word));
        return fiveLetterWords;
    } catch (error) {
        console.error(`Error fetching words: ${error.message}`);
        return []; // return an empty array to prevent crashes
    }
}

function cleanString(input) {
    // Normalizar y eliminar acentos
    const normalizedString = input.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    // Eliminar caracteres especiales, dejando solo letras y números
    const cleanedString = normalizedString.replace(/[^a-zA-Z0-9]/g, "");
    
    return cleanedString;
}
async function startGame() {
    const words = await fetchFiveLetterWords();
    const wordsSet = new Set(words); //to-do: agregar verificacion de letras aleatoria acentuadas

    // Elements
    const keyboard = document.getElementById('keyboard');
    const resultModal = document.getElementById('result-modal');
    const resultText = document.getElementById('result-text');
    const secretWordText = document.getElementById('secret-word');
    const playAgainBtn = document.getElementById('play-again');

    // Variables
    let guess = '';
    let activeRowNumber = 1;
    let guessAttempts = 0;
    const maxAttempts = 6;
    let gameStatus = 'active';

    // Get a random word for the game
    function getRandomWord() {
        const index = Math.floor(Math.random() * words.length);
        return words[index];
    }
    let randomWord = getRandomWord();
    let secretWord = randomWord.toLowerCase();
    console.log('secretWord:', secretWord);

    // Handle real keyboard or on-screen keyboard event
    window.addEventListener('keyup', handleKeyEvent);
    keyboard.addEventListener('click', handleKeyEvent);

    function handleKeyEvent(event) {
        if (gameStatus === 'active') {
            const { letter, backspace } = getKeys(event);

            if (letter || backspace) {
                if (!backspace) {
                    if (letter === 'enter') {
                        if (guess.length === 5) {
                            scoreGuess();
                        } else {
                            alert('Faltan letras');
                        }
                    } else {
                        handleGuessLetter(letter);
                    }
                } else {
                    handleBackspace();
                }
            }
        }
    }

    function getKeys(event) {
        const eventType = event.type;
        const keys = { letter: null, backspace: false };

        if (eventType === 'keyup') {
            if (event.code.toLowerCase().includes('key')) {
                keys.letter = event.key;
            } else {
                keys.letter = event.code.toLowerCase() === 'enter' ? 'enter' : null;
            }

            keys.backspace = event.key.toLowerCase() === 'backspace';
        } else {
            keys.letter = event.target.classList.contains('keyboard-letter')
                ? event.target.textContent
                : null;
            keys.backspace =
                event.target.classList.contains('fa-delete-left') ||
                event.target.innerHTML.includes('fa-delete-left');
        }
        return keys;
    }

    // Handle letter
    function handleGuessLetter(letter) {
        if (guess.length < 5) {
            guess += letter;
            showGuessOnBoard(letter);
        } else {
            alert(`Ya agregaste 5 letras en esta palabra`);
        }
    }

    function showGuessOnBoard(letter) {
        const activeRow = document.querySelector(`.board-row--${activeRowNumber}`);

        for (let rowBoardLetter of activeRow.children) {
            const rowBoardLetterSpan = rowBoardLetter.querySelector('span');
            if (!rowBoardLetterSpan.textContent) {
                rowBoardLetterSpan.classList.add('letter-enter');
                rowBoardLetterSpan.textContent = letter;
                return;
            }
        }
    }

    function handleBackspace() {
        if (guess.length > 0) {
            const letterIndex = guess.length - 1;

            const activeRow = document.querySelector(
                `.board-row--${activeRowNumber}`
            );
            const rowBoardLetterSpan =
                activeRow.children[letterIndex].querySelector('span');
            rowBoardLetterSpan.classList.remove('letter-enter');
            setTimeout(() => {
                rowBoardLetterSpan.textContent = '';
            }, 300);

            guess = guess.slice(0, letterIndex);
        }
    }

    function handleNotExistingWord() {
        const activeRow = document.querySelector(`.board-row--${activeRowNumber}`);
        activeRow.classList.add('shake');
        setTimeout(() => {
            activeRow.classList.remove('shake');
        }, 300);
    }

    function scoreGuess() {
        const guessResult = [];
        let secretWordCopy = secretWord;

        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === secretWord[i]) {
                guessResult.push({ letter: guess[i], status: 'correct' });

                const letterIndex = secretWordCopy.indexOf(guess[i]);
                secretWordCopy =
                    secretWordCopy.substring(0, letterIndex) +
                    secretWordCopy.substring(letterIndex + 1);

                console.log(secretWordCopy);
            } else {
                guessResult.push(null);
            }
        }

        for (let i = 0; i < guess.length; i++) {
            if (guessResult[i] === null) {
                if (secretWordCopy.includes(guess[i])) {
                    guessResult[i] = { letter: guess[i], status: 'present' };

                    const letterIndex = secretWordCopy.indexOf(guess[i]);
                    secretWordCopy =
                        secretWordCopy.substring(0, letterIndex) +
                        secretWordCopy.substring(letterIndex + 1);
                } else {
                    guessResult[i] = { letter: guess[i], status: 'absent' };
                }
            }
        }

        updateUI(guessResult);
    }

    function updateUI(guessResult) {
        guessAttempts++;
        const activeRow = document.querySelector(`.board-row--${activeRowNumber}`);
        updateRowLetters(activeRow, guessResult);
        updateKeyboardLetters(guessResult);
        const numCorrect = guessResult.filter(
            (result) => result.status === 'correct'
        ).length;
        console.log('numCorrect', numCorrect);
        handleGameStatus(numCorrect);
    }

    function updateRowLetters(row, guessResult) {
        for (let i = 0; i < guessResult.length; i++) {
            row.children[i].classList.add(`letter-${guessResult[i].status}`);
        }
    }

    function updateKeyboardLetters(guessResult) {
        for (let keyboardRow of keyboard.children) {
            for (let keyboardLetter of keyboardRow.children) {
                for (let i = 0; i < guessResult.length; i++) {
                    if (guessResult[i].letter === keyboardLetter.textContent) {
                        if (guessResult[i].status === 'correct') {
                            keyboardLetter.classList.add('letter-correct');
                        } else if (!keyboardLetter.classList.contains('letter-correct')) {
                            keyboardLetter.classList.add(`letter-${guessResult[i].status}`);
                        }
                    }
                }
            }
        }
    }

    function handleGameStatus(numCorrect) {
        if (numCorrect === 5) {
            gameStatus = 'won';
            // Mostrar el modal de resultado si el juego ha terminado
            resultModal.classList.remove('hidden');
            resultText.innerText = '¡Felicidades!';
            secretWordText.innerText = secretWord;
        } else if (guessAttempts >= maxAttempts) {
            gameStatus = 'lost';
            // Mostrar el modal de resultado si el juego ha terminado
            resultModal.classList.remove('hidden');
            resultText.innerText = '¡Suerte la próxima vez!';
            secretWordText.innerText = secretWord;
        } else {
            // Si no se ha ganado ni perdido, avanza a la siguiente fila
            guess = '';
            activeRowNumber++;
            activeRow = document.querySelector(`.board-row--${activeRowNumber}`);
            if (activeRowNumber > maxAttempts) {
                // Si se supera el número máximo de intentos, el juego termina
                gameStatus = 'lost';
                resultModal.classList.remove('hidden');
                resultText.innerText = '¡Suerte la próxima vez!';
                secretWordText.innerText = secretWord;
            } else {
                // Obtener una nueva palabra secreta para la siguiente ronda
                secretWord = getRandomWord.toLowerCase();
                console.log('New secretWord:', secretWord);
            }
        }
    }

    playAgainBtn.addEventListener('click', () => window.location.reload());
}

startGame();
