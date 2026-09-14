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
// Descripción/Padre explícitos. Padre puede ser el título exacto de la tarea
// raíz, o (como exporta el backlog de seguimiento de HUs) "[ID] Título" —
// ese ID se resuelve contra la columna ID propia de cada fila en el backend.
const parseFlatRows = (rawRows) =>
  rawRows
    .map((rawRow) => {
      const row = { tipo: "", titulo: "", tags: "", descripcion: "", padre: "", id: "" };

      for (const key of Object.keys(rawRow)) {
        const norm = normalize(key);
        const value = rawRow[key];

        if (norm === "id") row.id = String(value || "").trim();
        else if (norm.includes("tipo")) row.tipo = String(value || "").trim();
        else if (norm.includes("titulo")) row.titulo = String(value || "").trim();
        else if (norm.includes("tag")) row.tags = String(value || "").trim();
        else if (norm.includes("descripcion")) row.descripcion = String(value || "");
        else if (norm.includes("padre")) row.padre = String(value || "").trim();
        else if (norm.includes("estado")) row.status = mapEstado(value);
      }

      return row;
    })
    .filter((row) => row.titulo);

// "Hecha"/"Implementado" → completed, "Parcial" → inProgress, cualquier otra
// cosa (incluido "Pendiente", "Sin verificar" o vacío) → pending. Mismo
// modelo de 3 estados que ya usa el tablero, para no perder el progreso real
// ya registrado en el backlog.
const mapEstado = (estado) => {
  const norm = normalize(estado);
  if (norm === "implementado" || norm === "hecha") return "completed";
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

// ============================================================================
// Plantilla "catálogo ERP": workbook con hoja "Historias de Usuario" (Módulo/
// Épica/Rol (Como)/Historia de usuario/Prioridad/Release/Puntos/Caso de uso/
// Estado) más, opcionalmente, "Criterios de aceptación" (Dado/Cuando/Entonces
// por historia), "Módulos", "Casos de Uso" y "Roles". A diferencia de las dos
// plantillas de arriba (que se detectan y parsean hoja por hoja), esta se
// detecta a nivel de todo el workbook porque necesita cruzar varias hojas, y
// se manda a un endpoint distinto (/import-erp-catalog) que sí entiende ese
// catálogo relacional. Ver manager.controller.js para el lado del backend.
// ============================================================================

const findSheetByName = (workbook, normalizedTarget) => {
  const match = workbook.SheetNames.find((name) => normalize(name) === normalizedTarget);
  return match ? workbook.Sheets[match] : null;
};

// Encabezados en la fila 1 (Historias de Usuario, Criterios de aceptación):
// alcanza con sheet_to_json normal. Módulos/Roles/Casos de Uso traen un
// título y subtítulo antes de la fila de encabezados real (fila 4 en el
// archivo original) — se busca esa fila buscando la primera que contenga
// todas las pistas de encabezado pedidas.
const sheetRowsFromHeaderRow = (sheet, headerHints) => {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerRowIndex = raw.findIndex((row) => {
    const normalizedCells = row.map((c) => normalize(c));
    return headerHints.every((hint) => normalizedCells.some((c) => c.includes(hint)));
  });
  if (headerRowIndex === -1) return [];

  const headers = raw[headerRowIndex];
  return raw
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((c) => String(c).trim() !== ""))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i] ?? "";
      });
      return obj;
    });
};

// "Backlog"/vacío → pending, "En desarrollo" → inProgress, "Terminada" →
// completed. Vocabulario propio de este formato (distinto de mapEstado, que
// usa "Hecha"/"Parcial"/"Implementado").
const mapEstadoHu = (estado) => {
  const norm = normalize(estado);
  if (norm === "terminada") return "completed";
  if (norm === "en desarrollo") return "inProgress";
  return "pending";
};

// Cada criterio de la columna "Criterios de aceptación" de la HU viene
// concatenado como "CA1. texto...\nCA2. texto..." — se usa como respaldo
// cuando no hay hoja "Criterios de aceptación" aparte (o una HU no aparece
// en ella), aunque sin el desglose Dado/Cuando/Entonces de esa hoja.
const CA_SPLIT_REGEX = /(?=CA\d+\.)/g;
const CA_LINE_REGEX = /^(CA\d+)\.\s*([\s\S]*)$/;

const splitInlineCriteria = (text) => {
  if (!text) return [];
  return text
    .split(CA_SPLIT_REGEX)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(CA_LINE_REGEX);
      return match
        ? { code: match[1], texto_completo: match[2].trim() }
        : { code: null, texto_completo: chunk };
    });
};

