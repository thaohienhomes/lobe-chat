#!/usr/bin/env node
/**
 * Linear.app Auto-Setup Script for Phở Chat
 * Creates teams, labels, projects, and issues via GraphQL API
 */

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || 'REDACTED';
const API_URL = 'https://api.linear.app/graphql';

// ============================================================
// GraphQL Helper
// ============================================================
async function gql(query, variables = {}) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': LINEAR_API_KEY,
        },
        body: JSON.stringify({ query, variables }),
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
    return { org: data.organization, existingTeams: data.teams.nodes };
}

// ============================================================
// Step 1: Create Teams
// ============================================================
const TEAMS_TO_CREATE = [
    { name: 'Medical', key: 'MED', description: 'Plugin y khoa, nghiên cứu, drug DB, clinical tools', icon: '🏥', color: '#06b6d4' },
    { name: 'Growth', key: 'GRO', description: 'Payment, pricing, email, landing page, SEO', icon: '💰', color: '#eab308' },
    { name: 'Infra', key: 'INF', description: 'Deploy, monitoring, security, performance', icon: '🛡️', color: '#6b7280' },
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
                    name: team.name,
                    key: team.key,
                    description: team.description,
                    color: team.color,
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
    { name: 'feature', color: '#22c55e' },
    { name: 'bug', color: '#ef4444' },
    { name: 'improvement', color: '#3b82f6' },
    { name: 'research', color: '#a855f7' },
    { name: 'infra', color: '#6b7280' },
    { name: 'urgent', color: '#f97316' },
    { name: 'medical-plugin', color: '#14b8a6' },
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
                        name: label.name,
                        color: label.color,
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
    { name: 'Hardening Sprint', teamKey: 'INF', state: 'completed', description: 'Bug fixes, stability, performance hardening' },
    { name: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', state: 'planned', description: 'PubMed v2, Citation Manager, search results' },
    { name: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', state: 'planned', description: 'ClinicalTrials.gov, OpenAlex, FDA upgrade, PDF processing' },
    { name: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', state: 'planned', description: 'Research assistant preset, evidence summary, auto-detect medical context' },
    { name: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', state: 'planned', description: 'Clinical calculators, research session memory, plugin UX' },
    { name: 'Admin Roadmap Tracker', teamKey: 'PHO', state: 'backlog', description: 'Admin dashboard & roadmap tracking tools' },
    { name: 'Admin Second Brain', teamKey: 'PHO', state: 'backlog', description: 'Knowledge management & second brain features' },
    { name: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', state: 'backlog', description: 'Disease research, variant interpreter, adverse events, rare disease, drug repurposing' },
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
                    name: proj.name,
                    description: proj.description,
                    teamIds: [teamId],
                    state: proj.state,
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
    { title: 'PubMed v2: clickable links, MeSH terms, pagination', project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', priority: 2, labels: ['feature', 'medical-plugin'], estimate: 2 },
    { title: 'Citation Manager plugin (PMID/DOI → APA/BibTeX/Vancouver)', project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', priority: 3, labels: ['feature', 'medical-plugin'], estimate: 3 },
    { title: 'Search results as markdown table', project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', priority: 3, labels: ['improvement'], estimate: 1 },
    { title: '"Export all citations" as .bib file', project: 'Medical Research Sprint 1: Search + Cite', teamKey: 'MED', priority: 4, labels: ['feature'], estimate: 1 },

    // Sprint 2: Read + New DBs
    { title: 'ClinicalTrials.gov plugin (free API, no auth)', project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', priority: 2, labels: ['feature', 'medical-plugin'], estimate: 3 },
    { title: 'OpenAlex plugin (citation count, OA PDF links)', project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', priority: 2, labels: ['feature', 'medical-plugin'], estimate: 2 },
    { title: 'FDA openFDA upgrade (real-time, replace hardcoded 42-drug DB)', project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', priority: 2, labels: ['improvement', 'medical-plugin'], estimate: 3 },
    { title: 'Medical PDF processing (Gemini multimodal, IMRAD chunking)', project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', priority: 3, labels: ['feature', 'research'], estimate: 5 },
    { title: 'Background PDF job + progress indicator', project: 'Medical Research Sprint 2: Read + New DBs', teamKey: 'MED', priority: 3, labels: ['feature'], estimate: 2 },

    // Sprint 3: Extract + Write
    { title: '"Phở Medical Research" assistant preset (GRADE, PICO, IMRAD)', project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', priority: 3, labels: ['feature'], estimate: 2 },
    { title: 'Evidence Summary template (auto-formatted after search)', project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', priority: 3, labels: ['feature'], estimate: 2 },
    { title: 'Auto-detect medical context → suggest plugins', project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', priority: 3, labels: ['improvement'], estimate: 1 },
    { title: 'Vietnamese summary option for medical responses', project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', priority: 3, labels: ['feature'], estimate: 1 },
    { title: 'Legal disclaimer system (footer on every medical response)', project: 'Medical Research Sprint 3: Extract + Write', teamKey: 'MED', priority: 2, labels: ['feature'], estimate: 1 },

    // Sprint 4: Polish + Workspace
    { title: 'Clinical calculators (eGFR, CHA₂DS₂-VASc, MELD-Na, BMI, NNT)', project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', priority: 3, labels: ['improvement', 'medical-plugin'], estimate: 3 },
    { title: 'Research Session Memory (tag, save, bibliography)', project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', priority: 3, labels: ['feature'], estimate: 3 },
    { title: 'Search history for researchers', project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', priority: 4, labels: ['feature'], estimate: 2 },
    { title: 'Plugin response card rendering (paper cards, severity badges)', project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', priority: 3, labels: ['improvement'], estimate: 3 },
    { title: 'Mobile quick-action buttons (PubMed, Drug Check, Calculator)', project: 'Medical Research Sprint 4: Polish + Workspace', teamKey: 'MED', priority: 3, labels: ['improvement'], estimate: 2 },

    // Cross-cutting
    { title: 'Redis caching for PubMed/OpenAlex (1h TTL)', teamKey: 'MED', priority: 3, labels: ['infra'] },
    { title: 'Error handling: fallback OpenAlex when PubMed down', teamKey: 'MED', priority: 3, labels: ['improvement'] },
    { title: 'Drug not found → "Did you mean...?" suggestions', teamKey: 'MED', priority: 4, labels: ['improvement'] },
    { title: 'VN-EN medical terminology mapping', teamKey: 'MED', priority: 4, labels: ['feature'] },

    // Backlog: Future
    { title: 'Weekly email digest', teamKey: 'GRO', priority: 0, labels: ['feature'] },
    { title: 'API key generation UI (/settings/api)', teamKey: 'PHO', priority: 0, labels: ['feature'] },
    { title: 'Public changelog page', teamKey: 'PHO', priority: 0, labels: ['feature'] },
    { title: 'User feedback widget', teamKey: 'PHO', priority: 0, labels: ['feature'] },
    { title: 'Health check dashboard', teamKey: 'INF', priority: 0, labels: ['feature'] },
    { title: 'Cost alert system', teamKey: 'INF', priority: 0, labels: ['feature'] },
    { title: 'Feature flags for beta access', teamKey: 'PHO', priority: 0, labels: ['feature'] },
    { title: 'Referral bonus automation', teamKey: 'GRO', priority: 0, labels: ['feature'] },
    { title: 'SEO: programmatic pages for medical AI topics', teamKey: 'GRO', priority: 0, labels: ['feature'] },
    { title: 'Community forum for medical users', teamKey: 'GRO', priority: 0, labels: ['feature'] },

    // Phase 2: Advanced
    { title: 'Disease Research plugin (DisGeNET + OMIM API)', project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', priority: 3, labels: ['feature', 'medical-plugin', 'research'] },
    { title: 'Variant Interpreter plugin (ClinVar + OncoKB)', project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', priority: 3, labels: ['feature', 'medical-plugin', 'research'] },
    { title: 'Adverse Event Detector plugin (FDA FAERS)', project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', priority: 3, labels: ['feature', 'medical-plugin'] },
    { title: 'Rare Disease Helper plugin (Orphanet + OMIM)', project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', priority: 4, labels: ['feature', 'medical-plugin', 'research'] },
    { title: 'Drug Repurposing plugin (DrugBank + DisGeNET)', project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', priority: 4, labels: ['feature', 'medical-plugin', 'research'] },
    { title: 'Evaluate ToolUniverse MCP integration (Harvard MIMS)', project: 'Advanced Medical Research (Phase 2)', teamKey: 'MED', priority: 4, labels: ['research'] },
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
            console.log(`  ⏩ "${issue.title.substring(0, 50)}..." already exists`);
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
            title: issue.title,
            teamId: teamId,
            priority: issue.priority,
            labelIds: labelIds,
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
            console.log(`  ✅ Created: ${issue.title.substring(0, 60)}`);
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
        } catch (e) {
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
