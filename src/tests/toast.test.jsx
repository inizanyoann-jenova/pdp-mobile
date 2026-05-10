// src/tests/toast.test.js
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../contexts/ToastContext';

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

describe('ToastContext', () => {
  it('addToast ajoute un toast avec un id unique', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current.addToast({ message: 'Bonjour', type: 'success' }));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Bonjour');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('removeToast supprime le toast par id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current.addToast({ message: 'Test', type: 'info' }));
    const id = result.current.toasts[0].id;
    act(() => result.current.removeToast(id));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('limite la file à 3 toasts max', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.addToast({ message: '1', type: 'info' });
      result.current.addToast({ message: '2', type: 'info' });
      result.current.addToast({ message: '3', type: 'info' });
      result.current.addToast({ message: '4', type: 'info' });
    });
    expect(result.current.toasts).toHaveLength(3);
  });
});
