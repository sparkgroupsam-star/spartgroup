import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Building, DollarSign, Tag, Info, Calendar, Clock, MapPin, Bot, Users, CheckSquare, Megaphone } from "lucide-react";
import { CRMClient } from "../types";

// Helper to convert date to YYYY-MM-DD for standard input display
const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const month = parts[0].padStart(2, "0");
    const day = parts[1].padStart(2, "0");
    const year = parts[2];
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return "";
};

// Helper to convert standard YYYY-MM-DD back to MM/DD/YYYY
const formatDateFromInput = (val: string) => {
  if (!val) return "";
  const parts = val.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1]).toString();
    const day = parseInt(parts[2]).toString();
    return `${month}/${day}/${year}`;
  }
  return val;
};

// Helper to convert time to 24h HH:MM for input time display
const formatTimeForInput = (timeStr: string) => {
  if (!timeStr) return "";
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  return "";
};

// Helper to convert 24h HH:MM back to readable 12h AM/PM
const formatTimeFromInput = (val: string) => {
  if (!val) return "";
  const parts = val.split(":");
  if (parts.length === 2) {
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return val;
};

interface CRMFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<CRMClient>) => void;
  client?: CRMClient | null;
}

export default function CRMFormModal({ isOpen, onClose, onSave, client }: CRMFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState<number>(0);
  const [stage, setStage] = useState<CRMClient["stage"]>("Prospecto");

  // Advanced Multi-tab Category fields
  const [category, setCategory] = useState<CRMClient["category"]>("event_tracker");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHours, setEventHours] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [robot, setRobot] = useState("");
  const [djNeeded, setDjNeeded] = useState("");
  const [helper, setHelper] = useState("");
  const [eventType, setEventType] = useState("");
  const [equipment, setEquipment] = useState("");
  const [contractStatus, setContractStatus] = useState("");
  const [invoiceSent, setInvoiceSent] = useState("");
  const [info, setInfo] = useState("");
  const [marketingStaff, setMarketingStaff] = useState("");
  const [marketingValue, setMarketingValue] = useState("");

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setCompany(client.company || "");
      setValue(client.value || 0);
      setStage(client.stage || "Prospecto");
      
      setCategory(client.category || "event_tracker");
      setAddress(client.address || "");
      setLocation(client.location || "");
      setEventDate(client.eventDate || "");
      setEventHours(client.eventHours || "");
      setStartTime(client.startTime || "");
      setEndTime(client.endTime || "");
      setRobot(client.robot || "");
      setDjNeeded(client.djNeeded || "");
      setHelper(client.helper || "");
      setEventType(client.eventType || "");
      setEquipment(client.equipment || "");
      setContractStatus(client.contractStatus || "");
      setInvoiceSent(client.invoiceSent || "");
      setInfo(client.info || "");
      setMarketingStaff(client.marketingStaff || "");
      setMarketingValue(client.marketingValue || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setValue(0);
      setStage("Prospecto");
      
      setCategory("event_tracker");
      setAddress("");
      setLocation("");
      setEventDate("");
      setEventHours("");
      setStartTime("");
      setEndTime("");
      setRobot("");
      setDjNeeded("");
      setHelper("");
      setEventType("");
      setEquipment("");
      setContractStatus("");
      setInvoiceSent("");
      setInfo("");
      setMarketingStaff("");
      setMarketingValue("");
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      value: Number(value) || 0,
      stage,
      category,
      address: address.trim(),
      location: location.trim(),
      eventDate: eventDate.trim(),
      eventHours: eventHours.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      robot: robot.trim(),
      djNeeded: djNeeded.trim(),
      helper: helper.trim(),
      eventType: eventType.trim(),
      equipment: equipment.trim(),
      contractStatus: contractStatus.trim(),
      invoiceSent: invoiceSent.trim(),
      info: info.trim(),
      marketingStaff: marketingStaff.trim(),
      marketingValue: marketingValue.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="crm-form-modal-overlay">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        id="crm-form-modal-container"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50" id="crm-form-header">
          <div>
            <h3 className="text-base font-bold text-slate-950 flex items-center gap-2" id="crm-form-title">
              <Tag className="h-4 w-4 text-indigo-600" />
              {client ? "Editar Información del Registro" : "Agregar Nuevo Registro"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5" id="crm-form-subtitle">
              {client ? "Modifica los campos específicos de la pestaña seleccionada." : "Crea una ficha de contacto o evento clasificado en la nube."}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            id="close-crm-form-btn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs md:text-sm" id="crm-form-el">
          
          {/* Category Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Pestaña / Categoría del Registro
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCategory("event_tracker")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                  category === "event_tracker"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📊 Event Tracker
              </button>
              <button
                type="button"
                onClick={() => setCategory("clientes_pendientes")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                  category === "clientes_pendientes"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⏳ Pendientes
              </button>
              <button
                type="button"
                onClick={() => setCategory("daily_event_planner")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                  category === "daily_event_planner"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📅 Planner Diario
              </button>
              <button
                type="button"
                onClick={() => setCategory("event_marketing")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                  category === "event_marketing"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📣 Marketing
              </button>
            </div>
          </div>

          {/* Core Fields (Always shown) */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Datos Básicos</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5" id="field-name-container">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="client-name-input">
                  {category === "daily_event_planner" ? "Descripción de la Tarea / Evento" : "Nombre del Cliente / Evento"} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="client-name-input"
                    type="text"
                    required
                    placeholder={category === "daily_event_planner" ? "Ej: Preparar lista de globos" : "Ej: Carlos Pérez"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5" id="field-company-container">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="client-company-input">
                  Empresa / Negocio
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="h-4 w-4" />
                  </div>
                  <input
                    id="client-company-input"
                    type="text"
                    placeholder="Ej: Innova Tech"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="pl-9 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1.5" id="field-email-container">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="client-email-input">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="client-email-input"
                    type="email"
                    placeholder="carlos@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5" id="field-phone-container">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="client-phone-input">
                  Teléfono / Celular
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="client-phone-input"
                    type="tel"
                    placeholder="Ej: +34 600 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deal value */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Valor del Trato ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 1500"
                    value={value || ""}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="pl-9 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Pipeline Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Etapa del Embudo (Pipeline)
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as CRMClient["stage"])}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Prospecto">🆕 Prospecto</option>
                  <option value="Contactado">📞 Contactado</option>
                  <option value="Negociación">🤝 Negociación</option>
                  <option value="Ganado">🎉 Ganado</option>
                  <option value="Perdido">❌ Perdido</option>
                </select>
              </div>
            </div>
          </div>

          {/* 1. Event Tracker Fields Section */}
          {category === "event_tracker" && (
            <div className="border-t border-slate-100 pt-4 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Campos de Event Tracker
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Dirección Evento</label>
                  <input
                    type="text"
                    placeholder="Ej: Calle Gran Vía 12"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Locación / Lugar</label>
                  <input
                    type="text"
                    placeholder="Ej: Salón Real Metropol"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Fecha Evento</label>
                  <input
                    type="date"
                    value={formatDateForInput(eventDate)}
                    onChange={(e) => setEventDate(formatDateFromInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Horas Contratadas</label>
                  <input
                    type="text"
                    placeholder="Ej: 5"
                    value={eventHours}
                    onChange={(e) => setEventHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Tipo de Evento</label>
                  <input
                    type="text"
                    placeholder="Ej: Boda, Cumpleaños"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Hora Inicio (Start Time)</label>
                  <input
                    type="time"
                    value={formatTimeForInput(startTime)}
                    onChange={(e) => setStartTime(formatTimeFromInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Hora Fin (End Time)</label>
                  <input
                    type="time"
                    value={formatTimeForInput(endTime)}
                    onChange={(e) => setEndTime(formatTimeFromInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Robot</label>
                  <input
                    type="text"
                    placeholder="Ej: Sí / Led"
                    value={robot}
                    onChange={(e) => setRobot(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">DJ Needed</label>
                  <input
                    type="text"
                    placeholder="Ej: Yes / DJ Mark"
                    value={djNeeded}
                    onChange={(e) => setDjNeeded(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Ayudante / Helper</label>
                  <input
                    type="text"
                    placeholder="Ej: Pedro Ruiz"
                    value={helper}
                    onChange={(e) => setHelper(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Equipos / Equipment</label>
                  <input
                    type="text"
                    placeholder="Ej: Parlantes, Cabina"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Clientes Pendientes Fields Section */}
          {category === "clientes_pendientes" && (
            <div className="border-t border-slate-100 pt-4 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Campos de Clientes Pendientes
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Estado del Contrato (Contract Status)</label>
                  <input
                    type="text"
                    placeholder="Ej: Firmado, Por enviar"
                    value={contractStatus}
                    onChange={(e) => setContractStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Factura Enviada (Invoice Send)</label>
                  <input
                    type="text"
                    placeholder="Ej: Sí / No / Enviada"
                    value={invoiceSent}
                    onChange={(e) => setInvoiceSent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Información Adicional / Notas</label>
                <textarea
                  placeholder="Escribe notas, observaciones, requerimientos del cliente pendiente..."
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-sans"
                />
              </div>
            </div>
          )}

          {/* 3. Daily Event Planner Fields Section */}
          {category === "daily_event_planner" && (
            <div className="border-t border-slate-100 pt-4 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4" /> Campos de Daily Event Planner
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Fecha Planificada</label>
                  <input
                    type="date"
                    value={formatDateForInput(eventDate)}
                    onChange={(e) => setEventDate(formatDateFromInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Ayudantes o Vendedores (Staff)</label>
                  <input
                    type="text"
                    placeholder="Ej: Pedro Martínez"
                    value={helper}
                    onChange={(e) => setHelper(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Estado de la Tarea</label>
                  <input
                    type="text"
                    placeholder="Ej: Done, Pendiente"
                    value={contractStatus}
                    onChange={(e) => setContractStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Notas de la Tarea / Materiales</label>
                <textarea
                  placeholder="Materiales requeridos, notas de logística para este día..."
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-sans"
                />
              </div>
            </div>
          )}

          {/* 4. Event Marketing Fields Section */}
          {category === "event_marketing" && (
            <div className="border-t border-slate-100 pt-4 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="h-4 w-4" /> Campos de Event Marketing
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Locación del Evento</label>
                  <input
                    type="text"
                    placeholder="Ej: Plaza Central"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Fecha Evento</label>
                  <input
                    type="date"
                    value={formatDateForInput(eventDate)}
                    onChange={(e) => setEventDate(formatDateFromInput(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Tipo de Evento</label>
                  <input
                    type="text"
                    placeholder="Ej: Expo, Promoción"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Staff Requerido</label>
                  <input
                    type="text"
                    placeholder="Ej: 3 Promotoras"
                    value={marketingStaff}
                    onChange={(e) => setMarketingStaff(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Valor / Presupuesto</label>
                  <input
                    type="text"
                    placeholder="Ej: $1,200.00"
                    value={marketingValue}
                    onChange={(e) => setMarketingValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 mt-4" id="crm-form-disclaimer">
            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              La información se guardará en tiempo real en la base de datos sincronizada de Firebase. Si modificas la pestaña de un cliente, este cambiará automáticamente de lista en la sección principal de CRM.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-5 mt-6" id="form-actions-container">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-all hover:bg-slate-50"
              id="cancel-crm-form-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1"
              id="save-crm-client-btn"
            >
              {client ? "Guardar Cambios" : "Crear Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