const detectErpCatalogSheet = (workbook) => {
  const huSheet = findSheetByName(workbook, "historias de usuario");
  if (!huSheet) return null;

  const rawRows = XLSX.utils.sheet_to_json(huSheet, { defval: "" });
  if (rawRows.length === 0) return null;

  const headers = Object.keys(rawRows[0]).map(normalize);
  const isErpCatalog =
    headers.some((h) => h.includes("rol (como)")) ||
    (headers.includes("modulo") && headers.some((h) => h.includes("caso de uso")));

  return isErpCatalog ? huSheet : null;
};

const parseErpStoriesSheet = (sheet) => {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rawRows
    .map((rawRow) => {
      const s = {
        external_code: "",
        module_code: "",
        epic_name: "",
        title: "",
        role_name: "",
        story_text: "",
        raw_criteria: "",
        business_rules: "",
        ux_notes: "",
        priority: "",
        release_tag: "",
        story_points: "",
        dependencies_raw: "",
        use_case_code: "",
        tags: "",
        status: "pending",
      };

      for (const key of Object.keys(rawRow)) {
        const norm = normalize(key);
        const value = rawRow[key];
        const str = String(value ?? "").trim();

        if (norm === "id") s.external_code = str;
        else if (norm === "modulo") s.module_code = str;
        else if (norm === "epica") s.epic_name = str;
        else if (norm === "titulo") s.title = str;
        else if (norm.startsWith("rol")) s.role_name = str;
        else if (norm === "historia de usuario") s.story_text = String(value ?? "");
        else if (norm.includes("criterios de aceptacion")) s.raw_criteria = String(value ?? "");
        else if (norm.includes("reglas de negocio")) s.business_rules = String(value ?? "");
        else if (norm.includes("notas de ux")) s.ux_notes = String(value ?? "");
        else if (norm === "prioridad") s.priority = str;
        else if (norm === "release") s.release_tag = str;
        else if (norm === "puntos") s.story_points = str;
        else if (norm === "dependencias") s.dependencies_raw = str === "—" ? "" : str;
        else if (norm.includes("caso de uso")) s.use_case_code = str;
        else if (norm === "etiquetas") s.tags = str;
        else if (norm === "estado") s.status = mapEstadoHu(value);
      }

      return s;
    })
    .filter((s) => s.title);
};

const parseErpCriteriaSheet = (sheet) => {
  if (!sheet) return {};
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const byHuCode = {};

  rawRows.forEach((rawRow) => {
    let huCode = "";
    let code = "";
    let dado = "";
    let cuando = "";
    let entonces = "";
    let texto_completo = "";
    let resultado_prueba = "";

    for (const key of Object.keys(rawRow)) {
      const norm = normalize(key);
      const value = String(rawRow[key] ?? "").trim();

      if (norm === "id hu") huCode = value;
      else if (norm.startsWith("n") && norm.length <= 2) code = value; // "N°"
      else if (norm.startsWith("dado")) dado = value;
      else if (norm.startsWith("cuando")) cuando = value;
      else if (norm.startsWith("entonces")) entonces = value;
      else if (norm.includes("criterio completo")) texto_completo = value;
      else if (norm.includes("resultado")) resultado_prueba = value;
    }

    if (!huCode) return;
    if (!byHuCode[huCode]) byHuCode[huCode] = [];
    byHuCode[huCode].push({ code, dado, cuando, entonces, texto_completo, resultado_prueba });
  });

  return byHuCode;
};

const parseErpModulesSheet = (sheet) => {
  if (!sheet) return [];
  const rawRows = sheetRowsFromHeaderRow(sheet, ["codigo", "modulo"]);

  return rawRows
    .map((rawRow) => {
      const m = { code: "", name: "", grupo: "", descripcion: "", objetivo: "", release_base: "" };
      for (const key of Object.keys(rawRow)) {
        const norm = normalize(key);
        const value = String(rawRow[key] ?? "").trim();
        if (norm === "codigo") m.code = value;
        else if (norm === "modulo") m.name = value;
        else if (norm === "grupo") m.grupo = value;
        else if (norm.includes("release")) m.release_base = value;
        else if (norm.includes("descripcion")) m.descripcion = value;
        else if (norm.includes("objetivo")) m.objetivo = value;
      }
      return m;
    })
    .filter((m) => m.code);
};

