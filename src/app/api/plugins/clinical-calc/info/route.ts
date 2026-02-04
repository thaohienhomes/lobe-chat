import { NextRequest, NextResponse } from 'next/server';

/**
 * Clinical Calculator - Formula Info API
 * Returns information about specific clinical formulas
 */

const FORMULA_INFO: Record<
  string,
  {
    description: string;
    inputs: { description: string; name: string; type: 'number' | 'boolean'; unit?: string }[];
    name: string;
    normalRange?: string;
    references: string[];
  }
> = {
  anion_gap: {
    description: 'Anion Gap for metabolic acidosis evaluation',
    inputs: [
      { description: 'Serum sodium', name: 'sodium', type: 'number', unit: 'mEq/L' },
      { description: 'Serum chloride', name: 'chloride', type: 'number', unit: 'mEq/L' },
      { description: 'Serum bicarbonate', name: 'bicarbonate', type: 'number', unit: 'mEq/L' },
    ],
    name: 'Anion Gap',
    normalRange: '8-12 mEq/L',
    references: ['Formula: Na - (Cl + HCO3)'],
  },
  bmi: {
    description: 'Body Mass Index - a measure of body fat based on height and weight',
    inputs: [
      { description: 'Weight in kilograms', name: 'weight', type: 'number', unit: 'kg' },
      { description: 'Height in centimeters', name: 'height', type: 'number', unit: 'cm' },
    ],
    name: 'BMI (Body Mass Index)',
    normalRange: '18.5-24.9 kg/m²',
    references: ['WHO Classification', 'Formula: weight(kg) / height(m)²'],
  },
  chadsvasc: {
    description: 'CHA₂DS₂-VASc Score for Atrial Fibrillation Stroke Risk assessment',
    inputs: [
      { description: 'Congestive Heart Failure', name: 'chf', type: 'boolean' },
      { description: 'Hypertension', name: 'hypertension', type: 'boolean' },
      { description: 'Age in years', name: 'age', type: 'number', unit: 'years' },
      { description: 'Diabetes Mellitus', name: 'diabetes', type: 'boolean' },
      { description: 'Prior Stroke/TIA/Thromboembolism', name: 'stroke_tia', type: 'boolean' },
      {
        description: 'Vascular disease (prior MI, PAD, aortic plaque)',
        name: 'vascular_disease',
        type: 'boolean',
      },
      { description: 'Female sex', name: 'female', type: 'boolean' },
    ],
    name: 'CHA₂DS₂-VASc Score',
    normalRange: '0-9 points',
    references: ['Lip GY, et al. Chest 2010'],
  },
  corrected_calcium: {
    description: 'Corrected Calcium for Hypoalbuminemia - adjusts calcium level based on albumin',
    inputs: [
      { description: 'Total serum calcium', name: 'calcium', type: 'number', unit: 'mg/dL' },
      { description: 'Serum albumin', name: 'albumin', type: 'number', unit: 'g/dL' },
    ],
    name: 'Corrected Calcium',
    normalRange: '8.5-10.5 mg/dL',
    references: ['Formula: Measured Ca + 0.8 × (4 - Albumin)'],
  },
  creatinine_clearance: {
    description:
      'Creatinine Clearance using Cockcroft-Gault equation for renal function assessment',
    inputs: [
      { description: 'Age in years', name: 'age', type: 'number', unit: 'years' },
      { description: 'Actual body weight', name: 'weight', type: 'number', unit: 'kg' },
      { description: 'Serum creatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { description: 'Female sex (multiply by 0.85)', name: 'female', type: 'boolean' },
    ],
    name: 'Creatinine Clearance (Cockcroft-Gault)',
    normalRange: '>90 mL/min',
    references: ['Cockcroft DW, Gault MH. Nephron 1976'],
  },
  gfr: {
    description: 'Estimated Glomerular Filtration Rate using CKD-EPI 2021 equation (race-free)',
    inputs: [
      { description: 'Age in years', name: 'age', type: 'number', unit: 'years' },
      { description: 'Serum creatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { description: 'Female sex', name: 'female', type: 'boolean' },
      { description: 'Black race (optional adjustment)', name: 'black', type: 'boolean' },
    ],
    name: 'eGFR (CKD-EPI 2021)',
    normalRange: '≥90 mL/min/1.73m² (G1)',
    references: ['Inker LA, et al. NEJM 2021', 'CKD-EPI 2021 (race-free equation)'],
  },
  meld: {
    description: 'Model for End-Stage Liver Disease - predicts 3-month mortality in liver disease',
    inputs: [
      { description: 'Total bilirubin', name: 'bilirubin', type: 'number', unit: 'mg/dL' },
      { description: 'Serum creatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { description: 'INR (International Normalized Ratio)', name: 'inr', type: 'number' },
      { description: 'On dialysis at least 2x per week', name: 'dialysis', type: 'boolean' },
    ],
    name: 'MELD Score',
    normalRange: '6-40 points',
    references: ['Kamath PS, et al. Hepatology 2001', 'Used for liver transplant prioritization'],
  },
  osmolality: {
    description: 'Calculated Serum Osmolality for fluid/electrolyte assessment',
    inputs: [
      { description: 'Serum sodium', name: 'sodium', type: 'number', unit: 'mEq/L' },
      { description: 'Blood glucose', name: 'glucose', type: 'number', unit: 'mg/dL' },
      { description: 'Blood urea nitrogen', name: 'bun', type: 'number', unit: 'mg/dL' },
    ],
    name: 'Serum Osmolality',
    normalRange: '275-295 mOsm/kg',
    references: ['Formula: 2×Na + Glucose/18 + BUN/2.8'],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formula } = body as { formula: string };

    if (!formula) {
      return NextResponse.json(
        { availableFormulas: Object.keys(FORMULA_INFO), error: 'Formula name is required' },
        { status: 400 },
      );
    }

    const info = FORMULA_INFO[formula.toLowerCase()];
    if (!info) {
      return NextResponse.json(
        { availableFormulas: Object.keys(FORMULA_INFO), error: `Unknown formula: ${formula}` },
        { status: 400 },
      );
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error('Formula info error:', error);
    return NextResponse.json({ error: 'Failed to get formula info' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    formulas: Object.entries(FORMULA_INFO).map(([key, info]) => ({
      description: info.description,
      id: key,
      name: info.name,
      normalRange: info.normalRange,
    })),
  });
}
