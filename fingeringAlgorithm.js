// lib/fingeringAlgorithm.js

// Accordage standard de la guitare (Mi, La, Ré, Sol, Si, Mi) en valeurs MIDI
// Corde 0 = Mi grave (Low E), Corde 5 = Mi aigu (High e)
const TUNING = [40, 45, 50, 55, 59, 64]; 
const MAX_FRET = 22; // On limite à un manche de 22 cases

// 1. Trouver toutes les positions (Corde + Case) pour une note MIDI
function getPossiblePositions(midiNote) {
  let positions = [];
  for (let string = 0; string < TUNING.length; string++) {
    const fret = midiNote - TUNING[string];
    if (fret >= 0 && fret <= MAX_FRET) {
      positions.push({ string, fret });
    }
  }
  return positions;
}

// 2. Calculer le coût de déplacement entre deux positions
function getTransitionCost(pos1, pos2) {
  // Différence de case (le plus fatiguant/difficile)
  const fretDiff = Math.abs(pos2.fret - pos1.fret);
  
  // Différence de corde
  const stringDiff = Math.abs(pos2.string - pos1.string);

  // Pénalité de changement de position (démanché)
  // Si on reste dans une zone de 3-4 cases, c'est facile. Au-delà, c'est un saut.
  let positionShiftPenalty = 0;
  if (fretDiff > 4 && pos1.fret !== 0 && pos2.fret !== 0) {
    positionShiftPenalty = fretDiff * 5; // Pénalité lourde pour les grands sauts
  }

  // Les cordes à vide (case 0) coûtent moins cher à atteindre
  let openStringBonus = (pos2.fret === 0) ? -2 : 0;

  return (fretDiff * 2) + stringDiff + positionShiftPenalty + openStringBonus;
}

// 3. Algorithme de Viterbi pour le chemin optimal
export function calculateGuitarTab(midiNotes) {
  if (midiNotes.length === 0) return [];

  // Obtenir les positions possibles pour chaque note de la mélodie
  const sequencePositions = midiNotes.map(note => getPossiblePositions(note));
  
  // Si une note est hors de portée de la guitare, on l'ignore (ou on plante)
  if (sequencePositions.some(positions => positions.length === 0)) {
    throw new Error("Certaines notes sont injouables sur une guitare standard.");
  }

  let dp = [sequencePositions[0].map(() => 0)]; // Coûts initiaux à 0
  let path = [sequencePositions[0].map(() => -1)];

  // Remplissage du tableau des coûts
  for (let i = 1; i < sequencePositions.length; i++) {
    const currentPositions = sequencePositions[i];
    const prevPositions = sequencePositions[i - 1];
    
    let currentCosts = [];
    let currentPaths = [];

    for (let j = 0; j < currentPositions.length; j++) {
      let minCost = Infinity;
      let bestPrevIndex = -1;

      for (let k = 0; k < prevPositions.length; k++) {
        const cost = getTransitionCost(prevPositions[k], currentPositions[j]);
        const totalCost = dp[i - 1][k] + cost;

        if (totalCost < minCost) {
          minCost = totalCost;
          bestPrevIndex = k;
        }
      }
      currentCosts.push(minCost);
      currentPaths.push(bestPrevIndex);
    }
    dp.push(currentCosts);
    path.push(currentPaths);
  }

  // Retrouver le chemin optimal
  let optimalPath = [];
  let minFinalCost = Math.min(...dp[sequencePositions.length - 1]);
  let lastIndex = dp[sequencePositions.length - 1].indexOf(minFinalCost);

  optimalPath.unshift(sequencePositions[sequencePositions.length - 1][lastIndex]);

  for (let i = sequencePositions.length - 1; i > 0; i--) {
    lastIndex = path[i][lastIndex];
    optimalPath.unshift(sequencePositions[i - 1][lastIndex]);
  }

  return optimalPath;
}
