require('dotenv').config();
const key = process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(r => r.json())
  .then(d => {
    if (d.error) { console.log('Error:', d.error.message); return; }
    const streaming = d.models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes('streamGenerateContent')
    );
    console.log('Models that support streaming:');
    streaming.forEach(m => console.log(' -', m.name));
  })
  .catch(e => console.log('Fetch error:', e.message));
