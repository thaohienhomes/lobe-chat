/**
 * Scientific Research APIs for auto-execution
 * These enable the AI to directly query scientific databases and return results
 */

export const ScientificApiNames = {
  searchPubMed: 'searchPubMed',
  queryChEMBL: 'queryChEMBL',
  fetchUniProt: 'fetchUniProt',
  searchClinicalTrials: 'searchClinicalTrials',
  queryGene: 'queryGene',
  checkAlphaFold: 'checkAlphaFold',
};

export const ScientificSkillsAPIs = [
  {
    name: ScientificApiNames.searchPubMed,
    description:
      'Search PubMed biomedical literature database for research papers. Returns article titles, authors, abstracts, and DOIs.',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'string',
          description: 'Search keywords (e.g., "BRCA1 cancer", "machine learning protein")',
        },
        yearFrom: {
          type: 'integer',
          description: 'Year from which to search (e.g., 2020)',
        },
        yearTo: {
          type: 'integer',
          description: 'Year until which to search (default: current year)',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return (default: 10, max: 50)',
          default: 10,
        },
      },
      required: ['keywords'],
    },
  },
  {
    name: ScientificApiNames.queryChEMBL,
    description:
      'Query ChEMBL bioactivity database for compounds, targets, and drug properties. Search by SMILES, compound ID, or protein target.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SMILES notation, compound ID, protein name, or target name',
        },
        queryType: {
          type: 'string',
          enum: ['smiles', 'compound_id', 'target', 'activity'],
          description: 'Type of query to perform',
          default: 'compound_id',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results (default: 10)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: ScientificApiNames.fetchUniProt,
    description:
      'Fetch protein sequence, structure, and functional information from UniProt. Requires UniProt accession ID (e.g., P04637).',
    parameters: {
      type: 'object',
      properties: {
        proteinId: {
          type: 'string',
          description: 'UniProt accession ID (e.g., P04637 for p53)',
        },
        includeSequence: {
          type: 'boolean',
          description: 'Include full protein sequence (default: true)',
          default: true,
        },
        includeStructure: {
          type: 'boolean',
          description: 'Include known structure information (default: true)',
          default: true,
        },
      },
      required: ['proteinId'],
    },
  },
  {
    name: ScientificApiNames.searchClinicalTrials,
    description:
      'Search ClinicalTrials.gov for clinical trials. Find ongoing, completed, or recruiting trials by condition, intervention, or status.',
    parameters: {
      type: 'object',
      properties: {
        condition: {
          type: 'string',
          description: 'Disease or condition to search (e.g., "Type 2 Diabetes")',
        },
        intervention: {
          type: 'string',
          description: 'Drug, therapy, or intervention name',
        },
        status: {
          type: 'string',
          enum: ['recruiting', 'active', 'completed', 'enrolling_by_invitation'],
          description: 'Trial recruitment status',
        },
        limit: {
          type: 'integer',
          description: 'Maximum trials to return (default: 10)',
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: ScientificApiNames.queryGene,
    description:
      'Query NCBI Gene and Ensembl databases for gene information, including function, variants, and expression data.',
    parameters: {
      type: 'object',
      properties: {
        geneSymbol: {
          type: 'string',
          description: 'Gene symbol or name (e.g., "TP53", "BRCA1")',
        },
        includeVariants: {
          type: 'boolean',
          description: 'Include known genetic variants (default: true)',
          default: true,
        },
        includeExpression: {
          type: 'boolean',
          description: 'Include tissue expression data from GTEx (default: false)',
          default: false,
        },
      },
      required: ['geneSymbol'],
    },
  },
  {
    name: ScientificApiNames.checkAlphaFold,
    description:
      'Retrieve protein structure predictions from AlphaFold DB. Returns predicted 3D structure and confidence scores.',
    parameters: {
      type: 'object',
      properties: {
        proteinId: {
          type: 'string',
          description: 'UniProt accession ID or protein name',
        },
        includePdb: {
          type: 'boolean',
          description: 'Compare with known PDB structures if available (default: true)',
          default: true,
        },
      },
      required: ['proteinId'],
    },
  },
];
