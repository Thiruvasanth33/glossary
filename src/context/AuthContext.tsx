import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

export type UserRole = 'owner' | 'viewer';

interface AuthContextType {
  userRole: UserRole;
  isOwner: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  changeOwnerPin: (currentPin: string, newPin: string) => { success: boolean; message: string };
  hasCustomPin: boolean;
}

const STORAGE_KEYS = {
  AUTH_ROLE: 'freshprice_auth_role',
  OWNER_PIN: 'freshprice_owner_pin',
};

const DEFAULT_PIN = '1234';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_ROLE);
      return saved === 'owner' ? 'owner' : 'viewer';
    } catch {
      return 'viewer';
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync role to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, userRole);
    } catch {
      // ignore
    }
  }, [userRole]);

  const getStoredPin = useCallback((): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.OWNER_PIN) || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  }, []);

  const login = useCallback(
    (pin: string): boolean => {
      const stored = getStoredPin();
      if (pin.trim() === stored.trim()) {
        setUserRole('owner');
        setIsLoginModalOpen(false);
        toast.success('Owner Access Unlocked', 'You are now authorized to edit prices and manage inventory.');
        return true;
      } else {
        toast.error('Incorrect PIN', 'Please enter the correct 4-digit Owner PIN.');
        return false;
      }
    },
    [getStoredPin, toast]
  );

  const logout = useCallback(() => {
    setUserRole('viewer');
    toast.info('Logged Out', 'Switched to read-only Viewer mode.');
  }, [toast]);

  const changeOwnerPin = useCallback(
    (currentPin: string, newPin: string): { success: boolean; message: string } => {
      const stored = getStoredPin();
      if (currentPin.trim() !== stored.trim()) {
        return { success: false, message: 'Current PIN is incorrect.' };
      }
      if (newPin.trim().length < 4) {
        return { success: false, message: 'New PIN must be at least 4 digits.' };
      }
      try {
        localStorage.setItem(STORAGE_KEYS.OWNER_PIN, newPin.trim());
        toast.success('PIN Updated', 'Owner PIN has been changed successfully.');
        return { success: true, message: 'PIN updated successfully.' };
      } catch (e: any) {
        return { success: false, message: e.message || 'Failed to save new PIN.' };
      }
    },
    [getStoredPin, toast]
  );

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const hasCustomPin = getStoredPin() !== DEFAULT_PIN;

  return (
    <AuthContext.Provider
      value={{
        userRole,
        isOwner: userRole === 'owner',
        login,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        changeOwnerPin,
        hasCustomPin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
