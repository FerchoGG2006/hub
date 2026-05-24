const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const productsService = {
  async getTenantProducts(tenantSlug) {
    const response = await fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu?include_unavailable=true`);
    if (!response.ok) throw new Error('Error al obtener productos');
    const json = await response.json();
    const data = json.data || json;
    
    // Si la data está agrupada por categorías (objeto), la aplanamos para el InventoryManager
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.values(data).flat();
    }
    
    return Array.isArray(data) ? data : [];
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

  async magicSnapIngest(token, files) {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => formData.append('files', file));
    
    const response = await fetch(`${API_URL}/api/admin/ai-ingest`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Error en el análisis visual');
    return response.json();
  },

  async updateProductImage(productId, file, token) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_URL}/api/admin/products/${productId}/image`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Error al actualizar la imagen');
    return response.json();
  }
};
