import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

import { authAPI } from '../services/api';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const adminUser    = { id: 1, name: 'Admin',    email: 'admin@test.com', role: 'admin'    };
const customerUser = { id: 2, name: 'Customer', email: 'cust@test.com',  role: 'customer' };

describe('Admin AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initialises with null user when localStorage empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('restores admin user from localStorage on mount', () => {
    localStorage.setItem('user', JSON.stringify(adminUser));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toEqual(adminUser);
  });

  it('login stores token and user for admin', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'admintok', user: adminUser } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.login('admin@test.com', 'adminpass'); });

    expect(result.current.user).toEqual(adminUser);
    expect(localStorage.getItem('token')).toBe('admintok');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(adminUser);
  });

  it('login throws for non-admin users', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'ctok', user: customerUser } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => { await result.current.login('cust@test.com', 'pass'); })
    ).rejects.toThrow();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login propagates network errors', async () => {
    authAPI.login.mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => { await result.current.login('x@x.com', 'p'); })
    ).rejects.toThrow('Network Error');
  });

  it('logout clears user and removes token from localStorage', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'tok', user: adminUser } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.login('admin@test.com', 'pass'); });
    act(() => { result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
