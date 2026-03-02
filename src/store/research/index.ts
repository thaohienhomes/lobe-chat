/**
 * Research Mode — Zustand Store
 * Manages the state for the 5-phase medical research workflow.
 * Phase A: Discovery (search, PICO, papers)
 * Phase B: Screening (include/exclude papers, criteria)
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ========== Types ==========

export interface PaperResult {
    abstract?: string;
    authors: string;
    citations?: number;
    doi?: string;
    doiUrl?: string;
    id: string;
    isOpenAccess?: boolean;
    journal?: string;
    pubmedUrl?: string;
    source: 'PubMed' | 'OpenAlex' | 'ClinicalTrials.gov';
    title: string;
    year: number;
}

export interface PICOQuery {
    comparison: string;
    intervention: string;
    outcome: string;
    population: string;
}

export type ResearchPhase = 'discovery' | 'screening' | 'analysis' | 'writing' | 'publishing';

export type SearchSource = 'PubMed' | 'OpenAlex' | 'ClinicalTrials.gov';

export type ScreeningDecision = 'included' | 'excluded' | 'pending';

export interface ScreeningEntry {
    decision: ScreeningDecision;
    paperId: string;
    reason?: string;
}

export interface ScreeningCriteria {
    exclusionCriteria: string[];
    inclusionCriteria: string[];
    minCitations?: number;
    studyTypes?: string[];
    yearFrom?: number;
    yearTo?: number;
}

interface ResearchState {
    // Phase tracking
    activePhase: ResearchPhase;

    autoScreenByCitations: (minCitations: number) => void;
    autoScreenByYearRange: (yearFrom: number, yearTo: number) => void;
    excludeAllPapers: () => void;
    extractPICO: (query: string) => void;
    getExcludedPapers: () => PaperResult[];
    // Getters
    getIncludedPapers: () => PaperResult[];
    getPendingPapers: () => PaperResult[];

    getScreeningStats: () => { excluded: number; included: number; pending: number; total: number };
    includeAllPapers: () => void;

    isSearching: boolean;
    toggleSource: (source: SearchSource) => void;
    searchPapers: (query: string) => Promise<void>;
    pico: PICOQuery | null;
    setActivePhase: (phase: ResearchPhase) => void;

    // Screening Actions
    screenPaper: (paperId: string, decision: ScreeningDecision, reason?: string) => void;
    selectedSources: SearchSource[];
    papers: PaperResult[];
    updateScreeningCriteria: (criteria: Partial<ScreeningCriteria>) => void;
    screeningCriteria: ScreeningCriteria;
    // Discovery
    searchQuery: string;
    resetScreening: () => void;

    // Discovery Actions
    setSearchQuery: (query: string) => void;
    totalResults: number;
    searchError: string | null;
    // Screening
    screeningDecisions: Record<string, ScreeningEntry>;

    reset: () => void;
}

const defaultCriteria: ScreeningCriteria = {
    exclusionCriteria: ['Case reports', 'Animal studies', 'Non-English language'],
    inclusionCriteria: ['Randomized controlled trial', 'Systematic review', 'Meta-analysis'],
    minCitations: 0,
    studyTypes: ['RCT', 'Systematic Review', 'Meta-analysis', 'Cohort Study'],
    yearFrom: 2015,
    yearTo: new Date().getFullYear(),
};

const initialState = {
    activePhase: 'discovery' as ResearchPhase,
    isSearching: false,
    papers: [] as PaperResult[],
    pico: null as PICOQuery | null,
    screeningCriteria: defaultCriteria,
    screeningDecisions: {} as Record<string, ScreeningEntry>,
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
            abstract: a.abstract,
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

// ========== PICO extraction (keyword-based) ==========

const extractPICOFromQuery = (query: string): PICOQuery => {
    const lower = query.toLowerCase();
    const words = query.split(/\s+/);

    let population = '';
    let intervention = '';
    let comparison = '';
    let outcome = '';

    const interventionKeywords = ['metformin', 'aspirin', 'statin', 'insulin', 'therapy', 'treatment', 'drug', 'vaccine', 'surgery'];
    const outcomeKeywords = ['prevention', 'mortality', 'survival', 'risk', 'efficacy', 'outcome', 'effect', 'incidence', 'reduction'];
    const comparisonKeywords = ['placebo', 'control', 'versus', 'vs', 'compared', 'alternative'];

    for (const word of words) {
        const w = word.toLowerCase().replaceAll(/[,.:;]/g, '');
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

    population = query
        .replaceAll(new RegExp(intervention.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&'), 'gi'), '')
        .replaceAll(new RegExp(outcome.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&'), 'gi'), '')
        .replaceAll(new RegExp(comparison.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&'), 'gi'), '')
        .replaceAll(/\s+/g, ' ')
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

            autoScreenByCitations: (minCitations) => {
                const { papers, screeningDecisions } = get();
                const updated = { ...screeningDecisions };
                for (const paper of papers) {
                    if ((paper.citations || 0) < minCitations) {
                        updated[paper.id] = { decision: 'excluded', paperId: paper.id, reason: `< ${minCitations} citations` };
                    }
                }
                set({ screeningCriteria: { ...get().screeningCriteria, minCitations }, screeningDecisions: updated }, false, 'autoScreenByCitations');
            },

            autoScreenByYearRange: (yearFrom, yearTo) => {
                const { papers, screeningDecisions } = get();
                const updated = { ...screeningDecisions };
                for (const paper of papers) {
                    if (paper.year < yearFrom || paper.year > yearTo) {
                        updated[paper.id] = { decision: 'excluded', paperId: paper.id, reason: `Outside ${yearFrom}-${yearTo}` };
                    }
                }
                set({ screeningCriteria: { ...get().screeningCriteria, yearFrom, yearTo }, screeningDecisions: updated }, false, 'autoScreenByYearRange');
            },

            excludeAllPapers: () => {
                const { papers } = get();
                const decisions: Record<string, ScreeningEntry> = {};
                for (const paper of papers) {
                    decisions[paper.id] = { decision: 'excluded', paperId: paper.id };
                }
                set({ screeningDecisions: decisions }, false, 'excludeAllPapers');
            },

            extractPICO: (query) => {
                const pico = extractPICOFromQuery(query);
                set({ pico }, false, 'extractPICO');
            },

            getExcludedPapers: () => {
                const { papers, screeningDecisions } = get();
                return papers.filter((p) => screeningDecisions[p.id]?.decision === 'excluded');
            },

            getIncludedPapers: () => {
                const { papers, screeningDecisions } = get();
                return papers.filter((p) => screeningDecisions[p.id]?.decision === 'included');
            },

            getPendingPapers: () => {
                const { papers, screeningDecisions } = get();
                return papers.filter((p) => !screeningDecisions[p.id] || screeningDecisions[p.id]?.decision === 'pending');
            },

            getScreeningStats: () => {
                const { papers, screeningDecisions } = get();
                let included = 0;
                let excluded = 0;
                for (const paper of papers) {
                    const d = screeningDecisions[paper.id]?.decision;
                    if (d === 'included') included++;
                    else if (d === 'excluded') excluded++;
                }
                return { excluded, included, pending: papers.length - included - excluded, total: papers.length };
            },

            includeAllPapers: () => {
                const { papers } = get();
                const decisions: Record<string, ScreeningEntry> = {};
                for (const paper of papers) {
                    decisions[paper.id] = { decision: 'included', paperId: paper.id };
                }
                set({ screeningDecisions: decisions }, false, 'includeAllPapers');
            },

            reset: () => {
                set(initialState, false, 'reset');
            },

            resetScreening: () => {
                set({ screeningDecisions: {} }, false, 'resetScreening');
            },

            screenPaper: (paperId, decision, reason) => {
                const { screeningDecisions } = get();
                set({
                    screeningDecisions: {
                        ...screeningDecisions,
                        [paperId]: { decision, paperId, reason },
                    },
                }, false, 'screenPaper');
            },

            searchPapers: async (query) => {
                const { selectedSources } = get();
                set({ isSearching: true, searchError: null, searchQuery: query }, false, 'searchPapers/start');

                try {
                    const promises: Promise<PaperResult[]>[] = [];
                    if (selectedSources.includes('PubMed')) promises.push(searchPubMed(query));
                    if (selectedSources.includes('OpenAlex')) promises.push(searchOpenAlex(query));

                    const results = await Promise.allSettled(promises);
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

                    allPapers.sort((a, b) => {
                        if ((b.citations || 0) !== (a.citations || 0)) return (b.citations || 0) - (a.citations || 0);
                        return b.year - a.year;
                    });

                    set({
                        isSearching: false,
                        papers: allPapers,
                        screeningDecisions: {},
                        totalResults: allPapers.length,
                    }, false, 'searchPapers/done');
                } catch {
                    set({ isSearching: false, searchError: 'Search failed. Please try again.' }, false, 'searchPapers/error');
                }
            },

            setActivePhase: (phase) => set({ activePhase: phase }, false, 'setActivePhase'),
            setSearchQuery: (query) => set({ searchQuery: query }, false, 'setSearchQuery'),

            toggleSource: (source) => {
                const { selectedSources } = get();
                const newSources = selectedSources.includes(source)
                    ? selectedSources.filter((s) => s !== source)
                    : [...selectedSources, source];
                set({ selectedSources: newSources }, false, 'toggleSource');
            },

            updateScreeningCriteria: (criteria) => {
                set({ screeningCriteria: { ...get().screeningCriteria, ...criteria } }, false, 'updateScreeningCriteria');
            },
        }),
        { name: 'ResearchStore' },
    ),
);
