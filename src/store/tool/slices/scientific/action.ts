/**
 * Scientific Skills builtin tool action handlers.
 *
 * Each handler corresponds to a ScientificApiNames key.
 * When the LLM triggers a builtin tool call like `searchPubMed`,
 * `transformApiArgumentsToAiState` matches the apiName to these handlers,
 * calls the real API, and returns the result as JSON string.
 */
import { StateCreator } from 'zustand/vanilla';

import { ToolStore } from '../../store';

// ============== PubMed ==============

interface PubMedParams {
  keywords: string;
  limit?: number;
  yearFrom?: number;
  yearTo?: number;
}

async function callSearchPubMed(params: PubMedParams) {
  const res = await fetch('/api/plugins/pubmed/search', {
    body: JSON.stringify({
      maxResults: params.limit || 10,
      query: params.keywords,
      sortBy: 'relevance',
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!res.ok) throw new Error(`PubMed search failed: ${res.statusText}`);

  const data = await res.json();

  // Normalize to Render-expected format: { papers, query, totalResults }
  return {
    papers: (data.articles || []).map((a: any) => ({
      authors: a.authors,
      citationCount: undefined,
      doi: a.doi,
      paperId: a.pmid,
      title: a.title,
      url: a.pubmedUrl || (a.doi ? `https://doi.org/${a.doi}` : undefined),
      venue: a.journal,
      year: a.pubDate ? parseInt(a.pubDate, 10) || undefined : undefined,
    })),
    query: data.query || params.keywords,
    totalResults: data.pagination?.totalResults || data.totalResults || 0,
  };
}

// ============== Clinical Trials ==============

interface ClinicalTrialsParams {
  condition?: string;
  intervention?: string;
  limit?: number;
  status?: string;
}

async function callSearchClinicalTrials(params: ClinicalTrialsParams) {
  const res = await fetch('/api/plugins/clinical-trials/search', {
    body: JSON.stringify({
      condition: params.condition,
      intervention: params.intervention,
      maxResults: params.limit || 10,
      status: params.status,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!res.ok) throw new Error(`Clinical trials search failed: ${res.statusText}`);

  const data = await res.json();

  return {
    papers: (data.trials || []).map((t: any) => ({
      authors: t.sponsor ? [t.sponsor] : undefined,
      title: t.title,
      url: t.url,
      venue: [t.status, t.phase].filter(Boolean).join(' · '),
      year: t.startDate ? parseInt(t.startDate, 10) || undefined : undefined,
    })),
    query: params.condition || params.intervention || '',
    totalResults: data.totalFound || 0,
  };
}

// ============== ChEMBL (direct public API) ==============

interface ChEMBLParams {
  limit?: number;
  query: string;
  queryType?: string;
}

async function callQueryChEMBL(params: ChEMBLParams) {
  const limit = params.limit || 10;
  const base = 'https://www.ebi.ac.uk/chembl/api/data';

  let url: string;
  switch (params.queryType) {
    case 'target':
      url = `${base}/target/search.json?q=${encodeURIComponent(params.query)}&limit=${limit}`;
      break;
    case 'activity':
      url = `${base}/activity.json?molecule_chembl_id=${encodeURIComponent(params.query)}&limit=${limit}`;
      break;
    default:
      url = `${base}/molecule/search.json?q=${encodeURIComponent(params.query)}&limit=${limit}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ChEMBL query failed: ${res.statusText}`);

  const data = await res.json();
  const items = data.molecules || data.targets || data.activities || [];

  return {
    results: items.slice(0, limit).map((item: any) => ({
      doi: undefined,
      name: item.pref_name || item.molecule_chembl_id || item.target_chembl_id,
      source: 'ChEMBL',
      title:
        item.pref_name ||
        item.molecule_chembl_id ||
        item.target_pref_name ||
        item.target_chembl_id ||
        'Unknown',
      url: item.molecule_chembl_id
        ? `https://www.ebi.ac.uk/chembl/compound_report_card/${item.molecule_chembl_id}/`
        : undefined,
    })),
    query: params.query,
    totalResults: data.page_meta?.total_count || items.length,
  };
}

// ============== UniProt (direct public API) ==============

interface UniProtParams {
  includeSequence?: boolean;
  includeStructure?: boolean;
  proteinId: string;
}

async function callFetchUniProt(params: UniProtParams) {
  const res = await fetch(
    `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(params.proteinId)}.json`,
  );

  if (!res.ok) throw new Error(`UniProt fetch failed: ${res.statusText}`);

  const data = await res.json();

  return {
    accession: data.primaryAccession,
    function:
      data.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]?.value || '',
    organism: data.organism?.scientificName || '',
    proteinName: data.proteinDescription?.recommendedName?.fullName?.value || data.primaryAccession,
    sequence: params.includeSequence !== false ? data.sequence?.value : undefined,
    url: `https://www.uniprot.org/uniprot/${data.primaryAccession}`,
  };
}

// ============== NCBI Gene (direct public API) ==============

interface GeneParams {
  geneSymbol: string;
  includeExpression?: boolean;
  includeVariants?: boolean;
}

async function callQueryGene(params: GeneParams) {
  // Search for gene ID
  const searchRes = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${encodeURIComponent(params.geneSymbol)}[Gene Name]+AND+Homo+sapiens[Organism]&retmode=json`,
  );
  const searchData = await searchRes.json();
  const geneId = searchData.esearchresult?.idlist?.[0];

  if (!geneId) {
    return { geneName: params.geneSymbol, source: 'NCBI Gene', url: undefined };
  }

  // Fetch gene summary
  const summaryRes = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`,
  );
  const summaryData = await summaryRes.json();
  const gene = summaryData.result?.[geneId];

  return {
    description: gene?.description || '',
    geneName: gene?.name || params.geneSymbol,
    organism: gene?.organism?.scientificname || 'Homo sapiens',
    source: 'NCBI Gene',
    summary: gene?.summary || '',
    url: `https://www.ncbi.nlm.nih.gov/gene/${geneId}`,
  };
}

// ============== AlphaFold (direct public API) ==============

interface AlphaFoldParams {
  includePdb?: boolean;
  proteinId: string;
}

async function callCheckAlphaFold(params: AlphaFoldParams) {
  const res = await fetch(
    `https://alphafold.ebi.ac.uk/api/prediction/${encodeURIComponent(params.proteinId)}`,
  );

  if (!res.ok) throw new Error(`AlphaFold fetch failed: ${res.statusText}`);

  const data = await res.json();
  const entry = Array.isArray(data) ? data[0] : data;

  return {
    accession: entry?.uniprotAccession || params.proteinId,
    confidenceScore: entry?.globalMetricValue,
    organism: entry?.organismScientificName || '',
    proteinName: entry?.uniprotDescription || params.proteinId,
    structureUrl: entry?.cifUrl || entry?.pdbUrl,
    url: `https://alphafold.ebi.ac.uk/entry/${entry?.uniprotAccession || params.proteinId}`,
  };
}

// ============== Export slice ==============

export interface ScientificToolAction {
  checkAlphaFold: (params: AlphaFoldParams) => Promise<any>;
  fetchUniProt: (params: UniProtParams) => Promise<any>;
  queryChEMBL: (params: ChEMBLParams) => Promise<any>;
  queryGene: (params: GeneParams) => Promise<any>;
  searchClinicalTrials: (params: ClinicalTrialsParams) => Promise<any>;
  searchPubMed: (params: PubMedParams) => Promise<any>;
}

export const createScientificToolSlice: StateCreator<
  ToolStore,
  [['zustand/devtools', never]],
  [],
  ScientificToolAction
> = () => ({
  checkAlphaFold: callCheckAlphaFold,
  fetchUniProt: callFetchUniProt,
  queryChEMBL: callQueryChEMBL,
  queryGene: callQueryGene,
  searchClinicalTrials: callSearchClinicalTrials,
  searchPubMed: callSearchPubMed,
});
