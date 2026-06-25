import React, { useState, useMemo } from "react";
import { 
  Search, Filter, Plus, FileDown, FileUp, Sparkles, User, 
  Building, Mail, Phone, DollarSign, Tag, Calendar, MoreVertical, 
  Trash2, FileText, CheckCircle, ChevronRight, Download, Upload,
  Clock, MapPin, AlertCircle, Bot, Users, Megaphone, CheckSquare, ListFilter, Play
} from "lucide-react";
import { CRMClient } from "../types";
import * as XLSX from "xlsx";

interface CRMClientListProps {
  clients: CRMClient[];
  onAddClientClick: () => void;
  onClientClick: (client: CRMClient) => void;
  onImportExcel: (importedClients: Partial<CRMClient>[]) => void;
  onEditClientClick: (client: CRMClient) => void;
  onDeleteClient: (clientId: string) => void;
  onClearDatabase?: () => void;
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
}

const parseEventDateForSort = (dateStr: string): number => {
  if (!dateStr) return 9999999999999; // Empty dates go to the end
  try {
    const parts = dateStr.split(/[/\-]/);
    if (parts.length === 3) {
      let month = parseInt(parts[0], 10);
      let day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.getTime();
      }
    }
    const fallbackDate = new Date(dateStr);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.getTime();
    }
  } catch (e) {
    // fallback
  }
  return 9999999999999;
};

