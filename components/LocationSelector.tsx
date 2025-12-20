'use client';

import { MapPin, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LocationOption {
  id: string;
  name: string;
  state: string;
  zoneCount: number;
}

interface LocationSelectorProps {
  options: LocationOption[];
  selected: LocationOption | null;
  onSelect: (option: LocationOption) => void;
  size?: 'small' | 'large';
}

export default function LocationSelector({
  options,
  selected,
  onSelect,
  size = 'large'
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSmall = size === 'small';

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-dark/80 border border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-all ${
          isOpen ? 'border-primary/50' : ''
        }`}
      >
        <MapPin size={isSmall ? 10 : 12} className="text-primary fill-primary" />
        <span className={`font-display font-bold uppercase tracking-[0.15em] text-primary ${
          isSmall ? 'text-[8px]' : 'text-[10px]'
        }`}>
          {selected?.name || 'Select Location'}
        </span>
        <ChevronDown
          size={isSmall ? 10 : 12}
          className={`text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-surface-dark border border-primary/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          {/* Search Input */}
          <div className="p-3 border-b border-primary/10">
            <input
              type="text"
              placeholder="Search centers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-background-dark/50 border border-primary/20 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No centers found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full px-4 py-3 flex items-start justify-between hover:bg-primary/10 transition-colors border-b border-primary/5 last:border-b-0 ${
                    selected?.id === option.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        selected?.id === option.id ? 'text-primary fill-primary' : 'text-slate-500'
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-display font-bold text-sm text-white tracking-wide">
                        {option.name}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {option.state} • {option.zoneCount} {option.zoneCount === 1 ? 'zone' : 'zones'}
                      </div>
                    </div>
                  </div>
                  {selected?.id === option.id && (
                    <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5"></div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
