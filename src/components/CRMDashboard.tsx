import React, { useMemo } from "react";
import { 
  DollarSign, Users, CheckCircle2, TrendingUp, AlertCircle, 
  Calendar, ArrowRight, UserCheck, Percent, HelpCircle, Briefcase, Activity
} from "lucide-react";
import { CRMClient, ClientTask } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid 
} from "recharts";

interface CRMDashboardProps {
  clients: CRMClient[];
  onClientClick: (client: CRMClient) => void;
}

export default function CRMDashboard({ clients, onClientClick }: CRMDashboardProps) {
  
  // Real-time calculated metrics
  const stats = useMemo(() => {
    const totalClients = clients.length;
    
    // Counts per category
    const trackerCount = clients.filter(c => c.category === "event_tracker").length;
    const pendingCount = clients.filter(c => c.category === "clientes_pendientes").length;
    const plannerCount = clients.filter(c => c.category === "daily_event_planner").length;
    const marketingCount = clients.filter(c => c.category === "event_marketing").length;
    
    // Active pipeline count (not Won or Lost)
    const activeClients = clients.filter(c => c.stage !== "Ganado" && c.stage !== "Perdido").length;

    // Compile list of upcoming pending tasks with client info attached
    const upcomingTasks: { task: ClientTask; client: CRMClient }[] = [];
    clients.forEach(client => {
      if (client.tasks) {
        client.tasks.forEach(task => {
          if (!task.completed) {
            upcomingTasks.push({ task, client });
          }
        });
      }
    });

    // Sort upcoming tasks by due date ascending
    const sortedTasks = upcomingTasks.sort((a, b) => {
      return new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime();
    }).slice(0, 5); // top 5

    return {
      totalClients,
      activeClients,
      trackerCount,
      pendingCount,
      plannerCount,
      marketingCount,
      sortedTasks
    };
  }, [clients]);

  // Stage distribution data for Recharts Bar/Pie Charts
  const stageChartData = useMemo(() => {
    const counts = {
      Prospecto: 0,
      Contactado: 0,
      Negociación: 0,
      Ganado: 0,
      Perdido: 0
    };

    const values = {
      Prospecto: 0,
      Contactado: 0,
      Negociación: 0,
      Ganado: 0,
      Perdido: 0
    };

    clients.forEach(c => {
      if (counts[c.stage] !== undefined) {
        counts[c.stage] += 1;
        values[c.stage] += c.value || 0;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      Cantidad: counts[key as keyof typeof counts],
      Valor: values[key as keyof typeof values]
    }));
  }, [clients]);

  // Colors matching our Stage Badges
  const COLORS = {
    Prospecto: "#38bdf8",   // sky
    Contactado: "#4f46e5",  // indigo
    Negociación: "#f59e0b", // amber
    Ganado: "#10b981",      // emerald
    Perdido: "#ef4444"       // rose
  };

  const pieChartData = useMemo(() => {
    return stageChartData
      .filter(item => item.Cantidad > 0)
      .map(item => ({
        name: item.name,
        value: item.Cantidad,
        color: COLORS[item.name as keyof typeof COLORS]
      }));
  }, [stageChartData]);

  return (
    <div className="space-y-6 animate-fade-in" id="crm-dashboard-wrapper">
      {/* Dynamic Key metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {/* Total Clients card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex items-center justify-between text-white" id="metric-total-clients">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Registros Totales</span>
            <span className="text-3xl font-black text-white leading-none">{stats.totalClients}</span>
            <span className="text-[10px] text-slate-400 block font-bold">
              {stats.activeClients} seguimientos activos
            </span>
          </div>
          <div className="h-12 w-12 bg-slate-800 border border-slate-700 text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Event Tracker count card */}
        <div className="p-5 bg-indigo-600 border border-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/15 flex items-center justify-between text-white" id="metric-event-tracker">
          <div className="space-y-1.5">
            <span className="text-[10px] text-indigo-100 font-extrabold uppercase tracking-wider block">Event Tracker</span>
            <span className="text-3xl font-black text-white leading-none">{stats.trackerCount}</span>
            <span className="text-[10px] text-indigo-200 block font-bold">Eventos bajo control</span>
          </div>
          <div className="h-12 w-12 bg-indigo-700/50 border border-indigo-500/50 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Clients card */}
        <div className="p-5 bg-emerald-600 border border-emerald-500 rounded-2xl shadow-lg shadow-emerald-600/15 flex items-center justify-between text-white" id="metric-pending-clients">
          <div className="space-y-1.5">
            <span className="text-[10px] text-emerald-100 font-extrabold uppercase tracking-wider block">Clientes Pendientes</span>
            <span className="text-3xl font-black text-white leading-none">{stats.pendingCount}</span>
            <span className="text-[10px] text-emerald-200 block font-bold">Esperando confirmación</span>
          </div>
          <div className="h-12 w-12 bg-emerald-700/50 border border-emerald-500/50 text-white rounded-xl flex items-center justify-center shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Daily Planner & Marketing card */}
        <div className="p-5 bg-amber-500 border border-amber-400 rounded-2xl shadow-lg shadow-amber-500/15 flex items-center justify-between text-white" id="metric-planner-marketing">
          <div className="space-y-1.5">
            <span className="text-[10px] text-amber-50 font-extrabold uppercase tracking-wider block">Planner y Marketing</span>
            <span className="text-3xl font-black text-white leading-none">{stats.plannerCount + stats.marketingCount}</span>
            <span className="text-[10px] text-amber-100 block font-bold">{stats.plannerCount} planificados | {stats.marketingCount} de mercadeo</span>
          </div>
          <div className="h-12 w-12 bg-amber-600/50 border border-amber-400/50 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Reminders Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-graphics">
        
        {/* Stage Distribution (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4" id="pipeline-values-chart-panel">
          <div className="flex items-center justify-between" id="chart-head-val">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-500" /> Cantidad de Eventos por Etapa
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">Distribución real de registros en el embudo de control</p>
            </div>
            <span className="px-2 py-0.5 bg-slate-50 border rounded-lg text-[10px] font-mono text-slate-400 font-bold">Unidades</span>
          </div>

          <div className="h-64" id="bar-chart-container">
            {clients.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "rgba(79, 70, 229, 0.08)" }}
                    contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}
                    labelStyle={{ color: "#0f172a" }}
                    itemStyle={{ color: "#4f46e5" }}
                    formatter={(value) => [value, "Cantidad"]}
                  />
                  <Bar dataKey="Cantidad" radius={[8, 8, 0, 0]} fill="#6366f1">
                    {stageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Registra clientes para ver este gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Client Stage Distribution (Pie Chart) */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4" id="distribution-pie-chart-panel">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> Distribución de Contactos
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">División por estados de tu embudo de ventas</p>
          </div>

          <div className="h-48 relative" id="pie-chart-container">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}
                    labelStyle={{ color: "#0f172a" }}
                    itemStyle={{ color: "#4f46e5" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hay datos disponibles.
              </div>
            )}
            
            {/* Visual indicator in middle of donut */}
            {clients.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-xl font-black text-slate-800">{clients.length}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Clientes</span>
              </div>
            )}
          </div>

          {/* Simple custom legends */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold" id="custom-pie-legends">
            {stageChartData.map((stage) => (
              <div key={stage.name} className="flex items-center gap-1.5" id={`leg-${stage.name}`}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[stage.name as keyof typeof COLORS] }} />
                <span className="text-slate-500 truncate">{stage.name} ({stage.Cantidad})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Follow-up / Tasks agenda section */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4" id="agenda-reminders-panel">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" /> Próximas Tareas y Agenda de Seguimiento
          </h4>
          <p className="text-[11px] text-slate-400 font-medium">Llamadas y tareas de clientes ordenadas por vencimiento</p>
        </div>

        <div className="divide-y divide-slate-100" id="agenda-tasks-list">
          {stats.sortedTasks.length > 0 ? (
            stats.sortedTasks.map(({ task, client }) => {
              const isOverdue = new Date(task.dueDate + "T23:59:59").getTime() < Date.now();
              return (
                <div 
                  key={task.id}
                  onClick={() => onClientClick(client)}
                  className="py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-all rounded-xl px-2.5 group"
                  id={`agenda-task-row-${task.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        Cliente: <span className="text-slate-800 font-extrabold">{client.name}</span> {client.company ? `(${client.company})` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold" id={`agenda-task-meta-${task.id}`}>
                    <span className={`px-2 py-0.5 rounded-lg border font-mono ${
                      isOverdue 
                        ? "bg-rose-50 text-rose-700 border-rose-200 font-black animate-pulse" 
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`} id={`task-due-badge-${task.id}`}>
                      {isOverdue ? "⚠️ Vencido: " : "⏰ Vence: "}
                      {new Date(task.dueDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl bg-slate-50/30" id="agenda-empty-state">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
              <p className="font-bold text-slate-700">¡Agenda de seguimiento vacía!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ve al detalle de cualquier cliente y añade una tarea para programar una alerta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
