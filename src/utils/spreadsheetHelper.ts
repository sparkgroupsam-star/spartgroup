import * as XLSX from "xlsx";
import { Sheet, ColumnSchema, RowData, BusinessTemplate, ColumnType } from "../types";

// Detect column types based on row values
export function detectColumnSchema(headers: string[], rows: RowData[]): ColumnSchema[] {
  return headers.map((header) => {
    let type: ColumnType = "string";
    const sampleValues = rows
      .slice(0, 10)
      .map((row) => row[header])
      .filter((val) => val !== undefined && val !== null && val !== "");

    if (sampleValues.length > 0) {
      // Check if all are numbers
      const isAllNumbers = sampleValues.every((val) => {
        if (typeof val === "number") return true;
        const num = Number(val);
        return !isNaN(num) && val !== "";
      });

      if (isAllNumbers) {
        type = "number";
      } else {
        // Check if all are dates
        const isAllDates = sampleValues.every((val) => {
          if (val instanceof Date) return true;
          if (typeof val === "string") {
            const dateParsed = Date.parse(val);
            // Ignore small integers parsed as timestamp
            return !isNaN(dateParsed) && isNaN(Number(val)) && val.length > 5;
          }
          return false;
        });
        if (isAllDates) {
          type = "date";
        } else {
          const isAllBooleans = sampleValues.every((val) => {
            if (typeof val === "boolean") return true;
            const str = String(val).toLowerCase();
            return str === "true" || str === "false" || str === "sí" || str === "si" || str === "no";
          });
          if (isAllBooleans) {
            type = "boolean";
          }
        }
      }
    }

    return {
      name: header,
      key: header,
      type,
    };
  });
}

// Read an uploaded file and convert to Sheet format
export function parseExcelFile(file: File): Promise<Sheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return reject(new Error("No se pudo leer el archivo."));
        
        const workbook = XLSX.read(data, { type: "array" });
        const sheets: Sheet[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Get raw JSON containing header row
          const jsonData = XLSX.utils.sheet_to_json<RowData>(worksheet, { defval: "" });

          if (jsonData.length > 0) {
            // Get all headers from keys of the first row or of all rows combined
            const headersSet = new Set<string>();
            jsonData.forEach((row) => {
              Object.keys(row).forEach((key) => headersSet.add(key));
            });
            const headers = Array.from(headersSet);

            const columns = detectColumnSchema(headers, jsonData);
            sheets.push({
              name: sheetName,
              columns,
              rows: jsonData,
            });
          }
        });

        if (sheets.length === 0) {
          reject(new Error("La hoja de cálculo está vacía o no tiene formato válido."));
        } else {
          resolve(sheets);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsArrayBuffer(file);
  });
}

// Export sheet data back to .xlsx
export function exportToExcel(sheets: Sheet[], fileName: string) {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Standardize rows for sheetjs
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)); // sheet names limited to 31 chars
  });

  XLSX.writeFile(wb, `${fileName.replace(/\.[^/.]+$/, "")}_sistematizado.xlsx`);
}

// Calculate summary indicators for a sheet
export function getSheetMetrics(sheet: Sheet) {
  const rowCount = sheet.rows.length;
  
  // Find numeric columns
  const numericColumns = sheet.columns.filter((col) => col.type === "number");
  
  // Find status/categorical columns
  const categoricalColumns = sheet.columns.filter((col) => col.type === "string");

  const numericSummaries = numericColumns.map((col) => {
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let validCount = 0;

    sheet.rows.forEach((row) => {
      const val = Number(row[col.key]);
      if (!isNaN(val) && row[col.key] !== "") {
        sum += val;
        if (val < min) min = val;
        if (val > max) max = val;
        validCount++;
      }
    });

    return {
      key: col.key,
      name: col.name,
      sum: validCount > 0 ? sum : 0,
      avg: validCount > 0 ? sum / validCount : 0,
      min: validCount > 0 ? min : 0,
      max: validCount > 0 ? max : 0,
    };
  });

  // Calculate categorical distribution for top columns (columns with fewer than 15 unique values)
  const distributions = categoricalColumns.map((col) => {
    const counts: { [value: string]: number } = {};
    sheet.rows.forEach((row) => {
      const val = String(row[col.key] || "Vacio").trim();
      counts[val] = (counts[val] || 0) + 1;
    });

    const data = Object.keys(counts).map((value) => ({
      name: value,
      value: counts[value],
    })).sort((a, b) => b.value - a.value);

    return {
      key: col.key,
      name: col.name,
      uniqueCount: data.length,
      data: data, // Array of { name, value }
    };
  }).filter((dist) => dist.uniqueCount > 1 && dist.uniqueCount <= 12); // Keep only useful columns

  return {
    rowCount,
    numericSummaries,
    distributions,
  };
}

