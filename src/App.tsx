import React, { useState, useEffect } from "react";
import { 
  Users, LayoutDashboard, Kanban, Sparkles, FolderSync, Plus, 
  HelpCircle, CheckCircle2, CloudLightning, Database, AlertCircle, ChevronLeft, ChevronRight, Briefcase, Trash2, Download
} from "lucide-react";
import { CRMClient, ClientNote, ClientTask } from "./types";
import { db } from "./lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocFromServer,
  getDocs
} from "firebase/firestore";
import * as XLSX from "xlsx";

import CRMDashboard from "./components/CRMDashboard";
import CRMClientList from "./components/CRMClientList";
import CRMKanbanView from "./components/CRMKanbanView";
import CRMFormModal from "./components/CRMFormModal";
import CRMClientDetail from "./components/CRMClientDetail";
import AIChatSidebar from "./components/AIChatSidebar";

const DEMO_CLIENTS: Partial<CRMClient>[] = [];

export default function App() {
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<"dashboard" | "clients" | "kanban">("dashboard");
  const [showAIChat, setShowAIChat] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<CRMClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem("crm_use_offline") === "true";
  });
  const [importingStatus, setImportingStatus] = useState<{ current: number; total: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Validate Connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      if (isOfflineMode) return;
      try {
        await getDocFromServer(doc(db, "test", "connection"));
        console.log("Conexión con Firebase verificada.");
      } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.warn("Dispositivo sin conexión o base de datos offline.");
        }
      }
    }
    testConnection();
  }, [isOfflineMode]);

  // Firestore Real-Time listener or Offline synchronization
  useEffect(() => {
    if (isOfflineMode) {
      const cached = localStorage.getItem("crm_local_clients");
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CRMClient[];
          setClients(parsed);
        } catch (e) {
          console.error("Error al analizar clientes locales:", e);
          setClients([]);
        }
      } else {
        setClients([]);
        localStorage.setItem("crm_local_clients", JSON.stringify([]));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const clientsRef = collection(db, "clients");
    const unsubscribe = onSnapshot(clientsRef, (snapshot) => {
      const loaded: CRMClient[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        loaded.push({
          id: docSnapshot.id,
          ...data,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          company: data.company || "",
          value: Number(data.value) || 0,
          stage: data.stage || "Prospecto",
          notes: data.notes || [],
          tasks: data.tasks || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        } as CRMClient);
      });
      // Sort by creation date descending
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClients(loaded);
      setLoading(false);
      setFirebaseError(null);

      // Keep active detail sidebar client updated in real-time if open
      if (selectedClient) {
        const updatedSelected = loaded.find((c) => c.id === selectedClient.id);
        setSelectedClient(updatedSelected || null);
      }
    }, (error) => {
      console.error("Error en conexión o permisos de Firestore:", error);
      setLoading(false);
      setFirebaseError(error.message || "No se pudo conectar con Firebase. Por favor, revisa tus reglas y conexión.");
    });

    return () => unsubscribe();
  }, [isOfflineMode, selectedClient?.id]);

  // Create or Edit Client in Firestore or Local Storage
  const handleSaveClient = async (clientData: Partial<CRMClient>) => {
    if (isOfflineMode) {
      const newClients = [...clients];
      if (clientToEdit) {
        const index = newClients.findIndex(c => c.id === clientToEdit.id);
        if (index !== -1) {
          const updatedClient = {
            ...newClients[index],
            ...clientData,
            updatedAt: new Date().toISOString()
          };
          newClients[index] = updatedClient;
          if (selectedClient?.id === clientToEdit.id) {
            setSelectedClient(updatedClient);
          }
        }
        setClientToEdit(null);
      } else {
        const newClient: CRMClient = {
          ...clientData,
          id: `local-${Date.now()}`,
          name: clientData.name || "Sin nombre",
          company: clientData.company || "",
          email: clientData.email || "",
          phone: clientData.phone || "",
          value: Number(clientData.value) || 0,
          stage: clientData.stage || "Prospecto",
          notes: [],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newClients.unshift(newClient);
      }
      setClients(newClients);
      localStorage.setItem("crm_local_clients", JSON.stringify(newClients));
      return;
    }

    try {
      if (clientToEdit) {
        const clientDocRef = doc(db, "clients", clientToEdit.id);
        await updateDoc(clientDocRef, {
          ...clientData,
          updatedAt: new Date().toISOString()
        });
        setClientToEdit(null);
      } else {
        const clientsRef = collection(db, "clients");
        await addDoc(clientsRef, {
          ...clientData,
          notes: [],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error al guardar cliente en Firestore:", error);
    }
  };

  // Update specific client details (e.g. stage, notes, tasks list)
  const handleUpdateClientFields = async (clientId: string, updatedFields: Partial<CRMClient>) => {
    if (isOfflineMode) {
      const newClients = clients.map(c => {
        if (c.id === clientId) {
          return {
            ...c,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      });
      setClients(newClients);
      localStorage.setItem("crm_local_clients", JSON.stringify(newClients));
      if (selectedClient?.id === clientId) {
        const updatedSelected = newClients.find(c => c.id === clientId);
        setSelectedClient(updatedSelected || null);
      }
      return;
    }

    try {
      const clientDocRef = doc(db, "clients", clientId);
      await updateDoc(clientDocRef, {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error al actualizar campos del cliente:", error);
    }
  };

  // Move Client in Kanban stages
  const handleUpdateClientStage = async (clientId: string, newStage: CRMClient["stage"]) => {
    await handleUpdateClientFields(clientId, { stage: newStage });
  };

  // Delete Client from Firestore or Local Storage
  const handleDeleteClient = async (clientId: string) => {
    if (isOfflineMode) {
      const newClients = clients.filter(c => c.id !== clientId);
      setClients(newClients);
      localStorage.setItem("crm_local_clients", JSON.stringify(newClients));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      return;
    }

    try {
      const clientDocRef = doc(db, "clients", clientId);
      await deleteDoc(clientDocRef);
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error al eliminar cliente de Firestore:", error);
    }
  };

  // Trigger quick seed/demo data loads
  const handleLoadDemoData = async () => {
    if (isOfflineMode) {
      const loaded: CRMClient[] = DEMO_CLIENTS.map((demo, idx) => ({
        id: `local-demo-${idx}-${Date.now()}`,
        name: demo.name || "",
        company: demo.company || "",
        email: demo.email || "",
        phone: demo.phone || "",
        value: Number(demo.value) || 0,
        stage: demo.stage || "Prospecto",
        notes: demo.notes || [],
        tasks: demo.tasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setClients(loaded);
      localStorage.setItem("crm_local_clients", JSON.stringify(loaded));
      return;
    }

    try {
      const clientsRef = collection(db, "clients");
      for (const demo of DEMO_CLIENTS) {
        await addDoc(clientsRef, {
          ...demo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error cargando demo data:", error);
    }
  };

  // Open clear database confirmation dialog
  const handleClearDatabase = () => {
    setShowClearConfirm(true);
  };

  // Clear all contacts from database (both online and offline)
  const executeClearDatabase = async () => {
    setShowClearConfirm(false);

    if (isOfflineMode) {
      setClients([]);
      localStorage.removeItem("crm_local_clients");
      showToast("Se han eliminado todos los contactos locales con éxito.", "info");
      return;
    }

    try {
      setLoading(true);
      const clientsRef = collection(db, "clients");
      const snapshot = await getDocs(clientsRef);
      const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
      await Promise.all(deletePromises);
      setClients([]); // Instantly clear clients state locally
      showToast("Se han eliminado todos los contactos de la nube de Firebase con éxito.", "info");
    } catch (error: any) {
      console.error("Error al limpiar base de datos:", error);
      showToast(`No se pudo limpiar la base de datos: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Import clients list (e.g. from Excel file uploads)
  const handleImportExcelList = async (importedList: Partial<CRMClient>[]) => {
    setImportingStatus({ current: 0, total: importedList.length });
    setCurrentTab("clients"); // Switch to clients tab immediately so they see the list
    
    if (isOfflineMode) {
      // Small delay to show progress bar visually
      await new Promise(resolve => setTimeout(resolve, 600));
      const loaded: CRMClient[] = importedList.map((clientItem, idx) => ({
        id: `local-import-${idx}-${Date.now()}`,
        name: clientItem.name || "Sin nombre",
        company: clientItem.company || "",
        email: clientItem.email || "",
        phone: clientItem.phone || "",
        value: Number(clientItem.value) || 0,
        stage: clientItem.stage || "Prospecto",
        notes: [],
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Extended multi-tab attributes
        category: clientItem.category || "event_tracker",
        address: clientItem.address || "",
        location: clientItem.location || "",
        eventDate: clientItem.eventDate || "",
        eventHours: clientItem.eventHours || "",
        startTime: clientItem.startTime || "",
        endTime: clientItem.endTime || "",
        robot: clientItem.robot || "",
        djNeeded: clientItem.djNeeded || "",
        helper: clientItem.helper || "",
        eventType: clientItem.eventType || "",
        equipment: clientItem.equipment || "",
        contractStatus: clientItem.contractStatus || "",
        invoiceSent: clientItem.invoiceSent || "",
        info: clientItem.info || "",
        marketingStaff: clientItem.marketingStaff || "",
        marketingValue: clientItem.marketingValue || ""
      }));
      const newClients = [...loaded, ...clients];
      setClients(newClients);
      localStorage.setItem("crm_local_clients", JSON.stringify(newClients));
      setImportingStatus(null);
      showToast(`¡Importación exitosa! Se agregaron ${importedList.length} contactos en modo local.`, "success");
      return;
    }

    try {
      const clientsRef = collection(db, "clients");
      let count = 0;
      for (const clientItem of importedList) {
        await addDoc(clientsRef, {
          name: clientItem.name || "Sin nombre",
          company: clientItem.company || "",
          email: clientItem.email || "",
          phone: clientItem.phone || "",
          value: Number(clientItem.value) || 0,
          stage: clientItem.stage || "Prospecto",
          notes: [],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          
          // Extended multi-tab attributes
          category: clientItem.category || "event_tracker",
          address: clientItem.address || "",
          location: clientItem.location || "",
          eventDate: clientItem.eventDate || "",
          eventHours: clientItem.eventHours || "",
          startTime: clientItem.startTime || "",
          endTime: clientItem.endTime || "",
          robot: clientItem.robot || "",
          djNeeded: clientItem.djNeeded || "",
          helper: clientItem.helper || "",
          eventType: clientItem.eventType || "",
          equipment: clientItem.equipment || "",
          contractStatus: clientItem.contractStatus || "",
          invoiceSent: clientItem.invoiceSent || "",
          info: clientItem.info || "",
          marketingStaff: clientItem.marketingStaff || "",
          marketingValue: clientItem.marketingValue || ""
        });
        count++;
        setImportingStatus({ current: count, total: importedList.length });
      }
      showToast(`¡Éxito! Se importaron ${importedList.length} registros y se sincronizaron con la nube de Firebase.`, "success");
    } catch (error: any) {
      console.error("Error al importar lista desde Excel:", error);
      showToast(`Hubo un error de conexión: ${error.message || "revisa tus permisos"}`, "error");
    } finally {
      setImportingStatus(null);
    }
  };

  // Onboarding screen Excel parser helper - Full 4-tab matching
  const handleOnboardImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            // 1. Event Tracker
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
            // 2. Clientes Pendientes
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
            // 3. Daily Event Planner
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

              const isDatePattern = /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/.test(colA);
              if (isDatePattern) {
                currentDate = colA;
              } else {
                if (colA.length > 3) {
                  plannerItems.push({
                    name: colA,
                    eventDate: currentDate || "6/25/2026",
                    contractStatus: colB || "Pendiente",
                    helper: colC,
                    info: colD,
                    category: "daily_event_planner" as const,
                    stage: colB.toLowerCase().includes("done") || colB.toLowerCase().includes("terminado") ? ("Ganado" as const) : ("Prospecto" as const),
                    value: 0
                  });
                }
              }
            });
            allImportedItems.push(...plannerItems);

          } else if (cleanSheetName.includes("marketing") || cleanSheetName.includes("event marketing") || cleanSheetName.includes("mercadeo")) {
            // 4. Event Marketing
            const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            const marketingItems: Partial<CRMClient>[] = [];

            rows.forEach((row, idx) => {
              if (idx === 0) {
                const firstCell = String(row[0] || "").toLowerCase();
                if (firstCell.includes("cliente") || firstCell.includes("nombre") || firstCell.includes("client")) return;
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
              if (cleaned) valueNum = Number(cleaned) || 0;

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

        // Fallback to first sheet as Event Tracker if nothing was loaded
        if (allImportedItems.length === 0 && workbook.SheetNames.length > 0) {
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);
          const trackerFallback = jsonRows.map((row) => {
            const keys = Object.keys(row);
            return {
              name: String(row[keys[0]] || "Cliente sin nombre").trim(),
              email: String(row[keys[2]] || "").trim(),
              phone: String(row[keys[3]] || "").trim(),
              category: "event_tracker" as const,
              stage: "Prospecto" as const,
              value: 0
            };
          }).filter(item => item.name);
          allImportedItems.push(...trackerFallback);
        }

        if (allImportedItems.length > 0) {
          handleImportExcelList(allImportedItems);
        } else {
          showToast("No se encontraron registros válidos en las pestañas de tu archivo de Excel.", "error");
        }
      } catch (err) {
        console.error("Error leyendo archivo de Excel:", err);
        showToast("Ocurrió un error al procesar el archivo Excel. Asegúrate de que sea un formato válido.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // reset input
  };

  const handleEditClick = (client: CRMClient) => {
    setClientToEdit(client);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased" id="app-root-container">
      
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-35 shadow-sm" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="header-container">
          <div className="flex justify-between h-16 items-center" id="header-content">
            
            {/* Brand Logo & Tagline */}
            <div className="flex items-center gap-3" id="brand-logo-container">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20" id="brand-icon">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-slate-950 tracking-tight" id="header-title">
                  Spark Group
                </h2>
                <span className="text-[9px] text-indigo-600 font-mono font-bold flex items-center gap-1 leading-none uppercase tracking-widest mt-0.5">
                  <CloudLightning className="h-3 w-3 shrink-0" /> Sincronización Firebase Real-Time
                </span>
              </div>
            </div>

            {/* Quick Status indicators & AI triggers */}
            <div className="flex items-center gap-2.5" id="header-actions">
              
              {/* Database status indicators */}
              <div className="hidden sm:flex items-center gap-2" id="db-status-container">
                {isOfflineMode ? (
                  <button
                    onClick={() => {
                      setIsOfflineMode(false);
                      localStorage.setItem("crm_use_offline", "false");
                      setLoading(true);
                      setFirebaseError(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-xl text-[10px] font-bold font-mono transition-all"
                    title="Hacer clic para reintentar sincronizar con Firebase"
                    id="offline-retry-indicator"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Modo Local (Offline)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-bold font-mono" id="online-indicator">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Nube: {clients.length} contactos</span>
                  </div>
                )}
              </div>

              {/* Add Client quick trigger */}
              <button
                onClick={() => {
                  setClientToEdit(null);
                  setIsFormOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 transition-all flex items-center gap-1.5 shrink-0"
                id="header-add-client-btn"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Agregar Contacto</span>
              </button>

              {/* AI Assistant toggle trigger */}
              <button
                onClick={() => setShowAIChat((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  showAIChat
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                id="header-toggle-ai"
              >
                <Sparkles className="h-4 w-4 text-indigo-400" />
                {showAIChat ? "Ocultar IA" : "Asistente IA"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative" id="loaded-workspace-view">
        
        {/* Left Side Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full" id="left-workspace">
          
          {firebaseError && !isOfflineMode && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm" id="firebase-error-alert">
              <div className="flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 font-sans">
                    Sincronización Cloud Pausada
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    No pudimos conectar con tu base de datos de Firebase: <strong>{firebaseError}</strong>. Para evitar quedarte esperando, puedes activar el <strong>Modo Offline (Local)</strong> y usar la aplicación con persistencia local en tu navegador.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <button
                  onClick={() => {
                    setIsOfflineMode(true);
                    localStorage.setItem("crm_use_offline", "true");
                    setFirebaseError(null);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                  id="error-use-offline-btn"
                >
                  Activar Modo Local
                </button>
              </div>
            </div>
          )}

          {/* Main Controls Section: Navigation and Overview Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3" id="workspace-controls-bar">
            
            {/* Left page Title / Segment information */}
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight" id="workspace-title">
                {currentTab === "dashboard" && "Tablero de Control Analítico"}
                {currentTab === "clients" && "Directorio de Clientes Cloud"}
                {currentTab === "kanban" && "Embudo de Procesos (Kanban)"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5" id="workspace-subtitle">
                {currentTab === "dashboard" && "Resumen en tiempo real de tu pipeline comercial, volumen y tareas urgentes."}
                {currentTab === "clients" && "Base de datos unificada para administrar clientes, notas, contactos e importaciones."}
                {currentTab === "kanban" && "Mueve a tus clientes a través del pipeline comercial con arrastrar y soltar."}
              </p>
            </div>

            {/* View switcher navigation tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60" id="view-tabs-container">
              <button
                onClick={() => setCurrentTab("dashboard")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentTab === "dashboard"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
                }`}
                id="tab-btn-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-500" />
                Resumen
              </button>
              <button
                onClick={() => setCurrentTab("clients")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentTab === "clients"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
                }`}
                id="tab-btn-clients"
              >
                <Users className="h-4 w-4 text-slate-500" />
                Clientes
              </button>
              <button
                onClick={() => setCurrentTab("kanban")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentTab === "kanban"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
                }`}
                id="tab-btn-kanban"
              >
                <Kanban className="h-4 w-4 text-slate-500" />
                Flujo Kanban
              </button>
            </div>
          </div>

          {/* Core Content Layout router based on state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3.5" id="global-loading">
              <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" id="spin" />
              <p className="text-xs font-bold text-slate-500 font-mono animate-pulse">Sincronizando con base de datos de Firebase...</p>
            </div>
          ) : (
            <div id="workspace-active-panel">
              {currentTab === "dashboard" && (
                clients.length === 0 ? (
                  /* Onboarding Empty state view helper */
                  <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center max-w-xl mx-auto space-y-6 shadow-sm animate-fade-in" id="empty-onboarding-card">
                    <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm animate-bounce" id="empty-ico">
                      <Database className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-950" id="onboard-title">¡Bienvenido a tu nuevo Gestor Cloud!</h3>
                      <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        Has eliminado con éxito la necesidad de usar Excel para organizar tu negocio. Tus contactos ahora se guardan de forma permanente, segura y rápida en la nube de Firebase.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3" id="onboard-actions">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Elige cómo comenzar:</p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5" id="onboard-btn-group">
                        <button
                          onClick={() => {
                            setClientToEdit(null);
                            setIsFormOpen(true);
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1"
                          id="onboard-add-btn"
                        >
                          <Plus className="h-4 w-4" />
                          Crear primer cliente
                        </button>
                        
                        <label
                          className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          id="onboard-import-label"
                          title="Importar una base de datos existente desde Excel o CSV"
                        >
                          <Download className="h-4 w-4 text-slate-400" />
                          <span>Importar de Excel</span>
                          <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleOnboardImportExcel} 
                            className="hidden" 
                            id="onboard-excel-import"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CRMDashboard clients={clients} onClientClick={setSelectedClient} />
                )
              )}

              {currentTab === "clients" && (
                <CRMClientList 
                  clients={clients} 
                  onAddClientClick={() => {
                    setClientToEdit(null);
                    setIsFormOpen(true);
                  }}
                  onClientClick={setSelectedClient}
                  onImportExcel={handleImportExcelList}
                  onEditClientClick={handleEditClick}
                  onDeleteClient={handleDeleteClient}
                  onClearDatabase={handleClearDatabase}
                  onShowToast={showToast}
                />
              )}

              {currentTab === "kanban" && (
                <CRMKanbanView 
                  clients={clients} 
                  onUpdateClientStage={handleUpdateClientStage} 
                  onClientClick={setSelectedClient}
                  onEditClientClick={handleEditClick}
                />
              )}
            </div>
          )}
        </main>

        {/* Collapsible right AI assistant panel */}
        {showAIChat && (
          <aside className="w-80 md:w-96 shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-l border-slate-200 flex flex-col bg-white shadow-2xl md:shadow-none animate-in slide-in-from-right duration-300" id="ai-chat-sidebar">
            <AIChatSidebar clients={clients} />
          </aside>
        )}
      </div>

      {/* Form modal for creating/modifying client records */}
      <CRMFormModal 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setClientToEdit(null);
        }}
        onSave={handleSaveClient}
        client={clientToEdit}
      />

      {/* Slide-out detail view modal for detailed CRM actions */}
      {selectedClient && (
        <CRMClientDetail 
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          client={selectedClient}
          onUpdateClient={handleUpdateClientFields}
          onDeleteClient={handleDeleteClient}
          onEditClick={handleEditClick}
        />
      )}

      {/* Importing Progress Overlay */}
      {importingStatus && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" id="importing-overlay">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full mx-4 space-y-4" id="importing-card">
            <div className="flex items-center gap-3" id="importing-header">
              <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 animate-spin" id="importing-spin">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-sans">
                  Importación en Progreso
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  Sincronizando {importingStatus.current} de {importingStatus.total}
                </p>
              </div>
            </div>
            
            {/* Progress bar container */}
            <div className="space-y-1.5" id="importing-bar-container">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden" id="bar-outer">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(importingStatus.current / importingStatus.total) * 100}%` }}
                  id="bar-inner"
                />
              </div>
              <span className="text-[10px] font-black text-slate-400 font-mono float-right">
                {Math.round((importingStatus.current / importingStatus.total) * 100)}% completo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Clearing Database */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" id="clear-database-modal">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full mx-4 space-y-4" id="clear-database-card">
            <div className="flex items-start gap-3.5" id="clear-database-header">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0" id="clear-database-icon">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-sans">
                  ¿Eliminar todos los contactos?
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Esta acción es permanente e irreversible. Borrará tanto los datos de demostración como todos los contactos que hayas importado de Excel.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2" id="clear-database-footer">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl transition-colors border border-transparent hover:border-slate-200"
                id="clear-database-cancel-btn"
              >
                Cancelar
              </button>
              <button
                onClick={executeClearDatabase}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/10 transition-colors animate-pulse"
                id="clear-database-confirm-btn"
              >
                Sí, limpiar base de datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Popup Notifications */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white p-4 rounded-xl border border-slate-200 shadow-xl flex items-start gap-3 animate-in slide-in-from-bottom duration-300`}
          id="custom-toast-notification"
        >
          <div className={`p-1 rounded-lg shrink-0 ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
            toast.type === "error" ? "bg-rose-50 text-rose-600 border border-rose-100" :
            "bg-slate-150 text-slate-600"
          }`} id="toast-icon-container">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
          </div>
          <div className="space-y-0.5 flex-1" id="toast-content">
            <h5 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider font-sans">
              {toast.type === "success" ? "Operación Exitosa" : "Mensaje del Sistema"}
            </h5>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono px-1 transition-colors self-start"
            id="toast-close-btn"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
