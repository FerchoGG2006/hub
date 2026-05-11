import { useState, useCallback } from 'react';
import { productsService } from './productsService';

export const useProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleAvailability = useCallback(async (productId, token) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.toggleProductAvailability(productId, token);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const magicSnap = useCallback(async (token, file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.magicSnapIngest(token, file);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggleAvailability, magicSnap, loading, error };
};