const parseErpRolesSheet = (sheet) => {
  if (!sheet) return [];
  const rawRows = sheetRowsFromHeaderRow(sheet, ["rol", "tipo"]);

  return rawRows
    .map((rawRow) => {
      const r = { name: "", tipo: "", descripcion: "" };
      for (const key of Object.keys(rawRow)) {
        const norm = normalize(key);
        const value = String(rawRow[key] ?? "").trim();
        // startsWith en vez de includes: "N° HUs como rol principal" también
        // contiene "rol" y pisaría el nombre real con una celda vacía si se
        // matcheara por substring en cualquier posición.
        if (norm.startsWith("rol")) r.name = value;
        else if (norm === "tipo") r.tipo = value;
        else if (norm.includes("descripcion")) r.descripcion = value;
      }
      return r;
    })
    .filter((r) => r.name);
};

const parseErpUseCasesSheet = (sheet) => {
  if (!sheet) return [];
  const rawRows = sheetRowsFromHeaderRow(sheet, ["id", "caso de uso"]);

  return rawRows
    .map((rawRow) => {
      const uc = {
        code: "",
        module_code: "",
        name: "",
        actor_principal: "",
        actores_secundarios: "",
        objetivo: "",
        release_minimo: "",
      };
      for (const key of Object.keys(rawRow)) {
        const norm = normalize(key);
        const value = String(rawRow[key] ?? "").trim();
        if (norm === "id") uc.code = value;
        else if (norm === "modulo") uc.module_code = value;
        else if (norm === "caso de uso") uc.name = value;
        else if (norm.includes("actor principal")) uc.actor_principal = value;
        else if (norm.includes("actores")) uc.actores_secundarios = value;
        else if (norm.includes("objetivo")) uc.objetivo = value;
        else if (norm.includes("release")) uc.release_minimo = value;
      }
      return uc;
    })
    .filter((uc) => uc.code);
};

// Punto de entrada del modo "catálogo ERP": si el workbook trae una hoja
// "Historias de Usuario" con las columnas de este formato, arma el payload
// completo cruzando el resto de hojas que estén presentes (todas opcionales
// salvo Historias de Usuario). Devuelve null si el workbook no aplica, para
// que el caller siga con la detección hoja por hoja de las plantillas viejas.
const parseErpCatalogWorkbook = (workbook) => {
  const huSheet = detectErpCatalogSheet(workbook);
  if (!huSheet) return null;

  const stories = parseErpStoriesSheet(huSheet);
  if (stories.length === 0) return null;

  const criteriaByHuCode = parseErpCriteriaSheet(findSheetByName(workbook, "criterios de aceptacion"));
  const modules = parseErpModulesSheet(findSheetByName(workbook, "modulos"));
  const roles = parseErpRolesSheet(findSheetByName(workbook, "roles"));
  const useCases = parseErpUseCasesSheet(findSheetByName(workbook, "casos de uso"));

  stories.forEach((s) => {
    const fromSheet = criteriaByHuCode[s.external_code];
    s.criteria = fromSheet && fromSheet.length > 0 ? fromSheet : splitInlineCriteria(s.raw_criteria);
  });

  return { mode: "erp-catalog", stories, modules, roles, useCases };
};

const parseWorkbook = (arrayBuffer) => {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const erpCatalog = parseErpCatalogWorkbook(workbook);
  if (erpCatalog) return erpCatalog;

  const sheets = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const rows = detectAndParseSheet(rawRows);

    return { sheetName, rows, included: true };
  }).filter((sheet) => sheet.rows.length > 0);

  return { mode: "legacy", sheets };
};

