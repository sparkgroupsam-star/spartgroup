import React, { useState } from "react";
import { 
  X, Mail, Phone, Building, DollarSign, Calendar, Sparkles, 
  Trash2, Plus, CheckSquare, Square, StickyNote, CheckCircle, 
  Clock, CheckSquare2, FileEdit, AlertCircle 
} from "lucide-react";
import { CRMClient, ClientNote, ClientTask } from "../types";

interface CRMClientDetailProps {
  isOpen: boolean;
  onClose: () => void;
  client: CRMClient | null;
  onUpdateClient: (clientId: string, updatedData: Partial<CRMClient>) => void;
  onDeleteClient: (clientId: string) => void;
  onEditClick: (client: CRMClient) => void;
}

export default function CRMClientDetail({ 
  isOpen, 
  onClose, 
  client, 
  onUpdateClient, 
  onDeleteClient, 
  onEditClick 
}: CRMClientDetailProps) {
  const [newNote, setNewNote] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !client) return null;

  // Add a Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteItem: ClientNote = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      createdAt: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updatedNotes = [noteItem, ...(client.notes || [])];
    onUpdateClient(client.id, { notes: updatedNotes });
    setNewNote("");
  };

  // Delete a Note
  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = (client.notes || []).filter((n) => n.id !== noteId);
    onUpdateClient(client.id, { notes: updatedNotes });
  };

  // Add a Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskItem: ClientTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || new Date().toISOString().split("T")[0],
      completed: false
    };

    const updatedTasks = [...(client.tasks || []), taskItem];
    onUpdateClient(client.id, { tasks: updatedTasks });
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  // Toggle Task Completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = (client.tasks || []).map((t) => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    onUpdateClient(client.id, { tasks: updatedTasks });
  };

  // Delete a Task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = (client.tasks || []).filter((t) => t.id !== taskId);
    onUpdateClient(client.id, { tasks: updatedTasks });
  };

  // Stage Badge stylings
  const getStageBadgeClass = (stage: CRMClient["stage"]) => {
    switch (stage) {
      case "Lead":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Contacted":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Negotiation":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Won":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Lost":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const formattedDate = client.createdAt 
    ? new Date(client.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "No date";

  return (
    <div className="fixed inset-y-0 right-0 z-45 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-screen animate-in slide-in-from-right duration-300" id="client-detail-sidebar">      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50" id="detail-header">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
            Contact Details
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5 line-clamp-1" id="detail-client-name">
            {client.name}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          id="close-detail-btn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6" id="detail-body-container">
        {/* Core Info Summary Card */}
        <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-3.5" id="detail-core-card">
          <div className="flex items-center justify-between" id="detail-badge-row">
            <span className={`px-2.5 py-1 border rounded-lg text-xs font-bold ${getStageBadgeClass(client.stage)}`} id="detail-stage-badge">
              {client.stage}
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 font-semibold">
              <Calendar className="h-3 w-3" />
              Created: {formattedDate}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs text-slate-600" id="detail-fields">
            {client.company && (
              <div className="flex items-center gap-2" id="detail-field-company">
                <Building className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500">Business:</span>
                <span className="font-bold text-slate-800">{client.company}</span>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-2" id="detail-field-email">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500">Email:</span>
                <a href={`mailto:${client.email}`} className="text-indigo-600 hover:underline font-bold truncate">
                  {client.email}
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-2" id="detail-field-phone">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-500">Phone/WhatsApp:</span>
                <span className="font-bold text-slate-800">{client.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-slate-100/60 pt-2.5 mt-1" id="detail-field-value">
              <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-500">Account Value / Deal:</span>
              <span className="font-black text-emerald-600 text-sm">
                {Number(client.value || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Category Specific Advanced Fields */}
            {client.category && (
              <div className="border-t border-slate-200/60 pt-3 mt-3 space-y-2.5 text-[11px] text-slate-600">
                <span className="text-[10px] font-mono font-black text-slate-400 block uppercase tracking-wider">
                  Details for {client.category === "event_tracker" ? "Event Tracker" : client.category === "clientes_pendientes" ? "Pending Clients" : client.category === "daily_event_planner" ? "Daily Planner" : "Event Marketing"}
                </span>

                {client.eventType && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Event Type:</span>
                    <span className="font-bold text-slate-800">{client.eventType}</span>
                  </div>
                )}
                {client.eventDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Event Date:</span>
                    <span className="font-bold text-indigo-700 font-mono">{client.eventDate}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-500 shrink-0">Address:</span>
                    <span className="font-bold text-slate-800">{client.address}</span>
                  </div>
                )}
                {client.location && client.location !== client.address && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-500 shrink-0">Location:</span>
                    <span className="font-bold text-slate-800">{client.location}</span>
                  </div>
                )}
                {client.eventHours && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Contracted Hours:</span>
                    <span className="font-bold text-slate-800">{client.eventHours} hours</span>
                  </div>
                )}
                {(client.startTime || client.endTime) && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Schedule:</span>
                    <span className="font-bold text-slate-800 font-mono">{client.startTime || "N/A"} - {client.endTime || "N/A"}</span>
                  </div>
                )}
                {client.robot && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Robot:</span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.robot}</span>
                  </div>
                )}
                {client.djNeeded && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">DJ Needed:</span>
                    <span className="font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.djNeeded}</span>
                  </div>
                )}
                {client.helper && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Helper / Staff:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.helper}</span>
                  </div>
                )}
                {client.equipment && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Equipment:</span>
                    <span className="font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.equipment}</span>
                  </div>
                )}
                {client.contractStatus && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Contract / Task Status:</span>
                    <span className="font-bold text-slate-800 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.contractStatus}</span>
                  </div>
                )}
                {client.invoiceSent && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Invoice Sent:</span>
                    <span className="font-bold text-slate-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.invoiceSent}</span>
                  </div>
                )}
                {client.marketingStaff && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Marketing Staff:</span>
                    <span className="font-bold text-slate-800 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.marketingStaff}</span>
                  </div>
                )}
                {client.marketingValue && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Marketing Value:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg text-[10px]">{client.marketingValue}</span>
                  </div>
                )}
                {client.info && (
                  <div className="flex flex-col gap-1 mt-1 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-black text-slate-500">Info / Notes:</span>
                    <span className="text-slate-700 italic font-medium whitespace-pre-wrap leading-relaxed">{client.info}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit / Quick actions */}
          <div className="flex gap-2 pt-2" id="detail-quick-actions">
            <button
              onClick={() => onEditClick(client)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              id="detail-edit-btn"
            >
              <FileEdit className="h-3.5 w-3.5" />
              Modify profile
            </button>

            <button
              onClick={() => setShowConfirmDelete(true)}
              className="px-3 py-1.5 border border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-[11px] font-bold flex items-center justify-center transition-all shadow-sm"
              title="Delete client"
              id="detail-delete-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showConfirmDelete && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-2.5 animate-in fade-in duration-200" id="confirm-delete-box">
            <div className="flex gap-2 items-start text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-bold leading-normal">
                Are you sure you want to delete this client? All registered notes and interactions will be permanently deleted.
              </p>
            </div>
            <div className="flex justify-end gap-2 text-[10px] font-bold">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                id="cancel-del-btn"
              >
                No, keep
              </button>
              <button 
                onClick={() => {
                  onDeleteClient(client.id);
                  onClose();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                id="confirm-del-btn"
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}

        {/* Tasks / To-Do Follow ups Section */}
        <div className="space-y-3" id="detail-tasks-section">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-indigo-500" /> 
            Tasks & Follow-up ({(client.tasks || []).filter(t => !t.completed).length})
          </h4>

          {/* Task creation form */}
          <form onSubmit={handleAddTask} className="flex gap-2 bg-slate-50 p-2.5 border rounded-xl" id="add-task-form">
            <input
              type="text"
              required
              placeholder="New task... (e.g., Call for budget/details)"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="new-task-title-input"
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="bg-white border border-slate-200 px-1.5 py-1 rounded-lg text-xs text-slate-600 focus:outline-none"
              id="new-task-date-input"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              id="submit-task-btn"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1" id="tasks-list">
            {(client.tasks && client.tasks.length > 0) ? (
              client.tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-2.5 border rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    task.completed 
                      ? "bg-slate-50/75 border-slate-150 text-slate-400 line-through" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  id={`task-item-${task.id}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none shrink-0"
                      id={`toggle-task-btn-${task.id}`}
                    >
                      {task.completed ? (
                        <CheckSquare2 className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <div className="h-4 w-4 border border-slate-300 rounded hover:border-indigo-500" />
                      )}
                    </button>
                    <div className="text-xs font-semibold leading-normal truncate">
                      <span>{task.title}</span>
                      {task.dueDate && (
                        <span className="text-[9px] text-slate-400 block font-mono font-medium line-through-none mt-0.5">
                          ⏰ Due: {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-all shrink-0"
                    id={`delete-task-btn-${task.id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-[11px] text-slate-400 border border-dashed rounded-xl bg-slate-50/30" id="empty-tasks-placeholder">
                No pending tasks. Everything up to date!
              </div>
            )}
          </div>
        </div>

        {/* Notes / Interactions History */}
        <div className="space-y-3" id="detail-notes-section">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <StickyNote className="h-4 w-4 text-indigo-500" /> 
            Notes & Interactions ({client.notes?.length || 0})
          </h4>

          {/* Quick Note Input */}
          <form onSubmit={handleAddNote} className="space-y-1.5" id="add-note-form">
            <textarea
              required
              rows={2}
              placeholder="Record call, visit, or custom agreement with this client..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 px-3 py-2 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
              id="new-note-text-input"
            />
            <div className="flex justify-end" id="submit-note-btn-container">
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                id="submit-note-btn"
              >
                <Plus className="h-3 w-3" />
                Add note
              </button>
            </div>
          </form>

          {/* Notes list */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1" id="notes-list">
            {(client.notes && client.notes.length > 0) ? (
              client.notes.map((note) => (
                <div 
                  key={note.id}
                  className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl relative group hover:bg-indigo-50/55 transition-colors"
                  id={`note-item-${note.id}`}
                >
                  <div className="flex items-start justify-between gap-2" id={`note-head-${note.id}`}>
                    <span className="text-[9px] text-indigo-500 font-mono font-bold uppercase tracking-wider" id={`note-date-${note.id}`}>
                      {note.createdAt}
                    </span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-0.5 rounded hover:bg-indigo-100/70 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete note"
                      id={`delete-note-${note.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-normal mt-1 whitespace-pre-wrap" id={`note-text-${note.id}`}>
                    {note.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[11px] text-slate-400 border border-dashed rounded-xl bg-slate-50/30" id="empty-notes-placeholder">
                No registered notes. Log calls, visits, or agreements to build a rich historical timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
