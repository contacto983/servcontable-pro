import { useEffect, useState } from "react";

import TrabajadoresRemuneraciones from "./remuneraciones/TrabajadoresRemuneraciones";
import LiquidacionesRemuneraciones from "./remuneraciones/LiquidacionesRemuneraciones";
import ConfiguracionRemuneraciones from "./remuneraciones/ConfiguracionRemuneraciones";
import LibroRemuneraciones from "./remuneraciones/LibroRemuneraciones";
import PreviredRemuneraciones from "./remuneraciones/PreviredRemuneraciones";
import PagosRemuneraciones from "./remuneraciones/PagosRemuneraciones";
import LiquidacionPDF from "./remuneraciones/LiquidacionPDF";
import HaberesDescuentosRemuneraciones from "./remuneraciones/HaberesDescuentosRemuneraciones";
import ImpuestoUnicoRemuneraciones from "./remuneraciones/ImpuestoUnicoRemuneraciones";
import DashboardRemuneraciones from "./remuneraciones/DashboardRemuneraciones";
import FiniquitosRemuneraciones from "./remuneraciones/FiniquitosRemuneraciones";
import VacacionesAusenciasRemuneraciones from "./remuneraciones/VacacionesAusenciasRemuneraciones";
import SaldoVacacionesRemuneraciones from "./remuneraciones/SaldoVacacionesRemuneraciones";

export default function Remuneraciones({ vistaInicial = "panel" }) {
  const [submodulo, setSubmodulo] = useState(vistaInicial);

  useEffect(() => {
    setSubmodulo(vistaInicial);
  }, [vistaInicial]);

  return (
    <div>
      {submodulo === "panel" && (
        <DashboardRemuneraciones irSubmodulo={setSubmodulo} />
      )}

      {submodulo === "trabajadores" && <TrabajadoresRemuneraciones />}
      {submodulo === "haberesDescuentos" && (
        <HaberesDescuentosRemuneraciones />
      )}
      {submodulo === "impuestoUnico" && <ImpuestoUnicoRemuneraciones />}
      {submodulo === "liquidaciones" && <LiquidacionesRemuneraciones />}
      {submodulo === "liquidacionPDF" && <LiquidacionPDF />}
      {submodulo === "libro" && <LibroRemuneraciones />}
      {submodulo === "pagos" && <PagosRemuneraciones />}
      {submodulo === "previred" && <PreviredRemuneraciones />}
      {submodulo === "configuracion" && <ConfiguracionRemuneraciones />}
      {submodulo === "finiquitos" && <FiniquitosRemuneraciones />}
      {submodulo === "vacacionesAusencias" && <VacacionesAusenciasRemuneraciones />}
      {submodulo === "saldoVacaciones" && <SaldoVacacionesRemuneraciones />}
    </div>
  );
}

