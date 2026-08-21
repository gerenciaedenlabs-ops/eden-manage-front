/* eslint-disable react/prop-types */
import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Upload, FileSpreadsheet } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { authHeaders, getCurrentUserId } from "@components/project-detail/task-constants.js";

// Quita acentos y normaliza para poder emparejar encabezados de columna
// sin depender de tildes/mayúsculas exactas ("Título" vs "titulo", etc).
const DIACRITICS_REGEX = /[̀-ͯ]/g;

const normalize = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim();

// Réplica ligera (solo para la vista previa) de la extracción de checklist
// que hace el backend a partir del bloque "**Criterios de Aceptación:**".
const countChecklistItems = (description) => {
  const marker = "**Criterios de Aceptación:**";
  const idx = (description || "").indexOf(marker);
  if (idx === -1) return 0;

  const after = description.slice(idx + marker.length).split("\n");
  let count = 0;

  for (const rawLine of after) {
    const line = rawLine.trim();
    if (line.startsWith("- ")) count += 1;
    else if (line !== "") break;
  }

  return count;
};

// Plantilla "plana": una fila por tarea/subtarea, con Tipo/Título/Tags/
// Descripción/Padre explícitos (Padre = título exacto de la tarea raíz).
const parseFlatRows = (rawRows) =>
  rawRows
    .map((rawRow) => {
      const row = { tipo: "", titulo: "", tags: "", descripcion: "", padre: "" };

      for (const key of Object.keys(rawRow)) {
        const norm = normalize(key);
        const value = rawRow[key];

        if (norm.includes("tipo")) row.tipo = String(value || "").trim();
        else if (norm.includes("titulo")) row.titulo = String(value || "").trim();
        else if (norm.includes("tag")) row.tags = String(value || "").trim();
        else if (norm.includes("descripcion")) row.descripcion = String(value || "");
        else if (norm.includes("padre")) row.padre = String(value || "").trim();
      }

      return row;
    })
    .filter((row) => row.titulo);

// "Implementado" → completed, "Parcial" → inProgress, cualquier otra cosa
// (incluido "Pendiente" o vacío) → pending. Mismo modelo de 3 estados que ya
// usa el tablero, para no perder el progreso real ya registrado en el backlog.
const mapEstado = (estado) => {
  const norm = normalize(estado);
  if (norm === "implementado") return "completed";
  if (norm === "parcial") return "inProgress";
  return "pending";
};

// Plantilla "agrupada": una fila por HU (Épica/ID HU/Historia de Usuario/
// Estado HU) seguida de N filas de Subtarea que le pertenecen (con las
// primeras columnas en blanco, como exporta un backlog tipo Notion/Excel
// con celdas combinadas). No hay columna "Padre" explícita: el padre de
// cada subtarea es la última HU vista.
const parseGroupedRows = (rawRows) => {
  const rows = [];
  let currentTitle = null;

  for (const rawRow of rawRows) {
    let epica = "";
    let idHu = "";
    let historia = "";
    let estadoHu = "";
    let subtarea = "";
    let estadoSub = "";
    let notas = "";

    for (const key of Object.keys(rawRow)) {
      const norm = normalize(key);
      const value = String(rawRow[key] || "").trim();

      if (norm.includes("epica")) epica = value;
      else if (norm.includes("historia")) historia = value;
      else if (norm.includes("estado") && norm.includes("subtarea")) estadoSub = value;
      else if (norm.includes("estado")) estadoHu = value;
      else if (norm.includes("subtarea")) subtarea = value;
      else if (norm.includes("notas")) notas = value;
      else if (norm.includes("id") && norm.includes("hu")) idHu = value;
    }

    if (historia) {
      currentTitle = idHu ? `${idHu}: ${historia}` : historia;
      rows.push({
        tipo: "US",
        titulo: currentTitle,
        tags: epica,
        descripcion: notas,
        padre: "",
        status: mapEstado(estadoHu),
      });
    }

    if (subtarea && currentTitle) {
      rows.push({
        tipo: "Subtask",
        titulo: subtarea,
        tags: "",
        descripcion: "",
        padre: currentTitle,
        status: mapEstado(estadoSub),
      });
    }
  }

  return rows;
};