// Generate default mock business templates in Spanish
export function getBusinessTemplates(): BusinessTemplate[] {
  return [
    {
      id: "ventas_pedidos",
      name: "Control de Ventas y Pedidos",
      description: "Optimiza el seguimiento de clientes, pedidos de productos, montos totales, estados de entrega y prioridades.",
      icon: "ShoppingCart",
      sheets: [
        {
          name: "Pedidos Realizados",
          columns: [
            { name: "ID Pedido", key: "ID Pedido", type: "string" },
            { name: "Fecha", key: "Fecha", type: "date" },
            { name: "Cliente", key: "Cliente", type: "string" },
            { name: "Producto", key: "Producto", type: "string" },
            { name: "Categoría", key: "Categoría", type: "string" },
            { name: "Cantidad", key: "Cantidad", type: "number" },
            { name: "Precio Unitario", key: "Precio Unitario", type: "number" },
            { name: "Total", key: "Total", type: "number" },
            { name: "Estado", key: "Estado", type: "string" },
            { name: "Prioridad", key: "Prioridad", type: "string" },
            { name: "Vendedor", key: "Vendedor", type: "string" },
            { name: "Notas", key: "Notas", type: "string" },
          ],
          rows: [
            { "ID Pedido": "PED-2026-001", "Fecha": "2026-06-10", "Cliente": "Inversiones Alianza S.A.", "Producto": "Laptop Premium Pro", "Categoría": "Tecnología", "Cantidad": 5, "Precio Unitario": 1200, "Total": 6000, "Estado": "Completado", "Prioridad": "Alta", "Vendedor": "Andrés Gómez", "Notas": "Entregado a oficina central." },
            { "ID Pedido": "PED-2026-002", "Fecha": "2026-06-12", "Cliente": "Sofía Mendoza", "Producto": "Monitor Curvo 32\"", "Categoría": "Tecnología", "Cantidad": 2, "Precio Unitario": 350, "Total": 700, "Estado": "En Proceso", "Prioridad": "Media", "Vendedor": "Elena Ruiz", "Notas": "Cliente solicitó envío exprés." },
            { "ID Pedido": "PED-2026-003", "Fecha": "2026-06-15", "Cliente": "Constructora Bolívar", "Producto": "Silla Ergonómica Ejecutiva", "Categoría": "Mobiliario", "Cantidad": 15, "Precio Unitario": 180, "Total": 2700, "Estado": "Pendiente", "Prioridad": "Alta", "Vendedor": "Andrés Gómez", "Notas": "Requiere ensamblaje en sitio." },
            { "ID Pedido": "PED-2026-004", "Fecha": "2026-06-18", "Cliente": "Clínica San Rafael", "Producto": "Escritorio L-Shape", "Categoría": "Mobiliario", "Cantidad": 4, "Precio Unitario": 280, "Total": 1120, "Estado": "Completado", "Prioridad": "Baja", "Vendedor": "Carlos Ortiz", "Notas": "Entregado con factura de crédito." },
            { "ID Pedido": "PED-2026-005", "Fecha": "2026-06-20", "Cliente": "Librería El Saber", "Producto": "Pack Papelería Corporativa", "Categoría": "Suministros", "Cantidad": 50, "Precio Unitario": 12, "Total": 600, "Estado": "En Proceso", "Prioridad": "Media", "Vendedor": "Elena Ruiz", "Notas": "Entrega parcial programada." },
            { "ID Pedido": "PED-2026-006", "Fecha": "2026-06-22", "Cliente": "Mauricio Delgado", "Producto": "Teclado Mecánico RGB", "Categoría": "Tecnología", "Cantidad": 1, "Precio Unitario": 85, "Total": 85, "Estado": "Pendiente", "Prioridad": "Baja", "Vendedor": "Carlos Ortiz", "Notas": "Pendiente de confirmar pago." },
            { "ID Pedido": "PED-2026-007", "Fecha": "2026-06-23", "Cliente": "Restaurante Delicias", "Producto": "Mesa Cafetería Roble", "Categoría": "Mobiliario", "Cantidad": 6, "Precio Unitario": 150, "Total": 900, "Estado": "Pendiente", "Prioridad": "Alta", "Vendedor": "Andrés Gómez", "Notas": "Urgente antes de inauguración." },
            { "ID Pedido": "PED-2026-008", "Fecha": "2026-06-24", "Cliente": "Colegio San Ignacio", "Producto": "Impresora Láser Multifuncional", "Categoría": "Tecnología", "Cantidad": 3, "Precio Unitario": 400, "Total": 1200, "Estado": "En Proceso", "Prioridad": "Media", "Vendedor": "Elena Ruiz", "Notas": "Revisar stock de tóners adicionales." }
          ]
        }
      ]
    },
    {
      id: "inventario_reabastecimiento",
      name: "Gestión de Inventario y Reabastecimiento",
      description: "Organiza tus productos, controla el stock actual versus los límites mínimos, costos, precios de venta y estados de alerta de compra.",
      icon: "Package",
      sheets: [
        {
          name: "Productos en Almacén",
          columns: [
            { name: "SKU", key: "SKU", type: "string" },
            { name: "Nombre del Producto", key: "Nombre del Producto", type: "string" },
            { name: "Categoría", key: "Categoría", type: "string" },
            { name: "Stock Actual", key: "Stock Actual", type: "number" },
            { name: "Stock Mínimo", key: "Stock Mínimo", type: "number" },
            { name: "Precio de Compra ($)", key: "Precio de Compra ($)", type: "number" },
            { name: "Precio de Venta ($)", key: "Precio de Venta ($)", type: "number" },
            { name: "Estado Alerta", key: "Estado Alerta", type: "string" },
            { name: "Proveedor", key: "Proveedor", type: "string" },
            { name: "Ubicación Pasillo", key: "Ubicación Pasillo", type: "string" }
          ],
          rows: [
            { "SKU": "TEC-LAP-01", "Nombre del Producto": "Laptop Premium Pro", "Categoría": "Tecnología", "Stock Actual": 12, "Stock Mínimo": 5, "Precio de Compra ($)": 850, "Precio de Venta ($)": 1200, "Estado Alerta": "Suficiente", "Proveedor": "TechDistribuidora Ltda", "Ubicación Pasillo": "Pasillo A - Estante 2" },
            { "SKU": "TEC-MON-02", "Nombre del Producto": "Monitor Curvo 32\"", "Categoría": "Tecnología", "Stock Actual": 3, "Stock Mínimo": 4, "Precio de Compra ($)": 230, "Precio de Venta ($)": 350, "Estado Alerta": "Reabastecer", "Proveedor": "VisualGlobal SA", "Ubicación Pasillo": "Pasillo A - Estante 4" },
            { "SKU": "MOB-SIL-03", "Nombre del Producto": "Silla Ergonómica Ejecutiva", "Categoría": "Mobiliario", "Stock Actual": 8, "Stock Mínimo": 10, "Precio de Compra ($)": 110, "Precio de Venta ($)": 180, "Estado Alerta": "Reabastecer", "Proveedor": "Muebles del Futuro S.A.", "Ubicación Pasillo": "Pasillo B - Fondo" },
            { "SKU": "MOB-ESC-04", "Nombre del Producto": "Escritorio L-Shape", "Categoría": "Mobiliario", "Stock Actual": 5, "Stock Mínimo": 3, "Precio de Compra ($)": 180, "Precio de Venta ($)": 280, "Estado Alerta": "Suficiente", "Proveedor": "Muebles del Futuro S.A.", "Ubicación Pasillo": "Pasillo B - Lado Sur" },
            { "SKU": "TEC-TEC-05", "Nombre del Producto": "Teclado Mecánico RGB", "Categoría": "Tecnología", "Stock Actual": 25, "Stock Mínimo": 8, "Precio de Compra ($)": 45, "Precio de Venta ($)": 85, "Estado Alerta": "Suficiente", "Proveedor": "Perifericos Express", "Ubicación Pasillo": "Pasillo A - Estante 5" },
            { "SKU": "SUM-PAP-06", "Nombre del Producto": "Pack Papelería Corporativa", "Categoría": "Suministros", "Stock Actual": 110, "Stock Mínimo": 30, "Precio de Compra ($)": 6, "Precio de Venta ($)": 12, "Estado Alerta": "Suficiente", "Proveedor": "EcoPapelera Corp", "Ubicación Pasillo": "Pasillo C - Estante 1" },
            { "SKU": "TEC-IMP-07", "Nombre del Producto": "Impresora Láser Multifuncional", "Categoría": "Tecnología", "Stock Actual": 1, "Stock Mínimo": 3, "Precio de Compra ($)": 280, "Precio de Venta ($)": 400, "Estado Alerta": "Urgente", "Proveedor": "VisualGlobal SA", "Ubicación Pasillo": "Pasillo A - Estante 1" },
            { "SKU": "TEC-AUD-08", "Nombre del Producto": "Audífonos Bluetooth Premium", "Categoría": "Tecnología", "Stock Actual": 0, "Stock Mínimo": 6, "Precio de Compra ($)": 65, "Precio de Venta ($)": 110, "Estado Alerta": "Urgente", "Proveedor": "Perifericos Express", "Ubicación Pasillo": "Pasillo A - Estante 5" }
          ]
        }
      ]
    },
    {
      id: "presupuesto_gastos",
      name: "Control de Gastos y Presupuesto",
      description: "Sistematiza el registro de gastos por categoría, fechas, métodos de pago y estados para un control financiero ágil.",
      icon: "DollarSign",
      sheets: [
        {
          name: "Gastos Mensuales",
          columns: [
            { name: "ID Gasto", key: "ID Gasto", type: "string" },
            { name: "Fecha", key: "Fecha", type: "date" },
            { name: "Descripción", key: "Descripción", type: "string" },
            { name: "Categoría", key: "Categoría", type: "string" },
            { name: "Monto ($)", key: "Monto ($)", type: "number" },
            { name: "Método de Pago", key: "Método de Pago", type: "string" },
            { name: "Estado Pago", key: "Estado Pago", type: "string" },
            { name: "Factura Asociada", key: "Factura Asociada", type: "string" },
            { name: "Notas", key: "Notas", type: "string" }
          ],
          rows: [
            { "ID Gasto": "GST-2026-001", "Fecha": "2026-06-01", "Descripción": "Alquiler de Oficinas", "Categoría": "Oficina", "Monto ($)": 1500, "Método de Pago": "Transferencia", "Estado Pago": "Pagado", "Factura Asociada": "F-8890", "Notas": "Mes de Junio anticipado." },
            { "ID Gasto": "GST-2026-002", "Fecha": "2026-06-03", "Descripción": "Suscripción Nube AWS", "Categoría": "Software/TI", "Monto ($)": 345, "Método de Pago": "Tarjeta Crédito", "Estado Pago": "Pagado", "Factura Asociada": "AWS-2026-06", "Notas": "Cargado automáticamente." },
            { "ID Gasto": "GST-2026-003", "Fecha": "2026-06-05", "Descripción": "Suministros de Oficina Varios", "Categoría": "Materiales", "Monto ($)": 120, "Método de Pago": "Tarjeta Débito", "Estado Pago": "Pagado", "Factura Asociada": "F-PAP-102", "Notas": "Comprado en papelería local." },
            { "ID Gasto": "GST-2026-004", "Fecha": "2026-06-10", "Descripción": "Honorarios Asesoría Legal", "Categoría": "Servicios Profesionales", "Monto ($)": 800, "Método de Pago": "Transferencia", "Estado Pago": "Pendiente", "Factura Asociada": "F-ALEGAL-55", "Notas": "Pagar antes de fin de mes." },
            { "ID Gasto": "GST-2026-005", "Fecha": "2026-06-12", "Descripción": "Publicidad Meta Ads", "Categoría": "Marketing", "Monto ($)": 450, "Método de Pago": "Tarjeta Crédito", "Estado Pago": "Pagado", "Factura Asociada": "META-JUNIO-01", "Notas": "Campaña de Lanzamiento." },
            { "ID Gasto": "GST-2026-006", "Fecha": "2026-06-15", "Descripción": "Servicio de Internet Fibra", "Categoría": "Oficina", "Monto ($)": 95, "Método de Pago": "Débito Automático", "Estado Pago": "Pagado", "Factura Asociada": "NET-99120", "Notas": "Proveedor NetLine S.A." },
            { "ID Gasto": "GST-2026-007", "Fecha": "2026-06-18", "Descripción": "Refrigerios Reunión Directiva", "Categoría": "Eventos", "Monto ($)": 180, "Método de Pago": "Caja Chica", "Estado Pago": "Pagado", "Factura Asociada": "R-1092-REFRIG", "Notas": "Comida y bebidas para 10 personas." },
            { "ID Gasto": "GST-2026-008", "Fecha": "2026-06-22", "Descripción": "Licencias Office 365", "Categoría": "Software/TI", "Monto ($)": 210, "Método de Pago": "Tarjeta Crédito", "Estado Pago": "Pendiente", "Factura Asociada": "MSFT-881290", "Notas": "Suscripción anual pendiente renovación." }
          ]
        }
      ]
    }
  ];
}
