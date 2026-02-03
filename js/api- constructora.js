// api-constructora.js
const express = require('express');
const app = express();

// Endpoints profesionales
app.get('/api/v1/projects/:id', getProject);
app.post('/api/v1/projects', createProject);
app.put('/api/v1/projects/:id/budget', updateBudget);
app.get('/api/v1/projects/:id/timeline', getTimeline);

// Webhooks para integraciones
app.post('/webhook/slack', slackWebhook);
app.post('/webhook/quickbooks', quickbooksWebhook);
app.post('/webhook/trello', trelloWebhook);

// API para móviles
app.get('/api/mobile/attendance/:date', getAttendance);
app.post('/api/mobile/photo-upload', uploadPhoto);