export default function CRMClientList({ 
  clients, 
  onAddClientClick, 
  onClientClick, 
  onImportExcel,
  onEditClientClick,
  onDeleteClient,
  onClearDatabase,
  onShowToast
}: CRMClientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<"name" | "value" | "createdAt" | "eventDate">("eventDate");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("asc");
  
  // Custom Category State (Event Tracker vs Clientes Pendientes vs Planner vs Marketing)
  const [activeCategory, setActiveCategory] = useState<"event_tracker" | "clientes_pendientes" | "daily_event_planner" | "event_marketing">("event_tracker");
  
  // Past vs Future Filter (Specifically for Event Tracker)
  const [eventTimeFilter, setEventTimeFilter] = useState<"todos" | "futuros" | "pasados">("todos");

  // Helper to check if event date is in the past
  const isEventPast = (client: CRMClient): boolean => {
    if (!client.eventDate) return false;
    try {
      // Standard MM/DD/YYYY parse
      const parts = client.eventDate.split(/[/\-]/);
      if (parts.length === 3) {
        let month = parseInt(parts[0], 10);
        let day = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000; // handle 2-digit years
        
        const eventDateObj = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // compare date only
        
        return eventDateObj < today;
      }
    } catch (e) {
      // fallback
    }
    return false;
  };

  // Filter & Search Logic
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        // 1. Filter by category
        const clientCategory = client.category || "event_tracker";
        if (clientCategory !== activeCategory) return false;

        // 2. Search query matches
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          (client.name || "").toLowerCase().includes(query) ||
          (client.company || "").toLowerCase().includes(query) ||
          (client.email || "").toLowerCase().includes(query) ||
          (client.phone || "").includes(query) ||
          (client.address || "").toLowerCase().includes(query) ||
          (client.location || "").toLowerCase().includes(query) ||
          (client.eventType || "").toLowerCase().includes(query) ||
          (client.helper || "").toLowerCase().includes(query);

        if (!matchesSearch) return false;

        // 3. Stage filter
        if (stageFilter !== "Todos") {
          if (client.stage !== stageFilter) return false;
        }

        // 4. Past vs Future Event automatic filter (Only for event tracker)
        if (activeCategory === "event_tracker" && eventTimeFilter !== "todos") {
          const past = isEventPast(client);
          if (eventTimeFilter === "pasados" && !past) return false;
          if (eventTimeFilter === "futuros" && past) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "eventDate") {
          const timeA = parseEventDateForSort(a.eventDate || "");
          const timeB = parseEventDateForSort(b.eventDate || "");
          if (timeA < timeB) return sortOrder === "asc" ? -1 : 1;
          if (timeA > timeB) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }

        let valueA: any = a[sortBy];
        let valueB: any = b[sortBy];

        if (sortBy === "value") {
          valueA = Number(valueA) || 0;
          valueB = Number(valueB) || 0;
        } else {
          valueA = String(valueA || "").toLowerCase();
          valueB = String(valueB || "").toLowerCase();
        }

        if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
        if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [clients, searchQuery, stageFilter, sortBy, sortOrder, activeCategory, eventTimeFilter]);

  // Grouped Planner Items (by eventDate)
  const groupedPlannerItems = useMemo(() => {
    if (activeCategory !== "daily_event_planner") return {};
    const groups: { [date: string]: CRMClient[] } = {};
    
    // Sort clients by date first
    const sorted = [...filteredClients].sort((a, b) => {
      const dateA = a.eventDate || "";
      const dateB = b.eventDate || "";
      return dateA.localeCompare(dateB);
    });

    sorted.forEach(c => {
      const d = c.eventDate || "Sin Fecha Definida";
      if (!groups[d]) groups[d] = [];
      groups[d].push(c);
    });
    return groups;
  }, [filteredClients, activeCategory]);

  // Stage Badge color helper
  const getStageBadgeClass = (stage: CRMClient["stage"]) => {
    switch (stage) {
      case "Prospecto":
        return "bg-sky-50 text-sky-700 border-sky-150";
      case "Contactado":
        return "bg-indigo-50 text-indigo-700 border-indigo-150";
      case "Negociación":
        return "bg-amber-50 text-amber-700 border-amber-150";
      case "Ganado":
        return "bg-emerald-50 text-emerald-700 border-emerald-150";
      case "Perdido":
        return "bg-slate-150 text-slate-600 border-slate-200";
    }
  };

  // Export to Excel trigger
  const handleExportExcel = () => {
    if (clients.length === 0) return;

    // Filter into sheets based on category
    const trackerRows = clients.filter(c => !c.category || c.category === "event_tracker").map(c => ({
      Cliente: c.name,
      Contacto: `${c.email || ""} ${c.phone ? "(" + c.phone + ")" : ""}`.trim(),
      Dirección: c.address || "",
      Locación: c.location || "",
      Fecha: c.eventDate || "",
      "Horas Contratadas": c.eventHours || "",
      "Start Time": c.startTime || "",
      "End Time": c.endTime || "",
      Robot: c.robot || "",
      "DJ Needed": c.djNeeded || "",
      Helper: c.helper || "",
      "Type Event": c.eventType || "",
      Equipement: c.equipment || ""
    }));

    const pendientesRows = clients.filter(c => c.category === "clientes_pendientes").map(c => ({
      Cliente: c.name,
      "Contract Status": c.contractStatus || "",
      "Invoice Send": c.invoiceSent || "",
      Teléfono: c.phone || "",
      Email: c.email || "",
      Información: c.info || ""
    }));

    const plannerRows = clients.filter(c => c.category === "daily_event_planner").map(c => ({
      Fecha: c.eventDate || "",
      Evento: c.name,
      Ayudante: c.helper || "",
      Estado: c.contractStatus || "",
      Notas: c.info || ""
    }));

    const marketingRows = clients.filter(c => c.category === "event_marketing").map(c => ({
      Cliente: c.name,
      Locación: c.location || "",
      Fecha: c.eventDate || "",
      Tipo: c.eventType || "",
      Staff: c.marketingStaff || "",
      Valor: c.marketingValue || ""
    }));

    const workbook = XLSX.book_new();

    if (trackerRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(trackerRows);
      XLSX.book_append_sheet(workbook, ws, "Event Tracker");
    }
    if (pendientesRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(pendientesRows);
      XLSX.book_append_sheet(workbook, ws, "Clientes Pendientes");
    }
    if (plannerRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(plannerRows);
      XLSX.book_append_sheet(workbook, ws, "Daily Event Planner");
    }
    if (marketingRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(marketingRows);
      XLSX.book_append_sheet(workbook, ws, "Event Marketing");
    }

    // Default sheet if all are empty
    if (workbook.SheetNames.length === 0) {
      const ws = XLSX.utils.json_to_sheet([{ Mensaje: "Base de datos vacía" }]);
      XLSX.book_append_sheet(workbook, ws, "CRM Clientes");
    }

    XLSX.writeFile(workbook, `CRM_Clientes_Completo_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Comprehensive 4-tab Excel Import trigger
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const allImportedItems: Partial<CRMClient>[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const cleanSheetName = sheetName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const worksheet = workbook.Sheets[sheetName];
          
          if (cleanSheetName.includes("tracker") || cleanSheetName.includes("event traker") || cleanSheetName.includes("eventos") || sheetName === workbook.SheetNames[0]) {
            // 1. Parse Event Tracker Sheet
            const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);
            const trackerItems = jsonRows.map((row) => {
              const keys = Object.keys(row);
              const getVal = (possibleSubstrings: string[]) => {
                const matchedKey = keys.find(k => {
                  const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return possibleSubstrings.some(sub => cleanK.includes(sub));
                });
                return matchedKey ? row[matchedKey] : undefined;
              };

              const nameVal = getVal(["cliente", "nombre", "client", "name", "prospecto", "usuario"]);
              const contactVal = getVal(["contacto", "contact", "email", "telefono", "phone", "celular", "movil", "tel"]);
              const addressVal = getVal(["direccion", "address", "dir"]);
              const locationVal = getVal(["locacion", "location", "lugar"]);
              const dateVal = getVal(["fecha", "date", "day"]);
              const hoursVal = getVal(["horas", "hours", "horas contratadas", "contracted hours"]);
              const startTimeVal = getVal(["star time", "start time", "inicio", "hora inicio"]);
              const endTimeVal = getVal(["end time", "fin", "salida", "hora fin"]);
              const robotVal = getVal(["robot"]);
              const djVal = getVal(["dj", "dj needed"]);
              const helperVal = getVal(["helper", "ayudante", "vendedor", "staff"]);
              const eventTypeVal = getVal(["type event", "event type", "evento", "tipo"]);
              const equipmentVal = getVal(["equipement", "equipment", "equipos"]);

              let email = "";
              let phone = "";
              const contactStr = contactVal ? String(contactVal).trim() : "";
              if (contactStr) {
                if (contactStr.includes("@")) {
                  const parts = contactStr.split(/[\s,]+/);
                  parts.forEach(p => {
                    if (p.includes("@")) email = p;
                    else if (/[0-9]/.test(p)) phone = p;
                  });
                  if (!phone) phone = contactStr.replace(email, "").replace(/[\s,]+/g, "").trim();
                } else {
                  phone = contactStr;
                }
              }

              return {
                name: nameVal ? String(nameVal).trim() : "",
                email,
                phone,
                company: locationVal ? String(locationVal).trim() : "",
                address: addressVal ? String(addressVal).trim() : "",
                location: locationVal ? String(locationVal).trim() : "",
                eventDate: dateVal ? String(dateVal).trim() : "",
                eventHours: hoursVal ? String(hoursVal).trim() : "",
                startTime: startTimeVal ? String(startTimeVal).trim() : "",
                endTime: endTimeVal ? String(endTimeVal).trim() : "",
                robot: robotVal ? String(robotVal).trim() : "",
                djNeeded: djVal ? String(djVal).trim() : "",
                helper: helperVal ? String(helperVal).trim() : "",
                eventType: eventTypeVal ? String(eventTypeVal).trim() : "",
                equipment: equipmentVal ? String(equipmentVal).trim() : "",
                category: "event_tracker" as const,
                stage: "Contactado" as const,
                value: 0
              };
            }).filter(item => item.name);
            allImportedItems.push(...trackerItems);

          } else if (cleanSheetName.includes("pendiente") || cleanSheetName.includes("clientes pendientes") || cleanSheetName.includes("pending")) {
            // 2. Parse Clientes Pendientes Sheet
            const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);
            const pendingItems = jsonRows.map((row) => {
              const keys = Object.keys(row);
              const getVal = (possibleSubstrings: string[]) => {
                const matchedKey = keys.find(k => {
                  const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return possibleSubstrings.some(sub => cleanK.includes(sub));
                });
                return matchedKey ? row[matchedKey] : undefined;
              };

              const nameVal = getVal(["cliente", "nombre", "client", "name"]);
              const contractStatusVal = getVal(["contract status", "contract", "estado contrato", "contrato"]);
              const invoiceSentVal = getVal(["invoice send", "invoice", "factura enviada", "factura"]);
              const phoneVal = getVal(["telefono", "phone", "tel", "celular"]);
              const emailVal = getVal(["email", "correo", "mail"]);
              const infoVal = getVal(["informacion", "info", "información", "notas", "detalles"]);

              return {
                name: nameVal ? String(nameVal).trim() : "",
                email: emailVal ? String(emailVal).trim() : "",
                phone: phoneVal ? String(phoneVal).trim() : "",
                contractStatus: contractStatusVal ? String(contractStatusVal).trim() : "Pendiente",
                invoiceSent: invoiceSentVal ? String(invoiceSentVal).trim() : "No",
                info: infoVal ? String(infoVal).trim() : "",
                category: "clientes_pendientes" as const,
                stage: "Prospecto" as const,
                value: 0
              };
            }).filter(item => item.name);
            allImportedItems.push(...pendingItems);

          } else if (cleanSheetName.includes("planner") || cleanSheetName.includes("dayle event planner") || cleanSheetName.includes("diario") || cleanSheetName.includes("planificador")) {
            // 3. Parse Daily Event Planner Sheet
            const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            let currentDate = "";
            const plannerItems: Partial<CRMClient>[] = [];

            rows.forEach((row) => {
              if (!row || row.length === 0) return;
              const colA = String(row[0] || "").trim();
              const colB = String(row[1] || "").trim();
              const colC = String(row[2] || "").trim();
              const colD = String(row[3] || "").trim();

              if (!colA) return;

              // Check if cell is a date
              const isDatePattern = /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/.test(colA);
              
              if (isDatePattern) {
                currentDate = colA;
              } else {
                if (colA.length > 3 && !colA.toLowerCase().includes("setup") && !colA.toLowerCase().includes("make")) {
                  // Valid task item
                  plannerItems.push({
                    name: colA, // Task Description
                    eventDate: currentDate || "6/25/2026", // Use current parser date
                    contractStatus: colB || "Pendiente", // e.g. "Done" or "ordered"
                    helper: colC, // assignee
                    info: colD, // notes/materials
                    category: "daily_event_planner" as const,
                    stage: colB.toLowerCase().includes("done") || colB.toLowerCase().includes("terminado") ? ("Ganado" as const) : ("Prospecto" as const),
                    value: 0
                  });
                } else if (colA.length > 3) {
                  // Default fallback
                  plannerItems.push({
                    name: colA,
                    eventDate: currentDate || "6/25/2026",
                    contractStatus: colB || "",
                    helper: colC || "",
                    info: colD || "",
                    category: "daily_event_planner" as const,
                    stage: "Prospecto" as const,
                    value: 0
                  });
                }
              }
            });
            allImportedItems.push(...plannerItems);

          } else if (cleanSheetName.includes("marketing") || cleanSheetName.includes("event marketing") || cleanSheetName.includes("mercadeo")) {
            // 4. Parse Event Marketing Sheet
            const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            const marketingItems: Partial<CRMClient>[] = [];

            rows.forEach((row, idx) => {
              if (idx === 0) {
                const firstCell = String(row[0] || "").toLowerCase();
                if (firstCell.includes("cliente") || firstCell.includes("nombre") || firstCell.includes("client")) {
                  return;
                }
              }
              if (!row || row.length === 0) return;
              const name = String(row[0] || "").trim();
              const location = String(row[1] || "").trim();
              const date = String(row[2] || "").trim();
              const eventType = String(row[3] || "").trim();
              const staff = String(row[4] || "").trim();
              const valueRaw = String(row[5] || "").trim();

              if (!name && !location && !date) return;

              let valueNum = 0;
              const cleaned = valueRaw.replace(/[^0-9.-]+/g, "");
              if (cleaned) {
                valueNum = Number(cleaned) || 0;
              }

              marketingItems.push({
                name: name || "Evento de Marketing",
                location: location,
                eventDate: date,
                eventType: eventType,
                marketingStaff: staff,
                marketingValue: valueRaw,
                value: valueNum,
                category: "event_marketing" as const,
                stage: "Prospecto" as const
              });
            });
            allImportedItems.push(...marketingItems);
          }
        });

        // Fallback: If no sheets matched our 4 tab criteria, parse first tab as Event Tracker
        if (allImportedItems.length === 0 && workbook.SheetNames.length > 0) {
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);
          
          const trackerFallback = jsonRows.map((row) => {
            const keys = Object.keys(row);
            const getVal = (possibleSubstrings: string[]) => {
              const matchedKey = keys.find(k => k.toLowerCase().includes(possibleSubstrings[0]));
              return matchedKey ? row[matchedKey] : undefined;
            };

            return {
              name: String(getVal(["nombre"]) || getVal(["client"]) || getVal(["name"]) || keys[0] || "Cliente sin nombre").trim(),
              email: String(getVal(["email"]) || getVal(["correo"]) || "").trim(),
              phone: String(getVal(["telefono"]) || getVal(["phone"]) || "").trim(),
              category: "event_tracker" as const,
              stage: "Prospecto" as const,
              value: 0
            };
          }).filter(item => item.name);
          allImportedItems.push(...trackerFallback);
        }

        if (allImportedItems.length > 0) {
          onImportExcel(allImportedItems);
          if (onShowToast) {
            onShowToast(`¡Importación de 4 pestañas completada con éxito! Se cargaron ${allImportedItems.length} registros en total.`, "success");
          }
        } else {
          if (onShowToast) {
            onShowToast("No se encontraron registros válidos en las pestañas. Verifica el archivo Excel.", "error");
          }
        }
      } catch (err) {
        console.error("Error leyendo archivo de Excel:", err);
        if (onShowToast) {
          onShowToast("Ocurrió un error al procesar el archivo Excel. Asegúrate de que sea un formato válido.", "error");
        }
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // reset input
  };

  const handleSortToggle = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="crm-client-list-wrapper">
      
      {/* 4 Multi-Tab Excel Category Pills Switcher */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-150 rounded-2xl border border-slate-200" id="category-tabs-group">
        <button
          onClick={() => {
            setActiveCategory("event_tracker");
            setStageFilter("Todos");
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeCategory === "event_tracker"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          id="category-tab-tracker"
        >
          <Calendar className="h-4 w-4 shrink-0" />
          <span>📊 Event Tracker</span>
        </button>
        <button
          onClick={() => {
            setActiveCategory("clientes_pendientes");
            setStageFilter("Todos");
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeCategory === "clientes_pendientes"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          id="category-tab-pendientes"
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>⏳ Clientes Pendientes</span>
        </button>
        <button
          onClick={() => {
            setActiveCategory("daily_event_planner");
            setStageFilter("Todos");
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeCategory === "daily_event_planner"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          id="category-tab-planner"
        >
          <CheckSquare className="h-4 w-4 shrink-0" />
          <span>📅 Daily Event Planner</span>
        </button>
        <button
          onClick={() => {
            setActiveCategory("event_marketing");
            setStageFilter("Todos");
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeCategory === "event_marketing"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          id="category-tab-marketing"
        >
          <Megaphone className="h-4 w-4 shrink-0" />
          <span>📣 Event Marketing</span>
        </button>
      </div>

      {/* Search and Action Filters Header */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="search-filter-toolbar">
        
        {/* Search bar & filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1" id="toolbar-left-side">
          {/* Search box */}
          <div className="relative flex-1 max-w-md" id="search-box-wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder={`Buscar en ${activeCategory.replace("_", " ")}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-all"
              id="search-input"
            />
          </div>

          {/* Event Tracker Sub-Filter: Past vs Future Events */}
          {activeCategory === "event_tracker" && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200" id="time-filter-pills">
              <button
                onClick={() => setEventTimeFilter("todos")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  eventTimeFilter === "todos"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setEventTimeFilter("futuros")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  eventTimeFilter === "futuros"
                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🔮 Futuros
              </button>
              <button
                onClick={() => setEventTimeFilter("pasados")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  eventTimeFilter === "pasados"
                    ? "bg-slate-200 text-slate-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⏳ Pasados
              </button>
            </div>
          )}

          {/* Stage Dropdown select (For tracker & pending & marketing) */}
          {activeCategory !== "daily_event_planner" && (
            <div className="flex items-center gap-2 shrink-0" id="filter-dropdown-wrapper">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filtrar:
              </span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                id="stage-filter-select"
              >
                <option value="Todos">📂 Todas las Etapas</option>
                <option value="Prospecto">🆕 Prospectos</option>
                <option value="Contactado">📞 Contactados</option>
                <option value="Negociación">🤝 En Negociación</option>
                <option value="Ganado">🎉 Ganados</option>
                <option value="Perdido">❌ Perdidos</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons: Add / Excel import / Excel export */}
        <div className="flex flex-wrap items-center gap-2" id="toolbar-right-side">
          
          {/* Excel Import button */}
          <label className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm">
            <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
            <span>Importar de Excel</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleImportExcel} 
              className="hidden" 
              id="excel-import-file"
            />
          </label>

          {/* Excel Export button */}
          <button
            onClick={handleExportExcel}
            disabled={clients.length === 0}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40"
            id="excel-export-btn"
            title="Exportar base de datos a un archivo Excel (.xlsx)"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            Exportar Excel
          </button>

          {/* Clear database button */}
          {onClearDatabase && clients.length > 0 && (
            <button
              onClick={onClearDatabase}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition-all shadow-sm flex items-center gap-1.5"
              id="clear-db-btn"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              Limpiar Base
            </button>
          )}

          {/* Add Client Button */}
          <button
            onClick={onAddClientClick}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            id="add-client-toolbar-btn"
          >
            <Plus className="h-4 w-4" />
            Agregar Registro
          </button>
        </div>
      </div>

      {/* Grid Table or Daily Planner View */}
      {activeCategory === "daily_event_planner" ? (
        
        /* Render Daily Event Planner view (Cards matching user screenshot) */
        <div className="space-y-6" id="planner-grouped-container">
          {Object.keys(groupedPlannerItems).length > 0 ? (
            Object.keys(groupedPlannerItems).map((date) => {
              const items = groupedPlannerItems[date];
              return (
                <div key={date} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id={`planner-group-${date.replace(/\//g, "-")}`}>
                  
                  {/* Group Date Header */}
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-150 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-indigo-600" />
                      <span className="font-extrabold text-slate-900 tracking-tight text-sm font-mono">{date}</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-black font-mono">
                      {items.length} tareas
                    </span>
                  </div>

                  {/* Grouped Tasks Checklist */}
                  <div className="p-4 divide-y divide-slate-100">
                    {items.map((item) => {
                      const isCompleted = item.contractStatus?.toLowerCase() === "done" || item.stage === "Ganado";
                      return (
                        <div 
                          key={item.id}
                          onClick={() => onClientClick(item)}
                          className="py-3 px-2 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-all cursor-pointer group"
                        >
                          {/* Task Description */}
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={(e) => {
                                e.stopPropagation();
                                const updated: CRMClient = {
                                  ...item,
                                  contractStatus: isCompleted ? "Pendiente" : "Done",
                                  stage: isCompleted ? "Prospecto" : "Ganado"
                                };
                                onEditClientClick(updated);
                              }}
                              className="h-4 w-4 text-indigo-600 rounded border-slate-300 mt-0.5 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className={`text-xs md:text-sm font-bold block ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                                {item.name}
                              </span>
                              {item.info && (
                                <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                                  {item.info}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Helper & Seller and Actions */}
                          <div className="flex items-center gap-3 shrink-0">
                            {item.helper && (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-[10px] font-bold">
                                <Users className="h-3 w-3 text-amber-500 shrink-0" />
                                {item.helper}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                              isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"
                            }`}>
                              {item.contractStatus || "Pendiente"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClientClick(item);
                              }}
                              className="p-1 border border-slate-150 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors bg-white shadow-sm"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <CheckSquare className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-slate-800">No hay planificador diario cargado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Carga un archivo de Excel con la pestaña "Daily Event Planner" para organizar las tareas por fecha.
              </p>
            </div>
          )}
        </div>

      ) : (

        /* Render Standard Category Tables (Event Tracker, Clientes Pendientes, Event Marketing) */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="client-table-panel">
          <div className="overflow-x-auto" id="client-table-scroll">
            <table className="w-full text-left border-collapse" id="client-data-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider" id="table-head-row">
                  
                  {/* Category-Specific Table Headers */}
                  {activeCategory === "event_tracker" && (
                    <>
                      <th onClick={() => handleSortToggle("name")} className="p-4 cursor-pointer hover:text-slate-700 hover:bg-slate-100/50 transition-colors min-w-[150px]">
                        Cliente {sortBy === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="p-4 min-w-[160px]">Contacto (Email, Tel)</th>
                      <th className="p-4 min-w-[150px]">Dirección</th>
                      <th className="p-4 min-w-[130px]">Locación</th>
                      <th onClick={() => handleSortToggle("eventDate")} className="p-4 cursor-pointer hover:text-slate-700 hover:bg-slate-100/50 transition-colors min-w-[120px]">
                        Fecha {sortBy === "eventDate" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="p-4 min-w-[140px]">Horas Contratadas</th>
                      <th className="p-4 min-w-[110px]">Start Time</th>
                      <th className="p-4 min-w-[110px]">End Time</th>
                      <th className="p-4 min-w-[110px]">Robot</th>
                      <th className="p-4 min-w-[110px]">DJ Needed</th>
                      <th className="p-4 min-w-[110px]">Helper</th>
                      <th className="p-4 min-w-[130px]">Type Event</th>
                      <th className="p-4 min-w-[130px]">Equipment</th>
                      <th className="p-4 text-right min-w-[80px]">Acción</th>
                    </>
                  )}

                  {activeCategory === "clientes_pendientes" && (
                    <>
                      <th onClick={() => handleSortToggle("name")} className="p-4 cursor-pointer hover:text-slate-700 hover:bg-slate-100/50 transition-colors">
                        Cliente {sortBy === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4">Contrato</th>
                      <th className="p-4">Factura</th>
                      <th className="p-4">Información</th>
                      <th className="p-4 text-right">Acción</th>
                    </>
                  )}

                  {activeCategory === "event_marketing" && (
                    <>
                      <th onClick={() => handleSortToggle("name")} className="p-4 cursor-pointer hover:text-slate-700 hover:bg-slate-100/50 transition-colors">
                        Evento / Cliente {sortBy === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="p-4">Locación</th>
                      <th onClick={() => handleSortToggle("eventDate")} className="p-4 cursor-pointer hover:text-slate-700 hover:bg-slate-100/50 transition-colors">
                        Fecha {sortBy === "eventDate" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="p-4">Tipo de Evento</th>
                      <th className="p-4">Staff Requerido</th>
                      <th className="p-4">Valor / Costo</th>
                      <th className="p-4 text-right">Acción</th>
                    </>
                  )}

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700" id="table-body">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const isPast = isEventPast(client);
                    return (
                      <tr
                        key={client.id}
                        onClick={() => onClientClick(client)}
                        className="hover:bg-slate-50/70 transition-all cursor-pointer group"
                        id={`client-row-${client.id}`}
                      >
                        
                        {/* 1. Event Tracker Category Row */}
                        {activeCategory === "event_tracker" && (
                          <>
                            {/* Cliente */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 font-sans uppercase">
                                  {client.name.substring(0, 2)}
                                </div>
                                <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                                  {client.name}
                                </span>
                              </div>
                            </td>

                            {/* Contacto */}
                            <td className="p-4">
                              <div className="space-y-1">
                                {client.email ? (
                                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                    {client.email}
                                  </span>
                                ) : null}
                                {client.phone ? (
                                  <span className="flex items-center gap-1 text-slate-500 font-bold font-mono">
                                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                    {client.phone}
                                  </span>
                                ) : null}
                                {!client.email && !client.phone && (
                                  <span className="text-slate-400 italic">Sin contacto</span>
                                )}
                              </div>
                            </td>

                            {/* Dirección */}
                            <td className="p-4 text-slate-700 font-semibold">
                              {client.address ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  <span>{client.address}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Sin dirección</span>
                              )}
                            </td>

                            {/* Locación */}
                            <td className="p-4 text-slate-700 font-semibold">
                              {client.location ? (
                                <span>{client.location}</span>
                              ) : (
                                <span className="text-slate-400 italic">Sin locación</span>
                              )}
                            </td>

                            {/* Fecha */}
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-extrabold text-slate-900 font-mono flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  {client.eventDate || "No definida"}
                                </span>
                                {client.eventDate && (
                                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full w-max tracking-wide uppercase ${
                                    isPast 
                                      ? "bg-rose-50 text-rose-600 border border-rose-100" 
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse"
                                  }`}>
                                    {isPast ? "⏳ Pasado" : "🔮 Futuro"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Horas Contratadas */}
                            <td className="p-4 font-bold text-slate-700">
                              {client.eventHours ? `${client.eventHours} Horas` : <span className="text-slate-400 italic font-normal">--</span>}
                            </td>

                            {/* Start Time */}
                            <td className="p-4 font-mono font-bold text-slate-600">
                              {client.startTime || <span className="text-slate-400 italic font-normal">--:--</span>}
                            </td>

                            {/* End Time */}
                            <td className="p-4 font-mono font-bold text-slate-600">
                              {client.endTime || <span className="text-slate-400 italic font-normal">--:--</span>}
                            </td>

                            {/* Robot */}
                            <td className="p-4">
                              {client.robot ? (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold font-mono">
                                  🤖 {client.robot}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No</span>
                              )}
                            </td>

                            {/* DJ Needed */}
                            <td className="p-4">
                              {client.djNeeded ? (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-bold font-mono">
                                  🎵 {client.djNeeded}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No</span>
                              )}
                            </td>

                            {/* Helper */}
                            <td className="p-4">
                              {client.helper ? (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-bold font-mono">
                                  🙋 {client.helper}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No</span>
                              )}
                            </td>

                            {/* Type Event */}
                            <td className="p-4">
                              {client.eventType ? (
                                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                                  {client.eventType}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Sin tipo</span>
                              )}
                            </td>

                            {/* Equipment */}
                            <td className="p-4">
                              {client.equipment ? (
                                <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[10px] font-bold font-mono">
                                  📦 {client.equipment}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Ninguno</span>
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onClientClick(client)}
                                  className="p-1.5 border border-slate-150 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors bg-white shadow-sm"
                                  title="Ver detalles"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* 2. Clientes Pendientes Category Row */}
                        {activeCategory === "clientes_pendientes" && (
                          <>
                            {/* Cliente */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 font-sans uppercase">
                                  {client.name.substring(0, 2)}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                                    {client.name}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Contacto */}
                            <td className="p-4 space-y-1">
                              {client.email && (
                                <span className="flex items-center gap-1 text-slate-500 font-medium">
                                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                  {client.email}
                                </span>
                              )}
                              {client.phone && (
                                <span className="flex items-center gap-1 text-slate-500 font-bold font-mono">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  {client.phone}
                                </span>
                              )}
                              {!client.email && !client.phone && (
                                <span className="text-slate-400 italic">Sin contacto</span>
                              )}
                            </td>

                            {/* Contract Status */}
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wide uppercase ${
                                client.contractStatus?.toLowerCase().includes("firm") || client.contractStatus?.toLowerCase().includes("sign")
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {client.contractStatus || "Pendiente"}
                              </span>
                            </td>

                            {/* Invoice Sent */}
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border tracking-wide uppercase ${
                                client.invoiceSent?.toLowerCase().includes("si") || client.invoiceSent?.toLowerCase().includes("yes") || client.invoiceSent?.toLowerCase().includes("send")
                                  ? "bg-teal-50 text-teal-700 border-teal-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                Factura: {client.invoiceSent || "No"}
                              </span>
                            </td>

                            {/* Información */}
                            <td className="p-4 text-slate-500 max-w-[250px] truncate font-medium">
                              {client.info || "Sin información adicional"}
                            </td>

                            {/* Acciones */}
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onClientClick(client)}
                                  className="p-1.5 border border-slate-150 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors bg-white shadow-sm"
                                  title="Ver detalles"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* 3. Event Marketing Category Row */}
                        {activeCategory === "event_marketing" && (
                          <>
                            {/* Cliente / Evento */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 font-sans uppercase">
                                  {client.name.substring(0, 2)}
                                </div>
                                <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                                  {client.name}
                                </span>
                              </div>
                            </td>

                            {/* Locación */}
                            <td className="p-4 font-bold text-slate-800">
                              {client.location ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  {client.location}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No definida</span>
                              )}
                            </td>

                            {/* Fecha */}
                            <td className="p-4 font-mono font-bold text-slate-900">
                              {client.eventDate || "No definida"}
                            </td>

                            {/* Tipo de Evento */}
                            <td className="p-4 text-slate-600 font-medium">
                              {client.eventType || "No definido"}
                            </td>

                            {/* Staff Requerido */}
                            <td className="p-4">
                              {client.marketingStaff ? (
                                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold font-mono">
                                  👤 {client.marketingStaff}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No asignado</span>
                              )}
                            </td>

                            {/* Valor / Costo */}
                            <td className="p-4">
                              {client.marketingValue ? (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-black font-mono">
                                  💰 {client.marketingValue}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Gratis / No especificado</span>
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onClientClick(client)}
                                  className="p-1.5 border border-slate-150 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors bg-white shadow-sm"
                                  title="Ver detalles"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                      </tr>
                    );
                  })
                ) : (
                  <tr id="empty-state-row">
                    <td colSpan={8} className="p-12 text-center" id="empty-state-td">
                      <Tag className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-pulse" />
                      <h4 className="text-base font-bold text-slate-800">No se encontraron registros en esta pestaña</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Carga tu archivo Excel para poblar automáticamente los registros correspondientes o agrega uno de forma manual.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
