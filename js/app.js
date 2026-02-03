/**
 * M&S Constructor - Sistema de Gestión de Construcción
 * Archivo principal de funcionalidades JavaScript
 */

// Base de datos local simulada
const MS_DATABASE = {
    // Inicializar base de datos
    init: function() {
        // Inicializar datos si no existen
        if (!localStorage.getItem('ms_projects')) {
            localStorage.setItem('ms_projects', JSON.stringify([]));
        }
        if (!localStorage.getItem('ms_transactions')) {
            localStorage.setItem('ms_transactions', JSON.stringify([]));
        }
        if (!localStorage.getItem('ms_budgets')) {
            localStorage.setItem('ms_budgets', JSON.stringify([]));
        }
        if (!localStorage.getItem('ms_employees')) {
            localStorage.setItem('ms_employees', JSON.stringify([]));
        }
        if (!localStorage.getItem('ms_purchases')) {
            localStorage.setItem('ms_purchases', JSON.stringify([]));
        }
        if (!localStorage.getItem('ms_settings')) {
            localStorage.setItem('ms_settings', JSON.stringify({
                companyName: 'CONSTRUCTORA WM/M&S',
                slogan: 'EDIFICANDO EL FUTURO',
                address: 'Barrio el Centro Casco Urbano Quesada Jutiapa',
                phone: '55606172',
                email: 'multiserviciosdeguatemal@gmail.com',
                currency: 'GTQ',
                ivaRate: 12,
                defaultAUI: {
                    administration: 20,
                    utility: 12,
                    contingencies: 3
                }
            }));
        }
    },

    // Métodos para proyectos
    projects: {
        getAll: function() {
            return JSON.parse(localStorage.getItem('ms_projects')) || [];
        },
        
        getById: function(id) {
            const projects = this.getAll();
            return projects.find(p => p.id === id);
        },
        
        save: function(project) {
            const projects = this.getAll();
            
            if (project.id) {
                // Actualizar proyecto existente
                const index = projects.findIndex(p => p.id === project.id);
                if (index !== -1) {
                    projects[index] = project;
                }
            } else {
                // Crear nuevo proyecto
                project.id = 'PROJ_' + Date.now();
                project.createdAt = new Date().toISOString();
                project.status = 'pending'; // pending, active, completed, cancelled
                projects.push(project);
            }
            
            localStorage.setItem('ms_projects', JSON.stringify(projects));
            return project;
        },
        
        delete: function(id) {
            const projects = this.getAll();
            const filteredProjects = projects.filter(p => p.id !== id);
            localStorage.setItem('ms_projects', JSON.stringify(filteredProjects));
            return true;
        }
    },

    // Métodos para transacciones
    transactions: {
        getAll: function() {
            return JSON.parse(localStorage.getItem('ms_transactions')) || [];
        },
        
        getByProject: function(projectId) {
            const transactions = this.getAll();
            return transactions.filter(t => t.projectId === projectId);
        },
        
        save: function(transaction) {
            const transactions = this.getAll();
            
            if (!transaction.id) {
                transaction.id = 'TRX_' + Date.now();
                transaction.createdAt = new Date().toISOString();
            }
            
            transactions.push(transaction);
            localStorage.setItem('ms_transactions', JSON.stringify(transactions));
            return transaction;
        }
    },

    // Métodos para presupuestos
    budgets: {
        getAll: function() {
            return JSON.parse(localStorage.getItem('ms_budgets')) || [];
        },
        
        getByProject: function(projectId) {
            const budgets = this.getAll();
            return budgets.find(b => b.projectId === projectId);
        },
        
        save: function(budget) {
            const budgets = this.getAll();
            
            if (budget.id) {
                // Actualizar presupuesto existente
                const index = budgets.findIndex(b => b.id === budget.id);
                if (index !== -1) {
                    budgets[index] = budget;
                }
            } else {
                // Crear nuevo presupuesto
                budget.id = 'BUD_' + Date.now();
                budget.createdAt = new Date().toISOString();
                budgets.push(budget);
            }
            
            localStorage.setItem('ms_budgets', JSON.stringify(budgets));
            return budget;
        }
    },

    // Métodos para sincronización
    sync: {
        // Exportar datos a CSV
        exportToCSV: function(data, filename) {
            if (!data || data.length === 0) {
                console.error('No hay datos para exportar');
                return;
            }
            
            // Convertir a CSV
            const headers = Object.keys(data[0]);
            const csvRows = [];
            
            // Agregar encabezados
            csvRows.push(headers.join(','));
            
            // Agregar filas
            for (const row of data) {
                const values = headers.map(header => {
                    const value = row[header];
                    // Manejar valores con comas
                    return typeof value === 'string' && value.includes(',') ? 
                        `"${value}"` : value;
                });
                csvRows.push(values.join(','));
            }
            
            // Crear archivo CSV
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            // Descargar
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'export.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        // Importar datos desde CSV
        importFromCSV: function(file, callback) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                const data = [];
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const obj = {};
                    const currentLine = lines[i].split(',');
                    
                    for (let j = 0; j < headers.length; j++) {
                        let value = currentLine[j];
                        
                        // Remover comillas si existen
                        if (value && value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        
                        obj[headers[j].trim()] = value;
                    }
                    
                    data.push(obj);
                }
                
                callback(data);
            };
            
            reader.readAsText(file);
        },
        
        // Sincronizar con Google Sheets
        syncWithGoogleSheets: function(data, sheetId, callback) {
            // Esta función requeriría implementación con Google Sheets API
            console.log('Sincronización con Google Sheets no implementada completamente');
            console.log('Datos a sincronizar:', data);
            
            // Simular éxito
            if (callback) callback(true);
        }
    },

    // Utilidades
    utils: {
        formatCurrency: function(amount, currency = 'GTQ') {
            return new Intl.NumberFormat('es-GT', {
                style: 'currency',
                currency: 'GTQ'
            }).format(amount);
        },
        
        formatDate: function(dateString, format = 'short') {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-GT', {
                year: 'numeric',
                month: format === 'short' ? '2-digit' : 'long',
                day: '2-digit'
            });
        },
        
        calculateMonthName: function(dateString) {
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            
            const date = new Date(dateString);
            return months[date.getMonth()];
        },
        
        generateId: function(prefix = '') {
            return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }
};

