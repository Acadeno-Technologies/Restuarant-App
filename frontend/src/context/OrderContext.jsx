import React, { createContext, useState, useEffect, useContext } from 'react';
import { ordersApi } from '../api/ordersApi';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [draftItems, setDraftItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeTableOrder, setActiveTableOrder] = useState(null);
  const [loadingActiveOrder, setLoadingActiveOrder] = useState(false);
  const [orderType, setOrderType] = useState('dine_in'); // dine_in, takeaway, delivery, swiggy, zomato
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active cart items are strictly the draft items the user has selected but not yet placed
  const cartItems = draftItems;

  const loadActiveTableOrder = async (tableId) => {
    if (!tableId) {
      setActiveTableOrder(null);
      return null;
    }
    setLoadingActiveOrder(true);
    try {
      const orderData = await ordersApi.getActiveTableOrder(tableId);
      const guestFromTable = selectedTable?.active_reservation?.guest_name || selectedTable?.guest_name || '';

      if (orderData && orderData.id && Array.isArray(orderData.items)) {
        setActiveTableOrder(orderData);
        if (!customerName) {
          setCustomerName(orderData.customer_name || guestFromTable || '');
        }
        if (!customerPhone) {
          setCustomerPhone(orderData.customer_phone || '');
        }
        return orderData;
      } else {
        setActiveTableOrder(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching active table order metadata:', err);
      setActiveTableOrder(null);
      return null;
    } finally {
      setLoadingActiveOrder(false);
    }
  };

  const addToCart = (menuItem, portion = 'Full') => {
    setDraftItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.menu_item?.id) === String(menuItem.id) && item.portion === portion
      );

      let price = parseFloat(menuItem.price || 0);
      if (portion === 'Half' && menuItem.half_price) {
        price = parseFloat(menuItem.half_price);
      } else if (portion === 'Half') {
        price = Math.round(parseFloat(menuItem.price || 0) * 0.6);
      } else if (portion === 'Quarter' && menuItem.quarter_price) {
        price = parseFloat(menuItem.quarter_price);
      } else if (portion === 'Quarter') {
        price = Math.round(parseFloat(menuItem.price || 0) * 0.35);
      }

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            menu_item: menuItem,
            quantity: 1,
            unit_price: price,
            portion,
            notes: '',
            isSubmitted: false,
          },
        ];
      }
    });
  };

  const removeFromCart = async (menuItemId, portion) => {
    setDraftItems((prev) =>
      prev.filter((item) => !(String(item.menu_item?.id) === String(menuItemId) && item.portion === portion))
    );
  };

  const updateQuantity = (menuItemId, portion, delta) => {
    setDraftItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.menu_item?.id) === String(menuItemId) && item.portion === portion
      );

      if (existingIndex > -1) {
        const newQty = prev[existingIndex].quantity + delta;
        if (newQty > 0) {
          return prev.map((item, idx) =>
            idx === existingIndex ? { ...item, quantity: newQty } : item
          );
        } else {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
      } else if (delta > 0) {
        return [
          ...prev,
          {
            menu_item: { id: menuItemId },
            quantity: delta,
            unit_price: 0,
            portion,
            notes: '',
            isSubmitted: false,
          },
        ];
      }
      return prev;
    });
  };

  const updateItemNotes = (menuItemId, portion, notes) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        String(item.menu_item?.id) === String(menuItemId) && item.portion === portion
          ? { ...item, notes }
          : item
      )
    );
  };

  const clearCart = () => {
    setDraftItems([]);
    setSelectedTable(null);
    setActiveTableOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.unit_price) || 0) * item.quantity,
    0
  );

  const startNewOrderSession = (table) => {
    setSelectedTable(table);
    setDraftItems([]);
    setActiveTableOrder(null);
    setCustomerName(table?.active_reservation?.guest_name || table?.guest_name || '');
    setCustomerPhone('');
    setOrderNotes('');
    setOrderType('dine_in');
  };

  const viewTableOrderSession = async (table) => {
    setSelectedTable(table);
    setDraftItems([]);
    setOrderType('dine_in');
    if (table?.id) {
      await loadActiveTableOrder(table.id);
    }
  };

  const placeOrder = async () => {
    if (draftItems.length === 0) {
      throw new Error('No new items to place. Add items to submit to kitchen.');
    }

    if (orderType === 'dine_in' && !selectedTable) {
      throw new Error('Please select a dining table for Dine-In orders');
    }

    setIsSubmitting(true);
    try {
      let createdOrder;
      const itemsPayload = draftItems.map((item) => ({
        menu_item: item.menu_item?.id || item.menu_item,
        quantity: item.quantity,
        unit_price: item.unit_price,
        portion: item.portion || 'Full',
        notes: item.notes || '',
      }));

      const tableIdToUpdate = selectedTable?.id;

      if (activeTableOrder && activeTableOrder.id) {
        createdOrder = await ordersApi.addItemsToOrder(activeTableOrder.id, {
          items: itemsPayload,
          notes: orderNotes || '',
          kitchen_notes: orderNotes || '',
        });
      } else {
        const payload = {
          table: orderType === 'dine_in' ? (selectedTable?.id || null) : null,
          order_type: orderType,
          customer_name: customerName || '',
          customer_phone: customerPhone || '',
          notes: orderNotes || '',
          kitchen_notes: orderNotes || '',
          items: itemsPayload,
        };
        createdOrder = await ordersApi.createOrder(payload);
      }

      // 1. Immediately reset active cart state
      setDraftItems([]);
      setOrderNotes('');
      setActiveTableOrder(null);
      setSelectedTable(null);

      // 2. Synchronize local cache and notify table status listeners
      if (tableIdToUpdate) {
        try {
          const cached = localStorage.getItem('staff_cached_tables');
          if (cached) {
            const list = JSON.parse(cached);
            const updated = list.map((t) =>
              String(t.id) === String(tableIdToUpdate) ? { ...t, status: 'occupied' } : t
            );
            localStorage.setItem('staff_cached_tables', JSON.stringify(updated));
          }
        } catch {}
        window.dispatchEvent(new Event('tablesUpdated'));
      }

      return createdOrder;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        cartItems,
        draftItems,
        hasDraftItems: draftItems.length > 0,
        selectedTable,
        setSelectedTable,
        startNewOrderSession,
        viewTableOrderSession,
        activeTableOrder,
        setActiveTableOrder,
        loadingActiveOrder,
        loadActiveTableOrder,
        orderType,
        setOrderType,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        orderNotes,
        setOrderNotes,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        clearCart,
        subtotal,
        placeOrder,
        isSubmitting,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => useContext(OrderContext);
