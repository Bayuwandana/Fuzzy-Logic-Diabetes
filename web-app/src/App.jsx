import { useState, useEffect } from 'react';
import { predictDiabetes } from './utils/fuzzyLogic';
import './index.css';

function App() {
  const [age, setAge] = useState(45);
  const [bmi, setBmi] = useState(24.5);
  const [hba1c, setHba1c] = useState(5.8);
  const [glucose, setGlucose] = useState(120);
  const [hypertension, setHypertension] = useState(0);
  const [heartDisease, setHeartDisease] = useState(0);

  const [result, setResult] = useState({ sugenoScore: 0, mamdaniScore: 0, classification: 'Low Risk' });

  useEffect(() => {
    const res = predictDiabetes(age, bmi, hba1c, glucose, hypertension, heartDisease);
    setResult(res);
  }, [age, bmi, hba1c, glucose, hypertension, heartDisease]);

  const getStatusColor = (classification) => {
    if (classification === 'Low Risk') return 'var(--risk-low)';
    if (classification === 'Medium Risk') return 'var(--risk-med)';
    return 'var(--risk-high)';
  };

  const statusClass = result.classification.split(' ')[0].toLowerCase();
  
  // Convert score (0-1) to degrees for gauge (-90 to 90)
  const rotation = -90 + (result.mamdaniScore * 180);

  return (
    <div className="app-container">
      <header>
        <h1>Diabetes Risk Predictor</h1>
        <p>Real-time fuzzy logic inference system (Mamdani & Sugeno)</p>
      </header>

      <div className="dashboard-layout">
        {/* Left Panel: Inputs */}
        <div className="glass-panel">
          <h2 className="panel-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Patient Data
          </h2>

          <div className="input-group">
            <div className="input-header">
              <span className="input-label">Age</span>
              <span className="input-value">{age} years</span>
            </div>
            <input type="range" min="0" max="100" value={age} onChange={(e) => setAge(Number(e.target.value))} />
          </div>

          <div className="input-group">
            <div className="input-header">
              <span className="input-label">BMI</span>
              <span className="input-value">{bmi.toFixed(1)} kg/m²</span>
            </div>
            <input type="range" min="10" max="50" step="0.1" value={bmi} onChange={(e) => setBmi(Number(e.target.value))} />
          </div>

          <div className="input-group">
            <div className="input-header">
              <span className="input-label">HbA1c Level</span>
              <span className="input-value">{hba1c.toFixed(1)}%</span>
            </div>
            <input type="range" min="3" max="15" step="0.1" value={hba1c} onChange={(e) => setHba1c(Number(e.target.value))} />
          </div>

          <div className="input-group">
            <div className="input-header">
              <span className="input-label">Blood Glucose</span>
              <span className="input-value">{glucose} mg/dL</span>
            </div>
            <input type="range" min="70" max="350" value={glucose} onChange={(e) => setGlucose(Number(e.target.value))} />
          </div>

          <div className="input-group" style={{ marginTop: '2rem' }}>
            <div className="input-header" style={{ marginBottom: '1rem' }}>
              <span className="input-label">Hypertension</span>
            </div>
            <div className="toggle-container">
              <button 
                className={`toggle-btn ${hypertension === 0 ? 'active' : ''}`}
                onClick={() => setHypertension(0)}
              >No</button>
              <button 
                className={`toggle-btn ${hypertension === 1 ? 'active' : ''}`}
                onClick={() => setHypertension(1)}
              >Yes</button>
            </div>
          </div>

          <div className="input-group">
            <div className="input-header" style={{ marginBottom: '1rem' }}>
              <span className="input-label">Heart Disease</span>
            </div>
            <div className="toggle-container">
              <button 
                className={`toggle-btn ${heartDisease === 0 ? 'active' : ''}`}
                onClick={() => setHeartDisease(0)}
              >No</button>
              <button 
                className={`toggle-btn ${heartDisease === 1 ? 'active' : ''}`}
                onClick={() => setHeartDisease(1)}
              >Yes</button>
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 className="panel-title" style={{ justifyContent: 'center' }}>Risk Assessment</h2>
          
          <div className="result-display">
            <div className="gauge-container">
              <div className="gauge-bg"></div>
              <div 
                className="gauge-fill" 
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  borderColor: getStatusColor(result.classification)
                }}
              ></div>
              <div className="gauge-center">
                <span className="gauge-score">{(result.mamdaniScore * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className={`status-badge ${statusClass}`}>
              {result.classification}
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              Based on Mamdani Inference Model
            </p>
          </div>

          <div className="comparison-section">
            <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>Model Comparison</h3>
            <div className="comparison-grid">
              <div className="comparison-card">
                <h4>Mamdani Score</h4>
                <div className="score" style={{ color: 'var(--primary)' }}>
                  {result.mamdaniScore.toFixed(3)}
                </div>
              </div>
              <div className="comparison-card">
                <h4>Sugeno Score</h4>
                <div className="score" style={{ color: '#8b5cf6' }}>
                  {result.sugenoScore.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
