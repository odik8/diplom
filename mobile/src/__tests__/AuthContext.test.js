/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

jest.mock('../services/api', () => ({
  authAPI: {
    login:         jest.fn(),
    register:      jest.fn(),
    me:            jest.fn(),
    updateProfile: jest.fn(),
  },
  setOnUnauthorized: jest.fn(),
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const fakeCustomer = { id: 1, name: 'Alice', email: 'a@a.com', role: 'customer' };
const fakeCourier  = { id: 2, name: 'Bob',   email: 'b@b.com', role: 'courier'  };

describe('AuthContext', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('starts with null user and loading=false after mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('restores user from AsyncStorage on mount', async () => {
    await AsyncStorage.setItem('user', JSON.stringify(fakeCustomer));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user).toEqual(fakeCustomer);
  });

  it('login sets user and persists token + user', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'tok123', user: fakeCustomer } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.login('a@a.com', 'pass'); });

    expect(result.current.user).toEqual(fakeCustomer);
    expect(await AsyncStorage.getItem('token')).toBe('tok123');
    expect(JSON.parse(await AsyncStorage.getItem('user'))).toEqual(fakeCustomer);
  });

  it('login returns the user object', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'tok', user: fakeCustomer } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    let returned;
    await act(async () => { returned = await result.current.login('a@a.com', 'pass'); });
    expect(returned).toEqual(fakeCustomer);
  });

  it('login propagates API errors', async () => {
    authAPI.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await expect(result.current.login('x@x.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('register sets user and persists token + user', async () => {
    authAPI.register.mockResolvedValueOnce({ data: { token: 'regtok', user: fakeCustomer } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => {
      await result.current.register({ name: 'Alice', email: 'a@a.com', password: 'pass123' });
    });
    expect(result.current.user).toEqual(fakeCustomer);
    expect(await AsyncStorage.getItem('token')).toBe('regtok');
  });

  it('logout clears user and removes storage keys', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'tok', user: fakeCustomer } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.login('a@a.com', 'pass'); });
    await act(async () => { await result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(await AsyncStorage.getItem('token')).toBeNull();
    expect(await AsyncStorage.getItem('user')).toBeNull();
  });

  it('updateUser merges new fields into current user', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'tok', user: { ...fakeCustomer, address: null } } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.login('a@a.com', 'pass'); });
    act(() => { result.current.updateUser({ name: 'Alice Updated', address: 'Moscow, Lenina 1' }); });

    expect(result.current.user.name).toBe('Alice Updated');
    expect(result.current.user.address).toBe('Moscow, Lenina 1');
    expect(result.current.user.email).toBe('a@a.com');
  });

  it('updateUser persists merged user to AsyncStorage', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'tok', user: fakeCustomer } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.login('a@a.com', 'pass'); });
    act(() => { result.current.updateUser({ address: 'SPb, Nevsky 1' }); });
    await act(async () => {});

    const stored = JSON.parse(await AsyncStorage.getItem('user'));
    expect(stored.address).toBe('SPb, Nevsky 1');
  });

  it('works for courier role', async () => {
    authAPI.login.mockResolvedValueOnce({ data: { token: 'ctok', user: fakeCourier } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.login('b@b.com', 'pass'); });
    expect(result.current.user.role).toBe('courier');
  });
});
