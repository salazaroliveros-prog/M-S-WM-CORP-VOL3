"use strict";

/**
 * Sistema avanzado de gestión de planillas para RRHH
 * Incluye: Ingreso manual, generación automática, múltiples formatos de exportación.
 *
 * Nota: Este script fue migrado desde el archivo "añadir a rrhh.html".
 * Puede cargarse en páginas que tengan (o no) el UI esperado; los listeners se activan
 * solo si los elementos existen.
 */

class PayrollManager {
    constructor() {
        this.currentPayroll = null;
        this.history = [];
        this.syncService = null;
    }

    createNewPayroll(period = "semanal", projectId = null) {
        this.currentPayroll = {
            id: this.generatePayrollId(),
            period,
            startDate: this.getDefaultStartDate(period),
            endDate: new Date().toISOString().split("T")[0],
            projectId,
            workers: [],
            totals: {
                totalWorkers: 0,
                totalHours: 0,
                totalGross: 0,
                totalDeductions: 0,
                totalNet: 0,
            },
            status: "draft",
            syncStatus: "local",
            createdAt: new Date().toISOString(),
            notes: "",
        };

        return this.currentPayroll;
    }

    generatePayrollId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `PL-${timestamp}-${random}`.toUpperCase();
    }

    getDefaultStartDate(period) {
        const endDate = new Date();
        const startDate = new Date(endDate);

        switch (period) {
            case "semanal":
                startDate.setDate(endDate.getDate() - 6);
                break;
            case "quincenal":
                startDate.setDate(endDate.getDate() - 14);
                break;
            case "mensual":
                startDate.setMonth(endDate.getMonth() - 1);
                startDate.setDate(endDate.getDate());
                break;
            default:
                startDate.setDate(endDate.getDate() - 6);
        }

        return startDate.toISOString().split("T")[0];
    }

    addWorker(workerData) {
        if (!this.currentPayroll) {
            throw new Error("No hay planilla activa. Cree una nueva planilla primero.");
        }

        const worker = {
            id: workerData.id || `WRK-${Date.now()}`,
            name: workerData.name,
            position: workerData.position,
            projectId: workerData.projectId || this.currentPayroll.projectId,
            daysWorked: parseFloat(workerData.daysWorked) || 0,
            extraHours: parseFloat(workerData.extraHours) || 0,
            dailySalary: parseFloat(workerData.dailySalary) || this.getDefaultSalary(workerData.position),
            bonus: parseFloat(workerData.bonus) || 0,
            deductions: parseFloat(workerData.deductions) || 0,
            status: workerData.status || "pending",
            notes: workerData.notes || "",
        };

        worker.grossSalary = this.calculateGrossSalary(worker);
        worker.netSalary = this.calculateNetSalary(worker);

        this.currentPayroll.workers.push(worker);
        this.recalculateTotals();

        return worker;
    }

    calculateGrossSalary(worker) {
        const regularSalary = worker.daysWorked * worker.dailySalary;
        const extraSalary = worker.extraHours * (worker.dailySalary / 8) * 1.5;
        return regularSalary + extraSalary + worker.bonus;
    }

    calculateNetSalary(worker) {
        return worker.grossSalary - worker.deductions;
    }

    recalculateTotals() {
        if (!this.currentPayroll || !this.currentPayroll.workers.length) {
            if (this.currentPayroll) {
                this.currentPayroll.totals = {
                    totalWorkers: 0,
                    totalHours: 0,
                    totalGross: 0,
                    totalDeductions: 0,
                    totalNet: 0,
                };
            }
            return;
        }

        const totals = {
            totalWorkers: this.currentPayroll.workers.length,
            totalHours: 0,
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
        };

        this.currentPayroll.workers.forEach((worker) => {
            totals.totalHours += worker.daysWorked * 8 + worker.extraHours;
            totals.totalGross += worker.grossSalary;
            totals.totalDeductions += worker.deductions;
            totals.totalNet += worker.netSalary;
        });

        this.currentPayroll.totals = totals;
    }

    getDefaultSalary(position) {
        const salaryTable = {
            supervisor: 250.0,
            encargado: 250.0,
            maestro: 200.0,
            albañil: 175.0,
            ayudante: 125.0,
            peon: 100.0,
            otros: 150.0,
        };

        const key = String(position || "").toLowerCase();
        return salaryTable[key] ?? 150.0;
    }

    saveLocal() {
        if (!this.currentPayroll) {
            throw new Error("No hay planilla para guardar");
        }

        const payrollData = JSON.stringify(this.currentPayroll, null, 2);
        const fileName = `planilla_${this.currentPayroll.id}.json`;
        this.saveToFile(payrollData, fileName, "application/json");

        this.addToHistory("json");
        return fileName;
    }

    exportToCSV() {
        if (!this.currentPayroll || !this.currentPayroll.workers.length) {
            throw new Error("No hay datos para exportar");
        }

        let csv = "ID,Nombre,Puesto,Días,Horas Extra,Salario Diario,Bonificaciones,Deducciones,Salario Bruto,Salario Neto,Estado\n";

        this.currentPayroll.workers.forEach((worker) => {
            csv += `"${worker.id}","${worker.name}","${worker.position}",`;
            csv += `${worker.daysWorked},${worker.extraHours},${worker.dailySalary},`;
            csv += `${worker.bonus},${worker.deductions},${worker.grossSalary},`;
            csv += `${worker.netSalary},"${worker.status}"\n`;
        });

        csv += "\n";
        csv += `Total Trabajadores,${this.currentPayroll.totals.totalWorkers}\n`;
        csv += `Total Horas,${this.currentPayroll.totals.totalHours}\n`;
        csv += `Total Bruto,${this.currentPayroll.totals.totalGross}\n`;
        csv += `Total Deducciones,${this.currentPayroll.totals.totalDeductions}\n`;
        csv += `Total Neto,${this.currentPayroll.totals.totalNet}\n`;

        const fileName = `planilla_${this.currentPayroll.id}.csv`;
        this.saveToFile(csv, fileName, "text/csv");

        this.addToHistory("csv");
        return fileName;
    }

    async generatePDF() {
        if (!this.currentPayroll) {
            throw new Error("No hay planilla para generar PDF");
        }
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error("jsPDF no está cargado en esta página");
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");

        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPos = margin;

        this.addPDFHeader(doc, pageWidth, yPos);
        yPos = 40;

        yPos = this.addPayrollInfo(doc, yPos, pageWidth);
        yPos = this.addWorkersTable(doc, yPos);
        yPos = this.addTotalsSection(doc, yPos, pageWidth);
        this.addSignatures(doc, yPos, pageWidth);
        this.addPDFFooter(doc);

        const fileName = `planilla_${this.currentPayroll.id}.pdf`;
        doc.save(fileName);

        this.addToHistory("pdf", fileName);
        return fileName;
    }

    addPDFHeader(doc, pageWidth, yPos) {
        doc.setFontSize(20);
        doc.setTextColor(26, 35, 126);
        doc.setFont("helvetica", "bold");
        doc.text("CONSTRUCTORA WM/M&S", pageWidth / 2, yPos, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(212, 160, 23);
        doc.setFont("helvetica", "italic");
        doc.text("EDIFICANDO EL FUTURO", pageWidth / 2, yPos + 7, { align: "center" });
    }

    addPayrollInfo(doc, yPos, pageWidth) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("PLANILLA DE PAGO", pageWidth / 2, yPos, { align: "center" });

        yPos += 15;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        const col1 = 20;
        const col2 = pageWidth - 20;

        doc.text(`Número: ${this.currentPayroll.id}`, col1, yPos);
        doc.text(`Período: ${String(this.currentPayroll.period).toUpperCase()}`, col2, yPos, { align: "right" });

        yPos += 6;
        doc.text(`Proyecto: ${this.currentPayroll.projectId || "No especificado"}`, col1, yPos);

        yPos += 6;
        const startDate = new Date(this.currentPayroll.startDate).toLocaleDateString("es-GT");
        const endDate = new Date(this.currentPayroll.endDate).toLocaleDateString("es-GT");
        doc.text(`Del ${startDate} al ${endDate}`, col1, yPos);
        doc.text(`Generado: ${new Date().toLocaleDateString("es-GT")}`, col2, yPos, { align: "right" });

        return yPos + 10;
    }

    addWorkersTable(doc, yPos) {
        if (typeof doc.autoTable !== "function") {
            throw new Error("jsPDF-AutoTable no está cargado en esta página");
        }

        const headers = [["#", "ID", "Nombre", "Puesto", "Días", "H.Extra", "S.Diario", "Bruto", "Neto", "Estado"]];

        const data = this.currentPayroll.workers.map((worker, index) => [
            String(index + 1),
            worker.id,
            String(worker.name || "").substring(0, 15),
            String(worker.position || "").substring(0, 10),
            String(worker.daysWorked),
            String(worker.extraHours),
            `Q${Number(worker.dailySalary).toFixed(2)}`,
            `Q${Number(worker.grossSalary).toFixed(2)}`,
            `Q${Number(worker.netSalary).toFixed(2)}`,
            worker.status === "paid" ? "Pagado" : "Pendiente",
        ]);

        doc.autoTable({
            head: headers,
            body: data,
            startY: yPos,
            theme: "grid",
            headStyles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 10, right: 10 },
            styles: { fontSize: 8, cellPadding: 3 },
        });

        return doc.lastAutoTable.finalY + 10;
    }

    addTotalsSection(doc, yPos, pageWidth) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN DE PLANILLA", 20, yPos);

        yPos += 10;
        doc.setFont("helvetica", "normal");

        const totals = [
            ["Total Trabajadores:", String(this.currentPayroll.totals.totalWorkers)],
            ["Total Horas Trabajadas:", `${this.currentPayroll.totals.totalHours.toFixed(1)} horas`],
            ["Total Salario Bruto:", `Q ${this.currentPayroll.totals.totalGross.toFixed(2)}`],
            ["Total Deducciones:", `Q ${this.currentPayroll.totals.totalDeductions.toFixed(2)}`],
            ["Total a Pagar (Neto):", `Q ${this.currentPayroll.totals.totalNet.toFixed(2)}`],
        ];

        totals.forEach(([label, value], index) => {
            doc.text(label, 30, yPos + index * 6);
            doc.text(value, pageWidth - 30, yPos + index * 6, { align: "right" });
        });

        return yPos + totals.length * 6 + 15;
    }

    addSignatures(doc, yPos, pageWidth) {
        doc.setFontSize(10);
        doc.text("_________________________", 50, yPos);
        doc.text("Responsable de Planilla", 50, yPos + 5);

        doc.text("_________________________", pageWidth - 50, yPos, { align: "right" });
        doc.text("Autorizado por", pageWidth - 50, yPos + 5, { align: "right" });
    }

    addPDFFooter(doc) {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            "Barrio el Centro Casco Urbano Quesada, Jutiapa | Tel: 55606172 | Email: multiserviciosdeguatemal@gmail.com",
            doc.internal.pageSize.width / 2,
            pageHeight - 10,
            { align: "center" }
        );
    }

    saveToFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    addToHistory(type, fileName = null) {
        const historyEntry = {
            id: this.currentPayroll.id,
            type,
            fileName: fileName || `planilla_${this.currentPayroll.id}.${type}`,
            date: new Date().toISOString(),
            period: this.currentPayroll.period,
            projectId: this.currentPayroll.projectId,
            totalAmount: this.currentPayroll.totals.totalNet,
            status: this.currentPayroll.status,
        };

        this.history.unshift(historyEntry);
        this.saveHistory();
        return historyEntry;
    }

    saveHistory() {
        try {
            localStorage.setItem("payrollHistory", JSON.stringify(this.history));
            localStorage.setItem("payrollHistoryLastUpdate", new Date().toISOString());
        } catch (error) {
            console.error("Error guardando historial:", error);
        }
    }

    loadHistory() {
        try {
            const savedHistory = localStorage.getItem("payrollHistory");
            if (savedHistory) {
                this.history = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error("Error cargando historial:", error);
            this.history = [];
        }
    }
}

