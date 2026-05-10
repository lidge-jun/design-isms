import { readFileSync, writeFileSync } from 'fs';

const ISMS_PATH = new URL('../assets/data/isms.json', import.meta.url).pathname;

// Global brand recognition score (higher = more famous)
// Only need to list known brands; unlisted defaults to 0
const FAME = {
  'Apple': 100, 'Google': 99, 'Google Store': 95, 'Gmail': 96,
  'Microsoft': 98, 'Stripe': 90, 'Dropbox': 88, 'Slack': 89,
  'Figma': 87, 'Airbnb': 92, 'Spotify': 91, 'Netflix': 93,
  'Nike': 92, 'Adidas': 85, 'Tesla': 90, 'Amazon': 97,
  'YouTube': 96, 'Instagram': 95, 'Twitter': 90, 'X': 90,
  'Facebook': 94, 'Meta': 93, 'WhatsApp': 92, 'TikTok': 91,
  'Uber': 88, 'Lyft': 80, 'Pinterest': 82, 'Reddit': 83,
  'Notion': 84, 'Linear': 75, 'Vercel': 72, 'GitHub': 88,
  'Discord': 85, 'Zoom': 87, 'Twitch': 82, 'Steam': 84,
  'Shopify': 85, 'Squarespace': 78, 'Webflow': 70,
  'Mailchimp': 82, 'Intercom': 75, 'HubSpot': 78,
  'Salesforce': 86, 'Adobe': 88, 'Canva': 80,
  'Duolingo': 82, 'Calm': 75, 'Headspace': 74,
  'Robinhood': 78, 'Coinbase': 77, 'Revolut': 72,
  'Asana': 76, 'Monday.com': 74, 'Trello': 78, 'Jira': 80,
  'Hinge': 70, 'Bumble': 72, 'Tinder': 78,
  'Behance': 72, 'Dribbble': 70, 'Awwwards': 65,
  'Medium': 78, 'Substack': 72, 'WordPress': 82,
  'Everlane': 65, 'Glossier': 68, 'Warby Parker': 70,
  'Away': 60, 'Allbirds': 62, 'Casper': 65,
  'WeTransfer': 70, 'Loom': 68, 'Miro': 72,
  'Zendesk': 76, 'Freshworks': 65,
  'Herman Miller': 70, 'IKEA': 90, 'Muji': 78,
  'Braun': 75, 'Dyson': 80,
  'Porsche': 82, 'BMW': 82, 'Mercedes-Benz': 80,
  'Louis Vuitton': 85, 'Gucci': 84, 'Prada': 80,
  'The New Yorker': 78, 'Vogue': 80, 'GQ': 72,
  'Samsung': 90, 'Sony': 85, 'LG': 80,
  'Nintendo': 85, 'PlayStation': 84, 'Xbox': 83,
  'Razer': 72, 'Corsair': 60,
  'Coca-Cola': 92, 'Starbucks': 88, 'McDonald\'s': 90,
  'LEGO': 85, 'Disney': 92, 'Pixar': 82,
  'NASA': 80, 'SpaceX': 82,
  'Vitra': 55, 'Knoll': 50, 'Artek': 45,
  'Design Within Reach': 48, 'Thonet': 42,
  'MOO': 40, 'Lammhults': 30,
  'Bauhaus Dessau': 55,
  'Gogoro': 35, 'Mila': 20, '2Create': 15,
  'Tala': 25, "Turner's Dairy": 10, '450GSM': 10,
  'Waaark': 20, 'Podia': 35, 'Asphalte': 20,
  'Railsware': 15, 'FireHydrant': 25, 'Pastel': 15,
  'Fontainebleau Miami': 45, 'Hotel Imperial Prague': 30,
  'Hotel Le Doge': 20, 'Cavalier South Beach': 25,
  'Delano Miami': 35, 'The Breakers': 50,
  'Colony Hotel Palm Beach': 30, 'The Edmon': 15,
  'LAFC': 50, 'Edison Hotel NYC': 40,
  'Nécessaire': 30, 'Toteme': 35,
  'Negative Underwear': 15,
  'Dropbox Business': 85,
  'Pentagram': 60, 'IDEO': 55, 'Sagmeister & Walsh': 50,
  'Stefan Sagmeister': 50,
  'Paula Scher': 45, 'Experimental Jetset': 40,
  'Massimo Vignelli': 50,
  'CD Projekt Red': 70, 'Cyberpunk 2077': 75,
  'Naughty Dog': 65, 'AKIRA': 60,
  'SoundCloud': 72, 'Bandcamp': 55,
  'Sanrio': 75, 'Hello Kitty': 80,
  'LINE': 78, 'Kakao': 72,
  'Animal Crossing': 72,
  'Pokémon': 88,
  'Etsy': 80, 'Society6': 55,
  'Patagonia': 75, 'REI': 65,
  'Whole Foods': 72, 'Trader Joe\'s': 70,
  'Anthropologie': 60, 'Urban Outfitters': 65,
  'Depop': 55, 'Poshmark': 50,
  'LUSH': 62, 'The Body Shop': 60,
  'Aesop': 65, 'Glossier': 68,
  'Fenty Beauty': 70, 'Kylie Cosmetics': 65,
  'Grailed': 55, 'StockX': 60,
  'Hypebeast': 58, 'Highsnobiety': 50,
};

const isms = JSON.parse(readFileSync(ISMS_PATH, 'utf8'));

let totalMoved = 0;

isms.forEach(ism => {
  const before = ism.examples.map(e => e.name).join(', ');

  ism.examples.sort((a, b) => {
    const scoreA = FAME[a.name] || 0;
    const scoreB = FAME[b.name] || 0;
    return scoreB - scoreA;
  });

  const after = ism.examples.map(e => e.name).join(', ');
  if (before !== after) {
    totalMoved++;
    console.log(`${ism.name}:`);
    console.log(`  Top 3: ${ism.examples.slice(0,3).map(e => e.name).join(', ')}`);
  }
});

writeFileSync(ISMS_PATH, JSON.stringify(isms, null, 2));
console.log(`\nDone! Reordered examples in ${totalMoved}/${isms.length} ISMs.`);
