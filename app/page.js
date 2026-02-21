// app/page.js
'use client';
import { useState } from 'react';
import { Midi } from '@tonejs/midi';
import { calculateGuitarFingering } from '../lib/fingeringAlgorithm';

export default function Home() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const stringNames = ["Mi grave", "La", "Ré", "Sol", "Si", "Mi aigu"];
  const fingerNames = ["À vide", "Index (1)", "Majeur (2)", "Annulaire (3)", "Auriculaire (4)"];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const midiData = new Midi(e.target.result);
        const notes = midiData.tracks[0].notes;
        const res = calculateGuitarFingering(notes.map(n => n.midi));
        
        setResults(res.map((step, i) => ({
          note: notes[i].name,
          ...step
        })));
      } catch (err) {
        alert("Erreur de calcul. Vérifie ton fichier MIDI.");
      }
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'system-ui', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#1a202c' }}>Optimiseur de Doigtés Guitare 🎸</h1>
        <p style={{ color: '#4a5568' }}>Trouve le chemin le plus ergonomique pour ta main gauche.</p>
        
        <input type="file" onChange={handleFileUpload} style={{ margin: '20px 0', padding: '10px' }} />

        {loading && <p>Analyse du manche en cours...</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '30px' }}>
          {results.map((r, i) => (
            <div key={i} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: r.fret === 0 ? '#fffaf0' : 'white' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{r.note}</div>
              <div style={{ fontSize: '0.9rem', color: '#718096' }}>{stringNames[r.string]}</div>
              <div style={{ margin: '8px 0', fontWeight: 'bold', color: '#2b6cb0' }}>Case {r.fret}</div>
              <div style={{ fontSize: '0.85rem', color: '#2f855a', fontWeight: '600' }}>
                ✋ {fingerNames[r.finger]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
