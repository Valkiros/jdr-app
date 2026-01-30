import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    onSaveAndContinue?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    saveLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    onSaveAndContinue,
    confirmLabel = "Continuer sans sauvegarder",
    cancelLabel = "Annuler",
    saveLabel = "Sauvegarder et Continuer"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-parchment border-2 border-leather rounded-lg shadow-2xl p-6 max-w-md w-full m-4">
                <h3 className="text-xl font-bold text-leather mb-4 border-b border-leather/30 pb-2">
                    {title}
                </h3>
                <p className="text-leather-dark mb-8 text-lg">
                    {message}
                </p>
                <div className="flex flex-col gap-3">
                    {onSaveAndContinue && (
                        <button
                            onClick={onSaveAndContinue}
                            className="w-full px-4 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-800 transition-colors shadow-sm"
                        >
                            💾 {saveLabel}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className="w-full px-4 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-800 transition-colors shadow-sm"
                    >
                        ⚠️ {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full px-4 py-2 bg-leather/10 text-leather font-bold rounded hover:bg-leather/20 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
