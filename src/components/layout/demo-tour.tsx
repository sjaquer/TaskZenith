'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDemo } from '@/contexts/demo-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tour Overlay ─────────────────────────────────────────────
export function DemoTourOverlay() {
  const {
    isDemo,
    isTourActive,
    currentTourStep,
    tourStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    startTour,
  } = useDemo();

  const { exitDemoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowDir: string }>({
    top: 0,
    left: 0,
    arrowDir: 'none',
  });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  // Navigate to the step's page if needed
  useEffect(() => {
    if (!currentTourStep?.page) return;
    if (pathname !== currentTourStep.page) {
      router.push(currentTourStep.page);
    }
  }, [currentTourStep, pathname, router]);

  // Position the tooltip and highlight - recalculates target rect each time
  const positionTooltip = useCallback(() => {
    if (!currentTourStep || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();

    if (currentTourStep.placement === 'center') {
      setHighlightRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - tooltipRect.height / 2,
        left: window.innerWidth / 2 - tooltipRect.width / 2,
        arrowDir: 'none',
      });
      setIsPositioned(true);
      return;
    }

    const targetEl = document.querySelector(currentTourStep.target);
    if (!targetEl) {
      // Fallback to center if target not found
      setHighlightRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - tooltipRect.height / 2,
        left: window.innerWidth / 2 - tooltipRect.width / 2,
        arrowDir: 'none',
      });
      setIsPositioned(true);
      return;
    }

    // Always recalculate from live DOM position
    const targetRect = targetEl.getBoundingClientRect();
    setHighlightRect(targetRect);

    const gap = 16;
    let top = 0;
    let left = 0;
    let arrowDir = currentTourStep.placement;

    switch (currentTourStep.placement) {
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipRect.height - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + gap;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipRect.width - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipRect.height - 12));

    setTooltipPos({ top, left, arrowDir });
    setIsPositioned(true);
  }, [currentTourStep]);

  // Scroll-aware repositioning using rAF for smooth tracking
  const handleScrollOrResize = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      positionTooltip();
    });
  }, [positionTooltip]);

  // Scroll target element into view when step changes, then position
  useEffect(() => {
    if (!isTourActive || !currentTourStep) return;
    setIsPositioned(false);

    const setup = () => {
      if (currentTourStep.placement !== 'center' && currentTourStep.target) {
        const targetEl = document.querySelector(currentTourStep.target);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          // After scroll animation settles, position tooltip
          setTimeout(positionTooltip, 450);
          return;
        }
      }
      positionTooltip();
    };

    // Delay to allow DOM to render after navigation
    const timer = setTimeout(setup, 350);

    // Listen to scroll on all scrollable ancestors + window
    const scrollHandler = handleScrollOrResize;
    window.addEventListener('resize', scrollHandler);
    window.addEventListener('scroll', scrollHandler, true); // capture phase to catch all scrolls

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', scrollHandler);
      window.removeEventListener('scroll', scrollHandler, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isTourActive, currentTourStep, positionTooltip, handleScrollOrResize]);

  if (!isDemo) return null;

  // Demo banner (always shows when in demo mode)
  if (!isTourActive) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 bg-primary/95 text-primary-foreground px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-sm border border-primary-foreground/20">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">Modo Demo</span>
          <div className="w-px h-4 bg-primary-foreground/30" />
          <Button
            size="sm"
            variant="secondary"
            onClick={startTour}
            className="h-7 text-xs gap-1 rounded-full"
          >
            <Play className="w-3 h-3" />
            Iniciar Tour
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              exitDemoMode();
              router.push('/login');
            }}
            className="h-7 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full"
          >
            Salir
          </Button>
        </div>
      </div>
    );
  }

  // Tour active - show overlay + tooltip
  return (
    <>
      {/* Clickable overlay - clicking anywhere on the dark area skips the tour */}
      <div 
        className="fixed inset-0 z-[9997]"
        onClick={skipTour}
        style={{ background: highlightRect ? 'transparent' : 'rgba(0,0,0,0.6)' }}
      />

      {/* Highlight cutout with massive box-shadow for overlay effect */}
      {highlightRect && (
        <div
          className="fixed z-[9998] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
          style={{
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] w-[340px] max-w-[calc(100vw-24px)] bg-card border border-border rounded-xl shadow-2xl transition-all duration-300',
          isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((tourStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight">
              {currentTourStep?.title}
            </h3>
            <button
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentTourStep?.description}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {tourStep + 1} de {totalSteps}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={prevStep}
                disabled={tourStep === 0}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                Anterior
              </Button>
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 text-xs gap-1"
              >
                {tourStep === totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
                {tourStep < totalSteps - 1 && <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Exit Demo Button for AppShell ────────────────────────────
export function DemoBadge() {
  const { isDemo } = useDemo();
  const { exitDemoMode } = useAuth();
  const router = useRouter();

  if (!isDemo) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        exitDemoMode();
        router.push('/login');
      }}
      className="h-7 text-xs gap-1.5 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
    >
      <Sparkles className="w-3 h-3" />
      Salir del Demo
    </Button>
  );
}
