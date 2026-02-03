// notification-system.js
class NotificationSystem {
    constructor() {
        this.channels = ['push', 'email', 'sms', 'whatsapp', 'slack'];
    }

    async enviarNotificacion(contexto, urgencia) {
        // Notificaciones inteligentes basadas en:
        switch(contexto) {
            case 'vencimiento_renta':
                return this.enviarRecordatorioRenta();
            case 'sobrecosto_detectado':
                return this.enviarAlertaSobrecosto();
            case 'retraso_proyecto':
                return this.enviarAlertaRetraso();
            case 'incidente_seguridad':
                return this.enviarAlertaSeguridad();
        }
    }

    async enviarAlertaSobrecosto() {
        // Envía a múltiples canales
        await this.pushNotification('⚠️ Sobrecosto detectado');
        await this.emailNotification('alerta@mysconstructora.com');
        await this.smsNotification('+50255556666');
        await this.slackNotification('#alertas-financieras');
    }
}