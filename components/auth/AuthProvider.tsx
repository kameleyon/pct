'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { AuthModal, type Step } from './AuthModal';

const Ctx = createContext<{ open: (step?: Step) => void }>({ open: () => {} });
export const useAuthModal = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step | null>(null);
  return (
    <Ctx.Provider value={{ open: (s = 'signin') => setStep(s) }}>
      {children}
      {step && <AuthModal initial={step} onClose={() => setStep(null)} />}
    </Ctx.Provider>
  );
}