function loadSyncConfiguration() {
    const defaultConfig = {
        enabled: false,
        service: "local",
        autoSync: false,
        syncInterval: 24,
        lastSync: null,
    };

    try {
        const raw = localStorage.getItem("payrollSyncConfig");
        const parsed = raw ? JSON.parse(raw) : null;
        window.payrollSyncConfig = parsed && typeof parsed === "object" ? { ...defaultConfig, ...parsed } : defaultConfig;
    } catch {
        window.payrollSyncConfig = defaultConfig;
    }
}

async function importFromAttendance(startDate, endDate, projectId = null) {
    const attendanceData = await getAttendanceData(startDate, endDate, projectId);

    const payroll = window.payrollManager.createNewPayroll("semanal", projectId);
    payroll.startDate = startDate;
    payroll.endDate = endDate;

    const workersMap = new Map();

    attendanceData.forEach((record) => {
        if (!workersMap.has(record.workerId)) {
            workersMap.set(record.workerId, {
                id: record.workerId,
                name: record.workerName,
                position: record.position,
                projectId: record.projectId,
                daysWorked: 0,
                extraHours: 0,
                dailySalary: window.payrollManager.getDefaultSalary(record.position),
            });
        }

        const worker = workersMap.get(record.workerId);
        worker.daysWorked += record.present ? 1 : 0;
        worker.extraHours += record.extraHours || 0;
    });

    workersMap.forEach((workerData) => {
        window.payrollManager.addWorker(workerData);
    });

    window.payrollManager.recalculateTotals();
    return payroll;
}

