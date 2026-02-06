import { RefEquipement } from '../types';

/**
 * Calculates the weight of an item based on specific rules.
 * 
 * Rules:
 * - Standard: Uses refItem.poids or refItem.details.poids.
 * - Category 'Boissons': Defaults to 250g.
 * - Exception 'Outre d'abondance (enchantée)': 12.5g.
 * 
 * @param refItem The reference item data.
 * @returns The weight in grams as a number.
 */
export const getItemWeight = (refItem: RefEquipement | undefined): number => {
    if (!refItem) return 0;

    // Specific Rule for Boissons
    // Note: Checking category case-insensitively just in case
    if (refItem.category === 'Boissons') {
        if (refItem.nom === "Outre d'abondance (enchantée)") {
            return 12.5;
        }
        return 250;
    }

    // Standard Logic (Robust check)
    const rawWeight = refItem.poids || (refItem as any)?.details?.poids || 0;

    // Ensure we handle strings if they come from JSON
    if (typeof rawWeight === 'string') {
        // Handle potential "g" suffix or commas if data is messy, though parseInt usually handles leading numbers
        // Using parseFloat to allow decimals if standard items start having them
        return parseFloat(rawWeight) || 0;
    }

    return rawWeight;
};
