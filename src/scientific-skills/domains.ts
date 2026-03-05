/**
 * Domain definitions mapping scientific skills to categories.
 * Each domain groups related skills for system prompt building and agent configuration.
 */

export interface ScientificDomain {
  avatar: string;
  description: string;
  id: string;
  name: string;
  skills: string[];
}

export const SCIENTIFIC_DOMAINS: ScientificDomain[] = [
  {
    avatar: '🧬',
    description:
      'Genomics, single-cell analysis, sequence alignment, and bioinformatics pipelines',
    id: 'bioinformatics',
    name: 'Bioinformatics & Genomics',
    skills: [
      'scanpy',
      'biopython',
      'bioservices',
      'anndata',
      'pysam',
      'gget',
      'cellxgene-census',
      'pydeseq2',
      'scvi-tools',
      'scvelo',
      'tiledbvcf',
      'deeptools',
      'scikit-bio',
      'flowio',
      'arboreto',
      'geniml',
      'gtars',
      'phylogenetics',
      'etetoolkit',
    ],
  },
  {
    avatar: '💊',
    description:
      'Molecular analysis, virtual screening, ADMET prediction, and drug-target interactions',
    id: 'drug-discovery',
    name: 'Drug Discovery & Cheminformatics',
    skills: [
      'rdkit',
      'datamol',
      'deepchem',
      'diffdock',
      'medchem',
      'molfeat',
      'pytdc',
      'torchdrug',
      'rowan',
      'chembl-database',
      'drugbank-database',
      'pubchem-database',
      'zinc-database',
      'bindingdb-database',
    ],
  },
  {
    avatar: '🏥',
    description:
      'Clinical trials, pharmacogenomics, variant interpretation, and precision medicine',
    id: 'clinical-research',
    name: 'Clinical Research & Precision Medicine',
    skills: [
      'clinicaltrials-database',
      'clinvar-database',
      'clinpgx-database',
      'cosmic-database',
      'clinical-decision-support',
      'clinical-reports',
      'treatment-plans',
      'pyhealth',
      'neurokit2',
      'fda-database',
      'gnomad-database',
    ],
  },
  {
    avatar: '🔬',
    description: 'Protein structure prediction, engineering, mass spectrometry, and proteomics',
    id: 'proteomics',
    name: 'Proteomics & Protein Engineering',
    skills: [
      'esm',
      'adaptyv',
      'alphafold-database',
      'pdb-database',
      'uniprot-database',
      'matchms',
      'pyopenms',
      'glycoengineering',
      'molecular-dynamics',
    ],
  },
  {
    avatar: '🤖',
    description:
      'Deep learning, reinforcement learning, Bayesian inference, and model interpretability',
    id: 'machine-learning',
    name: 'Machine Learning & AI',
    skills: [
      'scikit-learn',
      'pytorch-lightning',
      'transformers',
      'torch_geometric',
      'stable-baselines3',
      'pufferlib',
      'shap',
      'umap-learn',
      'pymc',
      'pymoo',
      'statsmodels',
      'scikit-survival',
      'aeon',
      'timesfm-forecasting',
    ],
  },
  {
    avatar: '📊',
    description:
      'Statistical analysis, visualization, data processing, and publication-quality figures',
    id: 'data-analysis',
    name: 'Data Analysis & Visualization',
    skills: [
      'matplotlib',
      'seaborn',
      'plotly',
      'networkx',
      'polars',
      'dask',
      'vaex',
      'geopandas',
      'simpy',
      'sympy',
      'datacommons-client',
      'statistical-analysis',
      'exploratory-data-analysis',
      'scientific-visualization',
      'zarr-python',
    ],
  },
  {
    avatar: '⚗️',
    description: 'Crystal structure, computational chemistry, metabolic modeling, and simulations',
    id: 'materials-science',
    name: 'Materials Science & Chemistry',
    skills: ['pymatgen', 'cobrapy', 'astropy', 'fluidsim', 'matlab'],
  },
  {
    avatar: '📝',
    description:
      'Literature review, scientific writing, citation management, and peer review assistance',
    id: 'scientific-communication',
    name: 'Scientific Communication',
    skills: [
      'pubmed-database',
      'biorxiv-database',
      'openalex-database',
      'pyzotero',
      'citation-management',
      'literature-review',
      'scientific-writing',
      'peer-review',
      'venue-templates',
      'scientific-slides',
      'latex-posters',
      'pptx-posters',
      'document-skills',
      'research-grants',
      'infographics',
      'scientific-schematics',
      'markitdown',
    ],
  },
  {
    avatar: '🧪',
    description:
      'Liquid handling, protocol management, LIMS integration, and laboratory automation',
    id: 'lab-automation',
    name: 'Laboratory Automation',
    skills: [
      'opentrons-integration',
      'benchling-integration',
      'protocolsio-integration',
      'labarchive-integration',
      'ginkgo-cloud-lab',
      'pylabrobot',
      'omero-integration',
      'lamindb',
    ],
  },
  {
    avatar: '🏦',
    description:
      'SEC EDGAR filings, economic data, stock market analysis, and financial research',
    id: 'financial-research',
    name: 'Financial & Economic Research',
    skills: [
      'edgartools',
      'alpha-vantage',
      'fred-economic-data',
      'usfiscaldata',
      'hedgefundmonitor',
      'market-research-reports',
    ],
  },
  {
    avatar: '🖥️',
    description: 'Quantum computing, cloud platforms, and research infrastructure',
    id: 'quantum-computing',
    name: 'Quantum Computing & Infrastructure',
    skills: ['qiskit', 'pennylane', 'cirq', 'qutip', 'modal', 'dnanexus-integration', 'latchbio-integration'],
  },
  {
    avatar: '🩺',
    description:
      'Medical imaging, digital pathology, DICOM processing, and image analysis',
    id: 'medical-imaging',
    name: 'Medical Imaging',
    skills: [
      'pydicom',
      'histolab',
      'pathml',
      'imaging-data-commons',
      'neuropixels-analysis',
    ],
  },
];

/**
 * Get all skill slugs across all domains
 */
export const getAllDomainSkillSlugs = (): string[] => {
  const slugs = new Set<string>();
  for (const domain of SCIENTIFIC_DOMAINS) {
    for (const skill of domain.skills) {
      slugs.add(skill);
    }
  }
  return [...slugs];
};

/**
 * Get the domain for a given skill slug
 */
export const getDomainForSkill = (slug: string): ScientificDomain | undefined => {
  return SCIENTIFIC_DOMAINS.find((d) => d.skills.includes(slug));
};
