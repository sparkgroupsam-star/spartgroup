export type ColumnType = "string" | "number" | "boolean" | "date";

export interface ColumnSchema {
  name: string;
  key: string;
  type: ColumnType;
  isCustom?: boolean; // If user added it in our app
}

export interface RowData {
  [key: string]: any;
}

export interface Sheet {
  name: string;
  columns: ColumnSchema[];
  rows: RowData[];
}

export interface SpreadsheetState {
  fileName: string;
  sheets: Sheet[];
  activeSheetIndex: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: string;
}

export interface BusinessTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  sheets: Sheet[];
}

export interface ClientNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface ClientTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface CRMClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number; // estimated deal size
  stage: "Prospecto" | "Contactado" | "Negociación" | "Ganado" | "Perdido";
  notes: ClientNote[];
  tasks: ClientTask[];
  createdAt: string;
  updatedAt: string;

  // Multi-tab Excel Extended fields
  category?: "event_tracker" | "clientes_pendientes" | "daily_event_planner" | "event_marketing";
  
  // Event Tracker fields
  address?: string;      // direccion
  location?: string;     // locacion
  eventDate?: string;    // fecha (used in tracker, planner, marketing)
  eventHours?: string;   // horas contratadas
  startTime?: string;    // star time
  endTime?: string;      // end time
  robot?: string;        // robot
  djNeeded?: string;     // dj needed
  helper?: string;       // helper / ayudante / vendedor
  eventType?: string;    // type event / event type / descripcion
  equipment?: string;    // equipement / equipment

  // Clientes Pendientes fields
  contractStatus?: string; // contract status
  invoiceSent?: string;    // invoice send
  info?: string;           // informacion

  // Event Marketing fields
  marketingStaff?: string; // required/staff
  marketingValue?: string; // value/cost
}

