const fs = require('fs');
const key = fs.readFileSync('.env', 'utf8').match(/GOOGLE_PLACES_API_KEY="([^"]+)"/)[1];
fetch('https://places.googleapis.com/v1/places:autocomplete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': key,
    'X-Goog-FieldMask': 'suggestions.placePrediction.text'
  },
  body: JSON.stringify({input: 'Apollo', includedRegionCodes: ['in']})
}).then(r => r.text()).then(console.log);
