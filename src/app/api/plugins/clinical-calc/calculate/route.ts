import { NextRequest, NextResponse } from 'next/server';

/**
 * Clinical Calculator - Calculate API
 * Implements various medical/clinical formulas
 */

type FormulaInputs = Record<string, number | string | boolean>;

interface CalculationResult {
  formula: string;
  inputs: FormulaInputs;
  interpretation?: string;
  references?: string[];
  result: number | string;
  unit?: string;
}

// Formula definitions with required inputs and calculations
const FORMULAS: Record<
  string,
  {
    calculate: (inputs: FormulaInputs) => {
      interpretation?: string;
      result: number | string;
      unit?: string;
    };
    description: string;
    inputs: { description: string; name: string; type: 'number' | 'boolean'; unit?: string }[];
    name: string;
    references: string[];
  }
> = {
  anion_gap: {
    calculate: (inputs) => {
      const na = Number(inputs.sodium);
      const cl = Number(inputs.chloride);
      const hco3 = Number(inputs.bicarbonate);
      const result = na - (cl + hco3);
      return {
        interpretation:
          result < 8
            ? 'Low anion gap'
            : result <= 12
              ? 'Normal anion gap'
              : 'Elevated anion gap - consider metabolic acidosis',
        result: Math.round(result * 10) / 10,
        unit: 'mEq/L',
      };
    },
    description: 'Anion Gap for metabolic acidosis evaluation',
    inputs: [
      { description: 'Serum sodium', name: 'sodium', type: 'number', unit: 'mEq/L' },
      { description: 'Serum chloride', name: 'chloride', type: 'number', unit: 'mEq/L' },
      { description: 'Serum bicarbonate', name: 'bicarbonate', type: 'number', unit: 'mEq/L' },
    ],
    name: 'Anion Gap',
    references: ['Normal range: 8-12 mEq/L'],
  },

  bmi: {
    calculate: (inputs) => {
      const weight = Number(inputs.weight);
      const height = Number(inputs.height) / 100; // cm to m
      const bmi = weight / (height * height);
      let interpretation = '';
      if (bmi < 18.5) interpretation = 'Underweight';
      else if (bmi < 25) interpretation = 'Normal weight';
      else if (bmi < 30) interpretation = 'Overweight';
      else if (bmi < 35) interpretation = 'Obesity Class I';
      else if (bmi < 40) interpretation = 'Obesity Class II';
      else interpretation = 'Obesity Class III (Severe)';
      return { interpretation, result: Math.round(bmi * 10) / 10, unit: 'kg/m²' };
    },
    description: 'Body Mass Index',
    inputs: [
      { description: 'Weight in kilograms', name: 'weight', type: 'number', unit: 'kg' },
      { description: 'Height in centimeters', name: 'height', type: 'number', unit: 'cm' },
    ],
    name: 'BMI (Body Mass Index)',
    references: ['WHO Classification'],
  },

  chadsvasc: {
    calculate: (inputs) => {
      let score = 0;
      if (inputs.chf) score += 1;
      if (inputs.hypertension) score += 1;
      if (Number(inputs.age) >= 75) score += 2;
      else if (Number(inputs.age) >= 65) score += 1;
      if (inputs.diabetes) score += 1;
      if (inputs.stroke_tia) score += 2;
      if (inputs.vascular_disease) score += 1;
      if (inputs.female) score += 1;

      let interpretation = '';
      if (score === 0) interpretation = 'Low risk - consider no anticoagulation';
      else if (score === 1) interpretation = 'Low-moderate risk - consider anticoagulation';
      else interpretation = 'Moderate-high risk - anticoagulation recommended';

      return { interpretation, result: score, unit: 'points' };
    },
    description: 'CHA₂DS₂-VASc Score for Atrial Fibrillation Stroke Risk',
    inputs: [
      { description: 'Congestive Heart Failure', name: 'chf', type: 'boolean' },
      { description: 'Hypertension', name: 'hypertension', type: 'boolean' },
      { description: 'Age', name: 'age', type: 'number', unit: 'years' },
      { description: 'Diabetes Mellitus', name: 'diabetes', type: 'boolean' },
      { description: 'Prior Stroke/TIA/Thromboembolism', name: 'stroke_tia', type: 'boolean' },
      { description: 'Vascular disease', name: 'vascular_disease', type: 'boolean' },
      { description: 'Female sex', name: 'female', type: 'boolean' },
    ],
    name: 'CHA₂DS₂-VASc Score',
    references: ['Lip GY, et al. Chest 2010'],
  },

  corrected_calcium: {
    calculate: (inputs) => {
      const calcium = Number(inputs.calcium);
      const albumin = Number(inputs.albumin);
      const corrected = calcium + 0.8 * (4 - albumin);
      return {
        interpretation:
          corrected < 8.5 ? 'Hypocalcemia' : corrected <= 10.5 ? 'Normal calcium' : 'Hypercalcemia',
        result: Math.round(corrected * 10) / 10,
        unit: 'mg/dL',
      };
    },
    description: 'Corrected Calcium for Hypoalbuminemia',
    inputs: [
      { description: 'Serum calcium', name: 'calcium', type: 'number', unit: 'mg/dL' },
      { description: 'Serum albumin', name: 'albumin', type: 'number', unit: 'g/dL' },
    ],
    name: 'Corrected Calcium',
    references: ['Normal range: 8.5-10.5 mg/dL'],
  },

  creatinine_clearance: {
    calculate: (inputs) => {
      const age = Number(inputs.age);
      const weight = Number(inputs.weight);
      const creatinine = Number(inputs.creatinine);
      const isFemale = inputs.female === true;

      // Cockcroft-Gault equation
      let crcl = ((140 - age) * weight) / (72 * creatinine);
      if (isFemale) crcl *= 0.85;

      return {
        interpretation:
          crcl >= 90
            ? 'Normal kidney function'
            : crcl >= 60
              ? 'Mild decrease'
              : crcl >= 30
                ? 'Moderate decrease'
                : crcl >= 15
                  ? 'Severe decrease'
                  : 'Kidney failure',
        result: Math.round(crcl * 10) / 10,
        unit: 'mL/min',
      };
    },
    description: 'Creatinine Clearance (Cockcroft-Gault)',
    inputs: [
      { description: 'Age', name: 'age', type: 'number', unit: 'years' },
      { description: 'Weight', name: 'weight', type: 'number', unit: 'kg' },
      { description: 'Serum creatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { description: 'Female sex', name: 'female', type: 'boolean' },
    ],
    name: 'Creatinine Clearance (Cockcroft-Gault)',
    references: ['Cockcroft DW, Gault MH. Nephron 1976'],
  },

  gfr: {
    calculate: (inputs) => {
      const age = Number(inputs.age);
      const creatinine = Number(inputs.creatinine);
      const isFemale = inputs.female === true;
      const isBlack = inputs.black === true;

      // CKD-EPI equation (2021 race-free)
      let gfr: number;
      const scr_k = isFemale ? 0.7 : 0.9;
      const alpha = isFemale ? -0.241 : -0.302;
      const scr_ratio = creatinine / scr_k;

      if (scr_ratio <= 1) {
        gfr = 142 * Math.pow(scr_ratio, alpha) * Math.pow(0.9938, age);
      } else {
        gfr = 142 * Math.pow(scr_ratio, -1.2) * Math.pow(0.9938, age);
      }

      if (isFemale) gfr *= 1.012;
      if (isBlack) gfr *= 1.159; // Optional adjustment

      return {
        interpretation:
          gfr >= 90
            ? 'Normal (G1)'
            : gfr >= 60
              ? 'Mildly decreased (G2)'
              : gfr >= 45
                ? 'Mild-moderate decrease (G3a)'
                : gfr >= 30
                  ? 'Moderate-severe decrease (G3b)'
                  : gfr >= 15
                    ? 'Severely decreased (G4)'
                    : 'Kidney failure (G5)',
        result: Math.round(gfr * 10) / 10,
        unit: 'mL/min/1.73m²',
      };
    },
    description: 'Glomerular Filtration Rate (CKD-EPI 2021)',
    inputs: [
      { description: 'Age', name: 'age', type: 'number', unit: 'years' },
      { description: 'Serum creatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { description: 'Female sex', name: 'female', type: 'boolean' },
      { description: 'Black race (optional adjustment)', name: 'black', type: 'boolean' },
    ],
    name: 'eGFR (CKD-EPI 2021)',
    references: ['Inker LA, et al. NEJM 2021'],
  },

  meld: {
    calculate: (inputs) => {
      const bilirubin = Math.max(Number(inputs.bilirubin), 1);
      const creatinine = Math.min(Math.max(Number(inputs.creatinine), 1), 4);
      const inr = Math.max(Number(inputs.inr), 1);
      const onDialysis = inputs.dialysis === true;

      // MELD score calculation
      const creatinineValue = onDialysis ? 4 : creatinine;
      const meld =
        10 *
        (0.957 * Math.log(creatinineValue) +
          0.378 * Math.log(bilirubin) +
          1.12 * Math.log(inr) +
          0.643);

      const score = Math.min(Math.round(meld), 40);

      let interpretation = '';
      if (score < 10) interpretation = '3-month mortality: 1.9%';
      else if (score < 20) interpretation = '3-month mortality: 6%';
      else if (score < 30) interpretation = '3-month mortality: 19.6%';
      else if (score < 40) interpretation = '3-month mortality: 52.6%';
      else interpretation = '3-month mortality: 71.3%';

      return { interpretation, result: score, unit: 'points' };
    },
    description: 'Model for End-Stage Liver Disease',
    inputs: [
      { description: 'Total bilirubin', name: 'bilirubin', type: 'number', unit: 'mg/dL' },
      { description: 'Serum creatinine', name: 'creatinine', type: 'number', unit: 'mg/dL' },
      { description: 'INR', name: 'inr', type: 'number' },
      { description: 'On dialysis (2x/week)', name: 'dialysis', type: 'boolean' },
    ],
    name: 'MELD Score',
    references: ['Kamath PS, et al. Hepatology 2001'],
  },

  osmolality: {
    calculate: (inputs) => {
      const na = Number(inputs.sodium);
      const glucose = Number(inputs.glucose);
      const bun = Number(inputs.bun);

      const osmolality = 2 * na + glucose / 18 + bun / 2.8;
      return {
        interpretation:
          osmolality < 275
            ? 'Low osmolality'
            : osmolality <= 295
              ? 'Normal osmolality'
              : 'High osmolality',
        result: Math.round(osmolality),
        unit: 'mOsm/kg',
      };
    },
    description: 'Calculated Serum Osmolality',
    inputs: [
      { description: 'Serum sodium', name: 'sodium', type: 'number', unit: 'mEq/L' },
      { description: 'Blood glucose', name: 'glucose', type: 'number', unit: 'mg/dL' },
      { description: 'Blood urea nitrogen', name: 'bun', type: 'number', unit: 'mg/dL' },
    ],
    name: 'Serum Osmolality',
    references: ['Normal range: 275-295 mOsm/kg'],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formula, inputs } = body as { formula: string; inputs: FormulaInputs };

    if (!formula || !inputs) {
      return NextResponse.json(
        { availableFormulas: Object.keys(FORMULAS), error: 'Formula and inputs are required' },
        { status: 400 },
      );
    }

    const formulaDef = FORMULAS[formula.toLowerCase()];
    if (!formulaDef) {
      return NextResponse.json(
        { availableFormulas: Object.keys(FORMULAS), error: `Unknown formula: ${formula}` },
        { status: 400 },
      );
    }

    // Validate required inputs
    const missingInputs = formulaDef.inputs
      .filter((inp) => inputs[inp.name] === undefined)
      .map((inp) => inp.name);

    if (missingInputs.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required inputs: ${missingInputs.join(', ')}`,
          requiredInputs: formulaDef.inputs,
        },
        { status: 400 },
      );
    }

    // Calculate
    const calcResult = formulaDef.calculate(inputs);

    const result: CalculationResult = {
      formula: formulaDef.name,
      inputs,
      interpretation: calcResult.interpretation,
      references: formulaDef.references,
      result: calcResult.result,
      unit: calcResult.unit,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Clinical calculator error:', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    availableFormulas: Object.entries(FORMULAS).map(([key, def]) => ({
      description: def.description,
      id: key,
      name: def.name,
    })),
    usage: 'POST /api/plugins/clinical-calc/calculate with { formula, inputs }',
  });
}
