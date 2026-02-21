// app/page.js
'use client';

import { useState } from 'react';
import { Midi } from '@tonejs/midi';
import { calculateGuitarTab } from '../lib/fingeringAlgorithm';

export default function Home() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Noms des cordes pour un affichage plus lisible
  const stringNames = ["Mi grave (E)", "La (A)", "Ré (D)", "Sol (G)", "Si (B)", "Mi aigu (e)"];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResults([]);
    
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const midiData = new Midi(e.target.result);
        const track = midiData.tracks[0]; 
        
        if (!track || track.notes.length === 0) {
          setError("Aucune note trouvée dans ce fichier MIDI.");
          setLoading(false);
          return;
        }

        const midiNotes = track.notes.map(n => n.midi);
        const noteNames = track.notes.map(n => n.name);
        
        // Calcul du chemin optimal sur le manche
        const optimalPositions = calculateGuitarTab(midiNotes);

        const finalOutput = noteNames.map((name, index) => ({
          note: name,
          string: stringNames[optimalPositions[index].string],
          fret: optimalPositions[index].fret
        }));

        setResults(finalOutput);
      } catch (err) {
        console.error(err);
        setError("Erreur : le fichier contient des notes trop graves ou trop aiguës pour une guitare standard.");
      }
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <main style={{ maxWidth: '700px', margin: '50px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Générateur de Tablature Optimale 🎸</h1>
      <p>Uploade un fichier MIDI monophonique (mélodie simple) pour trouver sur quelles cordes et quelles cases jouer pour bouger le moins possible sur le manche.</p>
      
      <div style={{ margin: '30px 0', padding: '20px', border: '2px dashed #ccc', borderRadius: '10px' }}>
        <input type="file" accept=".mid,.midi" onChange={handleFileUpload} />
      </div>

      {loading && <p>Calcul en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results.length > 0 && (
        <div style={{ textAlign: 'left', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h2>Chemin recommandé sur le manche :</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {results.map((res, i) => (
              <div key={i} style={{ border: '1px solid #ddd', padding: '15px', background: 'white', borderRadius: '5px', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '5px' }}>{res.note}</div>
                <div style={{ color: '#d97706' }}>Corde : {res.string}</div>
                <div style={{ color: '#2563eb', fontWeight: 'bold' }}>Case : {res.fret}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
