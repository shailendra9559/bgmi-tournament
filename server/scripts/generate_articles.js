const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../data/articles');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const categories = ['news', 'guides', 'tips', 'esports', 'redeem-codes', 'weapons'];
const templates = [
    {
        title: "How to Win ${feature} in BGMI 3.0 Update",
        content: "<p>The <strong>BGMI 3.0 update</strong> brings amazing new features including ${feature}. In this guide, we will show you how to master it.</p><h2>Top Strategies</h2><ul><li>Use cover effectively.</li><li>Coordinate with your squad.</li></ul><p>Winning isn't easy, but with this ${feature} guide, you'll be a pro in no time.</p>"
    },
    {
        title: "Top 10 ${weapon} Loadouts for Erangel",
        content: "<p>Erangel is a classic map, and choosing the right <strong>${weapon}</strong> loadout is crucial.</p><h2>Why ${weapon}?</h2><p>It offers great stability and damage.</p><h3>Attachments</h3><ul><li>Compensator</li><li>Vertical Foregrip</li></ul>"
    },
    {
        title: "${event} Released: Get Free Rewards Now",
        content: "<p>Krafton has just announced the <strong>${event}</strong>. Players can earn exclusive skins and rewards.</p><p>Don't miss out on this limited-time event!</p>"
    },
    {
        title: "BGMI Redeem Codes: ${month} ${year} Edition",
        content: "<p>Looking for the latest <strong>redeem codes</strong> for BGMI? You've come to the right place.</p><h2>Active Codes</h2><ul><li>BGMI${r1}</li><li>GET${r2}</li></ul><p>Redeem these on the official website before they expire!</p>"
    },
    {
        title: "Mastering the ${vehicle} in BGMI Esports",
        content: "<p>The <strong>${vehicle}</strong> is a game-changer in competitive play. Learn how professional teams use it to rotate safely.</p>"
    }
];

const variables = {
    feature: ['Shadow Blade', 'Recall Tower', 'Theme Mode', 'Glider', 'Spider-Web'],
    weapon: ['M416', 'AKM', 'UMP45', 'AWM', 'Kar98k'],
    event: ['Galactic Hunt', 'Dragon Ball Super', 'Hardcode Mode', 'Bonus Challenge', 'Diwali Dhamaka'],
    vehicle: ['Uaz', 'Dacia', 'Coupe RB', 'Monster Truck', 'Glider'],
    month: ['October', 'November', 'December', 'January'],
    year: ['2024', '2025']
};

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateArticle(index) {
    const template = getRandom(templates);
    let title = template.title;
    let content = template.content;

    // Replace variables
    for (const [key, values] of Object.entries(variables)) {
        const value = getRandom(values);
        title = title.replace(`\${${key}}`, value);
        content = content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        content = content.replace(`\${r1}`, Math.floor(Math.random() * 9000) + 1000);
        content = content.replace(`\${r2}`, Math.floor(Math.random() * 9000) + 1000);
    }

    // Ensure uniqueness by appending index if needed (though random combos are usually unique enough for this scale)
    // We'll let the DB handle strict uniqueness constraint on slug, but here we just generate contents.

    // SEO Data
    const category = getRandom(categories);
    const seoTitle = `${title} - BGMI Guide`;
    const seoDescription = `Learn everything about ${title}. Best tips, tricks, and guides for Battlegrounds Mobile India.`;

    return {
        title: title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${index}`, // Ensure unique slug
        excerpt: seoDescription,
        content: content,
        category: category,
        tags: ['bgmi', 'gaming', 'esports', category, 'mobile'],
        seoTitle: seoTitle,
        seoDescription: seoDescription,
        seoKeywords: ['bgmi', title.split(' ')[0], 'guide'],
        status: 'published',
        featured: Math.random() < 0.1 // 10% chance
    };
}

console.log(`Generating 100 articles in ${outputDir}...`);

for (let i = 1; i <= 100; i++) {
    const article = generateArticle(i);
    const filePath = path.join(outputDir, `article_${i}.json`);
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
}

console.log('Done! 100 articles generated.');
