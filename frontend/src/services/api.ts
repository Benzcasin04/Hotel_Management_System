const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Room APIs
  async getRooms() {
    return this.request('/rooms');
  }

  async getRoomById(id: string) {
    return this.request(`/rooms/${id}`);
  }

  async createRoom(roomData: any) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id: string, roomData: any) {
    return this.request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id: string) {
    return this.request(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // User APIs
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Booking APIs
  async getAllBookings() {
    return this.request('/bookings');
  }

  async getUserBookings() {
    return this.request('/bookings/my');
  }

  async getBookingById(id: string) {
    return this.request(`/bookings/${id}`);
  }

  async createBooking(bookingData: any) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(id: string, bookingData: any) {
    return this.request(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(id: string) {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment APIs
  async getAllPayments() {
    return this.request('/payments');
  }

  async getUserPayments() {
    return this.request('/payments/my');
  }

  async getPaymentById(id: string) {
    return this.request(`/payments/${id}`);
  }

  async createPayment(paymentData: any) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async updatePayment(id: string, paymentData: any) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async processRefund(id: string, note: string) {
    return this.request(`/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
