use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaseStats {
    pub esquive_naturelle: i32,
    // Add other stats as needed
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EquipmentType {
    Armure,
    Arme,
    Sac,
    Autre,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Equipement {
    pub nom: String,
    pub poids: f32,
    pub esquive_bonus: i32,
    pub equipement_type: EquipmentType,
    pub equipe: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Etats {
    pub fatigue: i32,      // Value of malus
    pub alcool: i32,       // Value of malus
    pub drogue: i32,       // Value of malus
    pub blessure_tete: i32, // Value of malus
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinalStats {
    pub esquive_totale: i32,
    pub esquive_naturelle: i32,
    pub bonus_equipement: i32,
    pub malus_poids: i32,
    pub malus_etats: i32,
}

pub fn calculer_stats_finales(
    base: BaseStats,
    equipements: Vec<Equipement>,
    etats: Etats,
) -> FinalStats {
    // 1. Calculate Total Weight of EQUIPPED items
    let poids_total: f32 = equipements
        .iter()
        .filter(|e| e.equipe)
        .map(|e| e.poids)
        .sum();

    // 2. Calculate Weight Penalty
    // Rule: >5kg = -2, >10kg = -5
    let malus_poids = if poids_total > 10.0 {
        5
    } else if poids_total > 5.0 {
        2
    } else {
        0
    };

    // 3. Calculate Equipment Bonus
    let bonus_equipement: i32 = equipements
        .iter()
        .filter(|e| e.equipe)
        .map(|e| e.esquive_bonus)
        .sum();

    // 4. Calculate State Malus
    let malus_etats = etats.fatigue + etats.alcool + etats.drogue + etats.blessure_tete;

    // 5. Final Calculation
    // ES Finale = ES Naturelle + Bonus Équipements - Malus Poids - Malus États
    let raw_esquive = base.esquive_naturelle + bonus_equipement - malus_poids - malus_etats;

    // 6. Clamp to 0
    let esquive_totale = raw_esquive.max(0);

    FinalStats { 
        esquive_totale,
        esquive_naturelle: base.esquive_naturelle,
        bonus_equipement,
        malus_poids,
        malus_etats,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mock_stats() -> BaseStats {
        BaseStats { esquive_naturelle: 10 }
    }

    fn mock_etats() -> Etats {
        Etats {
            fatigue: 0,
            alcool: 0,
            drogue: 0,
            blessure_tete: 0,
        }
    }

    #[test]
    fn test_esquive_basic() {
        let base = mock_stats();
        let etats = mock_etats();
        let eq = vec![];
        
        let final_stats = calculer_stats_finales(base, eq, etats);
        assert_eq!(final_stats.esquive_totale, 10);
    }

    #[test]
    fn test_esquive_with_equipment_bonus() {
        let base = mock_stats();
        let etats = mock_etats();
        let eq = vec![
            Equipement {
                nom: "Bottes agiles".to_string(),
                poids: 1.0,
                esquive_bonus: 2,
                equipement_type: EquipmentType::Autre,
                equipe: true,
            }
        ];
        
        let final_stats = calculer_stats_finales(base, eq, etats);
        // 10 + 2 = 12
        assert_eq!(final_stats.esquive_totale, 12);
    }

    #[test]
    fn test_esquive_weight_penalty_low() {
        let base = mock_stats(); // 10
        let etats = mock_etats();
        let eq = vec![
            Equipement {
                nom: "Lourde armure".to_string(),
                poids: 6.0, // > 5kg -> -2
                esquive_bonus: 0,
                equipement_type: EquipmentType::Armure,
                equipe: true,
            }
        ];
        
        let final_stats = calculer_stats_finales(base, eq, etats);
        // 10 - 2 = 8
        assert_eq!(final_stats.esquive_totale, 8);
    }

    #[test]
    fn test_esquive_weight_penalty_high() {
        let base = mock_stats(); // 10
        let etats = mock_etats();
        let eq = vec![
            Equipement {
                nom: "Très lourde armure".to_string(),
                poids: 11.0, // > 10kg -> -5
                esquive_bonus: 0,
                equipement_type: EquipmentType::Armure,
                equipe: true,
            }
        ];
        
        let final_stats = calculer_stats_finales(base, eq, etats);
        // 10 - 5 = 5
        assert_eq!(final_stats.esquive_totale, 5);
    }

    #[test]
    fn test_esquive_mixed_modifiers() {
        let base = mock_stats(); // 10
        let mut etats = mock_etats();
        etats.fatigue = 1; // -1
        
        let eq = vec![
            Equipement {
                nom: "Bouclier".to_string(),
                poids: 6.0, // > 5kg -> -2
                esquive_bonus: 1, // +1
                equipement_type: EquipmentType::Armure,
                equipe: true,
            }
        ];
        
        let final_stats = calculer_stats_finales(base, eq, etats);
        // 10 + 1 (bonus) - 2 (poids) - 1 (fatigue) = 8
        assert_eq!(final_stats.esquive_totale, 8);
    }

    #[test]
    fn test_esquive_cannot_be_negative() {
        let base = BaseStats { esquive_naturelle: 0 };
        let mut etats = mock_etats();
        etats.fatigue = 10;
        
        let eq = vec![];
        
        let final_stats = calculer_stats_finales(base, eq, etats);
        assert_eq!(final_stats.esquive_totale, 0);
    }
}
