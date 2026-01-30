import React, { useState } from 'react';

interface LocalSaveButtonProps {
    onSave: () => Promise<void>;
}

export const LocalSaveButton: React.FC<LocalSaveButtonProps> = ({ onSave }) => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSave = async () => {
        setStatus('saving');
        setErrorMessage('');
        try {
            await onSave();
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            console.error("Local Save Error:", err);
            setErrorMessage(String(err));
            setStatus('error');
        }
    };

    return (
        <div className="flex items-center gap-2">
            {errorMessage && <span className="text-xs text-red-500 font-bold">{errorMessage}</span>}
            <button
                onClick={handleSave}
                disabled={status === 'saving'}
                className={`
                    px-3 py-1 rounded text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer
                    ${status === 'idle' ? 'bg-parchment text-leather hover:bg-white' : ''}
                    ${status === 'saving' ? 'bg-yellow-600 text-white cursor-wait' : ''}
                    ${status === 'success' ? 'bg-green-700 text-white' : ''}
                    ${status === 'error' ? 'bg-red-700 text-white' : ''}
                `}
                title="Sauvegarder localement (Ctrl+S)"
            >
                {status === 'idle' && <>💾 Sauvegarder</>}
                {status === 'saving' && <>⏳ ...</>}
                {status === 'success' && <>✅ Sauvegardé</>}
                {status === 'error' && <>❌ Erreur</>}
            </button>
        </div>
    );
};
