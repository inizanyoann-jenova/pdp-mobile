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

  it('auto-dismiss supprime le toast après la durée', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current.addToast({ message: 'Auto', type: 'info', duration: 2000 }));
    expect(result.current.toasts).toHaveLength(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('duration=0 ne supprime pas le toast automatiquement', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current.addToast({ message: 'Permanent', type: 'info', duration: 0 }));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.toasts).toHaveLength(1);
    vi.useRealTimers();
  });
});
