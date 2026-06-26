import React from "react";
import { 
  ArrowLeft, ArrowRight, Building, Mail, Phone, DollarSign, 
  Calendar, CheckCircle, Clock, User, Sparkles, MessageSquare, Briefcase,
  FileEdit, Trash2
} from "lucide-react";
import { CRMClient } from "../types";

interface CRMKanbanViewProps {
  clients: CRMClient[];
  onUpdateClientStage: (clientId: string, newStage: CRMClient["stage"]) => void;
  onClientClick: (client: CRMClient) => void;
  onEditClientClick?: (client: CRMClient) => void;
  onDeleteClient?: (clientId: string) => void;
}

const STAGES: CRMClient["stage"][] = [
  "Lead",
  "Contacted",
  "Negotiation",
  "Won",
  "Lost"
];

export default function CRMKanbanView({ 
  clients, 
  onUpdateClientStage, 
  onClientClick, 
  onEditClientClick,
  onDeleteClient
}: CRMKanbanViewProps) {
  
  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("text/plain", clientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: CRMClient["stage"]) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("text/plain");
    if (clientId) {
      onUpdateClientStage(clientId, stage);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="crm-kanban-wrapper">
      {/* Informative Dashboard Header */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="kanban-info-panel">
        <div id="kanban-info-desc">
          <h3 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2" id="kanban-panel-title">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Briefcase className="h-4 w-4" />
            </span>
            Interactive Sales Funnel
          </h3>
          <p className="text-xs text-slate-500 mt-1" id="kanban-panel-subtitle">
            Drag cards or use arrows to move clients between stages. Click a card to view or add notes.
          </p>
        </div>
        
        {/* Pipeline values summary */}
        <div className="flex gap-4 text-xs shrink-0" id="kanban-pipeline-sums">
          <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl" id="pipeline-total-sum">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total in Progress</span>
            <span className="text-sm font-black text-indigo-700">
              {clients
                .filter(c => c.stage !== "Won" && c.stage !== "Lost")
                .reduce((acc, c) => acc + (c.value || 0), 0)
                .toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl" id="pipeline-won-sum">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Closed Won</span>
            <span className="text-sm font-black text-emerald-700">
              {clients
                .filter(c => c.stage === "Won")
                .reduce((acc, c) => acc + (c.value || 0), 0)
                .toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className="overflow-x-auto pb-4 -mx-4 md:-mx-6 px-4 md:px-6" id="kanban-scroller">
        <div className="flex gap-4 min-w-[1000px] items-start" id="kanban-grid-container">
          {STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.stage === stage);
            const totalStageValue = stageClients.reduce((acc, c) => acc + (c.value || 0), 0);

            // Dynamically set lane theme colors
            let laneColors = {
              topBorder: "border-t-slate-400",
              headerBg: "bg-slate-50 text-slate-700 border-slate-200",
              countBadge: "bg-slate-200/80 text-slate-600",
              valueText: "text-slate-500"
            };

            if (stage === "Lead") {
              laneColors = {
                topBorder: "border-t-sky-500",
                headerBg: "bg-sky-50/60 text-sky-800 border-sky-100",
                countBadge: "bg-sky-100/80 text-sky-700",
                valueText: "text-sky-600"
              };
            } else if (stage === "Contacted") {
              laneColors = {
                topBorder: "border-t-indigo-500",
                headerBg: "bg-indigo-50/60 text-indigo-800 border-indigo-100",
                countBadge: "bg-indigo-100/80 text-indigo-700",
                valueText: "text-indigo-600"
              };
            } else if (stage === "Negotiation") {
              laneColors = {
                topBorder: "border-t-amber-500",
                headerBg: "bg-amber-50/60 text-amber-800 border-amber-100",
                countBadge: "bg-amber-100/80 text-amber-700",
                valueText: "text-amber-600"
              };
            } else if (stage === "Won") {
              laneColors = {
                topBorder: "border-t-emerald-500",
                headerBg: "bg-emerald-50/60 text-emerald-800 border-emerald-100",
                countBadge: "bg-emerald-100/80 text-emerald-700",
                valueText: "text-emerald-600"
              };
            } else if (stage === "Lost") {
              laneColors = {
                topBorder: "border-t-rose-400",
                headerBg: "bg-rose-50/50 text-rose-800 border-rose-100",
                countBadge: "bg-rose-100/80 text-rose-700",
                valueText: "text-rose-500"
              };
            }

            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="flex-1 min-w-[240px] bg-slate-50/60 border border-slate-200 rounded-2xl flex flex-col max-h-[70vh] shadow-sm transition-all hover:bg-slate-50/80"
                id={`kanban-lane-${stage}`}
              >
                {/* Lane Header */}
                <div 
                   className={`p-3.5 rounded-t-2xl border-t-4 ${laneColors.topBorder} ${laneColors.headerBg} border-b flex flex-col gap-1.5`}
                  id={`kanban-lane-header-${stage}`}
                >
                  <div className="flex items-center justify-between" id={`lane-info-${stage}`}>
                    <span className="font-extrabold text-xs md:text-sm tracking-tight">{stage}</span>
                    <span className={`px-2 py-0.5 border rounded-lg text-xs font-mono font-black ${laneColors.countBadge}`}>
                      {stageClients.length}
                    </span>
                  </div>
                  
                  {/* Total financial value of the stage */}
                  <div className="flex items-center justify-between text-[10px] font-bold" id={`lane-finance-${stage}`}>
                    <span className="text-slate-400 uppercase tracking-wider">Total Value</span>
                    <span className={`font-black ${laneColors.valueText}`}>
                      {totalStageValue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Cards list container */}
                <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[300px]" id={`kanban-cards-list-${stage}`}>
                  {stageClients.length > 0 ? (
                    stageClients.map((client) => {
                      const pendingTasks = (client.tasks || []).filter(t => !t.completed).length;

                      return (
                        <div
                          key={client.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, client.id)}
                          onClick={() => onClientClick(client)}
                          className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group relative space-y-3"
                          id={`kanban-card-${client.id}`}
                        >
                          {/* Client Header */}
                          <div id={`card-header-${client.id}`}>
                            <span className="text-[9px] font-mono font-bold text-slate-400 block">
                              ID: {client.id.substring(0, 5)}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xs md:text-sm mt-0.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {client.name}
                            </h4>
                          </div>

                          {/* Company / Value section */}
                          <div className="border-t border-slate-100 pt-2 text-xs text-slate-500 space-y-1.5" id={`card-meta-${client.id}`}>
                            {client.company && (
                              <div className="flex items-center gap-1.5 text-slate-600 font-semibold" id={`company-${client.id}`}>
                                <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{client.company}</span>
                              </div>
                            )}

                            {client.value > 0 && (
                              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 border border-emerald-100 px-1.5 py-0.5 rounded-lg w-max font-bold text-[11px]" id={`value-${client.id}`}>
                                <DollarSign className="h-3 w-3 text-emerald-600" />
                                <span>{client.value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer with note count / pending tasks */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400 font-bold" id={`card-footer-${client.id}`}>
                            <div className="flex items-center gap-2" id={`stats-${client.id}`}>
                              {client.notes && client.notes.length > 0 && (
                                <span className="flex items-center gap-1 bg-slate-50 border rounded p-1" title="Registered notes">
                                  📝 {client.notes.length}
                                </span>
                              )}
                              {pendingTasks > 0 && (
                                <span className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 rounded p-1 text-amber-700" title="Pending tasks">
                                  ⏰ {pendingTasks}
                                </span>
                              )}
                            </div>

                            {/* visual column shifting controls for mobile / accessibility */}
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()} id={`shift-controls-${client.id}`}>
                              {onEditClientClick && (
                                <button
                                  onClick={() => onEditClientClick(client)}
                                  className="p-1 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-slate-500 hover:text-indigo-600 transition-all"
                                  title="Edit client"
                                  id={`edit-card-${client.id}`}
                                >
                                  <FileEdit className="h-3 w-3" />
                                </button>
                              )}
                              {onDeleteClient && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
                                      onDeleteClient(client.id);
                                    }
                                  }}
                                  className="p-1 border border-slate-200 hover:border-rose-400 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition-all"
                                  title="Delete client"
                                  id={`delete-card-${client.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                              {STAGES.indexOf(stage) > 0 && (
                                <button
                                  onClick={() => onUpdateClientStage(client.id, STAGES[STAGES.indexOf(stage) - 1])}
                                  className="p-1 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                  title="Move to previous stage"
                                  id={`shift-prev-${client.id}`}
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {STAGES.indexOf(stage) < STAGES.length - 1 && (
                                <button
                                  onClick={() => onUpdateClientStage(client.id, STAGES[STAGES.indexOf(stage) + 1])}
                                  className="p-1 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                  title="Move to next stage"
                                  id={`shift-next-${client.id}`}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 bg-white/40 rounded-xl" id={`empty-stage-placeholder-${stage}`}>
                      No clients in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
