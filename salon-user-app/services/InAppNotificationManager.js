// Simple EventEmitter implementation for React Native
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  removeAllListeners(eventName) {
    if (eventName) {
      delete this.events[eventName];
    } else {
      this.events = {};
    }
  }
}

class InAppNotificationManager extends SimpleEventEmitter {
  constructor() {
    super();
    this.appointments = [];
    this.checkInterval = null;
  }

  // Add appointment to track
  addAppointment(appointment) {
    const existingIndex = this.appointments.findIndex(a => a.id === appointment.id);
    if (existingIndex >= 0) {
      this.appointments[existingIndex] = appointment;
    } else {
      this.appointments.push(appointment);
    }
    console.log('Added appointment to track:', appointment.id);
  }

  // Remove appointment from tracking
  removeAppointment(appointmentId) {
    this.appointments = this.appointments.filter(a => a.id !== appointmentId);
    console.log('Removed appointment from tracking:', appointmentId);
  }

  // Start checking for upcoming appointments
  startChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkUpcomingAppointments();
    }, 60000); // 60 seconds

    // Initial check
    this.checkUpcomingAppointments();
    console.log('Started appointment checking');
  }

  // Stop checking
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Stopped appointment checking');
  }

  // Check for appointments that need notifications
  checkUpcomingAppointments() {
    const now = new Date();
    
    this.appointments.forEach(appointment => {
      const appointmentTime = new Date(appointment.date_time);
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / (1000 * 60));

      // Notify based on user's selected reminder option
      const option = appointment.reminderOption || 'both';

      // 15 minutes before
      if (minutesUntil === 15 && !appointment.notified15) {
        this.emit('notification', {
          type: 'appointment',
          message: `⏰ Appointment with ${appointment.stylist_name} starts in 15 minutes!`,
          appointment: appointment
        });
        appointment.notified15 = true;
      }

      // 30 minutes before
      if (minutesUntil === 30 && !appointment.notified30) {
        this.emit('notification', {
          type: 'appointment',
          message: `⏰ Appointment with ${appointment.stylist_name} starts in 30 minutes!`,
          appointment: appointment
        });
        appointment.notified30 = true;
      }

      // 1 hour before
      if (minutesUntil === 60 && !appointment.notified60) {
        this.emit('notification', {
          type: 'appointment',
          message: `🎯 Appointment with ${appointment.stylist_name} in 1 hour!`,
          appointment: appointment
        });
        appointment.notified60 = true;
      }

      // 1 day before (1440 minutes)
      if (minutesUntil === 1440 && !appointment.notified1day) {
        this.emit('notification', {
          type: 'appointment',
          message: `📅 Appointment with ${appointment.stylist_name} is tomorrow!`,
          appointment: appointment
        });
        appointment.notified1day = true;
      }

      // Remove past appointments
      if (minutesUntil < -30) { // 30 minutes after appointment
        this.removeAppointment(appointment.id);
      }
    });
  }

  // Get all tracked appointments
  getAppointments() {
    return this.appointments;
  }

  // Clear all appointments
  clearAppointments() {
    this.appointments = [];
    console.log('Cleared all tracked appointments');
  }

  // Manual trigger for testing
  triggerTestNotification() {
    this.emit('notification', {
      type: 'info',
      message: '🧪 Test notification - In-app notifications are working!',
    });
  }
}

export default new InAppNotificationManager();