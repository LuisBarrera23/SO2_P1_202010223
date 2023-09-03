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
	Total    uint64 `json:"total"`
	Usada    uint64 `json:"usada"`
	Activa   uint64 `json:"activa"`
	Inactiva uint64 `json:"inactiva"`
	Libre    uint64 `json:"libre"`
	Bufers   uint64 `json:"bufers"`
}

type InfoProceso struct {
	PID      int    `json:"pid"`
	Usuario  string `json:"usuario"`
	Comando  string `json:"comando"`
	OOMScore int    `json:"oom_score"`
}

func ObtenerInfoRAM() (InfoRAM, error) {
	out, err := exec.Command("vmstat", "-s", "-S", "M").Output()
	if err != nil {
		return InfoRAM{}, err
	}

	lines := strings.Split(string(out), "\n")
	info := InfoRAM{}

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		value, _ := strconv.ParseUint(fields[0], 10, 64)
		switch {
		case strings.Contains(line, "M memoria total"):
			info.Total = value
		case strings.Contains(line, "M memoria usada"):
			info.Usada = value
		case strings.Contains(line, "M memoria activa"):
			info.Activa = value
		case strings.Contains(line, "M memoria inactiva"):
			info.Inactiva = value
		case strings.Contains(line, "M memoria libre"):
			info.Libre = value
		case strings.Contains(line, "M memoria de búfer"):
			info.Bufers = value
		}
	}

	return info, nil
}

func ObtenerListaProcesos() ([]InfoProceso, error) {
	out, err := exec.Command("ps", "aux").Output()
	if err != nil {
		return nil, err
	}

	lineas := strings.Split(string(out), "\n")
	procesos := []InfoProceso{}
	for _, linea := range lineas[1:] {
		campos := strings.Fields(linea)
		if len(campos) >= 11 {
			pid, _ := strconv.Atoi(campos[1])
			usuario := campos[0]
			comando := campos[10]
			oomScore, err := obtenerOOMScore(campos[1])
			if err != nil {
				fmt.Println("Error al obtener el OOM score:", err)
			}
			procesos = append(procesos, InfoProceso{
				PID:      pid,
				Usuario:  usuario,
				Comando:  comando,
				OOMScore: oomScore,
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
