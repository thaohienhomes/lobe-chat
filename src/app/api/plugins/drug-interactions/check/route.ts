import { NextRequest, NextResponse } from 'next/server';

/**
 * Drug Interaction Check API
 * Checks potential interactions between two drugs using OpenFDA
 */

interface InteractionResult {
  drug1: string;
  drug2: string;
  hasInteraction: boolean;
  interactions: {
    description: string;
    severity: 'high' | 'medium' | 'low' | 'unknown';
    type: string;
  }[];
  recommendation: string;
}

// Common drug interactions database (simplified)
// In production, this would use a more comprehensive database like DrugBank
const KNOWN_INTERACTIONS: Record<
  string,
  { description: string; drugs: string[]; severity: 'high' | 'medium' | 'low' }[]
> = {
  aspirin: [
    {
      description: 'Increased risk of bleeding when combined with anticoagulants',
      drugs: ['warfarin', 'heparin', 'rivaroxaban', 'apixaban', 'dabigatran', 'clopidogrel'],
      severity: 'high',
    },
    {
      description:
        'May reduce effectiveness of ACE inhibitors and increase risk of kidney problems',
      drugs: ['lisinopril', 'enalapril', 'ramipril', 'captopril'],
      severity: 'medium',
    },
    {
      description: 'Increased risk of GI bleeding with NSAIDs',
      drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib'],
      severity: 'high',
    },
  ],
  ibuprofen: [
    {
      description: 'Increased risk of bleeding when combined with anticoagulants',
      drugs: ['warfarin', 'heparin', 'aspirin', 'clopidogrel'],
      severity: 'high',
    },
    {
      description: 'May reduce effectiveness of antihypertensive medications',
      drugs: ['lisinopril', 'enalapril', 'losartan', 'amlodipine', 'metoprolol'],
      severity: 'medium',
    },
    {
      description: 'Increased risk of kidney damage with ACE inhibitors',
      drugs: ['lisinopril', 'enalapril', 'ramipril'],
      severity: 'medium',
    },
  ],
  lisinopril: [
    {
      description: 'Risk of hyperkalemia (high potassium)',
      drugs: ['spironolactone', 'potassium', 'triamterene'],
      severity: 'high',
    },
    {
      description: 'NSAIDs may reduce effectiveness and increase kidney risk',
      drugs: ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac'],
      severity: 'medium',
    },
  ],
  metformin: [
    {
      description: 'Increased risk of lactic acidosis with contrast dyes',
      drugs: ['contrast', 'iodine'],
      severity: 'high',
    },
    {
      description: 'May increase hypoglycemic effect',
      drugs: ['insulin', 'glipizide', 'glyburide'],
      severity: 'medium',
    },
  ],
  omeprazole: [
    {
      description: 'May reduce absorption of certain medications',
      drugs: ['clopidogrel', 'iron', 'vitamin-b12', 'ketoconazole'],
      severity: 'medium',
    },
    {
      description: 'May reduce effectiveness of clopidogrel (controversial)',
      drugs: ['clopidogrel'],
      severity: 'medium',
    },
  ],
  simvastatin: [
    {
      description: 'Increased risk of muscle damage (rhabdomyolysis)',
      drugs: [
        'clarithromycin',
        'erythromycin',
        'itraconazole',
        'ketoconazole',
        'niacin',
        'gemfibrozil',
      ],
      severity: 'high',
    },
    {
      description: 'Grapefruit juice can increase statin levels',
      drugs: ['grapefruit'],
      severity: 'medium',
    },
  ],
  warfarin: [
    {
      description: 'Increased anticoagulant effect and risk of bleeding',
      drugs: ['aspirin', 'ibuprofen', 'naproxen', 'clopidogrel'],
      severity: 'high',
    },
    {
      description: 'Many antibiotics can increase warfarin effect',
      drugs: ['ciprofloxacin', 'metronidazole', 'fluconazole', 'amoxicillin'],
      severity: 'high',
    },
    {
      description: 'Some foods rich in Vitamin K can reduce warfarin effect',
      drugs: ['vitamin-k'],
      severity: 'medium',
    },
  ],
};

function normalizeWhiteSpace(str: string): string {
  return str.replaceAll(/\s+/g, ' ').trim();
}

function findInteractions(drug1: string, drug2: string): InteractionResult {
  const norm1 = normalizeWhiteSpace(drug1.toLowerCase());
  const norm2 = normalizeWhiteSpace(drug2.toLowerCase());

  const interactions: InteractionResult['interactions'] = [];

  // Check drug1's interactions
  for (const [drug, interactionList] of Object.entries(KNOWN_INTERACTIONS)) {
    if (norm1.includes(drug) || drug.includes(norm1)) {
      for (const interaction of interactionList) {
        if (interaction.drugs.some((d) => norm2.includes(d) || d.includes(norm2))) {
          interactions.push({
            description: interaction.description,
            severity: interaction.severity,
            type: 'drug-drug',
          });
        }
      }
    }
  }

  // Check drug2's interactions (reverse)
  for (const [drug, interactionList] of Object.entries(KNOWN_INTERACTIONS)) {
    if (norm2.includes(drug) || drug.includes(norm2)) {
      for (const interaction of interactionList) {
        if (interaction.drugs.some((d) => norm1.includes(d) || d.includes(norm1))) {
          // Avoid duplicates
          const exists = interactions.some((i) => i.description === interaction.description);
          if (!exists) {
            interactions.push({
              description: interaction.description,
              severity: interaction.severity,
              type: 'drug-drug',
            });
          }
        }
      }
    }
  }

  // Generate recommendation
  let recommendation =
    'No known interactions found. However, always consult a healthcare provider before combining medications.';
  if (interactions.length > 0) {
    const hasHigh = interactions.some((i) => i.severity === 'high');
    if (hasHigh) {
      recommendation =
        '⚠️ HIGH RISK: Significant interaction detected. Consult a healthcare provider before using these medications together.';
    } else {
      recommendation =
        '⚡ MODERATE RISK: Potential interaction detected. Monitor for side effects and consult a healthcare provider.';
    }
  }

  return {
    drug1,
    drug2,
    hasInteraction: interactions.length > 0,
    interactions,
    recommendation,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drug1, drug2 } = body as { drug1: string; drug2: string };

    if (!drug1 || !drug2) {
      return NextResponse.json(
        { error: 'Both drug1 and drug2 parameters are required' },
        { status: 400 },
      );
    }

    const result = findInteractions(drug1, drug2);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Drug interaction check error:', error);
    return NextResponse.json(
      { error: 'Failed to check drug interactions. Please try again.' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const drug1 = searchParams.get('drug1');
  const drug2 = searchParams.get('drug2');

  if (!drug1 || !drug2) {
    return NextResponse.json(
      {
        error: 'Both drug1 and drug2 parameters are required',
        usage: '/api/plugins/drug-interactions/check?drug1=aspirin&drug2=warfarin',
      },
      { status: 400 },
    );
  }

  const result = findInteractions(drug1, drug2);
  return NextResponse.json(result);
}
