import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const normalizedOptions = Array.isArray(options) ? options : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  const selectedLabel = normalizedOptions.find((opt) => opt === value || opt.value === value);
  const displayValue = typeof selectedLabel === 'object' ? selectedLabel?.label : selectedLabel;

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        disabled={disabled}
        className={`w-full border border-[#E2DDD8] rounded-xl px-3.5 py-2.5 text-sm text-[#2C1810] bg-white transition focus:outline-none focus:border-[#6B3E26] focus:ring-2 focus:ring-[#6B3E26]/10 flex items-center justify-between ${
          disabled ? 'cursor-not-allowed bg-[#F7F4F0] text-[#B7AAA1]' : ''
        } ${className}`}
      >
        <span className={displayValue ? 'text-[#2C1810]' : 'text-[#C4B8B0]'}>
          {displayValue || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 ${disabled ? 'text-[#C4B8B0]' : 'text-[#9E8A7A]'} transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2DDD8] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {normalizedOptions.length > 0 ? normalizedOptions.map((option, idx) => {
              const optValue = typeof option === 'object' ? option.value : option;
              const optLabel = typeof option === 'object' ? option.label : option;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm text-left transition-colors ${
                    value === optValue || value === optLabel
                      ? 'bg-[#3D261D] text-white font-semibold'
                      : 'text-[#2C1810] hover:bg-[#F7F4F0]'
                  }`}
                >
                  {optLabel}
                </button>
              );
            }) : (
              <div className="px-3.5 py-3 text-sm text-[#9E8A7A]">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
