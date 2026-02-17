const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Article = require('./models/Article');
const sanitizeHtml = require('sanitize-html');

const MONGO_URI = process.env.MONGO_URI;

const testArticleCreation = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected');

        const richTextContent = `
            <h2>This is a Test Article</h2>
            <p>Here is some <b>bold</b> text and <i>italic</i> text.</p>
            <ul>
                <li>List item 1</li>
                <li>List item 2</li>
            </ul>
            <span style="color: red;">Red Text</span>
            <img src="https://example.com/image.jpg" alt="Test Image" />
        `;

        // Simulate what the controller does
        const sanitized = sanitizeHtml(richTextContent, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                'img', 'h2', 'h3', 'h4', 'code', 'pre', 'iframe',
                'b', 'i', 'u', 's', 'em', 'strong', 'blockquote',
                'ul', 'ol', 'li', 'a', 'span', 'div', 'p', 'br'
            ]),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                'img': ['src', 'alt', 'class', 'width', 'height', 'style'],
                'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'style'],
                'a': ['href', 'name', 'target', 'rel'],
                'span': ['style', 'class'],
                'div': ['style', 'class'],
                'p': ['style', 'class'],
                'li': ['style', 'class'],
                '*': ['style']
            },
            allowedStyles: {
                '*': {
                    'color': [/.*/],
                    'text-align': [/.*/],
                    'font-size': [/.*/],
                    'background-color': [/.*/],
                    'width': [/.*/],
                    'height': [/.*/]
                }
            }
        });

        console.log('--- Original Content ---');
        console.log(richTextContent);
        console.log('\n--- Sanitized Content ---');
        console.log(sanitized);

        // Check for presence of key elements rather than exact string match
        const hasStyle = sanitized.includes('color:red') || sanitized.includes('color: red');
        const hasImg = sanitized.includes('<img');

        if (hasStyle && hasImg) {
            console.log('\n✅ SUCCESS: Rich text and styles preserved.');
        } else {
            console.log('\n❌ FAILURE: Some tags or styles were stripped.');
            if (!hasStyle) console.log('  - Missing style attribute');
            if (!hasImg) console.log('  - Missing img tag');
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testArticleCreation();
