'use client';

import { MapPin, X, Search, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LocationOption {
  id: string;
  name: string;
  state: string;
  zoneCount: number;
  zones?: string[];
}

interface ZoneSelection {
  centerId: string;
  centerName: string;
  zoneName: string;
}

interface LocationSelectorSheetProps {
  options: LocationOption[];
  selected: LocationOption | null;
  selectedZone?: string | null;
  onSelect: (option: LocationOption, zone?: string) => void;
  size?: 'small' | 'large';
  currentDate?: string;
}

export default function LocationSelectorSheet({
  options,
  selected,
  selectedZone,
  onSelect,
  size = 'large',
  currentDate
}: LocationSelectorSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<LocationOption | null>(selected);
  const [tempSelectedZone, setTempSelectedZone] = useState<string | null>(selectedZone || null);
  const [showingZones, setShowingZones] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update temp selection when selected changes
  useEffect(() => {
    setTempSelected(selected);
    setTempSelectedZone(selectedZone || null);
  }, [selected, selectedZone]);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredZones = showingZones && tempSelected?.zones
    ? tempSelected.zones.filter(zone =>
        zone.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCenterClick = (option: LocationOption) => {
    setTempSelected(option);
    if (option.zones && option.zones.length > 0) {
      setShowingZones(true);
      setSearchQuery('');
    } else {
      // If no zones, select the center directly
      setTempSelectedZone(null);
    }
  };

  const handleZoneClick = (zone: string) => {
    setTempSelectedZone(zone);
  };

  const handleBack = () => {
    setShowingZones(false);
    setSearchQuery('');
  };

  const handleSave = () => {
    if (tempSelected) {
      onSelect(tempSelected, tempSelectedZone || undefined);
    }
    setIsOpen(false);
    setSearchQuery('');
    setShowingZones(false);
  };

  const handleCancel = () => {
    setTempSelected(selected);
    setTempSelectedZone(selectedZone || null);
    setIsOpen(false);
    setSearchQuery('');
    setShowingZones(false);
  };

  const isSmall = size === 'small';

  const modalContent = isOpen && mounted ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-fade-in flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        {/* Sheet */}
        <div
          className="bg-surface-dark border border-primary/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-primary/10">
            <div className="flex items-center justify-between mb-2">
              {showingZones && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 mr-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                {showingZones ? `SELECT ZONE` : 'SELECT CENTER'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {showingZones && tempSelected && (
              <div className="text-sm text-slate-400 mb-2">
                {tempSelected.name}
              </div>
            )}

            {/* Search Input */}
            <div className="relative mt-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={showingZones ? "Search zones..." : "Search centers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background-dark/50 border border-primary/20 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-96 overflow-y-auto px-6 py-4">
            {showingZones ? (
              // Zone Selection View
              filteredZones.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No zones found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredZones.map((zone) => (
                    <button
                      key={zone}
                      onClick={() => handleZoneClick(zone)}
                      className={`w-full px-4 py-3.5 flex items-start justify-between rounded-xl transition-all ${
                        tempSelectedZone === zone
                          ? 'bg-primary/15 border-2 border-primary/40'
                          : 'bg-surface-lighter/50 border-2 border-transparent hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={18}
                          className={`mt-0.5 shrink-0 ${
                            tempSelectedZone === zone ? 'text-primary fill-primary' : 'text-slate-500'
                          }`}
                        />
                        <div className="text-left">
                          <div className={`font-display font-bold text-sm tracking-wide ${
                            tempSelectedZone === zone ? 'text-primary' : 'text-white'
                          }`}>
                            {zone}
                          </div>
                        </div>
                      </div>
                      {tempSelectedZone === zone && (
                        <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : (
              // Center Selection View
              filteredOptions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No centers found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleCenterClick(option)}
                      className={`w-full px-4 py-3.5 flex items-start justify-between rounded-xl transition-all ${
                        tempSelected?.id === option.id && !showingZones
                          ? 'bg-primary/15 border-2 border-primary/40'
                          : 'bg-surface-lighter/50 border-2 border-transparent hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={18}
                          className={`mt-0.5 shrink-0 ${
                            tempSelected?.id === option.id && !showingZones ? 'text-primary fill-primary' : 'text-slate-500'
                          }`}
                        />
                        <div className="text-left">
                          <div className={`font-display font-bold text-sm tracking-wide ${
                            tempSelected?.id === option.id && !showingZones ? 'text-primary' : 'text-white'
                          }`}>
                            {option.name}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                            {option.state} • {option.zoneCount} {option.zoneCount === 1 ? 'zone' : 'zones'}
                          </div>
                        </div>
                      </div>
                      <div className="text-primary/50 group-hover:text-primary transition-colors">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-primary/10 flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-surface-lighter border border-primary/20 text-slate-300 font-display font-bold text-sm uppercase tracking-wider hover:bg-surface-dark transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={showingZones ? !tempSelectedZone : !tempSelected}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-background-dark font-display font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showingZones ? 'Select Zone' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Trigger Button */}
      {isSmall ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-dark/80 border border-primary/30 backdrop-blur-sm hover:border-primary/50 transition-all active:scale-95"
        >
          <MapPin size={12} className="text-primary fill-primary shrink-0" />
          <span className="font-display font-bold uppercase tracking-[0.12em] text-primary text-[9px] truncate max-w-[120px]">
            {selected?.name || 'Select'}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-dark/80 border-2 border-primary/30 backdrop-blur-sm hover:border-primary/50 hover:bg-surface-dark transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/15 border border-primary/30">
              <MapPin size={20} className="text-primary fill-primary" />
            </div>
            <div className="text-left">
              <div className="text-[9px] font-display font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">
                {currentDate} • Location
              </div>
              <div className="text-base font-display font-bold tracking-wide text-primary">
                {selected?.name || 'Select Location'}
              </div>
              {selected && (
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                  {selectedZone || `${selected.state} • ${selected.zoneCount} ${selected.zoneCount === 1 ? 'zone' : 'zones'}`}
                </div>
              )}
            </div>
          </div>
          <div className="text-primary/50 group-hover:text-primary transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      )}

      {/* Portal Modal to document.body */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
