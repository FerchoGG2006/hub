const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ordersService = {
  async createOrder(tenantSlug, orderData) {
    const response = await fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error('Error al crear el pedido');
    return response.json();
  },

  async getAdminOrders(token) {
    const response = await fetch(`${API_URL}/api/admin/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al obtener pedidos');
    return response.json();
  },

  async updateOrderStatus(orderId, status, token) {
    const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al actualizar estado');
    return response.json();
  }
};