// Inicializar base de datos cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    MS_DATABASE.init();
    
    // Configurar servicio de notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Funciones de notificación
function showNotification(title, message, type = 'info') {
    // Notificaciones del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: type === 'alert' ? '/assets/alert.png' : '/assets/info.png'
        });
    }
    
    // Notificación en la página
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Cerrar manualmente
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Funciones de exportación a PDF
function generatePDF(elementId, filename) {
    // Esta función requeriría una librería como jsPDF o html2pdf
    console.log('Generar PDF no implementado completamente');
    
    // Simulación básica
    const element = document.getElementById(elementId);
    if (element) {
        // En una implementación real, usaríamos html2pdf o similar
        alert('En la versión completa, esto generaría un PDF del elemento: ' + elementId);
    }
}

// Funciones específicas para cálculos de construcción
const CONSTRUCTION_CALCULATIONS = {
    // Factores de ajuste por región
    regionFactors: {
        'central': 1.00,
        'sur': 1.10,
        'occidente': 1.175,
        'norte': 1.30,
        'oriente': 1.125
    },
    
    // Costos de losas por m2
    slabCosts: {
        'losa_solida': { min: 680, max: 850, avg: 765 },
        'losa_prefabricada': { min: 480, max: 620, avg: 550 },
        'estructura_metalica': { min: 350, max: 475, avg: 412.5 },
        'pergola_madera': { min: 950, max: 1250, avg: 1100 },
        'pergola_metal': { min: 580, max: 780, avg: 680 }
    },
    
    // Calcular AUI
    calculateAUI: function(administration = 20, utility = 12, contingencies = 3) {
        const totalPercentage = administration + utility + contingencies;
        return {
            administration,
            utility,
            contingencies,
            totalPercentage,
            factor: 1 + (totalPercentage / 100)
        };
    },
    
    // Calcular con IVA
    calculateWithIVA: function(amount, ivaRate = 12) {
        const ivaAmount = amount * (ivaRate / 100);
        const total = amount + ivaAmount;
        return {
            subtotal: amount,
            ivaRate,
            ivaAmount,
            total
        };
    },
    
    // Calcular costo directo
    calculateDirectCost: function(materials, labor, equipment) {
        const materialsCost = materials.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
        const laborCost = labor.reduce((sum, item) => sum + (item.hours * item.hourlyRate), 0);
        const equipmentCost = equipment.reduce((sum, item) => sum + (item.hours * item.hourlyRate), 0);
        
        return {
            materials: materialsCost,
            labor: laborCost,
            equipment: equipmentCost,
            total: materialsCost + laborCost + equipmentCost
        };
    },
    
    // Calcular acero necesario
    calculateSteelRequired: function(sectionArea, length, steelPercentage = 0.02) {
        // steelPercentage: porcentaje de acero en la sección (típicamente 1-3%)
        const concreteVolume = sectionArea * length;
        const steelVolume = concreteVolume * steelPercentage;
        
        // Densidad del acero: 7850 kg/m3
        const steelWeight = steelVolume * 7850;
        
        return {
            concreteVolume: concreteVolume.toFixed(3),
            steelVolume: steelVolume.toFixed(3),
            steelWeight: steelWeight.toFixed(2),
            steelWeightKg: steelWeight,
            steelWeightTons: (steelWeight / 1000).toFixed(3)
        };
    }
};

// Clase para manejar el almacenamiento offline
class OfflineStorage {
    constructor(name) {
        this.name = name;
        this.data = this.load() || [];
    }
    
    load() {
        try {
            return JSON.parse(localStorage.getItem(this.name)) || [];
        } catch (error) {
            console.error(`Error al cargar ${this.name}:`, error);
            return [];
        }
    }
    
    save() {
        try {
            localStorage.setItem(this.name, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error(`Error al guardar ${this.name}:`, error);
            return false;
        }
    }
    
    getAll() {
        return this.data;
    }
    
    getById(id) {
        return this.data.find(item => item.id === id);
    }
    
    add(item) {
        if (!item.id) {
            item.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        item.createdAt = new Date().toISOString();
        this.data.push(item);
        this.save();
        return item;
    }
    
    update(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates, updatedAt: new Date().toISOString() };
            this.save();
            return this.data[index];
        }
        return null;
    }
    
    delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }
    
    filter(predicate) {
        return this.data.filter(predicate);
    }
}

// Exportar para uso global
window.MS_APP = {
    database: MS_DATABASE,
    calculations: CONSTRUCTION_CALCULATIONS,
    storage: OfflineStorage,
    utils: MS_DATABASE.utils
};