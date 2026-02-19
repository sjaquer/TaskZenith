'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DEMO_TOUR_STEPS, type TourStep } from '@/lib/demo-data';

interface DemoContextType {
  isDemo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  // Tour
  isTourActive: boolean;
  tourStep: number;
  currentTourStep: TourStep | null;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const enterDemo = useCallback(() => {
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemo(false);
    setIsTourActive(false);
    setTourStep(0);
  }, []);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setTourStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setTourStep((prev) => {
      if (prev >= DEMO_TOUR_STEPS.length - 1) {
        setIsTourActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setTourStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setTourStep(0);
  }, []);

  const currentTourStep = isTourActive ? DEMO_TOUR_STEPS[tourStep] ?? null : null;

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        enterDemo,
        exitDemo,
        isTourActive,
        tourStep,
        currentTourStep,
        totalSteps: DEMO_TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
