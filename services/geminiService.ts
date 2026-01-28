
import { Vehicle, Driver } from "../types";

export const analyzeFleetRisk = async (vehicles: Vehicle[], drivers: Driver[]) => {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicles, drivers }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("AI Analysis Fetch Error:", error);
    return {
      risks: [{ title: "Error de Conexión", description: "No se pudo conectar con el servidor de análisis." }],
      recommendations: ["Verifique su conexión", "Intente de nuevo"]
    };
  }
};
