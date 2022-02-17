import { dico, motExist } from "./dico.js";

const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const langue = document.querySelector("#lang");
const hard = document.querySelector("#hardmode");
/* gestion de la date du jour */
let dateA = new Date();
const dateAujourdhui = () => {
  return `${dateA.getDate()}/${dateA.getMonth() + 1}/${dateA.getFullYear()}`;
};
const lettresOK = [];
const resultat = {
  date: dateAujourdhui(),
  numero: 0,
  langue: "",
  essais: [],
  target: "",
  reussi: false,
};
/* recuperer les archives  si elles existent, sinon []*/
let jeux = JSON.parse(localStorage.getItem("jeux"));
if (!jeux) {
  jeux = [];
}
/* recuperer la langue */
let lang = JSON.parse(localStorage.getItem("langue"));
if (!lang) lang = "F";
langue.value = lang;
let targetWord = dico(lang);
localStorage.setItem("[targets]", targetWord);
/* si on change la langue, on la stocke dans LocalStorage pour la retrouver apres reload */
langue.addEventListener("change", () => {
  lang = langue.value;
  localStorage.setItem("langue", JSON.stringify(lang));
  window.location.reload();
});
let hardm = hard.value;
hard.addEventListener("change", () => {
  hardm = hard.value;
});
startInteraction();
/* ---------------- fonctions---------------- */
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
function rajoutLettre(lettre) {
  if (!lettresOK.find((l) => l === lettre)) lettresOK.push(lettre);
}
function manqueLettres(guess) {
  let renvoi = false;
  lettresOK.forEach((ll) => {
    if (!guess.includes(ll)) renvoi = true;
  });
  return renvoi;
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];

  if (activeTiles.length !== WORD_LENGTH) {
    showAlert(`${activeTiles.length} lettres ?`, "erreur", 1000);
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter;
  }, "");
  if (!motExist(guess, lang)) {
    showAlert("Mot inconnu !", "erreur", 1000);
    shakeTiles(activeTiles);
    return;
  }

  if (manqueLettres(guess) && hardm === "h") {
    showAlert("manque lettres", "erreur", 1000);
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
        rajoutLettre(letter);
      } else if (targetWord.includes(letter)) {
        tile.dataset.state = "pas-la";
        key.classList.add("pas-la");
        rajoutLettre(letter);
      } else {
        tile.dataset.state = "faux";
        key.classList.add("faux");
      }
      if (index === array.length - 1) {
       
        const targmod = Array.from(targetWord).filter((lettre, index) => {
          if (activeTiles[index].dataset.state === "correct") return;
          return lettre;
        });
        /* enlever les lettres correctes de activeTiles */
        const actRed = activeTiles.filter((tile) => {
          return tile.dataset.state !== "correct";
        });
        /* maj du statut des lettres restantes */
        actRed.forEach((tile) => {
          if (targmod.includes(tile.dataset.letter)) {
            tile.dataset.state = "pas-la";
            targmod.splice(targmod.indexOf(tile.dataset.letter), 1);
          } else {
            tile.dataset.state = "faux";
          }
        });

        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            resultat.essais.push(guess);
            resultat.target = targetWord;
            resultat.langue = lang;
            let dateJeuxLast = "";
            if (jeux.length > 0) {
              dateJeuxLast = jeux[jeux.length - 1].date;
            }
            if (resultat.date == dateJeuxLast) {
              resultat.numero = jeux[jeux.length - 1].numero + 1;
            }
            console.log(resultat);
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

function showAlert(message, why, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alert.classList.add(why);
  alertContainer.append(alert); /* au lien de prepend */
  if (duration == null) return;

  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener(
      "transitionend",
      () => {
        alert.remove();
      },
      { once: true }
    );
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
    showAlert("Bravo!", "bravo", 5000);
    danceTiles(tiles);
    resultat.reussi = true;
    jeux.push(resultat);
    localStorage.setItem("jeux", JSON.stringify(jeux));
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    showAlert(
      "Désolé.. C'était " + targetWord.toUpperCase() + " !",
      "erreur",
      null
    );
    resultat.reussi = false;
    jeux.push(resultat);
    localStorage.setItem("jeux", JSON.stringify(jeux));
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
