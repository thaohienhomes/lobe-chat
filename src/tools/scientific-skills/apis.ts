/**
 * Scientific Research APIs for auto-execution
 * These enable the AI to directly query scientific databases and return results
 */

export const ScientificApiNames = {
  checkAlphaFold: 'checkAlphaFold',
  fetchUniProt: 'fetchUniProt',
  queryChEMBL: 'queryChEMBL',
  queryGene: 'queryGene',
  searchClinicalTrials: 'searchClinicalTrials',
  searchPubMed: 'searchPubMed',
};

export const ScientificSkillsAPIs = [
  {
    description:
      'Search PubMed biomedical literature database for research papers. Returns article titles, authors, abstracts, and DOIs.',
    name: ScientificApiNames.searchPubMed,
    parameters: {
      properties: {
        keywords: {
          description: 'Search keywords (e.g., "BRCA1 cancer", "machine learning protein")',
          type: 'string',
        },
        limit: {
          default: 10,
          description: 'Maximum number of results to return (default: 10, max: 50)',
          type: 'integer',
        },
        yearFrom: {
          description: 'Year from which to search (e.g., 2020)',
          type: 'integer',
        },
        yearTo: {
          description: 'Year until which to search (default: current year)',
          type: 'integer',
        },
      },
      required: ['keywords'],
      type: 'object',
    },
  },
  {
    description:
      'Query ChEMBL bioactivity database for compounds, targets, and drug properties. Search by SMILES, compound ID, or protein target.',
    name: ScientificApiNames.queryChEMBL,
    parameters: {
      properties: {
        limit: {
          default: 10,
          description: 'Maximum number of results (default: 10)',
          type: 'integer',
        },
        query: {
          description: 'SMILES notation, compound ID, protein name, or target name',
          type: 'string',
        },
        queryType: {
          default: 'compound_id',
          description: 'Type of query to perform',
          enum: ['smiles', 'compound_id', 'target', 'activity'],
          type: 'string',
        },
      },
      required: ['query'],
      type: 'object',
    },
  },
  {
    description:
      'Fetch protein sequence, structure, and functional information from UniProt. Requires UniProt accession ID (e.g., P04637).',
    name: ScientificApiNames.fetchUniProt,
    parameters: {
      properties: {
        includeSequence: {
          default: true,
          description: 'Include full protein sequence (default: true)',
          type: 'boolean',
        },
        includeStructure: {
          default: true,
          description: 'Include known structure information (default: true)',
          type: 'boolean',
        },
        proteinId: {
          description: 'UniProt accession ID (e.g., P04637 for p53)',
          type: 'string',
        },
      },
      required: ['proteinId'],
      type: 'object',
    },
  },
  {
    description:
      'Search ClinicalTrials.gov for clinical trials. Find ongoing, completed, or recruiting trials by condition, intervention, or status.',
    name: ScientificApiNames.searchClinicalTrials,
    parameters: {
      properties: {
        condition: {
          description: 'Disease or condition to search (e.g., "Type 2 Diabetes")',
          type: 'string',
        },
        intervention: {
          description: 'Drug, therapy, or intervention name',
          type: 'string',
        },
        limit: {
          default: 10,
          description: 'Maximum trials to return (default: 10)',
          type: 'integer',
        },
        status: {
          description: 'Trial recruitment status',
          enum: ['recruiting', 'active', 'completed', 'enrolling_by_invitation'],
          type: 'string',
        },
      },
      required: [],
      type: 'object',
    },
  },
  {
    description:
      'Query NCBI Gene and Ensembl databases for gene information, including function, variants, and expression data.',
    name: ScientificApiNames.queryGene,
    parameters: {
      properties: {
        geneSymbol: {
          description: 'Gene symbol or name (e.g., "TP53", "BRCA1")',
          type: 'string',
        },
        includeExpression: {
          default: false,
          description: 'Include tissue expression data from GTEx (default: false)',
          type: 'boolean',
        },
        includeVariants: {
          default: true,
          description: 'Include known genetic variants (default: true)',
          type: 'boolean',
        },
      },
      required: ['geneSymbol'],
      type: 'object',
    },
  },
  {
    description:
      'Retrieve protein structure predictions from AlphaFold DB. Returns predicted 3D structure and confidence scores.',
    name: ScientificApiNames.checkAlphaFold,
    parameters: {
      properties: {
        includePdb: {
          default: true,
          description: 'Compare with known PDB structures if available (default: true)',
          type: 'boolean',
        },
        proteinId: {
          description: 'UniProt accession ID or protein name',
          type: 'string',
        },
      },
      required: ['proteinId'],
      type: 'object',
    },
  },
];
