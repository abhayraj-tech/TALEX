require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
console.log('Key starts with:', key ? key.substring(0, 15) : 'NOT FOUND');

fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key)
  .then(r => r.json())
  .then(d => {
    if (d.error) { console.log('API Error:', d.error.message); return; }
    console.log('Available streaming models:');
    d.models
      .filter(m => m.supportedGenerationMethods?.includes('streamGenerateContent'))
      .forEach(m => console.log(' ', m.name));
  })
  .catch(e => console.log('Network error:', e.message));
