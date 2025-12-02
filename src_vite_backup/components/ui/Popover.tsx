import React, { useState, createContext, useContext, useRef, useEffect } from 'react';

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export const Popover = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block" ref={popoverRef}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within a Popover');

  const { setIsOpen, isOpen, triggerRef } = context;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      // @ts-ignore
      ref: triggerRef,
      onClick: handleClick,
    });
  }

  return (
    // @ts-ignore
    <button ref={triggerRef} onClick={handleClick}>
      {children}
    </button>
  );
};

export const PopoverContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverContent must be used within a Popover');

  if (!context.isOpen) return null;

  return (
    <div className={`absolute z-50 mt-2 ${className}`}>
      {children}
    </div>
  );
};