async function getAttendanceData(startDate, endDate, projectId) {
    return [
        {
            workerId: "WRK001",
            workerName: "Juan Pérez",
            position: "albañil",
            projectId,
            date: startDate,
            present: true,
            extraHours: 2,
        },
    ];
}

function setupPayrollEvents() {
    const generateFromAttendanceBtn = document.getElementById("generateFromAttendanceBtn");
    if (generateFromAttendanceBtn) {
        generateFromAttendanceBtn.addEventListener("click", async () => {
            try {
                const startDate = document.getElementById("startDate")?.value;
                const endDate = document.getElementById("endDate")?.value;
                const projectId = document.getElementById("projectSelect")?.value;

                if (!startDate || !endDate) {
                    alert("Seleccione fechas de inicio y fin");
                    return;
                }

                const payroll = await importFromAttendance(startDate, endDate, projectId);
                updatePayrollUI(payroll);
                alert("Planilla generada desde datos de asistencia");
            } catch (error) {
                alert("Error generando planilla: " + (error?.message || String(error)));
            }
        });
    }

    const saveLocalBtn = document.getElementById("saveLocalBtn");
    if (saveLocalBtn) {
        saveLocalBtn.addEventListener("click", () => {
            try {
                const fileName = window.payrollManager.saveLocal();
                alert(`Planilla guardada como: ${fileName}`);
            } catch (error) {
                alert("Error guardando planilla: " + (error?.message || String(error)));
            }
        });
    }

    const exportCSVBtn = document.getElementById("exportCSVBtn");
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener("click", () => {
            try {
                const fileName = window.payrollManager.exportToCSV();
                alert(`Planilla exportada como CSV: ${fileName}`);
            } catch (error) {
                alert("Error exportando CSV: " + (error?.message || String(error)));
            }
        });
    }

    const generatePDFBtn = document.getElementById("generatePDFBtn");
    if (generatePDFBtn) {
        generatePDFBtn.addEventListener("click", async () => {
            try {
                const fileName = await window.payrollManager.generatePDF();
                alert(`PDF generado: ${fileName}`);
            } catch (error) {
                alert("Error generando PDF: " + (error?.message || String(error)));
            }
        });
    }
}

