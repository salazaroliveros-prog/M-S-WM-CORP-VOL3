/**
 * Gestión de base de datos local para el sistema M&S Constructor
 */

class LocalDatabase {
    constructor() {
        this.tables = {
            projects: 'ms_projects',
            transactions: 'ms_transactions',
            budgets: 'ms_budgets',
            employees: 'ms_employees',
            purchases: 'ms_purchases',
            suppliers: 'ms_suppliers',
            materials: 'ms_materials',
            attendance: 'ms_attendance',
            settings: 'ms_settings'
        };
        
        this.initializeDatabase();
    }
    
    // Inicializar base de datos con datos de ejemplo
    initializeDatabase() {
        // Verificar y crear tablas si no existen
        Object.values(this.tables).forEach(table => {
            if (!localStorage.getItem(table)) {
                localStorage.setItem(table, JSON.stringify([]));
            }
        });
        
        // Datos iniciales de ejemplo
        this.initializeSampleData();
    }
    
    // Datos de ejemplo para pruebas
    initializeSampleData() {
        // Configuración inicial
        const settings = this.getTable('settings');
        if (settings.length === 0) {
            const defaultSettings = {
                id: 'settings_001',
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
                },
                created: new Date().toISOString()
            };
            this.save('settings', defaultSettings);
        }
        
        // Tipologías de construcción
        const typologies = [
            { id: 'residencial', name: 'RESIDENCIAL', description: 'Viviendas unifamiliares y multifamiliares' },
            { id: 'comercial', name: 'COMERCIAL', description: 'Centros comerciales, locales, oficinas' },
            { id: 'industrial', name: 'INDUSTRIAL', description: 'Bodegas, plantas de producción' },
            { id: 'civil', name: 'CIVIL', description: 'Puentes, carreteras, obras públicas' },
            { id: 'publica', name: 'PÚBLICA', description: 'Escuelas, hospitales, parques' }
        ];
        
        // Guardar tipologías si no existen
        const existingTypologies = this.getTable('typologies');
        if (existingTypologies.length === 0) {
            localStorage.setItem('ms_typologies', JSON.stringify(typologies));
        }
        
        // Proveedores de ejemplo
        const suppliers = this.getTable('suppliers');
        if (suppliers.length === 0) {
            const sampleSuppliers = [
                {
                    id: 'SUP001',
                    name: 'Materiales de Construcción S.A.',
                    contact: 'Juan Pérez',
                    phone: '12345678',
                    email: 'ventas@materiales.com',
                    materials: ['cemento', 'arena', 'grava', 'varilla'],
                    rating: 4.5,
                    created: new Date().toISOString()
                },
                {
                    id: 'SUP002',
                    name: 'Alquiler de Maquinaria GT',
                    contact: 'María González',
                    phone: '87654321',
                    email: 'alquiler@maquinaria.com',
                    services: ['alquiler'],
                    rating: 4.2,
                    created: new Date().toISOString()
                }
            ];
            
            sampleSuppliers.forEach(supplier => this.save('suppliers', supplier));
        }
        
