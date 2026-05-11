import { useState, useCallback } from 'react';
import { productsService } from './productsService';

export const useProducts = (tenantSlug) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsService.getTenantProducts(tenantSlug);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const toggleProduct = useCallback(async (productId) => {
    const token = localStorage.getItem('hub_token');
    try {
      await productsService.toggleProductAvailability(productId, token);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  }, [fetchProducts]);

  const magicSnap = useCallback(async (file) => {
    const token = localStorage.getItem('hub_token');
    setLoading(true);
    try {
      await productsService.magicSnapIngest(token, file);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  return { products, toggleProduct, fetchProducts, magicSnap, loading, error };
};
