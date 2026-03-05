#!/usr/bin/env node
/**
 * Linear.app Auto-Setup Script for Phở Chat
 * Creates teams, labels, projects, and issues via GraphQL API
 */

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || '';
const API_URL = 'https://api.linear.app/graphql';

// ============================================================
// GraphQL Helper
// ============================================================
async function gql(query, variables = {}) {
    const res = await fetch(API_URL, {
        body: JSON.stringify({ query, variables }),
        headers: {
            'Authorization': LINEAR_API_KEY,
            'Content-Type': 'application/json',
        },
        method: 'POST',
    });
    const json = await res.json();
    if (json.errors) {
        console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
        throw new Error(json.errors[0].message);
    }
    return json.data;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// Step 0: Verify API key & get workspace info
// ============================================================
async function verifyAndGetInfo() {
    console.log('\n🔑 Verifying API key...');
    const data = await gql(`{
    viewer { id name email }
    organization { id name urlKey }
    teams { nodes { id name key } }
  }`);
    console.log(`✅ Connected as: ${data.viewer.name} (${data.viewer.email})`);
    console.log(`🏢 Workspace: ${data.organization.name} (${data.organization.urlKey})`);
    console.log(`📋 Existing teams: ${data.teams.nodes.map(t => `${t.name} [${t.key}]`).join(', ')}`);
    return { existingTeams: data.teams.nodes, org: data.organization };
}

// ============================================================
// Step 1: Create Teams
// ============================================================
const TEAMS_TO_CREATE = [
    { color: '#06b6d4', description: 'Plugin y khoa, nghiên cứu, drug DB, clinical tools', icon: '🏥', key: 'MED', name: 'Medical' },
    { color: '#eab308', description: 'Payment, pricing, email, landing page, SEO', icon: '💰', key: 'GRO', name: 'Growth' },
    { color: '#6b7280', description: 'Deploy, monitoring, security, performance', icon: '🛡️', key: 'INF', name: 'Infra' },
];

async function createTeams(existingTeams) {
    console.log('\n📦 Creating teams...');
    const teamMap = {};

    // Map existing teams
    for (const t of existingTeams) {
        teamMap[t.key] = t.id;
        console.log(`  ⏩ Team "${t.name}" [${t.key}] already exists`);
    }

    for (const team of TEAMS_TO_CREATE) {
        if (teamMap[team.key]) {
            console.log(`  ⏩ Team "${team.name}" [${team.key}] already exists`);
            continue;
        }
        try {
            const data = await gql(`
        mutation($input: TeamCreateInput!) {
          teamCreate(input: $input) {
            success
            team { id name key }
          }
        }
      `, {
                input: {
                    color: team.color,
                    description: team.description,
                    key: team.key,
                    name: team.name,
                }
            });
            if (data.teamCreate.success) {
                teamMap[team.key] = data.teamCreate.team.id;
                console.log(`  ✅ Created team: ${team.name} [${team.key}]`);
            }
        } catch (e) {
            console.error(`  ❌ Failed to create team ${team.name}: ${e.message}`);
        }
        await sleep(300);
    }

    // Also remap PHO if exists
    for (const t of existingTeams) {
        if (!teamMap[t.key]) teamMap[t.key] = t.id;
    }

    return teamMap;
}

// ============================================================
// Step 2: Create Labels
// ============================================================
const LABELS = [
    { color: '#22c55e', name: 'feature' },
    { color: '#ef4444', name: 'bug' },
    { color: '#3b82f6', name: 'improvement' },
    { color: '#a855f7', name: 'research' },
    { color: '#6b7280', name: 'infra' },
    { color: '#f97316', name: 'urgent' },
    { color: '#14b8a6', name: 'medical-plugin' },
];

async function createLabels(teamMap) {
    console.log('\n🏷️  Creating labels...');

    // Get existing labels
    const data = await gql(`{
    issueLabels(first: 100) { nodes { id name team { id } } }
  }`);
    const existingLabels = data.issueLabels.nodes;

    for (const [teamKey, teamId] of Object.entries(teamMap)) {
        console.log(`  📂 Team ${teamKey}:`);
        for (const label of LABELS) {
            const exists = existingLabels.find(l => l.name === label.name && l.team?.id === teamId);
            if (exists) {
                console.log(`    ⏩ Label "${label.name}" already exists`);
                continue;
            }
            try {
                await gql(`
          mutation($input: IssueLabelCreateInput!) {
            issueLabelCreate(input: $input) {
              success
              issueLabel { id name }
            }
          }
        `, {
                    input: {
                        color: label.color,
                        name: label.name,
                        teamId: teamId,
                    }
                });
                console.log(`    ✅ Created label: ${label.name}`);
            } catch (e) {
                console.error(`    ❌ Failed: ${label.name} — ${e.message}`);
            }
            await sleep(200);
        }
    }
}

// ============================================================
// Step 3: Create Projects
// ============================================================
const PROJECTS = [
    { description: 'Bug fixes, stability, performance hardening', name: 'Hardening Sprint', state: 'completed', teamKey: 'INF' },
    { description: 'PubMed v2, Citation Manager, search results', name: 'Medical Research Sprint 1: Search + Cite', state: 'planned', teamKey: 'MED' },
    { description: 'ClinicalTrials.gov, OpenAlex, FDA upgrade, PDF processing', name: 'Medical Research Sprint 2: Read + New DBs', state: 'planned', teamKey: 'MED' },
    { description: 'Research assistant preset, evidence summary, auto-detect medical context', name: 'Medical Research Sprint 3: Extract + Write', state: 'planned', teamKey: 'MED' },
    { description: 'Clinical calculators, research session memory, plugin UX', name: 'Medical Research Sprint 4: Polish + Workspace', state: 'planned', teamKey: 'MED' },
    { description: 'Admin dashboard & roadmap tracking tools', name: 'Admin Roadmap Tracker', state: 'backlog', teamKey: 'PHO' },
    { description: 'Knowledge management & second brain features', name: 'Admin Second Brain', state: 'backlog', teamKey: 'PHO' },
    { description: 'Disease research, variant interpreter, adverse events, rare disease, drug repurposing', name: 'Advanced Medical Research (Phase 2)', state: 'backlog', teamKey: 'MED' },
];

async function createProjects(teamMap) {
    console.log('\n📁 Creating projects...');
    const projectMap = {};

    // Get existing projects
    const data = await gql(`{
    projects(first: 50) { nodes { id name } }
  }`);
    const existingProjects = data.projects.nodes;

    for (const proj of PROJECTS) {
        const exists = existingProjects.find(p => p.name === proj.name);
        if (exists) {
            projectMap[proj.name] = exists.id;
            console.log(`  ⏩ Project "${proj.name}" already exists`);
            continue;
        }

        const teamId = teamMap[proj.teamKey];
        if (!teamId) {
            console.log(`  ⚠️  No team found for key ${proj.teamKey}, skipping project "${proj.name}"`);
            continue;
        }

        try {
            const result = await gql(`
        mutation($input: ProjectCreateInput!) {
          projectCreate(input: $input) {
            success
            project { id name }
          }
        }
      `, {
                input: {
                    description: proj.description,
                    name: proj.name,
                    state: proj.state,
                    teamIds: [teamId],
                }
            });
            if (result.projectCreate.success) {
                projectMap[proj.name] = result.projectCreate.project.id;
                console.log(`  ✅ Created project: ${proj.name}`);
            }
        } catch (e) {
            console.error(`  ❌ Failed: ${proj.name} — ${e.message}`);
        }
        await sleep(300);
    }
    return projectMap;
}

// ============================================================
// Step 4: Create Issues
// ============================================================

// Priority: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
const ISSUES = [
    // Sprint 1: Search + Cite
    { estimate: 2, labels: ['feature', 'medical-plugin'], priority: 2, project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', title: 'PubMed v2: clickable links, MeSH terms, pagination' },
    { estimate: 3, labels: ['feature', 'medical-plugin'], priority: 3, project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', title: 'Citation Manager plugin (PMID/DOI → APA/BibTeX/Vancouver)' },
    { estimate: 1, labels: ['improvement'], priority: 3, project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', title: 'Search results as markdown table' },
    { estimate: 1, labels: ['feature'], priority: 4, project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', title: '"Export all citations" as .bib file' },

    // Sprint 2: Read + New DBs
    { estimate: 3, labels: ['feature', 'medical-plugin'], priority: 2, project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', title: 'ClinicalTrials.gov plugin (free API, no auth)' },
    { estimate: 2, labels: ['feature', 'medical-plugin'], priority: 2, project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', title: 'OpenAlex plugin (citation count, OA PDF links)' },
    { estimate: 3, labels: ['improvement', 'medical-plugin'], priority: 2, project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', title: 'FDA openFDA upgrade (real-time, replace hardcoded 42-drug DB)' },
    { estimate: 5, labels: ['feature', 'research'], priority: 3, project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', title: 'Medical PDF processing (Gemini multimodal, IMRAD chunking)' },
    { estimate: 2, labels: ['feature'], priority: 3, project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', title: 'Background PDF job + progress indicator' },

    // Sprint 3: Extract + Write
    { estimate: 2, labels: ['feature'], priority: 3, project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', title: '"Phở Medical Research" assistant preset (GRADE, PICO, IMRAD)' },
    { estimate: 2, labels: ['feature'], priority: 3, project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', title: 'Evidence Summary template (auto-formatted after search)' },
    { estimate: 1, labels: ['improvement'], priority: 3, project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', title: 'Auto-detect medical context → suggest plugins' },
    { estimate: 1, labels: ['feature'], priority: 3, project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', title: 'Vietnamese summary option for medical responses' },
    { estimate: 1, labels: ['feature'], priority: 2, project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', title: 'Legal disclaimer system (footer on every medical response)' },

    // Sprint 4: Polish + Workspace
    { estimate: 3, labels: ['improvement', 'medical-plugin'], priority: 3, project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', title: 'Clinical calculators (eGFR, CHA₂DS₂-VASc, MELD-Na, BMI, NNT)' },
    { estimate: 3, labels: ['feature'], priority: 3, project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', title: 'Research Session Memory (tag, save, bibliography)' },
    { estimate: 2, labels: ['feature'], priority: 4, project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', title: 'Search history for researchers' },
    { estimate: 3, labels: ['improvement'], priority: 3, project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', title: 'Plugin response card rendering (paper cards, severity badges)' },
    { estimate: 2, labels: ['improvement'], priority: 3, project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', title: 'Mobile quick-action buttons (PubMed, Drug Check, Calculator)' },

    // Cross-cutting
    { labels: ['infra'], priority: 3, teamKey: 'MED', title: 'Redis caching for PubMed/OpenAlex (1h TTL)' },
    { labels: ['improvement'], priority: 3, teamKey: 'MED', title: 'Error handling: fallback OpenAlex when PubMed down' },
    { labels: ['improvement'], priority: 4, teamKey: 'MED', title: 'Drug not found → "Did you mean...?" suggestions' },
    { labels: ['feature'], priority: 4, teamKey: 'MED', title: 'VN-EN medical terminology mapping' },

    // Backlog: Future
    { labels: ['feature'], priority: 0, teamKey: 'GRO', title: 'Weekly email digest' },
    { labels: ['feature'], priority: 0, teamKey: 'PHO', title: 'API key generation UI (/settings/api)' },
    { labels: ['feature'], priority: 0, teamKey: 'PHO', title: 'Public changelog page' },
    { labels: ['feature'], priority: 0, teamKey: 'PHO', title: 'User feedback widget' },
    { labels: ['feature'], priority: 0, teamKey: 'INF', title: 'Health check dashboard' },
    { labels: ['feature'], priority: 0, teamKey: 'INF', title: 'Cost alert system' },
    { labels: ['feature'], priority: 0, teamKey: 'PHO', title: 'Feature flags for beta access' },
    { labels: ['feature'], priority: 0, teamKey: 'GRO', title: 'Referral bonus automation' },
    { labels: ['feature'], priority: 0, teamKey: 'GRO', title: 'SEO: programmatic pages for medical AI topics' },
    { labels: ['feature'], priority: 0, teamKey: 'GRO', title: 'Community forum for medical users' },

    // Phase 2: Advanced
    { labels: ['feature', 'medical-plugin', 'research'], priority: 3, project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', title: 'Disease Research plugin (DisGeNET + OMIM API)' },
    { labels: ['feature', 'medical-plugin', 'research'], priority: 3, project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', title: 'Variant Interpreter plugin (ClinVar + OncoKB)' },
    { labels: ['feature', 'medical-plugin'], priority: 3, project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', title: 'Adverse Event Detector plugin (FDA FAERS)' },
    { labels: ['feature', 'medical-plugin', 'research'], priority: 4, project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', title: 'Rare Disease Helper plugin (Orphanet + OMIM)' },
    { labels: ['feature', 'medical-plugin', 'research'], priority: 4, project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', title: 'Drug Repurposing plugin (DrugBank + DisGeNET)' },
    { labels: ['research'], priority: 4, project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', title: 'Evaluate ToolUniverse MCP integration (Harvard MIMS)' },
];

async function createIssues(teamMap, projectMap) {
    console.log('\n📝 Creating issues...');

    // Get all label IDs
    const labelData = await gql(`{
    issueLabels(first: 200) { nodes { id name team { id } } }
  }`);
    const allLabels = labelData.issueLabels.nodes;

    // Get existing issues to avoid duplicates
    const existingData = await gql(`{
    issues(first: 100) { nodes { id title } }
  }`);
    const existingTitles = new Set(existingData.issues.nodes.map(i => i.title));

    let created = 0, skipped = 0, failed = 0;

    for (const issue of ISSUES) {
        if (existingTitles.has(issue.title)) {
            console.log(`  ⏩ "${issue.title.slice(0, 50)}..." already exists`);
            skipped++;
            continue;
        }

        const teamId = teamMap[issue.teamKey];
        if (!teamId) {
            console.log(`  ⚠️  No team for ${issue.teamKey}, skipping: "${issue.title}"`);
            failed++;
            continue;
        }

        // Resolve label IDs for this team
        const labelIds = [];
        for (const labelName of (issue.labels || [])) {
            // Try team-specific first, then workspace-level
            const label = allLabels.find(l => l.name === labelName && l.team?.id === teamId)
                || allLabels.find(l => l.name === labelName && !l.team);
            if (label) labelIds.push(label.id);
        }

        const input = {
            labelIds: labelIds,
            priority: issue.priority,
            teamId: teamId,
            title: issue.title,
        };

        if (issue.estimate) input.estimate = issue.estimate;
        if (issue.project && projectMap[issue.project]) {
            input.projectId = projectMap[issue.project];
        }

        try {
            await gql(`
        mutation($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue { id identifier title }
          }
        }
      `, { input });
            console.log(`  ✅ Created: ${issue.title.slice(0, 60)}`);
            created++;
        } catch (e) {
            console.error(`  ❌ Failed: ${issue.title} — ${e.message}`);
            failed++;
        }
        await sleep(250);
    }

    console.log(`\n📊 Issues: ${created} created, ${skipped} skipped, ${failed} failed`);
}

// ============================================================
// Step 5: Setup Cycles
// ============================================================
async function setupCycles(teamMap) {
    console.log('\n🔄 Checking cycles...');
    // Cycles are usually configured through team settings
    // Let's check if any of the teams already have cycles enabled
    for (const [key, id] of Object.entries(teamMap)) {
        try {
            const data = await gql(`{
        team(id: "${id}") {
          id name
          cycles(first: 1) { nodes { id number startsAt endsAt } }
        }
      }`);
            const cycles = data.team.cycles.nodes;
            if (cycles.length > 0) {
                console.log(`  ✅ Team ${key}: Cycles enabled (current: #${cycles[0].number})`);
            } else {
                console.log(`  ⚠️  Team ${key}: No cycles. Enable manually in Linear → Team Settings → Cycles`);
            }
        } catch {
            console.log(`  ⚠️  Team ${key}: Could not check cycles`);
        }
    }
}

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('🍜 Linear.app Auto-Setup for Phở Chat');
    console.log('=====================================\n');

    try {
        // Step 0
        const { org, existingTeams } = await verifyAndGetInfo();

        // Step 1: Create Teams
        const teamMap = await createTeams(existingTeams);

        // Step 2: Create Labels
        await createLabels(teamMap);

        // Step 3: Create Projects
        const projectMap = await createProjects(teamMap);

        // Step 4: Create Issues
        await createIssues(teamMap, projectMap);

        // Step 5: Check Cycles
        await setupCycles(teamMap);

        console.log('\n✨ Setup complete!');
        console.log(`🔗 https://linear.app/${org.urlKey}`);
        console.log('\n📋 Next steps:');
        console.log('  1. Mở Linear để verify toàn bộ data');
        console.log('  2. Enable Cycles cho mỗi team (Settings → Cycles → 2 weeks)');
        console.log('  3. Kết nối GitHub integration (Settings → Integrations → GitHub)');
        console.log('  4. Cân nhắc kết nối Linear MCP server cho AI agent');

    } catch (e) {
        console.error('\n💥 Fatal error:', e.message);
        process.exit(1);
    }
}

main();
