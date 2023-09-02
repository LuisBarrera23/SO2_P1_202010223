import { useState, useEffect } from 'react';
import './App.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { DataGrid } from '@mui/x-data-grid';

function App() {
  const [ramPorcentaje, setRam] = useState(0);
  const [ramUsada, setramUsada] = useState(0);
  const [ramLibre, setramLibre] = useState(0);
  const [ramBufCache, setramBufCache] = useState(0);
  const [ramTotal, setramTotal] = useState(0);
  const [procesos, setProcesos] = useState([]);

  const columns = [
    { field: 'pid', headerName: 'PID', width: 80 },
    { field: 'usuario', headerName: 'Usuario', width: 100 },
    { field: 'ram_usada_mb', headerName: 'RAM Usada (MB)', width: 180 },
    { field: 'ram_porcentaje', headerName: 'RAM Porcentaje', width: 180 },
    { field: 'comando', headerName: 'Comando', width: 400 },
    { field: 'oom_score', headerName: 'OOM Score', width: 150 },
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
    const ramUsada = data.ram.usada;
    const ramTotal = data.ram.total;
    setramUsada((ramUsada/(1024*1024)).toFixed(0))
    setramLibre((data.ram.libre/(1024*1024)).toFixed(0))
    setramBufCache((data.ram.bufcache/(1024*1024)).toFixed(0))
    setramTotal((ramTotal/(1024*1024)).toFixed(0))

    const porcentajeRam = ((ramUsada / ramTotal) * 100).toFixed(1);

    setRam(porcentajeRam);

    // Agregar una propiedad 'id' única a cada fila en 'data.procesos'
    const procesosConId = data.procesos.map((proceso, index) => ({
      ...proceso,
      id: index + 1, // Usar un valor único, como el índice
    }));

    setProcesos(procesosConId);
  }

  return (
    <div className="conteiner fondo" style={{ display: 'flex', alignItems: 'center'}}>
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
              <h2>Contadores de procesos</h2>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria utilizada (MB):</div>
                <div className="process-counter-value">{ramUsada}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Libre (MB):</div>
                <div className="process-counter-value">{ramLibre}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Buf/Cache (MB):</div>
                <div className="process-counter-value">{ramBufCache}</div>
              </div>
              <div className="process-counter-row">
                <div className="process-counter-label">Memoria Total (MB):</div>
                <div className="process-counter-value">{ramTotal}</div>
              </div>
            </div>

            {/* aquí quiero la tabla */}
            <div style={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={procesos}
                columns={columns}
                pageSize={2} // Puedes ajustar el tamaño de la página según tus necesidades
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
