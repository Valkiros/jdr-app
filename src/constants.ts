import { CharacterData } from "./types";

export const INITIAL_DATA: CharacterData = {
    identity: {
        avatar_url: '',
        nom: '',
        sexe: '',
        origine: '',
        metier: '',
        specialisation: '',
        sous_specialisation: '',
        description: ''
    },
    vitals: {
        pv: { current: 10, max: 10, temp: 0 },
        pm: { current: 0, max: 0, temp: 0 },
        corruption: { current: 0, max: 100, daily: 0 }
    },
    general: {
        niveau: 1,
        experience: 0,
        points_destin: 0,
        malus_tete: 0
    },
    defenses: {
        naturelle: { base: 0, temp: 0 },
        solide: { base: 0, temp: 0 },
        speciale: { base: 0, temp: 0 },
        magique: { base: 0, temp: 0 },
        bouclier_actif: false
    },
    movement: {
        marche: { base: 4, temp: 0 },
        course: { base: 10, temp: 0 }
    },
    magic: {
        magie_physique: { base: 0, temp: 0 },
        magie_psychique: { base: 0, temp: 0 },
        resistance_magique: { base: 0, temp: 0 },
        discretion: { base: 0, temp: 0 },
        protection_pluie: { base: 0, temp: 0 },
        protection_froid: { base: 0, temp: 0 },
        protection_chaleur: { base: 0, temp: 0 }
    },
    characteristics: {
        courage: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        intelligence: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        charisme: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        adresse: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        force: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        perception: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        esquive: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        attaque: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        parade: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        degats: { naturel: 0, t1: 0, t2: 0, t3: 0 }
    },
    temp_modifiers: {
        mod1: '',
        mod2: '',
        mod3: ''
    },
    inventory: [],
    custom_sac_items: [],
    ape: [],
    competences: [],
    competences_specialisation: [],
    competences_sous_specialisation: [],
    status: {
        senses: {
            vue: 'Normal',
            ouie: 'Normal',
            odorat: 'Normal',
            humectation: 'Normal',
            sentir_danger: 0
        },
        fatigue: {
            etat: 'Normal',
            recuperation: 'Normal',
            nb_heure: 0
        },
        alcohol: {
            leger: 0,
            fort: 0,
            gueule_de_bois: 0
        },
        drug: {
            type: 'Aucune',
            jours_retard: 0
        }
    },
    richesse: {
        capacite_bourse: 0,
        status_points: {
            honneurs: 0,
            sm_sot: 0,
            mc_mot: 0
        },
        monnaies: {
            beryllium: { sur_soi: 0, banque: 0, maison: 0, commun: 0 },
            thritil: { sur_soi: 0, banque: 0, maison: 0, commun: 0 },
            or: { sur_soi: 0, banque: 0, maison: 0, commun: 0 },
            argent: { sur_soi: 0, banque: 0, maison: 0, commun: 0 },
            cuivre: { sur_soi: 0, banque: 0, maison: 0, commun: 0 }
        }
    }
};
