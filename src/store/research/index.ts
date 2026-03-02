/**
 * Research Mode — Zustand Store
 * Manages the state for the 5-phase medical research workflow.
 * Phase A: Discovery slice (search, PICO, papers)
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ========== Types ==========

export interface PaperResult {
    id: string;
    title: string;
    authors: string;
    journal?: string;
    year: number;
    citations?: number;
    doi?: string;
    doiUrl?: string;
    pubmedUrl?: string;
    source: 'PubMed' | 'OpenAlex' | 'ClinicalTrials.gov';
    isOpenAccess?: boolean;
}

export interface PICOQuery {
    population: string;
    intervention: string;
    comparison: string;
    outcome: string;
}

export type ResearchPhase = 'discovery' | 'screening' | 'analysis' | 'writing' | 'publishing';

export type SearchSource = 'PubMed' | 'OpenAlex' | 'ClinicalTrials.gov';

interface ResearchState {
    // Phase tracking
    activePhase: ResearchPhase;

    // Discovery
    searchQuery: string;
    selectedSources: SearchSource[];
    papers: PaperResult[];
    pico: PICOQuery | null;
    totalResults: number;
    isSearching: boolean;
    searchError: string | null;

    // Actions
    setSearchQuery: (query: string) => void;
    toggleSource: (source: SearchSource) => void;
    searchPapers: (query: string) => Promise<void>;
    extractPICO: (query: string) => void;
    setActivePhase: (phase: ResearchPhase) => void;
    reset: () => void;
}

const initialState = {
    activePhase: 'discovery' as ResearchPhase,
    isSearching: false,
    papers: [] as PaperResult[],
    pico: null as PICOQuery | null,
    searchError: null as string | null,
    searchQuery: '',
    selectedSources: ['PubMed', 'OpenAlex'] as SearchSource[],
    totalResults: 0,
};

// ========== API Services ==========

const searchPubMed = async (query: string, maxResults = 10): Promise<PaperResult[]> => {
    try {
        const response = await fetch('/api/plugins/pubmed/search', {
            body: JSON.stringify({ maxResults, query }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
        if (!response.ok) throw new Error('PubMed search failed');

        const data = await response.json();
        const articles = data.articles || [];
        return articles.map((a: any) => ({
            authors: (a.authors || []).join(', '),
            citations: undefined,
            doi: a.doi,
            doiUrl: a.doiUrl,
            id: `pubmed-${a.pmid}`,
            journal: a.journal,
            pubmedUrl: a.pubmedUrl,
            source: 'PubMed' as const,
            title: a.title,
            year: a.pubDate ? new Date(a.pubDate).getFullYear() : 0,
        }));
    } catch (error) {
        console.error('[Research] PubMed search error:', error);
        return [];
    }
};

const searchOpenAlex = async (query: string, maxResults = 10): Promise<PaperResult[]> => {
    try {
        const response = await fetch('/api/plugins/openalex/search', {
            body: JSON.stringify({ maxResults, query }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
        if (!response.ok) throw new Error('OpenAlex search failed');

        const data = await response.json();
        const articles = data.articles || [];
        return articles.map((a: any) => ({
            authors: a.firstAuthor || 'Unknown',
            citations: a.citedByCount,
            doi: a.doi,
            doiUrl: a.doiUrl,
            id: `openalex-${a.doi || a.title}`,
            isOpenAccess: a.isOpenAccess,
            journal: a.journal,
            source: 'OpenAlex' as const,
            title: a.title,
            year: a.year || 0,
        }));
    } catch (error) {
        console.error('[Research] OpenAlex search error:', error);
        return [];
    }
};

// ========== Simple PICO extraction (keyword-based, Phase A) ==========

const extractPICOFromQuery = (query: string): PICOQuery => {
    // Simple keyword extraction — will be replaced by AI in Phase B
    const lower = query.toLowerCase();
    const words = query.split(/\s+/);

    // Try to identify key components from the query
    let population = '';
    let intervention = '';
    let comparison = '';
    let outcome = '';

    // Common medical patterns
    const interventionKeywords = ['metformin', 'aspirin', 'statin', 'insulin', 'therapy', 'treatment', 'drug', 'vaccine', 'surgery'];
    const outcomeKeywords = ['prevention', 'mortality', 'survival', 'risk', 'efficacy', 'outcome', 'effect', 'incidence', 'reduction'];
    const comparisonKeywords = ['placebo', 'control', 'versus', 'vs', 'compared', 'alternative'];

    for (const word of words) {
        const w = word.toLowerCase().replace(/[.,;:]/g, '');
        if (interventionKeywords.some((k) => w.includes(k))) {
            intervention = intervention ? `${intervention}, ${word}` : word;
        }
        if (outcomeKeywords.some((k) => w.includes(k))) {
            outcome = outcome ? `${outcome}, ${word}` : word;
        }
        if (comparisonKeywords.some((k) => w.includes(k))) {
            comparison = comparison ? `${comparison}, ${word}` : word;
        }
    }

    // Population is the remaining context
    population = query
        .replace(new RegExp(intervention, 'gi'), '')
        .replace(new RegExp(outcome, 'gi'), '')
        .replace(new RegExp(comparison, 'gi'), '')
        .replace(/\s+/g, ' ')
        .trim() || query;

    return {
        comparison: comparison || 'Placebo / Standard care',
        intervention: intervention || lower,
        outcome: outcome || 'Clinical outcomes',
        population: population || 'Study population',
    };
};

// ========== Store ==========

export const useResearchStore = create<ResearchState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            extractPICO: (query) => {
                const pico = extractPICOFromQuery(query);
                set({ pico }, false, 'extractPICO');
            },

            reset: () => {
                set(initialState, false, 'reset');
            },

            searchPapers: async (query) => {
                const { selectedSources } = get();
                set({ isSearching: true, searchError: null, searchQuery: query }, false, 'searchPapers/start');

                try {
                    // Parallel search across selected sources
                    const promises: Promise<PaperResult[]>[] = [];

                    if (selectedSources.includes('PubMed')) {
                        promises.push(searchPubMed(query));
                    }
                    if (selectedSources.includes('OpenAlex')) {
                        promises.push(searchOpenAlex(query));
                    }

                    const results = await Promise.allSettled(promises);

                    // Merge results, dedup by DOI
                    const allPapers: PaperResult[] = [];
                    const seenDois = new Set<string>();

                    for (const result of results) {
                        if (result.status === 'fulfilled') {
                            for (const paper of result.value) {
                                const key = paper.doi || paper.title;
                                if (!seenDois.has(key)) {
                                    seenDois.add(key);
                                    allPapers.push(paper);
                                }
                            }
                        }
                    }

                    // Sort by citations (desc), then year (desc)
                    allPapers.sort((a, b) => {
                        if ((b.citations || 0) !== (a.citations || 0)) {
                            return (b.citations || 0) - (a.citations || 0);
                        }
                        return b.year - a.year;
                    });

                    set({
                        isSearching: false,
                        papers: allPapers,
                        totalResults: allPapers.length,
                    }, false, 'searchPapers/done');
                } catch (error) {
                    set({
                        isSearching: false,
                        searchError: 'Search failed. Please try again.',
                    }, false, 'searchPapers/error');
                }
            },

            setActivePhase: (phase) => {
                set({ activePhase: phase }, false, 'setActivePhase');
            },

            setSearchQuery: (query) => {
                set({ searchQuery: query }, false, 'setSearchQuery');
            },

            toggleSource: (source) => {
                const { selectedSources } = get();
                const newSources = selectedSources.includes(source)
                    ? selectedSources.filter((s) => s !== source)
                    : [...selectedSources, source];
                set({ selectedSources: newSources }, false, 'toggleSource');
            },
        }),
        { name: 'ResearchStore' },
    ),
);
