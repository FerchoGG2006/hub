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
    const data = await response.json();
    
    // Almacenar en localStorage (o retornar para que el hook lo maneje)
    localStorage.setItem('hub_token', data.access_token);
    localStorage.setItem('hub_role', data.role);
    localStorage.setItem('hub_tenant', data.tenant_slug || '');
    
    return data;
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