// Detecta qué plantilla trae la hoja mirando sus encabezados, y la parsea
// con el parser correspondiente. "Historia de Usuario" es la señal más
// distintiva de la plantilla agrupada (no aparece en la plana).
const detectAndParseSheet = (rawRows) => {
  if (rawRows.length === 0) return [];

  const headers = Object.keys(rawRows[0]).map(normalize);
  // Frase completa (singular) para no confundir el encabezado real "Historia
  // de Usuario" con una celda de título suelta como "... Backlog de HISTORIAS
  // de Usuario" (plural, hojas de resumen sin tabla real) — sheet_to_json
  // toma esa celda como si fuera el único encabezado de la hoja.
  const isGrouped = headers.some((h) => h.includes("historia de usuario"));
  const isFlat = headers.some((h) => h.includes("titulo"));

  if (isGrouped) return parseGroupedRows(rawRows);
  if (isFlat) return parseFlatRows(rawRows);
  return [];
};

const parseWorkbook = (arrayBuffer) => {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const rows = detectAndParseSheet(rawRows);

    return { sheetName, rows, included: true };
  }).filter((sheet) => sheet.rows.length > 0);
};

export default function ImportTasksModal({
  isOpen,
  onClose,
  urlApi,
  projectId,
  refresh,
}) {
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState([]);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setFileName("");
    setSheets([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseWorkbook(e.target.result);
        setSheets(parsed);
        if (parsed.length === 0) {
          toast.error(
            "No se encontraron filas con columnas reconocibles (ni la plantilla Tipo/Título/Tags/Descripción/Padre, ni la de Épica/ID HU/Historia de Usuario/Subtarea)."
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("No se pudo leer el archivo. ¿Es un .xlsx válido?");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleSheet = (sheetName) => {
    setSheets((prev) =>
      prev.map((sheet) =>
        sheet.sheetName === sheetName
          ? { ...sheet, included: !sheet.included }
          : sheet
      )
    );
  };

  const includedSheets = sheets.filter((sheet) => sheet.included);
  const totals = includedSheets.reduce(
    (acc, sheet) => {
      for (const row of sheet.rows) {
        if (row.tipo === "Subtask") acc.subtasks += 1;
        else acc.tasks += 1;
        acc.checklist += countChecklistItems(row.descripcion);
      }
      return acc;
    },
    { tasks: 0, subtasks: 0, checklist: 0 }
  );

  const handleConfirmImport = () => {
    const rows = includedSheets.flatMap((sheet) => sheet.rows);
    if (rows.length === 0) return;

    setImporting(true);

    toast.promise(
      axios
        .post(
          `${urlApi}project/${projectId}/import-tasks`,
          { rows, created_by: getCurrentUserId() },
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            const { tasks, subtasks, checklist_items } = response.data.created;
            refresh();
            handleClose();
            return `Importadas ${tasks} tareas, ${subtasks} subtareas y ${checklist_items} items de checklist`;
          } else {
            throw new Error(response.data.message || "Error al importar");
          }
        })
        .finally(() => setImporting(false)),
      {
        loading: "Importando tareas...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de importación",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Importar tareas desde Excel"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(600px, 90vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: "8px",
          padding: "40px",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <CardHeader>
        <CardTitle>Importar tareas desde Excel</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Se reconocen dos plantillas: una plana con columnas{" "}
          <strong>Tipo</strong> (US/Task o Subtask), <strong>Título</strong>,{" "}
          <strong>Tags</strong>, <strong>Descripción</strong> y{" "}
          <strong>Padre (si es subtask)</strong>; o un backlog de HUs con{" "}
          <strong>Épica</strong>, <strong>ID HU</strong>,{" "}
          <strong>Historia de Usuario</strong>, <strong>Estado HU</strong>,{" "}
          <strong>Subtarea</strong> y <strong>Estado subtarea</strong>{" "}
          agrupadas por fila. Las tareas se crean dentro de este proyecto, sin
          colaborador asignado (lo asignas después manualmente).
        </p>

        <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50">
          <Upload className="w-4 h-4" />
          <span className="text-sm">
            {fileName || "Seleccionar archivo .xlsx"}
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {sheets.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-52 overflow-y-auto border rounded-md p-2">
              {sheets.map((sheet) => (
                <label
                  key={sheet.sheetName}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={sheet.included}
                    onCheckedChange={() => toggleSheet(sheet.sheetName)}
                  />
                  <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {sheet.sheetName} ({sheet.rows.length} filas)
                  </span>
                </label>
              ))}
            </div>

            <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
              <p>
                Se crearán <strong>{totals.tasks}</strong> tareas,{" "}
                <strong>{totals.subtasks}</strong> subtareas y aprox.{" "}
                <strong>{totals.checklist}</strong> items de checklist.
              </p>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          disabled={includedSheets.length === 0 || importing}
          onClick={handleConfirmImport}
        >
          {importing ? "Importando..." : "Confirmar importación"}
        </Button>
      </CardContent>
    </Modal>
  );
}
