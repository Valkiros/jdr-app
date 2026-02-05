import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    id: number | string;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: number | string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    direction?: 'up' | 'down' | 'auto';
    disableSort?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "-- Sélectionner --",
    className = "",
    direction = 'auto',
    disableSort = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0, bottom: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.id.toString() === value?.toString());

    // Sync search term with value
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm(selectedOption ? selectedOption.label : '');
        }
    }, [isOpen, selectedOption, value]);

    // We need a ref for the dropdown content to check clicks
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInput = containerRef.current && containerRef.current.contains(target);
            const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);

            if (!clickedInput && !clickedDropdown) {
                setIsOpen(false);
                if (selectedOption) setSearchTerm(selectedOption.label);
                else setSearchTerm('');
            }
        };

        if (isOpen) {
            const handleScroll = (event: Event) => {
                // If scroll stems from the dropdown content itself, don't close
                if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            };

            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', () => setIsOpen(false));
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', () => setIsOpen(false));
            };
        }
    }, [isOpen, selectedOption]);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                bottom: rect.bottom, // Fixed position relative to viewport
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        updateCoords();
        setIsOpen(true);
        e.target.select(); // Select all text for easy replacement
    };

    const handleSelect = (option: Option) => {
        onChange(option.id.toString());
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val === '') {
            onChange('');
        }
        if (!isOpen) {
            updateCoords();
            setIsOpen(true);
        }
    };

    const normalize = (str: string) =>
        str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const filteredOptions = options
        .filter(option => normalize(option.label).includes(normalize(searchTerm)));

    if (!disableSort) {
        filteredOptions.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
    }

    // Calculate position style
    const getDropdownStyle = () => {
        const style: React.CSSProperties = {
            position: 'fixed',
            left: coords.left,
            minWidth: coords.width,
            width: 'auto',
            maxHeight: '300px',
            zIndex: 9999
        };

        const spaceBelow = window.innerHeight - coords.bottom;
        const spaceAbove = coords.top;
        const dropdownHeightEstimate = Math.min(filteredOptions.length * 36 + 20, 300); // Approximate height

        let finalDirection = direction;
        if (direction === 'auto') {
            if (spaceBelow < dropdownHeightEstimate && spaceAbove > spaceBelow) {
                finalDirection = 'up';
            } else {
                finalDirection = 'down';
            }
        }

        if (finalDirection === 'up') {
            style.bottom = window.innerHeight - coords.top;
            style.marginBottom = '2px';
        } else {
            style.top = coords.bottom;
        }

        return style;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <input
                type="text"
                className="w-full p-1 bg-white/50 border-b border-gray-400 focus:border-black outline-none truncate text-black"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                title={selectedOption?.label}
            />

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={getDropdownStyle()}
                    className={`bg-white border border-gray-400 shadow-xl overflow-y-auto ${getDropdownStyle().bottom ? 'rounded-t-md border-b-0' : 'rounded-b-md border-t-0'}`}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <div
                                key={option.id}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-black text-sm whitespace-nowrap border-b border-gray-100 last:border-0"
                                onClick={() => handleSelect(option)}
                                title={option.label}
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm italic">
                            Aucun résultat
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};
