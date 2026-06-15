/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

const pizza  = { id: 1, name: 'Pizza',  price: '300.00' };
const burger = { id: 2, name: 'Burger', price: '150.00' };

describe('CartContext', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.count).toBe(0);
  });

  it('addItem adds a new item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 2));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.items[0].menu_item_id).toBe(1);
  });

  it('addItem increments quantity when item already in cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.addItem(pizza, 3));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(4);
  });

  it('addItem keeps different items separate', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.addItem(burger, 1));
    expect(result.current.items).toHaveLength(2);
  });

  it('removeItem removes item by id', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.addItem(burger, 1));
    act(() => result.current.removeItem(1));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].menu_item_id).toBe(2);
  });

  it('removeItem on non-existent id does nothing', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.removeItem(999));
    expect(result.current.items).toHaveLength(1);
  });

  it('updateQuantity sets new quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.updateQuantity(1, 5));
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('updateQuantity with 0 removes item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 3));
    act(() => result.current.updateQuantity(1, 0));
    expect(result.current.items).toHaveLength(0);
  });

  it('updateQuantity with negative value removes item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(pizza, 3));
    act(() => result.current.updateQuantity(1, -1));
    expect(result.current.items).toHaveLength(0);
  });

  it('clearCart empties everything', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(pizza, 2);
      result.current.addItem(burger, 3);
    });
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.count).toBe(0);
  });

  it('total is sum of price * quantity for all items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(pizza, 2);   // 300 * 2 = 600
      result.current.addItem(burger, 3);  // 150 * 3 = 450
    });
    expect(result.current.total).toBe(1050);
  });

  it('count is total number of units', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(pizza, 2);
      result.current.addItem(burger, 3);
    });
    expect(result.current.count).toBe(5);
  });
});
