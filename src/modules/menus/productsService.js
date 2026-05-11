const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const productsService = {
  async getTenantProducts(tenantSlug) {
    const response = await fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`);
    if (!response.ok) throw new Error('Error al obtener productos');
    return response.json();
  },

  async toggleProductAvailability(productId, token) {
    const response = await fetch(`${API_URL}/api/admin/products/${productId}/toggle`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al cambiar disponibilidad');
    return response.json();
  },

  async createProduct(token, formData) {
    const response = await fetch(`${API_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData, // FormData handles its own content-type
    });
    if (!response.ok) throw new Error('Error al crear producto');
    return response.json();
  },

  async magicSnapIngest(token, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/api/admin/ai-ingest`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Error en el análisis visual');
    return response.json();
  }
};
