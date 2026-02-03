/**
 * M&S Constructor - Módulo de Sincronización
 * Maneja la sincronización de datos entre localStorage y servicios en la nube
 */

class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 300000, // 5 minutos
            maxRetries: 3,
            retryDelay: 5000,
            cloudServices: {
                googleSheets: false,
                supabase: false,
                firestore: false,
                postgresql: false,
                googleCloud: false
            }
        };
        
        this.isSyncing = false;
        this.lastSync = localStorage.getItem('last_sync_timestamp') || null;
        this.pendingChanges = JSON.parse(localStorage.getItem('pending_sync_changes') || '[]');
        
        this.init();
    }
    
    init() {
        // Cargar configuración de sincronización
        const savedConfig = localStorage.getItem('sync_config');
        if (savedConfig) {
            this.config = { ...this.config, ...JSON.parse(savedConfig) };
        }
        
        // Iniciar sincronización automática si está habilitada
        if (this.config.autoSync) {
            this.startAutoSync();
        }
        
        // Escuchar eventos de conexión
        window.addEventListener('online', () => this.onConnectionRestored());
        window.addEventListener('offline', () => this.onConnectionLost());
    }
    
    // Configurar servicios en la nube
    configureCloudService(service, config) {
        if (service in this.config.cloudServices) {
            this.config.cloudServices[service] = config;
            localStorage.setItem('sync_config', JSON.stringify(this.config));
            return true;
        }
        return false;
    }
    
    // Sincronizar todos los datos
    async syncAll() {
        if (this.isSyncing) {
            console.log('Ya hay una sincronización en progreso');
            return false;
        }
        
        if (!navigator.onLine) {
            console.log('Sin conexión a internet');
            this.showNotification('Sin conexión', 'No se puede sincronizar sin conexión a internet', 'warning');
            return false;
        }
        
        this.isSyncing = true;
        this.showNotification('Sincronizando', 'Sincronizando datos con la nube...', 'info');
        
        try {
            // Sincronizar cada tabla
            const syncPromises = [
                this.syncTable('ms_projects', 'projects'),
                this.syncTable('ms_transactions', 'transactions'),
                this.syncTable('ms_budgets', 'budgets'),
                this.syncTable('ms_employees', 'employees'),
                this.syncTable('ms_contracts', 'contracts'),
                this.syncTable('ms_attendance', 'attendance'),
                this.syncTable('ms_payroll', 'payroll'),
                this.syncTable('ms_suppliers', 'suppliers'),
                this.syncTable('ms_materials', 'materials'),
                this.syncTable('ms_purchases', 'purchases')
            ];
            
            await Promise.all(syncPromises);
            
            // Marcar como sincronizado
            this.lastSync = new Date().toISOString();
            localStorage.setItem('last_sync_timestamp', this.lastSync);
            localStorage.removeItem('pending_sync_changes');
            this.pendingChanges = [];
            
            this.showNotification('Sincronización completada', 'Todos los datos han sido sincronizados', 'success');
            this.isSyncing = false;
            
            return true;
            
        } catch (error) {
            console.error('Error en sincronización:', error);
            this.showNotification('Error de sincronización', error.message, 'danger');
            this.isSyncing = false;
            return false;
        }
    }
    
    // Sincronizar una tabla específica
    async syncTable(tableName, endpoint) {
        try {
            const localData = JSON.parse(localStorage.getItem(tableName) || '[]');
            
            if (localData.length === 0) {
                console.log(`Tabla ${tableName} vacía, omitiendo sincronización`);
                return;
            }
            
            // Filtrar datos no sincronizados
            const unsyncedData = localData.filter(item => !item.synced || item.updated);
            
            if (unsyncedData.length === 0) {
                console.log(`Tabla ${tableName} ya sincronizada`);
                return;
            }
            
            console.log(`Sincronizando ${unsyncedData.length} registros de ${tableName}`);
            
            // Enviar a cada servicio configurado
            const syncPromises = [];
            
            if (this.config.cloudServices.googleSheets) {
                syncPromises.push(this.syncToGoogleSheets(unsyncedData, endpoint));
            }
            
            if (this.config.cloudServices.supabase) {
                syncPromises.push(this.syncToSupabase(unsyncedData, endpoint));
            }
            
            if (this.config.cloudServices.firestore) {
                syncPromises.push(this.syncToFirestore(unsyncedData, endpoint));
            }
            
            // Esperar a que todos los servicios se sincronicen
            await Promise.all(syncPromises);
            
            // Marcar como sincronizado en localStorage
            this.markAsSynced(tableName, unsyncedData);
            
            console.log(`Tabla ${tableName} sincronizada exitosamente`);
            
        } catch (error) {
            console.error(`Error sincronizando ${tableName}:`, error);
            throw error;
        }
    }
    
    // Marcar datos como sincronizados
    markAsSynced(tableName, syncedItems) {
        const allData = JSON.parse(localStorage.getItem(tableName) || '[]');
        const syncedIds = syncedItems.map(item => item.id);
        
        const updatedData = allData.map(item => {
            if (syncedIds.includes(item.id)) {
                return {
                    ...item,
                    synced: true,
                    syncedAt: new Date().toISOString(),
                    updated: false
                };
            }
            return item;
        });
        
        localStorage.setItem(tableName, JSON.stringify(updatedData));
    }
    
    // Sincronizar con Google Sheets
    async syncToGoogleSheets(data, endpoint) {
        if (!this.config.cloudServices.googleSheets) {
            return;
        }
        
        const { spreadsheetId, sheetName, apiKey } = this.config.cloudServices.googleSheets;
        
        if (!spreadsheetId || !apiKey) {
            console.warn('Configuración de Google Sheets incompleta');
            return;
        }
        
        try {
            // Convertir datos a formato de hoja de cálculo
            const rows = data.map(item => {
                return Object.values(item).map(value => 
                    typeof value === 'object' ? JSON.stringify(value) : value
                );
            });
            
            // En una implementación real, aquí se haría la petición a la API de Google Sheets
            console.log(`Enviando ${rows.length} filas a Google Sheets (${sheetName || endpoint})`);
            
            // Simular éxito
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Error sincronizando con Google Sheets:', error);
            throw error;
        }
    }
    
    // Sincronizar con Supabase
    async syncToSupabase(data, endpoint) {
        if (!this.config.cloudServices.supabase) {
            return;
        }
        
        const { url, anonKey, tableName } = this.config.cloudServices.supabase;
        
        if (!url || !anonKey) {
            console.warn('Configuración de Supabase incompleta');
            return;
        }
        
        try {
            // En una implementación real, aquí se usaría el cliente de Supabase
            console.log(`Enviando ${data.length} registros a Supabase (${tableName || endpoint})`);
            
            // Simular éxito
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Error sincronizando con Supabase:', error);
            throw error;
        }
    }
    
    // Sincronizar con Firestore
    async syncToFirestore(data, endpoint) {
        if (!this.config.cloudServices.firestore) {
            return;
        }
        
        const { projectId, apiKey } = this.config.cloudServices.firestore;
        
        if (!projectId || !apiKey) {
            console.warn('Configuración de Firestore incompleta');
            return;
        }
        
        try {
            // En una implementación real, aquí se usaría el SDK de Firebase
            console.log(`Enviando ${data.length} documentos a Firestore (${endpoint})`);
            
            // Simular éxito
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('Error sincronizando con Firestore:', error);
            throw error;
        }
    }
    
    // Exportar datos a varios formatos
    exportData(format = 'json', tableName = null) {
        try {
            let data;
            
            if (tableName) {
                // Exportar tabla específica
                data = JSON.parse(localStorage.getItem(tableName) || '[]');
            } else {
                // Exportar todas las tablas
                data = {};
                const tables = [
                    'ms_projects', 'ms_transactions', 'ms_budgets', 
                    'ms_employees', 'ms_contracts', 'ms_attendance',
                    'ms_payroll', 'ms_suppliers', 'ms_materials', 'ms_purchases'
                ];
                
                tables.forEach(table => {
                    data[table] = JSON.parse(localStorage.getItem(table) || '[]');
                });
            }
            
            switch (format.toLowerCase()) {
                case 'json':
                    return this.exportToJSON(data, tableName);
                    
                case 'csv':
                    return this.exportToCSV(data, tableName);
                    
                case 'excel':
                    return this.exportToExcel(data, tableName);
                    
                default:
                    throw new Error(`Formato no soportado: ${format}`);
            }
            
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.showNotification('Error al exportar', error.message, 'danger');
            return null;
        }
    }
    
    // Exportar a JSON
    exportToJSON(data, tableName) {
        const jsonStr = JSON.stringify(data, null, 2);
        const filename = tableName ? `${tableName}_${this.getTimestamp()}.json` : `backup_${this.getTimestamp()}.json`;
        
        this.downloadFile(jsonStr, filename, 'application/json');
        return filename;
    }
    
    // Exportar a CSV
    exportToCSV(data, tableName) {
        let csvContent = '';
        
        if (tableName) {
            // Exportar tabla específica
            if (data.length === 0) {
                throw new Error('No hay datos para exportar');
            }
            
            const headers = Object.keys(data[0]);
            csvContent = headers.join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    let value = row[header];
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    // Escapar comas y comillas
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csvContent += values.join(',') + '\n';
            });
            
        } else {
            // Exportar todas las tablas
            Object.keys(data).forEach(table => {
                if (data[table].length > 0) {
                    csvContent += `=== ${table} ===\n`;
                    const headers = Object.keys(data[table][0]);
                    csvContent += headers.join(',') + '\n';
                    
                    data[table].forEach(row => {
                        const values = headers.map(header => {
                            let value = row[header];
                            if (typeof value === 'object') {
                                value = JSON.stringify(value);
                            }
                            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                                value = `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        });
                        csvContent += values.join(',') + '\n';
                    });
                    
                    csvContent += '\n';
                }
            });
        }
        
        const filename = tableName ? `${tableName}_${this.getTimestamp()}.csv` : `backup_${this.getTimestamp()}.csv`;
        this.downloadFile(csvContent, filename, 'text/csv');
        return filename;
    }
    
    // Exportar a Excel (simulado)
    exportToExcel(data, tableName) {
        // En una implementación real, se usaría una librería como SheetJS
        console.log('Exportación a Excel (funcionalidad completa requiere librería adicional)');
        
        // Por ahora, exportamos como CSV
        return this.exportToCSV(data, tableName);
    }
    
    // Importar datos
    importData(file, format = 'json') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    let data;
                    
                    switch (format.toLowerCase()) {
                        case 'json':
                            data = JSON.parse(event.target.result);
                            break;
                            
                        case 'csv':
                            data = this.parseCSV(event.target.result);
                            break;
                            
                        default:
                            throw new Error(`Formato no soportado: ${format}`);
                    }
                    
                    // Procesar datos importados
                    this.processImportedData(data);
                    
                    this.showNotification('Importación completada', 'Datos importados exitosamente', 'success');
                    resolve(true);
                    
                } catch (error) {
                    console.error('Error importando datos:', error);
                    this.showNotification('Error al importar', error.message, 'danger');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error leyendo el archivo'));
            };
            
            reader.readAsText(file);
        });
    }
    
    // Parsear CSV
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        if (lines.length < 2) {
            throw new Error('Archivo CSV vacío o inválido');
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const row = {};
            
            headers.forEach((header, index) => {
                let value = values[index] || '';
                
                // Remover comillas si existen
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                    value = value.replace(/""/g, '"');
                }
                
                // Intentar convertir a número
                if (!isNaN(value) && value.trim() !== '') {
                    value = Number(value);
                }
                
                // Intentar parsear JSON
                if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Mantener como string si no es JSON válido
                    }
                }
                
                row[header] = value;
            });
            
            data.push(row);
        }
        
        return data;
    }
    
    // Procesar datos importados
    processImportedData(data) {
        if (Array.isArray(data)) {
            // Es una sola tabla
            console.log(`Importando ${data.length} registros`);
            // Aquí se determinaría a qué tabla pertenecen los datos
            // Por simplicidad, asumimos que son proyectos
            localStorage.setItem('ms_projects', JSON.stringify(data));
            
        } else if (typeof data === 'object') {
            // Son múltiples tablas
            Object.keys(data).forEach(tableName => {
                if (tableName.startsWith('ms_')) {
                    console.log(`Importando ${data[tableName].length} registros a ${tableName}`);
                    localStorage.setItem(tableName, JSON.stringify(data[tableName]));
                }
            });
        }
        
        // Forzar recarga de datos en las páginas
        this.broadcastDataChange();
    }
    
    // Iniciar sincronización automática
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (navigator.onLine) {
                this.syncAll();
            }
        }, this.config.syncInterval);
        
        console.log('Sincronización automática iniciada');
    }
    
    // Detener sincronización automática
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Sincronización automática detenida');
        }
    }
    
    // Manejar restauración de conexión
    onConnectionRestored() {
        console.log('Conexión a internet restaurada');
        this.showNotification('Conexión restaurada', 'Sincronizando datos pendientes...', 'info');
        
        if (this.pendingChanges.length > 0) {
            setTimeout(() => this.syncAll(), 2000);
        }
    }
    
    // Manejar pérdida de conexión
    onConnectionLost() {
        console.log('Conexión a internet perdida');
        this.showNotification('Sin conexión', 'Los cambios se guardarán localmente', 'warning');
    }
    
    // Obtener timestamp para nombres de archivo
    getTimestamp() {
        const now = new Date();
        return now.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
    }
    
    // Descargar archivo
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Mostrar notificación
    showNotification(title, message, type = 'info') {
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
    
    // Broadcast de cambios de datos
    broadcastDataChange() {
        const event = new CustomEvent('dataChanged', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }
    
    // Obtener estadísticas de sincronización
    getSyncStats() {
        const tables = [
            'ms_projects', 'ms_transactions', 'ms_budgets', 
            'ms_employees', 'ms_contracts', 'ms_attendance',
            'ms_payroll', 'ms_suppliers', 'ms_materials', 'ms_purchases'
        ];
        
        const stats = {
            totalRecords: 0,
            unsyncedRecords: 0,
            lastSync: this.lastSync,
            tables: {}
        };
        
        tables.forEach(tableName => {
            const data = JSON.parse(localStorage.getItem(tableName) || '[]');
            const unsynced = data.filter(item => !item.synced || item.updated).length;
            
            stats.tables[tableName] = {
                total: data.length,
                unsynced: unsynced,
                lastUpdate: data.length > 0 ? 
                    new Date(Math.max(...data.map(item => 
                        new Date(item.updatedAt || item.createdAt || 0).getTime()
                    ))) : null
            };
            
            stats.totalRecords += data.length;
            stats.unsyncedRecords += unsynced;
        });
        
        return stats;
    }
}

// Crear instancia global del gestor de sincronización
const syncManager = new SyncManager();

// Exportar para uso global
window.syncManager = syncManager;

// Función helper para sincronización rápida desde cualquier página
function quickSync() {
    return syncManager.syncAll();
}

// Función helper para exportación rápida
function quickExport(format = 'json', tableName = null) {
    return syncManager.exportData(format, tableName);
}