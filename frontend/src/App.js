import { useState, useEffect } from 'react';
import './App.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { DataGrid } from '@mui/x-data-grid';

function App() {
  const [ramPorcentaje, setRam] = useState(0);

  const [ramTotal, setramTotal] = useState(0);
  const [ramUsada, setramUsada] = useState(0);
  const [ramActiva, setramActiva] = useState(0);
  const [ramInactiva, setramInactiva] = useState(0);
  const [ramLibre, setramLibre] = useState(0);
  const [ramBufCache, setramBufCache] = useState(0);

  const [procesos, setProcesos] = useState([]);

  const columns = [
    { field: 'pid', headerName: 'PID', width: 80 },
    { field: 'usuario', headerName: 'Usuario', width: 100 },
    { field: 'oom_score', headerName: 'OOM Score', width: 150 },
    { field: 'comando', headerName: 'Comando', width: 400 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      logs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function logs() {
    const response = await fetch('http://localhost:5000/info-sistema');
    const data = await response.json();

    setramTotal(data.ram.total)
    setramUsada(data.ram.usada)
    setramActiva(data.ram.activa)
    setramInactiva(data.ram.inactiva)
    setramLibre(data.ram.libre)
    setramBufCache(data.ram.bufers)


    const ramUsada = data.ram.usada;
    const ramTotal = data.ram.total;
    const porcentajeRam = ((ramUsada / ramTotal) * 100).toFixed(1);
    setRam(porcentajeRam);

    const procesosConId = data.procesos.map((proceso, index) => ({
      ...proceso,
      id: index + 1,
    }));

    setProcesos(procesosConId);
  }

  return (
    <div className="conteiner fondo" style={{ display: 'flex', alignItems: 'center' }}>
      <div className="fondo2">
        <div className="App-titulo">
          <label>Monitoreo de recursos</label>
        </div>

        <header className="App-header">
          <div className="form-group align-items-center" style={{ display: 'flex' }}>
            <label style={{ marginLeft: '10px', marginRight: '10px' }}>RAM</label>
            <div style={{ width: 300, height: 200 }}>
              <CircularProgressbar value={ramPorcentaje} text={`${ramPorcentaje}%`} />
            </div>
          </div>
          <div className="fondo3">
            <div className="process-counter">
              <h2>Detalles Memoria RAM</h2>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Total (MB):</div>
                <div className="process-counter-value">{ramTotal}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Usada (MB):</div>
                <div className="process-counter-value">{ramUsada}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Activa (MB):</div>
                <div className="process-counter-value">{ramActiva}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Inactiva (MB):</div>
                <div className="process-counter-value">{ramInactiva}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Libre (MB):</div>
                <div className="process-counter-value">{ramLibre}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Buffer (MB):</div>
                <div className="process-counter-value">{ramBufCache}</div>
              </div>
            </div>

            <div style={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={procesos}
                columns={columns}
                pageSize={2}
                autoHeights
              />
            </div>
          </div>
        </header>
      </div>
    </div>
  );
}

export default App;