function updatePayrollUI(payroll) {
    const elTotalWorkers = document.getElementById("totalWorkers");
    const elTotalHours = document.getElementById("totalHours");
    const elTotalGross = document.getElementById("totalGross");
    const elTotalNet = document.getElementById("totalNet");

    if (elTotalWorkers) elTotalWorkers.textContent = String(payroll.totals.totalWorkers);
    if (elTotalHours) elTotalHours.textContent = String(payroll.totals.totalHours.toFixed(1));
    if (elTotalGross) elTotalGross.textContent = `Q ${payroll.totals.totalGross.toFixed(2)}`;
    if (elTotalNet) elTotalNet.textContent = `Q ${payroll.totals.totalNet.toFixed(2)}`;

    updatePayrollTable(payroll.workers);
}

function updatePayrollTable(workers) {
    const tbody = document.getElementById("payrollTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    workers.forEach((worker, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${worker.id}</td>
            <td>${worker.name}</td>
            <td>${worker.position}</td>
            <td>${worker.daysWorked}</td>
            <td>${worker.extraHours}</td>
            <td>Q ${Number(worker.dailySalary).toFixed(2)}</td>
            <td>Q ${Number(worker.grossSalary).toFixed(2)}</td>
            <td>Q ${Number(worker.deductions).toFixed(2)}</td>
            <td>Q ${Number(worker.netSalary).toFixed(2)}</td>
            <td>
                <select class="status-select" data-worker-id="${worker.id}">
                    <option value="pending" ${worker.status === "pending" ? "selected" : ""}>Pendiente</option>
                    <option value="approved" ${worker.status === "approved" ? "selected" : ""}>Aprobado</option>
                    <option value="paid" ${worker.status === "paid" ? "selected" : ""}>Pagado</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll(".status-select").forEach((select) => {
        select.addEventListener("change", function () {
            updateWorkerStatus(this.dataset.workerId, this.value);
        });
    });
}

function updateWorkerStatus(workerId, status) {
    const worker = window.payrollManager?.currentPayroll?.workers?.find((w) => w.id === workerId);
    if (!worker) return;

    worker.status = status;
    window.payrollManager.recalculateTotals();
    updatePayrollUI(window.payrollManager.currentPayroll);
}

// Exportar para uso global
window.PayrollManager = PayrollManager;

document.addEventListener("DOMContentLoaded", () => {
    if (!window.payrollManager) {
        window.payrollManager = new PayrollManager();
        window.payrollManager.loadHistory();
    }

    loadSyncConfiguration();
    setupPayrollEvents();
});
