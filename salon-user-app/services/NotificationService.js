import InAppNotificationManager from './InAppNotificationManager';

class NotificationService {
  constructor() {
    this.inAppManager = InAppNotificationManager;
  }

  // Initialize notification service (replaces registerForPushNotifications)
  async initialize() {
    console.log('NotificationService initialized with in-app notifications only');
    this.inAppManager.startChecking();
    return true;
  }

  // Schedule appointment reminder using in-app notifications
  async scheduleAppointmentReminder(appointment) {
    try {
      console.log('Adding appointment to in-app notification tracking:', appointment.id);
      this.inAppManager.addAppointment(appointment);
      return `in-app-${appointment.id}`;
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      return null;
    }
  }

  // Schedule daily check (now handled by in-app manager)
  async scheduleDailyAppointmentCheck() {
    console.log('Daily appointment checking is handled by in-app notification manager');
    return 'in-app-daily-check';
  }

  // Cancel appointment notifications
  async cancelAppointmentNotifications(appointmentId) {
    try {
      this.inAppManager.removeAppointment(appointmentId);
      console.log('Cancelled in-app notifications for appointment:', appointmentId);
    } catch (error) {
      console.error('Error cancelling appointment notifications:', error);
    }
  }

  // Cancel daily notifications (no-op for in-app)
  async cancelDailyNotifications() {
    console.log('Daily notifications are managed by in-app system');
  }

  // Get scheduled notifications (returns tracked appointments)
  async getScheduledNotifications() {
    try {
      const appointments = this.inAppManager.getAppointments();
      console.log('Tracked appointments:', appointments.length);
      return appointments;
    } catch (error) {
      console.error('Error getting tracked appointments:', error);
      return [];
    }
  }

  // Add notification listener (delegates to in-app manager)
  addNotificationReceivedListener(callback) {
    return this.inAppManager.on('notification', callback);
  }

  // Add notification response listener (delegates to in-app manager)
  addNotificationResponseReceivedListener(callback) {
    return this.inAppManager.on('notification', callback);
  }

  // Test notification
  triggerTestNotification() {
    this.inAppManager.triggerTestNotification();
  }

  // Stop notification service
  stop() {
    this.inAppManager.stopChecking();
    console.log('NotificationService stopped');
  }
}

export default new NotificationService();