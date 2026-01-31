import React, { useState, useEffect } from 'react';

interface TooltipProps {
    visible: boolean;
    position: { x: number, y: number };
    title?: string;
    children?: React.ReactNode;
    requireCtrl?: boolean;
    direction?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ visible, position, title, children, requireCtrl = true, direction = 'top' }) => {
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    if (!visible) return null;
    if (requireCtrl && !isCtrlPressed) return null;

    const verticalClass = direction === 'top' ? '-translate-y-full' : 'translate-y-0';
    const topStyle = direction === 'top' ? position.y - 10 : position.y + 10;

    return (
        <div
            className={`fixed z-50 p-4 bg-[#2a1a10] text-[#f0e6d2] rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-[#cca43b] w-96 pointer-events-none transform -translate-x-1/2 ${verticalClass}`}
            style={{ left: position.x, top: topStyle }}
        >
            {title && (
                <div className="font-serif font-bold text-xl mb-2 border-b border-[#cca43b]/40 pb-1 text-[#eebb44] tracking-wide">
                    {title}
                </div>
            )}

            <div className="text-sm space-y-1.5 opacity-90 font-sans">
                {children}
            </div>
        </div>
    );
};
