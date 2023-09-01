import { useState, useEffect } from 'react';
import './App.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';



function App() {
  const [ramPorcentaje, setRam] = useState(0);




  useEffect(() => {
    const interval = setInterval(() => {
      logs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function logs() {
    const response = await fetch('http://localhost:5000/info-sistema');
    const data = await response.json();
  
    // Obtén la cantidad de RAM usada y total desde los datos
    const ramUsada = data.ram.usada;
    const ramTotal = data.ram.total;
  
    // Calcula el porcentaje de RAM ocupada
    const porcentajeRam = ((ramUsada / ramTotal) * 100).toFixed(1);
  
    // Almacena el porcentaje en ramPorcentaje
    setRam(porcentajeRam);
  }





  return (

    <div className="conteiner fondo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="fondo2">
        <div className="App-titulo">
          <label  >Monitoreo de recursos</label>
        </div>


        <header className="App-header">

          <div className="form-group align-items-center" style={{ display: 'flex' }}>
            <label style={{ marginLeft: '10px', marginRight: '10px' }}>RAM</label>
            <div style={{ width: 300, height: 200 }}>
              <CircularProgressbar value={ramPorcentaje} text={`${ramPorcentaje}%`} />
            </div>
          </div>



        </header>
      </div>


    </div>
  );
}

export default App;