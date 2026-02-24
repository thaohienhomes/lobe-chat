/**
 * Medical Context Detection Utility
 *
 * Detects whether a user query is medical/clinical in nature.
 * Used to auto-suggest enabling medical plugins.
 *
 * Usage:
 *   import { isMedicalQuery, suggestPlugins } from '@/utils/medical-context';
 */

// Medical terms that trigger context detection
const MEDICAL_TERMS = new Set([
    // Conditions
    'diabetes', 'cancer', 'hypertension', 'heart failure', 'stroke', 'asthma',
    'copd', 'pneumonia', 'covid', 'hiv', 'aids', 'tuberculosis', 'malaria',
    'hepatitis', 'cirrhosis', 'kidney disease', 'ckd', 'aki', 'depression',
    'anxiety', 'alzheimer', 'parkinson', 'epilepsy', 'migraine', 'arthritis',
    'osteoporosis', 'obesity', 'anemia', 'leukemia', 'lymphoma', 'melanoma',
    'sepsis', 'icu', 'ards', 'dvt', 'pulmonary embolism', 'atrial fibrillation',

    // Vietnamese conditions
    'đái tháo đường', 'ung thư', 'tăng huyết áp', 'suy tim', 'đột quỵ',
    'hen suyễn', 'viêm phổi', 'sốt rét', 'lao phổi', 'trầm cảm', 'béo phì',
    'thiếu máu', 'xơ gan', 'suy thận', 'động kinh',

    // Drug categories
    'metformin', 'insulin', 'warfarin', 'aspirin', 'statin', 'ace inhibitor',
    'beta blocker', 'diuretic', 'antibiotic', 'antiviral', 'chemotherapy',
    'immunotherapy', 'corticosteroid', 'nsaid', 'opioid', 'benzodiazepine',
    'ssri', 'sglt2', 'glp-1', 'dpp-4', 'arb', 'ccb',

    // Clinical terms
    'rct', 'randomized', 'clinical trial', 'systematic review', 'meta-analysis',
    'cohort', 'case-control', 'cross-sectional', 'prospective', 'retrospective',
    'pubmed', 'medline', 'mesh', 'grade', 'pico', 'nnt', 'odds ratio',
    'hazard ratio', 'confidence interval', 'p-value', 'egfr', 'hba1c',
    'creatinine', 'bmi', 'blood pressure', 'ecg', 'ekg', 'mri', 'ct scan',

    // Specialties
    'cardiology', 'oncology', 'neurology', 'nephrology', 'endocrinology',
    'pulmonology', 'gastroenterology', 'rheumatology', 'hematology',
    'infectious disease', 'pediatrics', 'obstetrics', 'gynecology',
    'dermatology', 'ophthalmology', 'orthopedics', 'urology',
    'psychiatry', 'radiology', 'pathology', 'surgery', 'anesthesiology',

    // General triggers
    'drug interaction', 'side effect', 'adverse event', 'contraindication',
    'dosage', 'indication', 'mechanism of action', 'pharmacokinetics',
    'pharmacodynamics', 'half-life', 'bioavailability', 'clinical guideline',
    'treatment', 'diagnosis', 'prognosis', 'etiology', 'pathophysiology',
]);

/**
 * Check if a query contains medical/clinical terms
 */
export function isMedicalQuery(query: string): boolean {
    const lower = query.toLowerCase();
    for (const term of MEDICAL_TERMS) {
        if (lower.includes(term)) return true;
    }
    return false;
}

/**
 * Suggest relevant plugins based on query content
 */
export function suggestPlugins(query: string): string[] {
    const lower = query.toLowerCase();
    const suggestions: string[] = [];

    // Drug-related → Drug Interactions
    const drugTerms = ['drug', 'medication', 'thuốc', 'interaction', 'side effect', 'adverse', 'dosage', 'contraindication'];
    if (drugTerms.some(t => lower.includes(t))) {
        suggestions.push('drug-interactions');
    }

    // Research/literature → PubMed + OpenAlex
    const researchTerms = ['study', 'research', 'evidence', 'trial', 'nghiên cứu', 'pubmed', 'paper', 'article', 'review', 'meta-analysis'];
    if (researchTerms.some(t => lower.includes(t))) {
        suggestions.push('pubmed-search', 'openalex-search');
    }

    // Clinical trials → ClinicalTrials.gov
    const trialTerms = ['clinical trial', 'recruiting', 'enrollment', 'nct', 'phase 1', 'phase 2', 'phase 3', 'thử nghiệm'];
    if (trialTerms.some(t => lower.includes(t))) {
        suggestions.push('clinical-trials');
    }

    // Citation → Citation Manager
    const citationTerms = ['citation', 'reference', 'bibliography', 'bibtex', 'apa', 'vancouver', 'pmid', 'doi', 'trích dẫn'];
    if (citationTerms.some(t => lower.includes(t))) {
        suggestions.push('citation-manager');
    }

    // Calculator terms → Clinical Calc
    const calcTerms = ['egfr', 'cha2ds2', 'meld', 'bmi', 'nnt', 'calculator', 'calculate', 'score', 'tính'];
    if (calcTerms.some(t => lower.includes(t))) {
        suggestions.push('clinical-calc');
    }

    // Default: if medical but no specific match, suggest PubMed
    if (suggestions.length === 0 && isMedicalQuery(query)) {
        suggestions.push('pubmed-search');
    }

    return [...new Set(suggestions)]; // deduplicate
}

/**
 * Vietnamese ↔ English medical term mapping
 */
export const MEDICAL_TERMS_VI_EN: Record<string, string> = {
    'acetaminophen': 'Paracetamol',
    'aki': 'Tổn thương thận cấp',
    'anemia': 'Thiếu máu',
    'antibiotics': 'Kháng sinh',
    'atrial fibrillation': 'Rung nhĩ',
    'blood pressure': 'Huyết áp',
    'cancer': 'Ung thư',
    'ckd': 'Bệnh thận mạn',
    'copd': 'Bệnh phổi tắc nghẽn mạn tính',
    'depression': 'Trầm cảm',
    'diabetes mellitus': 'Đái tháo đường',
    'heart failure': 'Suy tim',
    'hypertension': 'Tăng huyết áp',
    'obesity': 'Béo phì',
    'pneumonia': 'Viêm phổi',
    'stroke': 'Đột quỵ',
    'tuberculosis': 'Lao phổi',
};
