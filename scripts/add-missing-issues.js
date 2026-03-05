const API = 'https://api.linear.app/graphql';
const KEY = 'REDACTED';

async function gql(q, v = {}) {
    const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': KEY },
        body: JSON.stringify({ query: q, variables: v }),
    });
    const j = await r.json();
    if (j.errors) throw new Error(j.errors[0].message);
    return j.data;
}

async function main() {
    const d = await gql('{ teams { nodes { id key } } issueLabels(first: 200) { nodes { id name team { id } } } }');
    const pho = d.teams.nodes.find(t => t.key === 'PHO');
    console.log('PHO team:', pho.id);
    let labels = d.issueLabels.nodes;

    const getLabel = (name) => {
        return (labels.find(x => x.name === name && x.team?.id === pho.id) || labels.find(x => x.name === name))?.id;
    };

    // Create 'growth' label if not exists
    if (!labels.find(l => l.name === 'growth' && l.team?.id === pho.id)) {
        await gql('mutation($i: IssueLabelCreateInput!) { issueLabelCreate(input: $i) { success } }', { i: { name: 'growth', color: '#eab308', teamId: pho.id } });
        console.log('+ label: growth');
        const d2 = await gql('{ issueLabels(first: 200) { nodes { id name team { id } } } }');
        labels = d2.issueLabels.nodes;
    }

    const issues = [
        { title: 'Weekly email digest', labels: ['feature', 'growth'] },
        { title: 'Referral bonus automation', labels: ['feature', 'growth'] },
        { title: 'SEO: programmatic pages for medical AI topics', labels: ['feature', 'growth'] },
        { title: 'Community forum for medical users', labels: ['feature', 'growth'] },
        { title: 'Health check dashboard', labels: ['feature', 'infra'] },
        { title: 'Cost alert system', labels: ['feature', 'infra'] },
    ];

    for (const issue of issues) {
        const labelIds = issue.labels.map(n => getLabel(n)).filter(Boolean);
        const result = await gql(
            'mutation($i: IssueCreateInput!) { issueCreate(input: $i) { success issue { identifier title } } }',
            { i: { title: issue.title, teamId: pho.id, priority: 0, labelIds } }
        );
        console.log('✅ Created:', issue.title);
    }
    console.log('\n🎉 Done! 6 issues added to team Phở Chat (PHO)');
}

main().catch(e => console.error('❌', e.message));
