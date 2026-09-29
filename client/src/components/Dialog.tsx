import React, { useEffect, useRef } from 'react';
export function Dialog({
  children,
  className = '',
  label,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key !== 'Tab' || !ref.current) return;
      const elements = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex="0"]'
        )
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (!first) {
        e.preventDefault();
        return;
      }
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected && !previous.matches(':disabled')) {
        previous.focus();
      } else {
        document
          .querySelector<HTMLElement>(
            '.btn-call:not(:disabled), .btn-allin:not(:disabled), .help-button'
          )
          ?.focus();
      }
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        ref={ref}
        className={`dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
