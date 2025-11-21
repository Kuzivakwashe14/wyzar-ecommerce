"use client";

import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  className
}: OTPInputProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/[^0-9]/g, '');

    if (digit.length > 1) {
      // Handle paste of multiple digits
      handlePaste(digit, index);
      return;
    }

    const newValue = value.split('');
    newValue[index] = digit;
    onChange(newValue.join(''));

    // Move to next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = value.split('');

      if (value[index]) {
        // Clear current digit
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
    }

    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }

    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handlePaste = (pastedValue: string, startIndex: number = 0) => {
    const digits = pastedValue.replace(/[^0-9]/g, '').slice(0, length);
    const newValue = value.split('');

    for (let i = 0; i < digits.length; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < length) {
        newValue[targetIndex] = digits[i];
      }
    }

    onChange(newValue.join(''));

    // Focus the next empty input or the last one
    const nextEmptyIndex = newValue.findIndex((v, i) => !v && i >= startIndex);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(startIndex + digits.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
    setActiveIndex(focusIndex);
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePaste(pastedData, index);
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
    // Select the content when focused for easier replacement
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePasteEvent(e, index)}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold",
            "border-2 rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all",
            activeIndex === index && !disabled && "ring-2 ring-primary border-primary"
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
