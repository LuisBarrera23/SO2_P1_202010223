package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strconv"
	"strings"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

type InfoRAM struct {
	Usada    uint64 `json:"usada"`
	Libre    uint64 `json:"libre"`
	BufCache uint64 `json:"bufcache"`
	Total    uint64 `json:"total"`
}

var usedRamProc uint64

type InfoProceso struct {
	PID           int     `json:"pid"`
	Usuario       string  `json:"usuario"`
	RAMUsadaMB    uint64  `json:"ram_usada_mb"`
	RAMPorcentaje float64 `json:"ram_porcentaje"`
	Comando       string  `json:"comando"`
	OOMScore      int     `json:"oom_score"`
}

func ObtenerInfoRAM() (InfoRAM, error) {
	out, err := exec.Command("free", "-b").Output()
	if err != nil {
		return InfoRAM{}, err
	}

	lineas := strings.Split(string(out), "\n")
	valores := strings.Fields(lineas[1])
	usada, _ := strconv.ParseUint(valores[2], 10, 64)
	libre, _ := strconv.ParseUint(valores[3], 10, 64)
	bufCache, _ := strconv.ParseUint(valores[5], 10, 64)
	total, _ := strconv.ParseUint(valores[1], 10, 64)

	return InfoRAM{Usada: usada, Libre: libre, BufCache: bufCache, Total: total}, nil
}

func ObtenerListaProcesos() ([]InfoProceso, error) {
	out, err := exec.Command("ps", "aux").Output()
	if err != nil {
		return nil, err
	}

	lineas := strings.Split(string(out), "\n")
	procesos := []InfoProceso{}
	usedRamProc = 0
	for _, linea := range lineas[1:] {
		campos := strings.Fields(linea)
		if len(campos) >= 11 {
			pid, _ := strconv.Atoi(campos[1])
			ramUsada, _ := strconv.ParseUint(campos[5], 10, 64)
			ramPorcentaje, _ := strconv.ParseFloat(campos[3], 64)
			usuario := campos[0]
			comando := campos[10]
			oomScore, err := obtenerOOMScore(campos[1])
			if err != nil {
				fmt.Println("Error al obtener el OOM score:", err)
			}
			usedRamProc += ramUsada
			procesos = append(procesos, InfoProceso{
				PID:           pid,
				Usuario:       usuario,
				RAMUsadaMB:    ramUsada / 1024, // Convertir a MB
				RAMPorcentaje: ramPorcentaje,
				Comando:       comando,
				OOMScore:      oomScore,
			})
		}
	}

	return procesos, nil
}

func ObtenerInfoSistemaHandler(w http.ResponseWriter, r *http.Request) {
	infoRAM, err := ObtenerInfoRAM()
	if err != nil {
		http.Error(w, "Error al obtener la información de RAM", http.StatusInternalServerError)
		return
	}

	listaProcesos, err := ObtenerListaProcesos()
	if err != nil {
		http.Error(w, "Error al obtener la lista de procesos", http.StatusInternalServerError)
		return
	}

	infoSistema := struct {
		RAM      InfoRAM       `json:"ram"`
		Procesos []InfoProceso `json:"procesos"`
	}{
		RAM:      infoRAM,
		Procesos: listaProcesos,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(infoSistema)
}

func obtenerOOMScore(pid string) (int, error) {
	out, err := exec.Command("cat", fmt.Sprintf("/proc/%s/oom_score", pid)).Output()
	if err != nil {
		return 0, err
	}

	oomScore, err := strconv.Atoi(strings.TrimSpace(string(out)))
	if err != nil {
		return 0, err
	}

	return oomScore, nil
}

func main() {
	enrutador := mux.NewRouter()

	enrutador.HandleFunc("/info-sistema", ObtenerInfoSistemaHandler).Methods("GET")

	origenesPermitidos := handlers.AllowedOrigins([]string{"*"})
	metodosPermitidos := handlers.AllowedMethods([]string{"GET", "OPTIONS"})
	headersPermitidos := handlers.AllowedHeaders([]string{"Content-Type"})

	fmt.Println("El servidor está ejecutándose en :5000")
	http.ListenAndServe(":5000", handlers.CORS(origenesPermitidos, metodosPermitidos, headersPermitidos)(enrutador))
}
