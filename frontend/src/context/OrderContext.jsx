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

  const loadActiveTableOrder = async (tableId) => {
    if (!tableId) {
      setActiveTableOrder(null);
      return;
    }
    setLoadingActiveOrder(true);
    try {
      const orderData = await ordersApi.getActiveTableOrder(tableId);
      const guestFromTable = selectedTable?.active_reservation?.guest_name || selectedTable?.guest_name || '';

      if (orderData && orderData.id && Array.isArray(orderData.items)) {
        setActiveTableOrder(orderData);
        setCustomerName(orderData.customer_name || guestFromTable || '');
        setCustomerPhone(orderData.customer_phone || '');
        if (orderData.kitchen_notes || orderData.notes) {
          setOrderNotes(orderData.kitchen_notes || orderData.notes);
        }
      } else {
        setActiveTableOrder(null);
      }
    } catch (err) {
      console.error('Error fetching active table order metadata:', err);
      setActiveTableOrder(null);
    } finally {
      setLoadingActiveOrder(false);
    }
  };

  useEffect(() => {
    if (selectedTable?.id) {
      loadActiveTableOrder(selectedTable.id);
    } else {
      setActiveTableOrder(null);
      setDraftItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
    }
  }, [selectedTable?.id]);

  // Compute unified display cart items = previously submitted items + newly added draft items
  const cartItems = (() => {
    const map = new Map();

    // 1. Include submitted items from active table order
    if (activeTableOrder && Array.isArray(activeTableOrder.items)) {
      activeTableOrder.items.forEach((item) => {
        const key = `${item.menu_item}-${item.portion || 'Full'}`;
        map.set(key, {
          order_item_id: item.id,
          menu_item: {
            id: item.menu_item,
            name: item.menu_item_name || 'Item',
            price: parseFloat(item.unit_price || item.price || 0),
            image: item.menu_item_image || '',
          },
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price || item.price || 0),
          portion: item.portion || 'Full',
          notes: item.notes || '',
          isSubmitted: true,
          submittedQuantity: item.quantity,
        });
      });
    }

    // 2. Merge newly added draft items
    draftItems.forEach((draft) => {
      const key = `${draft.menu_item?.id}-${draft.portion || 'Full'}`;
      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity = existing.submittedQuantity + draft.quantity;
        if (draft.unit_price) existing.unit_price = draft.unit_price;
      } else {
        map.set(key, {
          ...draft,
          isSubmitted: false,
          submittedQuantity: 0,
        });
      }
    });

    return Array.from(map.values());
  })();

  const addToCart = (menuItem, portion = 'Full') => {
    setDraftItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.menu_item?.id) === String(menuItem.id) && item.portion === portion
      );

      let price = parseFloat(menuItem.price);
      if (portion === 'Half' && menuItem.half_price) {
        price = parseFloat(menuItem.half_price);
      } else if (portion === 'Half') {
        price = Math.round(parseFloat(menuItem.price) * 0.6);
      } else if (portion === 'Quarter' && menuItem.quarter_price) {
        price = parseFloat(menuItem.quarter_price);
      } else if (portion === 'Quarter') {
        price = Math.round(parseFloat(menuItem.price) * 0.35);
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
    let submittedQty = 0;
    if (activeTableOrder && Array.isArray(activeTableOrder.items)) {
      const submittedItem = activeTableOrder.items.find(
        (item) => String(item.menu_item) === String(menuItemId) && (item.portion || 'Full') === portion
      );
      if (submittedItem) {
        submittedQty = submittedItem.quantity;
      }
    }

    setDraftItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => String(item.menu_item?.id) === String(menuItemId) && item.portion === portion
      );

      const currentDraftQty = existingIndex > -1 ? prev[existingIndex].quantity : 0;
      const currentDisplayQty = submittedQty + currentDraftQty;
      const newDisplayQty = currentDisplayQty + delta;
      const newDraftQty = Math.max(0, newDisplayQty - submittedQty);

      if (existingIndex > -1) {
        if (newDraftQty > 0) {
          return prev.map((item, idx) =>
            idx === existingIndex ? { ...item, quantity: newDraftQty } : item
          );
        } else {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
      } else if (newDraftQty > 0) {
        return [
          ...prev,
          {
            menu_item: { id: menuItemId },
            quantity: newDraftQty,
            unit_price: 0,
            portion,
            notes: '',
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
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const startNewOrderSession = (table) => {
    setSelectedTable(table);
    setDraftItems([]);
    setActiveTableOrder(null);
    setCustomerName(table?.active_reservation?.guest_name || table?.guest_name || '');
    setCustomerPhone('');
    setOrderNotes('');
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
        menu_item: item.menu_item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        portion: item.portion,
        notes: item.notes,
      }));

      if (activeTableOrder && activeTableOrder.id) {
        createdOrder = await ordersApi.addItemsToOrder(activeTableOrder.id, {
          items: itemsPayload,
          notes: orderNotes,
          kitchen_notes: orderNotes,
        });
      } else {
        const payload = {
          table: orderType === 'dine_in' ? (selectedTable?.id || null) : null,
          order_type: orderType,
          customer_name: customerName,
          customer_phone: customerPhone,
          notes: orderNotes,
          kitchen_notes: orderNotes,
          items: itemsPayload,
        };
        createdOrder = await ordersApi.createOrder(payload);
      }

      setDraftItems([]);
      if (selectedTable?.id) {
        try {
          const cached = localStorage.getItem('staff_cached_tables');
          if (cached) {
            const list = JSON.parse(cached);
            const updated = list.map((t) =>
              String(t.id) === String(selectedTable.id) ? { ...t, status: 'occupied' } : t
            );
            localStorage.setItem('staff_cached_tables', JSON.stringify(updated));
          }
          window.dispatchEvent(new Event('tablesUpdated'));
        } catch {}
        await loadActiveTableOrder(selectedTable.id);
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
        activeTableOrder,
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
