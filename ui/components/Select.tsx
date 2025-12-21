'use client';

import { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  dark?: boolean;
}

export default function Select({
  id,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  dark = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value);
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          onChange(options[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          const currentIndex = options.findIndex(opt => opt.value === value);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          onChange(options[prevIndex].value);
        }
        break;
    }
  };

  const baseButtonClasses = dark
    ? 'px-4 py-2 rounded-lg text-sm font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30 shadow-lg hover:bg-white/25 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[140px]'
    : 'px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 shadow-sm hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[80px]';

  const baseMenuClasses = dark
    ? 'absolute z-50 mt-1 w-full rounded-lg bg-white/95 backdrop-blur-md border border-white/30 shadow-xl overflow-hidden'
    : 'absolute z-50 mt-1 w-full rounded-lg bg-white border border-gray-200 shadow-xl overflow-hidden';

  const listboxId = id ? `${id}-listbox` : 'select-listbox';
  const buttonId = id || 'select-button';

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        id={buttonId}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`${baseButtonClasses} flex items-center justify-between gap-2`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={selectedOption.label}
      >
        <span className="flex-1 truncate text-left">{selectedOption.label}</span>
        <span
          className={`flex-shrink-0 flex items-center pointer-events-none transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={dark ? 'stroke-white' : 'stroke-primary'}
            aria-hidden="true"
          >
            <path
              d="M4 6L8 10L12 6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={baseMenuClasses}>
          <ul
            id={listboxId}
            role="listbox"
            aria-label={selectedOption.label}
            className="py-1 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    px-4 py-2.5 cursor-pointer transition-colors duration-150
                      ${isSelected
                        ? dark
                            ? 'bg-primary/20 text-white font-medium'
                            : 'bg-primary/10 text-teal-700 font-medium'
                        : dark
                        ? 'text-gray-800 hover:bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                            className="text-teal-700"
                        aria-hidden="true"
                      >
                        <path
                          d="M13 4L6 11L3 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

