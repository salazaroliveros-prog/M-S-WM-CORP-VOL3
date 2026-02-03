/**
 * Service Worker para Sistema M&S Constructor
 * Habilita funcionalidades offline y caching
 */

const CACHE_NAME = 'ms-constructor-v2.0';
const CACHE_VERSION = '2.0.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/inicio.html',
  '/proyectos.html',
  '/presupuestos.html',
  '/seguimiento.html',
  '/compras.html',
  '/rrhh.html',
  '/dashboard.html',
  '/cotizacion.html',
  '/asistencia.html',
  '/css/styles.css',
  '/css/components.css',
  '/js/app.js',
  '/js/database.js',
  '/js/sync.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error en instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activación completada');
      return self.clients.claim();
    })
  );
});

// Estrategia de caching: Cache First, Network Fallback
self.addEventListener('fetch', event => {
  // Excluir solicitudes de sincronización y APIs externas
  if (event.request.url.includes('/sync/') || 
      event.request.url.includes('api.') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolverlo
        if (response) {
          console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        // Si no está en cache, hacer la petición
        console.log('[Service Worker] Descargando:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para guardarla en cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Guardar en cache para próximas solicitudes
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Error en fetch:', error);
            
            // Para páginas HTML, devolver la página de offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Para otros recursos, devolver un mensaje de error
            return new Response('No hay conexión a internet', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  console.log('[Service Worker] Sincronización en segundo plano:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Función de sincronización
async function syncData() {
  console.log('[Service Worker] Iniciando sincronización en segundo plano');
  
  try {
    // Obtener datos pendientes de sincronización
    const pendingChanges = await getPendingChanges();
    
    if (pendingChanges.length === 0) {
      console.log('[Service Worker] No hay cambios pendientes');
      return;
    }
    
    // Enviar datos al servidor
    const response = await sendToServer(pendingChanges);
    
    if (response.ok) {
      console.log('[Service Worker] Sincronización exitosa');
      await clearPendingChanges();
      
      // Notificar a las páginas abiertas
      await notifyClients('sync-completed', {
        timestamp: new Date().toISOString(),
        count: pendingChanges.length
      });
    } else {
      throw new Error('Error en respuesta del servidor');
    }
    
  } catch (error) {
    console.error('[Service Worker] Error en sincronización:', error);
    await notifyClients('sync-failed', { error: error.message });
  }
}

// Obtener cambios pendientes
async function getPendingChanges() {
  // En una implementación real, leería de IndexedDB
  return [];
}

// Enviar al servidor
async function sendToServer(data) {
  // En una implementación real, haría una petición HTTP
  return { ok: true };
}

// Limpiar cambios pendientes
async function clearPendingChanges() {
  // En una implementación real, limpiaría IndexedDB
}

// Notificar a los clientes (páginas abiertas)
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: type,
      data: data
    });
  });
}

// Manejar mensajes desde las páginas
self.addEventListener('message', event => {
  console.log('[Service Worker] Mensaje recibido:', event.data);
  
  switch (event.data.type) {
    case 'CACHE_DATA':
      cacheData(event.data.key, event.data.value);
      break;
      
    case 'GET_CACHED_DATA':
      getCachedData(event.data.key, event.ports[0]);
      break;
      
    case 'REGISTER_SYNC':
      registerSync(event.data.tag);
      break;
      
    case 'CHECK_UPDATE':
      checkForUpdate();
      break;
  }
});

// Cachear datos
async function cacheData(key, value) {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(value));
  await cache.put(`/data/${key}`, response);
}

// Obtener datos cacheados
async function getCachedData(key, port) {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(`/data/${key}`);
  
  if (response) {
    const data = await response.json();
    port.postMessage({ key: key, value: data });
  } else {
    port.postMessage({ key: key, value: null });
  }
}

// Registrar sincronización
async function registerSync(tag) {
  try {
    await self.registration.sync.register(tag);
    console.log('[Service Worker] Sincronización registrada:', tag);
  } catch (error) {
    console.error('[Service Worker] Error registrando sync:', error);
  }
}

// Verificar actualizaciones
async function checkForUpdate() {
  try {
    // Verificar si hay una nueva versión disponible
    const response = await fetch('/version.json', { cache: 'no-cache' });
    const versionInfo = await response.json();
    
    if (versionInfo.version !== CACHE_VERSION) {
      // Nueva versión disponible
      await notifyClients('update-available', versionInfo);
    }
  } catch (error) {
    console.error('[Service Worker] Error verificando actualización:', error);
  }
}

// Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificación push recibida:', event);
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Nueva notificación del sistema',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'M&S Constructor', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notificación clickeada:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Abrir la URL especificada en la notificación
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Buscar ventana abierta
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});