export default function ImportTasksModal({
  isOpen,
  onClose,
  urlApi,
  projectId,
  refresh,
}) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setFileName("");
    setParsed(null);
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
        const result = parseWorkbook(e.target.result);
        setParsed(result);

        const isEmpty = result.mode === "erp-catalog" ? result.stories.length === 0 : result.sheets.length === 0;
        if (isEmpty) {
          toast.error(
            "No se encontraron filas con columnas reconocibles (ni el catálogo ERP con hoja \"Historias de Usuario\", ni la plantilla Tipo/Título/Tags/Descripción/Padre, ni la de Épica/ID HU/Historia de Usuario/Subtarea)."
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
    setParsed((prev) => ({
      ...prev,
      sheets: prev.sheets.map((sheet) =>
        sheet.sheetName === sheetName ? { ...sheet, included: !sheet.included } : sheet
      ),
    }));
  };

  const includedSheets = parsed?.mode === "legacy" ? parsed.sheets.filter((sheet) => sheet.included) : [];

  const legacyTotals = includedSheets.reduce(
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

  const erpTotals =
    parsed?.mode === "erp-catalog"
      ? {
          stories: parsed.stories.length,
          criteria: parsed.stories.reduce((sum, s) => sum + (s.criteria?.length || 0), 0),
          modules: parsed.modules.length,
          roles: parsed.roles.length,
          useCases: parsed.useCases.length,
        }
      : null;

  const canImport =
    parsed?.mode === "erp-catalog" ? parsed.stories.length > 0 : includedSheets.length > 0;

  const handleConfirmImport = () => {
    if (!canImport) return;
    setImporting(true);

    const request =
      parsed.mode === "erp-catalog"
        ? axios.post(
            `${urlApi}project/${projectId}/import-erp-catalog`,
            {
              stories: parsed.stories,
              modules: parsed.modules,
              roles: parsed.roles,
              useCases: parsed.useCases,
              created_by: getCurrentUserId(),
            },
            { headers: authHeaders() }
          )
        : axios.post(
            `${urlApi}project/${projectId}/import-tasks`,
            { rows: includedSheets.flatMap((sheet) => sheet.rows), created_by: getCurrentUserId() },
            { headers: authHeaders() }
          );

    toast.promise(
      request
        .then((response) => {
          if (response.data.status !== "ok") {
            throw new Error(response.data.message || "Error al importar");
          }

          refresh();
          handleClose();

          if (parsed.mode === "erp-catalog") {
            const { tasks, criteria, modules, roles, use_cases: useCases } = response.data.created;
            const { tasks: tasksUpdated } = response.data.updated || {};
            return `Creadas ${tasks} historias nuevas (+${tasksUpdated || 0} actualizadas) con ${criteria} criterios de aceptación, ${modules} módulos, ${roles} roles y ${useCases} casos de uso.`;
          }

          const { tasks, subtasks, checklist_items } = response.data.created;
          const { tasks: tasksUpdated, subtasks: subtasksUpdated } = response.data.updated || {};
          return `Creadas ${tasks} tareas y ${subtasks} subtareas (+${checklist_items} items de checklist). Actualizado el estado de ${tasksUpdated || 0} tareas y ${subtasksUpdated || 0} subtareas ya existentes.`;
        })
        .finally(() => setImporting(false)),
      {
        loading: "Importando...",
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
          Se reconocen tres formatos: un <strong>catálogo ERP</strong> (hoja
          &ldquo;Historias de Usuario&rdquo; con Módulo/Épica/Rol/Prioridad/Release/Caso de
          uso, más opcionalmente Criterios de aceptación/Módulos/Casos de
          Uso/Roles); una plantilla plana con{" "}
          <strong>Tipo/Título/Tags/Descripción/Padre</strong>; o un backlog de
          HUs con <strong>Épica/ID HU/Historia de Usuario/Subtarea</strong>{" "}
          agrupadas por fila. Las tareas se crean sin colaborador asignado (lo
          asignas después manualmente).
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

        {parsed?.mode === "erp-catalog" && (
          <div className="text-sm bg-muted/50 rounded-md p-3 space-y-1">
            <p>
              Catálogo ERP detectado: <strong>{erpTotals.stories}</strong>{" "}
              historias de usuario con <strong>{erpTotals.criteria}</strong>{" "}
              criterios de aceptación, <strong>{erpTotals.modules}</strong>{" "}
              módulos, <strong>{erpTotals.roles}</strong> roles y{" "}
              <strong>{erpTotals.useCases}</strong> casos de uso.
            </p>
            <p className="text-xs text-muted-foreground">
              Las historias que ya existan en este proyecto (mismo código,
              ej. HU-ADM-001) se actualizan en vez de duplicarse; sus
              criterios de aceptación se reemplazan por los de la hoja.
            </p>
          </div>
        )}

        {parsed?.mode === "legacy" && parsed.sheets.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-52 overflow-y-auto border rounded-md p-2">
              {parsed.sheets.map((sheet) => (
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
                Se procesarán <strong>{legacyTotals.tasks}</strong> tareas y{" "}
                <strong>{legacyTotals.subtasks}</strong> subtareas (con aprox.{" "}
                <strong>{legacyTotals.checklist}</strong> items de checklist
                para las nuevas). Las que ya existan en este proyecto (mismo
                título) se actualizan de estado en vez de duplicarse.
              </p>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!canImport || importing}
          onClick={handleConfirmImport}
        >
          {importing ? "Importando..." : "Confirmar importación"}
        </Button>
      </CardContent>
    </Modal>
  );
}
