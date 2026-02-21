// lib/fingeringAlgorithm.js

const TUNING = [40, 45, 50, 55, 59, 64]; 
const MAX_FRET = 22;

function getPossibleStates(midiNote) {
  let states = [];
  for (let string = 0; string < TUNING.length; string++) {
    const fret = midiNote - TUNING[string];
    if (fret >= 0 && fret <= MAX_FRET) {
      if (fret === 0) {
        states.push({ string, fret, finger: 0 }); // Corde à vide = aucun doigt
      } else {
        for (let finger = 1; finger <= 4; finger++) {
          states.push({ string, fret, finger });
        }
      }
    }
  }
  return states;
}

function getTransitionCost(s1, s2) {
  let cost = 0;

  // 1. Coût de changement de corde
  cost += Math.abs(s2.string - s1.string);

  // 2. Gestion de la main gauche (La "Position")
  // On estime la position de la main par : Case - Doigt + 1
  // Exemple : Case 7 avec doigt 3 (annulaire) -> Position 5
  const pos1 = s1.fret === 0 ? null : s1.fret - s1.finger + 1;
  const pos2 = s2.fret === 0 ? null : s2.fret - s2.finger + 1;

  if (pos1 !== null && pos2 !== null) {
    if (pos1 !== pos2) {
      cost += Math.abs(pos2 - pos1) * 10; // Grosse pénalité si la main doit glisser (démanché)
    }
  }

  // 3. Ergonomie des doigts
  if (s1.fret !== 0 && s2.fret !== 0) {
    const fretDiff = s2.fret - s1.fret;
    const fingerDiff = s2.finger - s1.finger;

    // Erreur fatale : Doigt 1 sur case 8 et Doigt 4 sur case 5 (doigts croisés à l'envers)
    if ((fretDiff > 0 && fingerDiff < 0) || (fretDiff < 0 && fingerDiff > 0)) {
      cost += 100;
    }
    
    // Écartement naturel : si l'écart de case est différent de l'écart de doigt
    cost += Math.abs(fretDiff - fingerDiff) * 2;
  }

  // 4. Bonus pour cordes à vide (facilité)
  if (s2.fret === 0) cost -= 2;

  return cost;
}

export function calculateGuitarFingering(midiNotes) {
  if (midiNotes.length === 0) return [];

  const sequenceStates = midiNotes.map(note => getPossibleStates(note));
  
  let dp = [sequenceStates[0].map(() => 0)];
  let path = [sequenceStates[0].map(() => -1)];

  for (let i = 1; i < sequenceStates.length; i++) {
    const currentStates = sequenceStates[i];
    const prevStates = sequenceStates[i - 1];
    let currentCosts = [];
    let currentPaths = [];

    for (let j = 0; j < currentStates.length; j++) {
      let minCost = Infinity;
      let bestPrevIndex = -1;

      for (let k = 0; k < prevStates.length; k++) {
        const cost = getTransitionCost(prevStates[k], currentStates[j]);
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

  let optimalPath = [];
  let lastIndex = dp[midiNotes.length - 1].indexOf(Math.min(...dp[midiNotes.length - 1]));

  for (let i = midiNotes.length - 1; i >= 0; i--) {
    optimalPath.unshift(sequenceStates[i][lastIndex]);
    lastIndex = path[i][lastIndex];
  }

  return optimalPath;
}
