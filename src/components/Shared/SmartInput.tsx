import React, { useState, useEffect } from 'react';

interface SmartInputProps {
    // La valeur "source" (store ou parent)
    value: string | number;
    // Appelée uniquement sur onBlur ou Enter
    onCommit: (newValue: string | number) => void;

    // Type d'input
    type?: 'text' | 'number' | 'textarea';

    // Props standard HTML (on évite d'étendre directement InputHTMLAttributes pour contrôler ce qu'on expose)
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    min?: number;
    max?: number;
    title?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
    value,
    onCommit,
    type = 'text',
    className = '',
    placeholder,
    disabled,
    readOnly,
    min,
    max,
    title
}) => {
    // État local pour gérer la saisie fluide
    const [localValue, setLocalValue] = useState<string | number>('');

    // Synchronisation Initiale & Externe :
    // Quand la prop 'value' change (rechargement, calcul externe), on met à jour le local.
    // On gère le cas 0 qui ne doit pas être affiché si l'utilisateur veut du vide, 
    // mais ici on respecte la valeur passée. Si le parent passe 0, on affiche 0. 
    // Si le parent veut afficher vide pour 0, il doit passer "".
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        if (type === 'number') {
            // AUTORISER : 
            // - Vide
            // - Signe moins seul (au début)
            // - Nombres avec ou sans décimales (points ou virgules)
            // Regex : ^-?\d*[.,]?\d*$
            if (val === '' || /^-?\d*[.,]?\d*$/.test(val)) {
                setLocalValue(val);
            }
        } else {
            setLocalValue(val);
        }
    };

    const handleBlur = () => {
        // Logique de validation / conversion avant commit
        let finalValue: string | number = localValue;

        if (type === 'number') {
            // Si c'est vide, on renvoie "" (ou 0 selon la logique souhaitée)
            if (localValue === '') {
                // Pour les nombres, souvent on veut remettre à 0 si c'est vide
                // SAUF si le user a explicitement demandé que ça reste vide (non demandé ici).
                // La demande est: "Toutes les cellules à valeur doivent pouvoir être vide ("") et ne doivent pas réafficher 0 automatiquement (sauf si le joueur le note LUI-MÈME)"

                // DONC : Si le user vide le champ, on envoie "" (ou null/0 au parent qui devra gérer).
                // Problème : TypeScript et les types 'number'.
                // Si le parent attend un number, on ne peut pas envoyer "".
                // Solution : On envoie 0, MAIS le composant parent devra transformer 0 en "" à l'affichage si besoin.

                // MAIS ATTENTION : La demande est "ne doit pas réafficher 0 automatiquement".
                // Cela veut dire que la valeur stockée DOIT être 0 (pour les calculs), mais l'affichage doit être vide.
                // OU le stockage doit accepter null/undefined.

                // Compromis : On renvoie 0. C'est le composant d'affichage qui choisira d'afficher "" si value === 0.
                finalValue = 0;
            } else {
                // Conversion en nombre (support virgule)
                const normalized = String(localValue).replace(',', '.');
                const parsed = parseFloat(normalized);
                if (isNaN(parsed)) {
                    finalValue = 0; // Fallback
                } else {
                    finalValue = parsed;
                }

                // Min/Max clamp
                if (min !== undefined && (finalValue as number) < min) finalValue = min;
                if (max !== undefined && (finalValue as number) > max) finalValue = max;
            }
        }

        // On ne notifie que si ça a changé par rapport à la prop value reçue
        // (Évite les boucles ou updates inutiles)
        if (finalValue !== value) {
            onCommit(finalValue);
        } else {
            // Si c'était "0" (string) et que value est 0 (number), c'est pareil,
            // mais on veut s'assurer que l'affichage local est propre (ex: "05" -> 5)
            // Sauf si on veut garder le vide.
            if (localValue === '' && value === 0) {
                // Cas spécial : Le user a vidé le champ. Le parent a 0.
                // Si on ne fait rien, on reste à "". C'est ce qu'on veut.
            } else {
                setLocalValue(value); // Reset au format propre
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLElement).blur(); // Déclenche le onBlur
        }
    };

    // Note sur l'affichage : Si value est 0, on veut afficher "".
    // C'est géré par le useEffect + logique parent. 
    // Si le parent passe 0, localValue devient 0.
    // L'astuce pour avoir "" quand c'est 0 : Le parent doit passer "" si value === 0.
    // Ou alors on gère ça ici ? 
    // "les cellules à valeur doivent pouvoir être vide ("")" -> C'est le comportement par défaut d'un input contrôlé.

    // Modif : Si localValue est 0 et qu'on n'est pas en focus... c'est complexe de savoir si c'est un "0" explicite ou implicite.
    // On va s'en tenir à : Ce composant affiche ce qu'on lui donne. C'est au parent de transformer 0 en "" avant de passer la prop 'value', si c'est le design voulu.

    if (type === 'textarea') {
        return (
            <textarea
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className={className}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                title={title}
            />
        );
    }

    return (
        <input
            type={type === 'number' ? 'text' : type} // On utilise 'text' même pour les nombres pour autoriser "-" et "." librement pendant la frappe, et éviter les comportements natifs de input[number]
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            title={title}
            inputMode={type === 'number' ? 'decimal' : 'text'}
        />
    );
};