        // Materiales de ejemplo
        const materials = this.getTable('materials');
        if (materials.length === 0) {
            const sampleMaterials = [
                {
                    id: 'MAT001',
                    name: 'Cemento',
                    unit: 'saco',
                    unitCost: 45.00,
                    category: 'materiales',
                    supplierId: 'SUP001',
                    stock: 100,
                    minStock: 10,
                    created: new Date().toISOString()
                },
                {
                    id: 'MAT002',
                    name: 'Varilla 3/8"',
                    unit: 'quintal',
                    unitCost: 280.00,
                    category: 'materiales',
                    supplierId: 'SUP001',
                    stock: 50,
                    minStock: 5,
                    created: new Date().toISOString()
                },
                {
                    id: 'MAT003',
                    name: 'Arena',
                    unit: 'm3',
                    unitCost: 120.00,
                    category: 'materiales',
                    supplierId: 'SUP001',
                    stock: 30,
                    minStock: 3,
                    created: new Date().toISOString()
                }
            ];
            
            sampleMaterials.forEach(material => this.save('materials', material));
        }
    }
    
    // Obtener tabla completa
    getTable(tableName) {
        try {
            const data = localStorage.getItem(tableName);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error al obtener tabla ${tableName}:`, error);
            return [];
        }
    }
    
    // Guardar en tabla
    save(tableName, item) {
        try {
            const table = this.getTable(tableName);
            
            // Si el item ya tiene ID, actualizar
            if (item.id) {
                const index = table.findIndex(i => i.id === item.id);
                if (index !== -1) {
                    table[index] = { ...table[index], ...item, updatedAt: new Date().toISOString() };
                } else {
                    if (!item.createdAt) item.createdAt = new Date().toISOString();
                    table.push(item);
                }
            } else {
                // Crear nuevo item
                item.id = this.generateId();
                item.createdAt = new Date().toISOString();
                table.push(item);
            }
            
            localStorage.setItem(tableName, JSON.stringify(table));
            return item;
        } catch (error) {
            console.error(`Error al guardar en ${tableName}:`, error);
            return null;
        }
    }
    
    // Eliminar de tabla
    delete(tableName, id) {
        try {
            const table = this.getTable(tableName);
            const filteredTable = table.filter(item => item.id !== id);
            localStorage.setItem(tableName, JSON.stringify(filteredTable));
            return true;
        } catch (error) {
            console.error(`Error al eliminar de ${tableName}:`, error);
            return false;
        }
    }
    
    // Buscar por ID
    findById(tableName, id) {
        const table = this.getTable(tableName);
        return table.find(item => item.id === id);
    }
    
    // Filtrar tabla
    filter(tableName, predicate) {
        const table = this.getTable(tableName);
        return table.filter(predicate);
    }
    
    // Buscar todos
    findAll(tableName) {
        return this.getTable(tableName);
    }
    
    // Contar registros
    count(tableName) {
        const table = this.getTable(tableName);
        return table.length;
    }
    
    // Generar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Exportar tabla a CSV
    exportToCSV(tableName, filename) {
        const table = this.getTable(tableName);
        
        if (table.length === 0) {
            console.warn(`La tabla ${tableName} está vacía`);
            return;
        }
        
        // Obtener encabezados
        const headers = Object.keys(table[0]);
        
        // Crear contenido CSV
        let csvContent = headers.join(',') + '\n';
        
        table.forEach(item => {
            const row = headers.map(header => {
                const value = item[header];
                // Escapar comas y comillas
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += row.join(',') + '\n';
        });
        
        // Crear y descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename || `${tableName}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Importar CSV a tabla
    importFromCSV(tableName, csvFile, callback) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                
                const importedData = [];
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const obj = {};
                    const currentLine = lines[i].split(',');
                    
                    headers.forEach((header, index) => {
                        let value = currentLine[index] || '';
                        
                        // Remover comillas si existen
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        
                        // Convertir a número si es posible
                        if (!isNaN(value) && value.trim() !== '') {
                            value = Number(value);
                        }
                        
                        obj[header] = value;
                    });
                    
                    importedData.push(obj);
                }
                
                // Guardar datos importados
                const existingData = this.getTable(tableName);
                const mergedData = [...existingData, ...importedData];
                localStorage.setItem(tableName, JSON.stringify(mergedData));
                
                if (callback) callback(true, importedData.length);
                
            } catch (error) {
                console.error('Error al importar CSV:', error);
                if (callback) callback(false, error.message);
            }
        };
        
        reader.readAsText(csvFile);
    }
    
    // Sincronizar con almacenamiento en la nube (simulado)
    syncToCloud(tableName, cloudEndpoint) {
        return new Promise((resolve, reject) => {
            const tableData = this.getTable(tableName);
            
            // En una implementación real, aquí se haría una petición HTTP
            console.log(`Sincronizando ${tableName} con la nube...`, tableData);
            
            // Simular éxito después de 1 segundo
            setTimeout(() => {
                // Guardar última fecha de sincronización
                const syncInfo = {
                    table: tableName,
                    lastSync: new Date().toISOString(),
                    recordCount: tableData.length
                };
                
                localStorage.setItem(`last_sync_${tableName}`, JSON.stringify(syncInfo));
                resolve(syncInfo);
            }, 1000);
        });
    }
    
    // Obtener estadísticas de la base de datos
    getStatistics() {
        const stats = {};
        
        Object.entries(this.tables).forEach(([key, tableName]) => {
            const table = this.getTable(tableName);
            stats[key] = {
                count: table.length,
                lastUpdated: table.length > 0 ? 
                    new Date(Math.max(...table.map(item => 
                        new Date(item.updatedAt || item.createdAt || 0).getTime()
                    ))) : null
            };
        });
        
        return stats;
    }
}

// Crear instancia global de la base de datos
const localDB = new LocalDatabase();

// Exportar para uso global
window.localDB = localDB;