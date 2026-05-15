const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authService = {
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) throw new Error('Credenciales Inválidas');
    const json = await response.json();
    
    // El backend envuelve la respuesta en success_response: {success, data, message}
    // Extraemos el objeto real de datos
    const payload = json.data || json;
    
    localStorage.setItem('hub_token', payload.access_token);
    localStorage.setItem('hub_role', payload.role);
    localStorage.setItem('hub_tenant', payload.tenant_slug || '');
    
    return payload;
  },

  logout() {
    localStorage.removeItem('hub_token');
    localStorage.removeItem('hub_role');
    localStorage.removeItem('hub_tenant');
  },

  getToken() {
    return localStorage.getItem('hub_token');
  },

  getRole() {
    return localStorage.getItem('hub_role');
  },

  getTenantSlug() {
    return localStorage.getItem('hub_tenant');
  }
};
