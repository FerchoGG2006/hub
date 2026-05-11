import { useState, useCallback } from 'react';
import { ordersService } from '../services/ordersService';

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = useCallback(async (tenantSlug, orderData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.createOrder(tenantSlug, orderData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (orderId, status, token) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.updateOrderStatus(orderId, status, token);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createOrder, updateStatus, loading, error };
};
