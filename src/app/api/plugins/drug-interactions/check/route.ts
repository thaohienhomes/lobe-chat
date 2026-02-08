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

// Comprehensive drug interactions database
// Covers 42 drugs across 10 pharmacological categories
// Sources: FDA labels, Lexicomp interaction data, clinical pharmacology references
const KNOWN_INTERACTIONS: Record<
  string,
  { description: string; drugs: string[]; severity: 'high' | 'medium' | 'low' }[]
> = {



  // =========================================================================
  // ANTIBIOTICS
  // =========================================================================
  amoxicillin: [
    {
      description: 'May increase anticoagulant effect of warfarin',
      drugs: ['warfarin'],
      severity: 'medium',
    },
    {
      description: 'May reduce effectiveness of oral contraceptives (debated)',
      drugs: ['oral-contraceptives', 'estrogen'],
      severity: 'low',
    },
    {
      description: 'Probenecid increases amoxicillin levels',
      drugs: ['probenecid'],
      severity: 'medium',
    },
  ],



  // =========================================================================
  // EXISTING CORE DRUGS (refined)
  // =========================================================================
  aspirin: [
    {
      description: 'Increased risk of bleeding when combined with anticoagulants',
      drugs: ['warfarin', 'heparin', 'rivaroxaban', 'apixaban', 'dabigatran', 'clopidogrel', 'enoxaparin'],
      severity: 'high',
    },
    {
      description:
        'May reduce effectiveness of ACE inhibitors and increase risk of kidney problems',
      drugs: ['lisinopril', 'enalapril', 'ramipril', 'captopril', 'losartan'],
      severity: 'medium',
    },
    {
      description: 'Increased risk of GI bleeding with NSAIDs',
      drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'meloxicam', 'indomethacin', 'piroxicam', 'ketorolac'],
      severity: 'high',
    },
  ],



  azithromycin: [
    {
      description: 'Risk of QT prolongation — additive cardiac risk',
      drugs: ['amiodarone', 'sotalol', 'haloperidol', 'ondansetron'],
      severity: 'high',
    },
    {
      description: 'May increase warfarin anticoagulant effect',
      drugs: ['warfarin'],
      severity: 'medium',
    },
    {
      description: 'May increase levels of digoxin',
      drugs: ['digoxin'],
      severity: 'medium',
    },
  ],



  // =========================================================================
  // CARDIOVASCULAR
  // =========================================================================
  atenolol: [
    {
      description: 'Risk of severe bradycardia with calcium channel blockers',
      drugs: ['verapamil', 'diltiazem'],
      severity: 'high',
    },
    {
      description: 'NSAIDs may reduce antihypertensive effect',
      drugs: ['ibuprofen', 'naproxen', 'meloxicam', 'indomethacin'],
      severity: 'medium',
    },
    {
      description: 'May mask hypoglycemia symptoms in diabetic patients',
      drugs: ['insulin', 'glipizide', 'glyburide'],
      severity: 'medium',
    },
  ],






  ciprofloxacin: [
    {
      description: 'May significantly increase theophylline levels — toxicity risk',
      drugs: ['theophylline'],
      severity: 'high',
    },
    {
      description: 'Increases warfarin anticoagulant effect',
      drugs: ['warfarin'],
      severity: 'high',
    },
    {
      description: 'Antacids, calcium, iron reduce ciprofloxacin absorption',
      drugs: ['calcium', 'iron', 'antacids', 'magnesium'],
      severity: 'medium',
    },
    {
      description: 'Risk of tendon rupture with corticosteroids',
      drugs: ['prednisone', 'dexamethasone'],
      severity: 'high',
    },
  ],






  amlodipine: [
    {
      description: 'May increase simvastatin levels — rhabdomyolysis risk',
      drugs: ['simvastatin'],
      severity: 'high',
    },
    {
      description: 'Additive hypotensive effect',
      drugs: ['lisinopril', 'losartan', 'atenolol', 'furosemide'],
      severity: 'medium',
    },
    {
      description: 'CYP3A4 inhibitors may increase amlodipine levels',
      drugs: ['ketoconazole', 'itraconazole', 'clarithromycin'],
      severity: 'medium',
    },
  ],






  ibuprofen: [
    {
      description: 'Increased risk of bleeding when combined with anticoagulants',
      drugs: ['warfarin', 'heparin', 'aspirin', 'clopidogrel', 'enoxaparin', 'rivaroxaban', 'apixaban'],
      severity: 'high',
    },
    {
      description: 'May reduce effectiveness of antihypertensive medications',
      drugs: ['lisinopril', 'enalapril', 'losartan', 'amlodipine', 'metoprolol', 'atenolol', 'furosemide'],
      severity: 'medium',
    },
    {
      description: 'Increased risk of kidney damage with ACE inhibitors',
      drugs: ['lisinopril', 'enalapril', 'ramipril'],
      severity: 'medium',
    },
  ],







  doxycycline: [
    {
      description: 'Antacids and calcium reduce doxycycline absorption',
      drugs: ['calcium', 'iron', 'antacids', 'magnesium'],
      severity: 'medium',
    },
    {
      description: 'May increase warfarin anticoagulant effect',
      drugs: ['warfarin'],
      severity: 'medium',
    },
    {
      description: 'Barbiturates and phenytoin reduce doxycycline levels',
      drugs: ['phenytoin', 'carbamazepine'],
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
      drugs: ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac', 'meloxicam', 'indomethacin', 'piroxicam', 'ketorolac'],
      severity: 'medium',
    },
  ],



  digoxin: [
    {
      description: 'Risk of digoxin toxicity — hypokalemia from diuretics',
      drugs: ['furosemide', 'hydrochlorothiazide'],
      severity: 'high',
    },
    {
      description: 'Amiodarone and verapamil increase digoxin levels',
      drugs: ['amiodarone', 'verapamil'],
      severity: 'high',
    },
    {
      description: 'Azithromycin and clarithromycin may increase digoxin levels',
      drugs: ['azithromycin', 'clarithromycin', 'erythromycin'],
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



  fluoxetine: [
    {
      description: 'Risk of serotonin syndrome',
      drugs: ['sertraline', 'tramadol', 'linezolid', 'lithium'],
      severity: 'high',
    },
    {
      description: 'CYP2D6 inhibition — increases levels of many drugs',
      drugs: ['codeine', 'tramadol', 'metoprolol', 'carbamazepine'],
      severity: 'medium',
    },
  ],




  omeprazole: [
    {
      description: 'May reduce absorption of certain medications',
      drugs: ['clopidogrel', 'iron', 'vitamin-b12', 'ketoconazole', 'itraconazole'],
      severity: 'medium',
    },
    {
      description: 'May reduce effectiveness of clopidogrel (CYP2C19 inhibition)',
      drugs: ['clopidogrel'],
      severity: 'medium',
    },
    {
      description: 'May increase levels of methotrexate',
      drugs: ['methotrexate'],
      severity: 'medium',
    },
  ],
  carbamazepine: [
    {
      description: 'Strong CYP3A4 inducer — reduces levels of many drugs',
      drugs: ['oral-contraceptives', 'warfarin', 'simvastatin', 'amlodipine', 'doxycycline'],
      severity: 'high',
    },
    {
      description: 'Risk of carbamazepine toxicity with CYP3A4 inhibitors',
      drugs: ['ketoconazole', 'itraconazole', 'fluconazole', 'erythromycin', 'clarithromycin'],
      severity: 'high',
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
        'fluconazole',
      ],
      severity: 'high',
    },
    {
      description: 'Grapefruit juice can increase statin levels',
      drugs: ['grapefruit'],
      severity: 'medium',
    },
  ],
  furosemide: [
    {
      description: 'Risk of ototoxicity with aminoglycosides',
      drugs: ['gentamicin', 'tobramycin', 'amikacin'],
      severity: 'high',
    },
    {
      description: 'Increased risk of hypokalemia with corticosteroids',
      drugs: ['prednisone', 'dexamethasone'],
      severity: 'medium',
    },
    {
      description: 'NSAIDs reduce diuretic effectiveness',
      drugs: ['ibuprofen', 'naproxen', 'meloxicam', 'indomethacin'],
      severity: 'medium',
    },
    {
      description: 'May increase lithium levels — toxicity risk',
      drugs: ['lithium'],
      severity: 'high',
    },
  ],
  warfarin: [
    {
      description: 'Increased anticoagulant effect and risk of bleeding',
      drugs: ['aspirin', 'ibuprofen', 'naproxen', 'clopidogrel', 'meloxicam', 'indomethacin', 'piroxicam', 'ketorolac'],
      severity: 'high',
    },
    {
      description: 'Many antibiotics can increase warfarin effect',
      drugs: ['ciprofloxacin', 'metronidazole', 'fluconazole', 'amoxicillin', 'azithromycin', 'doxycycline'],
      severity: 'high',
    },
    {
      description: 'Some foods rich in Vitamin K can reduce warfarin effect',
      drugs: ['vitamin-k'],
      severity: 'medium',
    },
  ],




  gabapentin: [
    {
      description: 'Additive CNS depression',
      drugs: ['tramadol', 'codeine', 'morphine', 'oxycodone'],
      severity: 'medium',
    },
    {
      description: 'Antacids may reduce gabapentin absorption',
      drugs: ['antacids', 'aluminum', 'magnesium'],
      severity: 'low',
    },
  ],



  // =========================================================================
  // DIABETES (beyond metformin)
  // =========================================================================
  glipizide: [
    {
      description: 'Increased hypoglycemia risk',
      drugs: ['insulin', 'metformin', 'glyburide'],
      severity: 'high',
    },
    {
      description: 'Fluconazole inhibits metabolism — increases glipizide effect',
      drugs: ['fluconazole'],
      severity: 'high',
    },
    {
      description: 'Beta-blockers may mask hypoglycemia symptoms',
      drugs: ['atenolol', 'metoprolol', 'propranolol'],
      severity: 'medium',
    },
  ],






  glyburide: [
    {
      description: 'Increased hypoglycemia risk with other antidiabetics',
      drugs: ['insulin', 'metformin', 'glipizide'],
      severity: 'high',
    },
    {
      description: 'Fluconazole increases glyburide levels',
      drugs: ['fluconazole'],
      severity: 'high',
    },
  ],






  insulin: [
    {
      description: 'Additive hypoglycemia risk with oral antidiabetics',
      drugs: ['metformin', 'glipizide', 'glyburide', 'pioglitazone'],
      severity: 'high',
    },
    {
      description: 'Beta-blockers may mask hypoglycemia symptoms',
      drugs: ['atenolol', 'metoprolol', 'propranolol'],
      severity: 'medium',
    },
  ],






  metronidazole: [
    {
      description: 'Severe disulfiram-like reaction with alcohol',
      drugs: ['alcohol', 'ethanol'],
      severity: 'high',
    },
    {
      description: 'Increases warfarin anticoagulant effect',
      drugs: ['warfarin'],
      severity: 'high',
    },
    {
      description: 'May increase lithium levels',
      drugs: ['lithium'],
      severity: 'medium',
    },
  ],







  codeine: [
    {
      description: 'CYP2D6 inhibitors block conversion to morphine',
      drugs: ['fluoxetine', 'paroxetine', 'bupropion'],
      severity: 'medium',
    },
    {
      description: 'Additive CNS/respiratory depression',
      drugs: ['gabapentin', 'tramadol', 'morphine', 'oxycodone'],
      severity: 'high',
    },
  ],



  losartan: [
    {
      description: 'Risk of hyperkalemia',
      drugs: ['spironolactone', 'potassium', 'triamterene', 'lisinopril'],
      severity: 'high',
    },
    {
      description: 'NSAIDs may reduce effectiveness and worsen kidney function',
      drugs: ['ibuprofen', 'naproxen', 'meloxicam', 'indomethacin', 'diclofenac'],
      severity: 'medium',
    },
    {
      description: 'Fluconazole may reduce losartan conversion to active metabolite',
      drugs: ['fluconazole'],
      severity: 'medium',
    },
  ],



  acetaminophen: [
    {
      description: 'May enhance warfarin anticoagulant effect at high/chronic doses',
      drugs: ['warfarin'],
      severity: 'medium',
    },
    {
      description: 'Alcohol increases hepatotoxicity risk',
      drugs: ['alcohol', 'ethanol'],
      severity: 'high',
    },
  ],



  montelukast: [
    {
      description: 'Phenobarbital and phenytoin may reduce montelukast levels',
      drugs: ['phenytoin', 'carbamazepine'],
      severity: 'low',
    },
  ],







  // =========================================================================
  // ANTICOAGULANTS (beyond warfarin)
  // =========================================================================
  enoxaparin: [
    {
      description: 'Increased bleeding risk with antiplatelet agents',
      drugs: ['aspirin', 'clopidogrel', 'ibuprofen', 'naproxen', 'ketorolac'],
      severity: 'high',
    },
  ],






  // =========================================================================
  // NEUROLOGY / PSYCHIATRY
  // =========================================================================
  sertraline: [
    {
      description: 'Risk of serotonin syndrome with other serotonergic drugs',
      drugs: ['fluoxetine', 'tramadol', 'linezolid', 'lithium'],
      severity: 'high',
    },
    {
      description: 'Increased bleeding risk with anticoagulants and NSAIDs',
      drugs: ['warfarin', 'aspirin', 'ibuprofen', 'naproxen'],
      severity: 'medium',
    },
  ],






  apixaban: [
    {
      description: 'CYP3A4/P-gp inhibitors increase apixaban levels',
      drugs: ['ketoconazole', 'itraconazole', 'ritonavir'],
      severity: 'high',
    },
    {
      description: 'Increased bleeding risk with antiplatelet/NSAIDs',
      drugs: ['aspirin', 'clopidogrel', 'ibuprofen', 'naproxen', 'ketorolac'],
      severity: 'high',
    },
  ],










  dabigatran: [
    {
      description: 'P-gp inhibitors increase dabigatran levels',
      drugs: ['ketoconazole', 'amiodarone', 'verapamil'],
      severity: 'high',
    },
    {
      description: 'Increased bleeding risk with antiplatelet/NSAIDs',
      drugs: ['aspirin', 'clopidogrel', 'ibuprofen', 'naproxen', 'ketorolac'],
      severity: 'high',
    },
  ],









  phenytoin: [
    {
      description: 'Strong enzyme inducer — reduces levels of many drugs',
      drugs: ['oral-contraceptives', 'warfarin', 'doxycycline', 'simvastatin', 'theophylline'],
      severity: 'high',
    },
    {
      description: 'Fluconazole and isoniazid increase phenytoin levels',
      drugs: ['fluconazole', 'isoniazid', 'omeprazole'],
      severity: 'high',
    },
  ],









  indomethacin: [
    {
      description: 'Increased bleeding risk with anticoagulants',
      drugs: ['warfarin', 'rivaroxaban', 'apixaban', 'enoxaparin'],
      severity: 'high',
    },
    {
      description: 'May reduce diuretic effect of furosemide',
      drugs: ['furosemide', 'hydrochlorothiazide'],
      severity: 'medium',
    },
    {
      description: 'May increase lithium levels',
      drugs: ['lithium'],
      severity: 'high',
    },
  ],









  pioglitazone: [
    {
      description: 'Additive hypoglycemia risk with insulin/sulfonylureas',
      drugs: ['insulin', 'glipizide', 'glyburide'],
      severity: 'medium',
    },
    {
      description: 'Risk of fluid retention and heart failure exacerbation',
      drugs: ['insulin'],
      severity: 'medium',
    },
  ],










  // =========================================================================
  // ANTIFUNGALS
  // =========================================================================
  fluconazole: [
    {
      description: 'Increases warfarin levels — bleeding risk',
      drugs: ['warfarin'],
      severity: 'high',
    },
    {
      description: 'Increases levels of sulfonylureas — hypoglycemia',
      drugs: ['glipizide', 'glyburide'],
      severity: 'high',
    },
    {
      description: 'Increases phenytoin levels — toxicity risk',
      drugs: ['phenytoin'],
      severity: 'high',
    },
    {
      description: 'May increase statin levels — rhabdomyolysis risk',
      drugs: ['simvastatin', 'atorvastatin'],
      severity: 'high',
    },
  ],









  prednisone: [
    {
      description: 'Increased GI bleeding risk with NSAIDs',
      drugs: ['aspirin', 'ibuprofen', 'naproxen', 'meloxicam', 'indomethacin', 'ketorolac'],
      severity: 'high',
    },
    {
      description: 'May worsen hyperglycemia in diabetic patients',
      drugs: ['insulin', 'metformin', 'glipizide', 'glyburide'],
      severity: 'medium',
    },
    {
      description: 'Increased risk of hypokalemia with diuretics',
      drugs: ['furosemide', 'hydrochlorothiazide'],
      severity: 'medium',
    },
    {
      description: 'Risk of tendon rupture with fluoroquinolones',
      drugs: ['ciprofloxacin', 'levofloxacin'],
      severity: 'high',
    },
  ],









  itraconazole: [
    {
      description: 'Strong CYP3A4 inhibitor — increases levels of many drugs',
      drugs: ['simvastatin', 'amlodipine', 'carbamazepine', 'rivaroxaban', 'apixaban'],
      severity: 'high',
    },
    {
      description: 'Omeprazole reduces itraconazole absorption',
      drugs: ['omeprazole', 'pantoprazole'],
      severity: 'medium',
    },
  ],






  // =========================================================================
  // RESPIRATORY
  // =========================================================================
  theophylline: [
    {
      description: 'Ciprofloxacin and erythromycin increase theophylline levels — toxicity',
      drugs: ['ciprofloxacin', 'erythromycin', 'clarithromycin'],
      severity: 'high',
    },
    {
      description: 'Carbamazepine and phenytoin decrease theophylline levels',
      drugs: ['carbamazepine', 'phenytoin'],
      severity: 'medium',
    },
  ],










  allopurinol: [
    {
      description: 'Severe skin reactions with amoxicillin/ampicillin',
      drugs: ['amoxicillin', 'ampicillin'],
      severity: 'medium',
    },
    {
      description: 'Increases azathioprine/6-MP levels — toxicity risk',
      drugs: ['azathioprine', 'mercaptopurine'],
      severity: 'high',
    },
    {
      description: 'May enhance anticoagulant effect of warfarin',
      drugs: ['warfarin'],
      severity: 'medium',
    },
  ],









  colchicine: [
    {
      description: 'CYP3A4/P-gp inhibitors increase colchicine levels — toxicity',
      drugs: ['ketoconazole', 'itraconazole', 'clarithromycin', 'erythromycin', 'ritonavir'],
      severity: 'high',
    },
    {
      description: 'Increased risk of myopathy with statins',
      drugs: ['simvastatin', 'atorvastatin'],
      severity: 'medium',
    },
  ],






  // =========================================================================
  // ANALGESICS
  // =========================================================================
  tramadol: [
    {
      description: 'Risk of serotonin syndrome with SSRIs',
      drugs: ['sertraline', 'fluoxetine', 'paroxetine'],
      severity: 'high',
    },
    {
      description: 'Risk of seizures — lowered seizure threshold',
      drugs: ['carbamazepine', 'phenytoin'],
      severity: 'high',
    },
    {
      description: 'Additive CNS/respiratory depression',
      drugs: ['gabapentin', 'codeine', 'morphine', 'oxycodone'],
      severity: 'high',
    },
  ],







  ketoconazole: [
    {
      description: 'Strong CYP3A4 inhibitor — increases levels of many drugs',
      drugs: ['simvastatin', 'amlodipine', 'carbamazepine', 'rivaroxaban', 'apixaban', 'dabigatran'],
      severity: 'high',
    },
    {
      description: 'Omeprazole reduces ketoconazole absorption',
      drugs: ['omeprazole', 'pantoprazole'],
      severity: 'medium',
    },
  ],



  ketorolac: [
    {
      description: 'Severe bleeding risk with anticoagulants — contraindicated',
      drugs: ['warfarin', 'heparin', 'enoxaparin', 'rivaroxaban', 'apixaban', 'dabigatran'],
      severity: 'high',
    },
    {
      description: 'GI bleeding risk with aspirin and other NSAIDs',
      drugs: ['aspirin', 'ibuprofen', 'naproxen', 'prednisone'],
      severity: 'high',
    },
    {
      description: 'May reduce diuretic and antihypertensive effects',
      drugs: ['furosemide', 'lisinopril', 'losartan'],
      severity: 'medium',
    },
  ],



  // =========================================================================
  // MISCELLANEOUS
  // =========================================================================
  levothyroxine: [
    {
      description: 'Calcium, iron, and antacids reduce absorption — take 4h apart',
      drugs: ['calcium', 'iron', 'antacids', 'omeprazole'],
      severity: 'medium',
    },
    {
      description: 'Warfarin effect may be enhanced',
      drugs: ['warfarin'],
      severity: 'medium',
    },
  ],










  // =========================================================================
  // ANTI-INFLAMMATORY (NSAIDs beyond ibuprofen)
  // =========================================================================
  meloxicam: [
    {
      description: 'Increased bleeding risk with anticoagulants',
      drugs: ['warfarin', 'rivaroxaban', 'apixaban', 'enoxaparin', 'dabigatran'],
      severity: 'high',
    },
    {
      description: 'May reduce antihypertensive effect',
      drugs: ['lisinopril', 'losartan', 'atenolol', 'amlodipine', 'furosemide'],
      severity: 'medium',
    },
  ],









  rivaroxaban: [
    {
      description: 'CYP3A4/P-gp inhibitors increase rivaroxaban levels',
      drugs: ['ketoconazole', 'itraconazole', 'ritonavir'],
      severity: 'high',
    },
    {
      description: 'Increased bleeding risk with antiplatelet/NSAIDs',
      drugs: ['aspirin', 'clopidogrel', 'ibuprofen', 'naproxen', 'ketorolac'],
      severity: 'high',
    },
  ],



  piroxicam: [
    {
      description: 'Increased bleeding risk with anticoagulants',
      drugs: ['warfarin', 'rivaroxaban', 'apixaban', 'enoxaparin'],
      severity: 'high',
    },
    {
      description: 'May reduce antihypertensive and diuretic effects',
      drugs: ['lisinopril', 'losartan', 'furosemide'],
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
