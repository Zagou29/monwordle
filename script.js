import { dico, motExist } from "./dico.js";

const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const langue = document.querySelector("#lang");

let lang = "F";
let targetWord = dico(lang);
localStorage.setItem("[targets]", targetWord);
langue.addEventListener("change", () => {
  effGrid();
  lang = langue.value;
  targetWord = dico(lang);
  localStorage.setItem("[targets]", targetWord);
});

/* cherche le mot au hasard dans le dico */

startInteraction();

function startInteraction() {
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    return;
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey(e);
    return;
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey();
    return;
  }

  if (e.key.match(/^[a-z]$/) || e.key.match(/^[A-Z]$/)) {
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  const activeTiles = getActiveTiles(); /* lise tuiles actives */
  if (activeTiles.length >= WORD_LENGTH) return; /* arrete à 5 lettres */
  const nextTile = guessGrid.querySelector(":not([data-letter])");
  nextTile.dataset.letter = key.toLowerCase(); /* stocker lettre min */
  nextTile.textContent = key.toUpperCase(); /* affiche lettre maj */
  nextTile.dataset.state = "active";
}

function deleteKey() {
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (lastTile == null) return;
  lastTile.textContent = "";
  delete lastTile.dataset.state; /* supprime les 2 dataset */
  delete lastTile.dataset.letter;
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];

  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Manque des lettres");
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");
  if (!motExist(guess, lang)) {
    showAlert("Pas dans le dictionnaire");
    shakeTiles(activeTiles);
    return;
  }

  stopInteraction();

  activeTiles.forEach((...params) => flipTile(...params, guess, activeTiles));
}

function flipTile(tile, index, array, guess, activeTiles) {
  const letter = tile.dataset.letter;
  /* liste les 5 cases avec des lettres, avec I pour comparer min aux majuscules */
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);

  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");
      if (targetWord[index] === letter) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "pas-la";
        key.classList.add("pas-la");
      } else {
        tile.dataset.state = "faux";
        key.classList.add("faux");
      }
      if (index === array.length - 1) {
        let targmod = "";
        /* reconstruire targword sans les lettres correctes */
        activeTiles.forEach((tile, index) => {
          if (tile.dataset.state === "correct") return;
          targmod = targmod + targetWord[index];
        });
        /* enlever les lettres correctes de activeTiles */
        const actRed = activeTiles.filter((tile) => {
          return tile.dataset.state !== "correct";
        });
        /* maj du statut des lettres restantes */
        actRed.forEach((tile) => {
          if (targmod.includes(tile.dataset.letter)) {
            tile.dataset.state = "pas-la";
          } else {
            tile.dataset.state = "faux";
          }
        });

        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

const getActiveTiles = () => {
  return guessGrid.querySelectorAll('[data-state="active"]');
};

function removeClassTouche(classe) {
  keyboard.querySelectorAll(`.${classe}`).forEach((touche) => {
    touche.classList.remove(classe);
  });
}

const effGrid = () => {
  guessGrid.querySelectorAll("[data-state]").forEach((key) => {
    delete key.dataset.letter;
    delete key.dataset.state;
    key.textContent = "";
  });
  removeClassTouche("faux");
  removeClassTouche("pas-la");
  removeClassTouche("correct");
};

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.prepend(alert);
  if (duration == null) return;

  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord) {
    showAlert("Bravo!", 5000);
    danceTiles(tiles);
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    showAlert("Désolé.. C'était " + targetWord.toUpperCase() + " !", null);
    stopInteraction();
  }
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}
