import { readFileSync, writeFileSync } from 'fs';

const isms = JSON.parse(readFileSync('assets/data/isms.json', 'utf-8'));

const grokExamples = {
  "minimalism": [
    { name: "Apple", url: "https://www.apple.com" },
    { name: "Away", url: "https://www.awaytravel.com" },
    { name: "Everlane", url: "https://www.everlane.com" },
    { name: "Nécessaire", url: "https://necessaire.com" },
    { name: "Toteme", url: "https://toteme.com" },
    { name: "Stripe", url: "https://stripe.com" },
    { name: "Linear", url: "https://linear.app" },
    { name: "Calm", url: "https://www.calm.com" },
    { name: "Dropbox", url: "https://www.dropbox.com" },
    { name: "Negative Underwear", url: "https://negativeunderwear.com" }
  ],
  "brutalism": [
    { name: "Studio Brot", url: "https://www.studiobrot.de/" },
    { name: "Hot Buro", url: "https://www.hotburo.com/" },
    { name: "Ezekiel Aquino", url: "https://ezekielaquino.com/" },
    { name: "Secession", url: "https://secession.at/" },
    { name: "MrBeast", url: "https://mrbeast.basement.studio/" },
    { name: "Chrissie Abbott", url: "https://chrissieabbott.com/" },
    { name: "CHRLS.DSGN", url: "https://www.chrls.design/" },
    { name: "Studio Job", url: "https://www.studio-job.com/" },
    { name: "Bloomberg", url: "https://www.bloomberg.com" },
    { name: "Craigslist", url: "https://www.craigslist.org" }
  ],
  "neumorphism": [
    { name: "Flow Ninja", url: "https://www.flow.ninja/" },
    { name: "Productside", url: "https://productside.com/" },
    { name: "N26", url: "https://n26.com/" },
    { name: "Huly", url: "https://huly.io/" },
    { name: "Cleanmeter", url: "https://www.cleanmeter.app/" },
    { name: "Sony", url: "https://www.sony.com" },
    { name: "Nike", url: "https://www.nike.com" },
    { name: "Reddit", url: "https://www.reddit.com" },
    { name: "Apple", url: "https://www.apple.com" },
    { name: "Stripe", url: "https://stripe.com" }
  ],
  "glassmorphism": [
    { name: "Raycast", url: "https://www.raycast.com/" },
    { name: "Reflect", url: "https://reflect.app/" },
    { name: "Tomorrow.io", url: "https://www.tomorrow.io/" },
    { name: "Framer", url: "https://www.framer.com/" },
    { name: "Linear", url: "https://linear.app" },
    { name: "Robinhood", url: "https://robinhood.com" },
    { name: "Vercel", url: "https://vercel.com/" },
    { name: "Stripe", url: "https://stripe.com" },
    { name: "Huly", url: "https://huly.io/" },
    { name: "Lightrun", url: "https://lightrun.com/" }
  ],
  "skeuomorphism": [
    { name: "Burger King", url: "https://www.bk.com/" },
    { name: "PostHog", url: "https://posthog.com/" },
    { name: "ChainZoku", url: "https://chainzoku.io/" },
    { name: "Sony", url: "https://www.sony.com" },
    { name: "Nike", url: "https://www.nike.com" },
    { name: "Apple", url: "https://www.apple.com" },
    { name: "MrBeast", url: "https://mrbeast.basement.studio/" },
    { name: "Away", url: "https://www.awaytravel.com" },
    { name: "Negative Underwear", url: "https://negativeunderwear.com" },
    { name: "Sergio Diaz", url: "https://www.sergiodiazschiaffino.com/" }
  ],
  "flat-design": [
    { name: "Stripe", url: "https://stripe.com" },
    { name: "Gogoro", url: "https://www.gogoro.com/" },
    { name: "Mila", url: "https://www.mila.direct/" },
    { name: "2Create", url: "https://2create.io/" },
    { name: "Tala", url: "https://www.gettala.com/" },
    { name: "Dropbox", url: "https://www.dropbox.com" },
    { name: "Mailchimp", url: "https://mailchimp.com" },
    { name: "Intercom", url: "https://www.intercom.com" },
    { name: "Figma", url: "https://www.figma.com" },
    { name: "Slack", url: "https://slack.com" }
  ],
  "material-design": [
    { name: "Google Store", url: "https://store.google.com" },
    { name: "Dropbox Business", url: "https://www.dropbox.com/business/" },
    { name: "Waaark", url: "https://waaark.com/" },
    { name: "Podia", url: "https://www.podia.com/" },
    { name: "Shopify", url: "https://www.shopify.com" },
    { name: "Asphalte", url: "https://www.asphalte.com/" },
    { name: "Railsware", url: "https://railsware.com" },
    { name: "FireHydrant", url: "https://firehydrant.io" },
    { name: "Pastel", url: "https://usepastel.com" },
    { name: "Gmail", url: "https://mail.google.com" }
  ],
  "swiss-style": [
    { name: "Apple", url: "https://www.apple.com" },
    { name: "Medium", url: "https://medium.com" },
    { name: "IKEA", url: "https://www.ikea.com" },
    { name: "Microsoft", url: "https://www.microsoft.com" },
    { name: "IBM", url: "https://www.ibm.com" },
    { name: "Zuerich", url: "https://www.zuerich.com" },
    { name: "Notion", url: "https://www.notion.so" },
    { name: "Figma", url: "https://www.figma.com" },
    { name: "Linear", url: "https://linear.app" },
    { name: "Frontify", url: "https://www.frontify.com" }
  ],
  "art-deco": [
    { name: "Fontainebleau Miami", url: "https://www.fontainebleau.com/" },
    { name: "Hotel Imperial Prague", url: "https://www.hotel-imperial.cz/" },
    { name: "Hotel Le Doge", url: "https://www.hotelledoge.com/" },
    { name: "Cavalier South Beach", url: "https://cavaliersouthbeach.com/" },
    { name: "Delano Miami", url: "https://www.delano-miami.com/" },
    { name: "The Breakers", url: "https://www.thebreakers.com/" },
    { name: "Colony Hotel Palm Beach", url: "https://www.thecolonypalmbeach.com/" },
    { name: "The Edmon", url: "https://www.theedmon.com" },
    { name: "LAFC", url: "https://www.lafc.com" },
    { name: "Edison Hotel NYC", url: "https://www.edisonhotelnyc.com" }
  ],
  "bauhaus": [
    { name: "Vitra", url: "https://www.vitra.com/" },
    { name: "Knoll", url: "https://www.knoll.com/" },
    { name: "Herman Miller", url: "https://www.hermanmiller.com/" },
    { name: "MOO", url: "https://www.moo.com/" },
    { name: "Design Within Reach", url: "https://www.dwr.com/" },
    { name: "Thonet", url: "https://www.thonet.de/" },
    { name: "Artek", url: "https://www.artek.fi/" },
    { name: "Braun", url: "https://www.braun.com" },
    { name: "Bauhaus Dessau", url: "https://www.bauhaus-dessau.de" },
    { name: "Lammhults", url: "https://www.lammhults.se/" }
  ],
  "memphis-design": [
    { name: "MoneyFarm", url: "https://moneyfarm.com/" },
    { name: "The Trainline", url: "https://thetrainline.com/" },
    { name: "GetEddie", url: "https://geteddie.co.uk/" },
    { name: "Slack", url: "https://slack.com/" },
    { name: "Salesforce", url: "https://salesforce.com/" },
    { name: "Robinhood", url: "https://robinhood.com/" },
    { name: "WeTransfer", url: "https://wetransfer.com/" },
    { name: "Google Fi", url: "https://fi.google.com/" },
    { name: "Kroger", url: "https://www.kroger.com/" },
    { name: "Duolingo", url: "https://www.duolingo.com/" }
  ],
  "vaporwave": [
    { name: "Vapor95", url: "https://vapor95.com/" },
    { name: "Catori Clothing", url: "https://catoriclothing.com" },
    { name: "Palm Treat", url: "https://palmtreat.design/" },
    { name: "Public Space", url: "https://www.publicspace.xyz/" },
    { name: "POPKILLER", url: "https://www.popkiller.us" },
    { name: "Ishihara Design", url: "https://ishiharadesign.com/" },
    { name: "In Control Clothing", url: "https://www.incontrolclothing.com/" },
    { name: "Staycool", url: "https://www.staycoolnyc.com/" },
    { name: "Pink Dolphin", url: "https://www.pinkdolphinonline.com/" },
    { name: "Neon Talk", url: "https://neontalk.com/" }
  ],
  "y2k": [
    { name: "Ryan Haskins", url: "https://www.ryanhaskins.com/" },
    { name: "Nasir Studio", url: "https://www.nasir.studio/" },
    { name: "Brendon Nguyen", url: "https://www.brendonnguyen.net/" },
    { name: "Spacehey", url: "https://spacehey.com/" },
    { name: "Olivia Rodrigo", url: "https://www.oliviarodrigo.com/" },
    { name: "Boys Club", url: "https://boysclub.vip/" },
    { name: "Byline", url: "https://www.bylinebyline.com/" },
    { name: "Pasha Ink", url: "https://pashaink.com/" },
    { name: "Griffo House", url: "https://www.griffo.house/" },
    { name: "Byooooob", url: "https://www.byooooob.com/" }
  ],
  "retro-vintage": [
    { name: "Caava Design", url: "https://caavadesign.com/" },
    { name: "Poolsuite", url: "https://poolsuite.net/" },
    { name: "Basement Studio", url: "https://basement.studio/" },
    { name: "Harvard Film Archive", url: "https://harvardfilmarchive.org/" },
    { name: "Sugarfire Pie", url: "https://sugarfirepie.com/" },
    { name: "Abel's on Queen", url: "https://www.abelsonqueen.com/" },
    { name: "Resp", url: "https://resp.tv/" },
    { name: "We Luv Video", url: "https://www.weluvvideo.org/" },
    { name: "Boogie Lover Band", url: "https://boogieloverband.com/" },
    { name: "Virtual Gas Museum", url: "https://wmgaz.pl/" }
  ],
  "dark-mode": [
    { name: "Spotify", url: "https://open.spotify.com/" },
    { name: "Discord", url: "https://discord.com/" },
    { name: "Netflix", url: "https://www.netflix.com/" },
    { name: "GitHub", url: "https://github.com/" },
    { name: "Linear", url: "https://linear.app/" },
    { name: "Steam", url: "https://store.steampowered.com/" },
    { name: "Qase", url: "https://qase.io/" },
    { name: "Cosmos Studio", url: "https://www.cosmos.studio/" },
    { name: "Teletech", url: "https://teletech.com/" },
    { name: "Isabel Moranta", url: "https://isabelmoranta.com/" }
  ],
  "organic-design": [
    { name: "Bloom & Wild", url: "https://bloomandwild.com" },
    { name: "Bouqs Company", url: "https://bouqs.com" },
    { name: "Headspace", url: "https://headspace.com" },
    { name: "Package Free Shop", url: "https://packagefreeshop.com" },
    { name: "Made Goods", url: "https://madegoods.com" },
    { name: "David Trubridge", url: "https://davidtrubridge.com" },
    { name: "FTD", url: "https://ftd.com" },
    { name: "Mind the Gap", url: "https://mindthegap.com" },
    { name: "Silphium Design", url: "https://silphiumdesign.com" },
    { name: "Strawbridge Pools", url: "https://strawbridgepools.com" }
  ],
  "cyberpunk": [
    { name: "Cyberpunk 2077", url: "https://www.cyberpunk.net" },
    { name: "N-O-D-E", url: "https://n-o-d-e.net" },
    { name: "Neon Dystopia", url: "https://neondystopia.com" },
    { name: "PWNK Digital", url: "https://pwnkdigital.com" },
    { name: "Blast Galaxy", url: "https://blastgalaxy.nl" },
    { name: "Box Bay", url: "https://box-bay.com" },
    { name: "Zach.dev", url: "https://zach.dev" },
    { name: "The Geek Designer", url: "https://thegeekdesigner.com" },
    { name: "Quentin.xyz", url: "https://quentin.xyz" },
    { name: "Sarmat", url: "https://sarmat.com" }
  ],
  "maximalism": [
    { name: "Ellen Porteus", url: "https://www.ellenporteus.com" },
    { name: "Choreus", url: "https://choreus.co" },
    { name: "Pest Stop Boys", url: "https://peststopboys.co.uk" },
    { name: "Slosh Seltzer", url: "https://sloshseltzer.com" },
    { name: "Glitché", url: "https://glitche.com" },
    { name: "PIN-UP Magazine", url: "https://pinupmagazine.org" },
    { name: "DIKO", url: "https://www.diko.co" },
    { name: "Dopple Press", url: "https://dopplepress.com" },
    { name: "Laurenz Marsau", url: "https://laurenzmarsau.com" },
    { name: "Hattie Stewart", url: "https://hattiestewart.com" }
  ],
  "japandi": [
    { name: "Nkuku", url: "https://www.nkuku.com" },
    { name: "Wearth London", url: "https://www.wearthlondon.com" },
    { name: "MUJI", url: "https://muji.com" },
    { name: "Rikumo", url: "https://rikumo.com" },
    { name: "Tortoise General Store", url: "https://tortoisegeneralstore.com" },
    { name: "Nalata Nalata", url: "https://shop.nalatanalata.com" },
    { name: "Kave Home", url: "https://kavehome.com" },
    { name: "Kinfolk", url: "https://www.kinfolk.com" },
    { name: "Cereal Magazine", url: "https://www.readcereal.com" },
    { name: "Form Shop", url: "https://form-shop.com" }
  ],
  "kawaii": [
    { name: "Sanrio", url: "https://www.sanrio.com" },
    { name: "Korekawaii", url: "https://korekawaii.com" },
    { name: "Kawaii Babe", url: "https://kawaiibabe.com" },
    { name: "The Kawaii Shoppu", url: "https://thekawaiishoppu.com" },
    { name: "Subtle Asian Treats", url: "https://subtleasiantreats.com" },
    { name: "Tattly", url: "https://tattly.com" },
    { name: "Moth Chicago", url: "https://mothchicago.com" },
    { name: "Mjölk", url: "https://www.mjolk.ca" },
    { name: "Bruna Zolet", url: "https://brunazolet.com" },
    { name: "LINE Friends", url: "https://www.linefriends.com" }
  ],
  "corporate-memphis": [
    { name: "Slack", url: "https://slack.com" },
    { name: "WeTransfer", url: "https://wetransfer.com" },
    { name: "Robinhood", url: "https://robinhood.com" },
    { name: "Salesforce", url: "https://salesforce.com" },
    { name: "Airbnb", url: "https://airbnb.com" },
    { name: "Asana", url: "https://asana.com" },
    { name: "Zendesk", url: "https://zendesk.com" },
    { name: "Lyft", url: "https://lyft.com" },
    { name: "Duolingo", url: "https://duolingo.com" },
    { name: "Hinge", url: "https://hinge.co" }
  ],
  "gradient-aurora": [
    { name: "Stripe", url: "https://stripe.com" },
    { name: "Vercel", url: "https://vercel.com" },
    { name: "Linear", url: "https://linear.app" },
    { name: "Reflect", url: "https://reflect.app" },
    { name: "Onima", url: "https://www.onima.bio" },
    { name: "Wope", url: "https://wope.com" },
    { name: "Evmos", url: "https://evmos.org" },
    { name: "Apple", url: "https://apple.com" },
    { name: "Spotify", url: "https://spotify.com" },
    { name: "Cohere", url: "https://cohere.com" }
  ],
  "claymorphism": [
    { name: "Pitch", url: "https://pitch.com" },
    { name: "Toggl", url: "https://toggl.com" },
    { name: "Send Potion", url: "https://www.sendpotion.com" },
    { name: "Bison Studio", url: "https://bison.studio" },
    { name: "Thibaud Allie", url: "https://www.thibaudallie.com" },
    { name: "Mouthwash", url: "https://mouthwash.co" },
    { name: "Van Holtz Co", url: "https://vanholtz.co" },
    { name: "Jon Way Studio", url: "https://www.jonway.studio" },
    { name: "Corentin Bernadou", url: "https://www.corentinbernadou.co" },
    { name: "Spline", url: "https://spline.design" }
  ],
  "neo-brutalism": [
    { name: "Gumroad", url: "https://gumroad.com" },
    { name: "Roze Bunker", url: "https://rozebunker.nl" },
    { name: "Problem Studio", url: "https://problem.studio" },
    { name: "Curry Cafe", url: "https://curry.cafe" },
    { name: "Ilya Money", url: "https://ilya.money" },
    { name: "American Millennial", url: "http://americanmillenni.al" },
    { name: "Arrc", url: "http://arrc.site" },
    { name: "Effecava", url: "http://effecava.xyz" },
    { name: "Figma Community", url: "https://www.figma.com/community" },
    { name: "Zavidova", url: "http://zavidova.com" }
  ],
  "kinetic-typography": [
    { name: "Thibaud Allie", url: "https://www.thibaudallie.com" },
    { name: "Diego Funken", url: "http://diegofunken.com" },
    { name: "Mouthwash", url: "https://mouthwash.co" },
    { name: "Sam Phlix", url: "https://sam-phlix.com" },
    { name: "Editorial New", url: "https://editorialnew.com" },
    { name: "BASIC Moves", url: "https://moves.basicagency.com" },
    { name: "100 Days of Poetry", url: "https://100daysofpoetry.gallery" },
    { name: "Locomotive", url: "https://locomotive.ca" },
    { name: "Van Holtz Co", url: "https://vanholtz.co" },
    { name: "Jon Way Studio", url: "https://www.jonway.studio" }
  ],
  "frutiger-aero": [
    { name: "Skeuoss", url: "https://skeuoss.net" },
    { name: "Apple", url: "https://www.apple.com" },
    { name: "Frutiger Aero Archive", url: "https://frutigeraeroarchive.org" },
    { name: "Lurk", url: "https://lurk.me" },
    { name: "Frutiger Aero Org", url: "https://frutigeraero.org" },
    { name: "Perfect Hue", url: "https://www.perfecthue.co" },
    { name: "Frutiger Aero Neocities", url: "https://frutiger-aero.neocities.org" },
    { name: "Aero Website", url: "https://aerowebsite.neocities.org" },
    { name: "Frutiger Aero Fans", url: "https://frutigeraero-fans.pi.fyi" },
    { name: "Frutiger Aero Community", url: "https://frutigeraero.neocities.org" }
  ],
  "bento-grid": [
    { name: "Apple", url: "https://www.apple.com" },
    { name: "Vercel", url: "https://vercel.com" },
    { name: "Next.js", url: "https://nextjs.org" },
    { name: "Notion", url: "https://notion.so" },
    { name: "DJI", url: "https://www.dji.com" },
    { name: "Linear", url: "https://linear.app" },
    { name: "Supabase", url: "https://supabase.com" },
    { name: "Framer", url: "https://framer.com" },
    { name: "Stripe", url: "https://stripe.com" },
    { name: "Walmart", url: "https://www.walmart.com" }
  ],
  "dopamine-design": [
    { name: "Lush", url: "https://www.lush.com" },
    { name: "Headspace", url: "https://www.headspace.com" },
    { name: "Starface", url: "https://starface.world" },
    { name: "Graza", url: "https://graza.co" },
    { name: "Duolingo", url: "https://www.duolingo.com" },
    { name: "Urban Outfitters", url: "https://www.urbanoutfitters.com" },
    { name: "Adult Swim", url: "https://www.adultswim.com" },
    { name: "Superthing Coffee", url: "https://superthingcoffee.com" },
    { name: "Tiny Tracks", url: "https://tinytracks.app" },
    { name: "Mango Marketing", url: "https://mangomarketingco.com" }
  ],
  "anti-design": [
    { name: "Kitchen 154", url: "https://kitchen154.com" },
    { name: "Visual Matter", url: "https://visualmatter.co.uk" },
    { name: "Spicato", url: "https://spicato.com" },
    { name: "Scrib3", url: "https://scrib3.co" },
    { name: "Terradactyl", url: "https://terradactyl.xyz" },
    { name: "Be The Buzz", url: "https://bethebuzz.co" },
    { name: "David Rudnick", url: "https://davidrudnick.com" },
    { name: "Experimental Jetset", url: "https://www.experimentaljetset.nl" },
    { name: "Adult Swim", url: "https://www.adultswim.com" },
    { name: "Urban Outfitters", url: "https://www.urbanoutfitters.com" }
  ],
  "psychedelic": [
    { name: "Falling Falling", url: "https://fallingfalling.com" },
    { name: "Zoom Quilt", url: "https://zoomquilt.org" },
    { name: "Audiograph", url: "https://audiograph.xyz" },
    { name: "Cache Monet", url: "https://cachemonet.com" },
    { name: "Trippy", url: "https://trippy.me" },
    { name: "Stone Techno", url: "https://www.stone-techno.com" },
    { name: "Threyda", url: "https://www.threyda.com" },
    { name: "Balenciaga", url: "https://www.balenciaga.com" },
    { name: "Bleach London", url: "https://bleachlondon.co.uk" },
    { name: "Coachella", url: "https://www.coachella.com" }
  ],
  "cottagecore": [
    { name: "Adored Vintage", url: "https://www.adoredvintage.com/" },
    { name: "LoveShackFancy", url: "https://www.loveshackfancy.com/" },
    { name: "Selkie Collection", url: "https://selkiecollection.com/" },
    { name: "Hill House Home", url: "https://hillhousehome.com/" },
    { name: "Moon and Cottage", url: "https://moonandcottage.com/" },
    { name: "LaceMade", url: "https://lacemade.com/" },
    { name: "Jessakae", url: "https://jessakae.com/" },
    { name: "Hopeless Romantic", url: "https://hopelessromantictrading.com/" },
    { name: "Atelette", url: "https://www.atelette.com/" },
    { name: "A Cottage in the City", url: "https://www.acottageinthecity.com/" }
  ],
  "steampunk": [
    { name: "Arthrobots", url: "https://arthrobots.com/" },
    { name: "Abney Park", url: "https://abneypark.com/" },
    { name: "Keith Thompson Art", url: "https://keiththompsonart.com/" },
    { name: "Steampunk Explorer", url: "https://steampunk-explorer.com/" },
    { name: "3232 Design", url: "https://3232design.com/" },
    { name: "Key City Steampunk", url: "https://keycitysteampunk.com/" },
    { name: "Airovale", url: "https://airovale.com/" },
    { name: "Steam Trek", url: "https://steam-trek.com/" },
    { name: "Chicago Steampunk", url: "https://chicagosteampunkexpo.com/" },
    { name: "Steampunk Store", url: "https://steampunkstore.fr/" }
  ],
  "solarpunk": [
    { name: "Slrpnk", url: "https://slrpnk.net/" },
    { name: "Solar Low Tech Magazine", url: "https://solar.lowtechmagazine.com/" },
    { name: "Compost Party", url: "https://compost.party/" },
    { name: "Solarpunk Cities", url: "https://solarpunkcities.com/" },
    { name: "Earthaven Ecovillage", url: "https://earthaven.org/" },
    { name: "Appropedia", url: "https://www.appropedia.org/" },
    { name: "Dark Matter Labs", url: "https://provocations.darkmatterlabs.org/" },
    { name: "WeeCasa Tiny Homes", url: "https://weecasa.com/" },
    { name: "Community First Village", url: "https://communityfirstvillage.org/" },
    { name: "Inhabitat", url: "https://inhabitat.com" }
  ],
  "futurism": [
    { name: "Lusion", url: "https://lusion.co/" },
    { name: "The Digital Panda", url: "https://thedigitalpanda.com/" },
    { name: "Martin Ehrlich", url: "https://martinehrlich.com/" },
    { name: "Genesis", url: "https://genesis.com/" },
    { name: "Dotto Dot", url: "https://dottodot.es/" },
    { name: "Loaf Agency", url: "https://loaf.agency/" },
    { name: "iLab Solutions", url: "https://ilabsolutions.it/" },
    { name: "Asmobius", url: "https://asmobius.co.jp/" },
    { name: "Kriss Real Estate", url: "https://krissrealestate.com/" },
    { name: "Downtown Philly", url: "https://downtown-philly.com/" }
  ],
  "indie-web": [
    { name: "Aaron Parecki", url: "https://aaronparecki.com/" },
    { name: "Lynn and Tonic", url: "https://lynnandtonic.com/" },
    { name: "Ciechanowski", url: "https://ciechanow.ski/" },
    { name: "SJ Land", url: "https://sj.land/" },
    { name: "Pastel Hello", url: "https://pastelhello.com/" },
    { name: "Baguete", url: "https://baguete.es/" },
    { name: "Pomelo", url: "https://pomelo.lol/" },
    { name: "IndieWeb.org", url: "https://indieweb.org" },
    { name: "Neocities", url: "https://neocities.org" },
    { name: "Jeya Austen", url: "https://jeyausten.com/" }
  ]
};

const histories = {
  "minimalism": "1960년대 미술 운동에서 출발, Donald Judd·Frank Stella 등이 주도. 웹에서는 2010년대 Apple과 Google의 영향으로 주류가 됨. 스큐어모피즘의 반작용으로 부상했으며, Dieter Rams의 'Less, but better' 철학이 핵심.",
  "brutalism": "1950년대 건축 운동(Le Corbusier)에서 이름을 따옴. 웹 브루탈리즘은 2014년경 Pascal Deville의 brutalistwebsites.com에서 본격 시작. Bloomberg 2017 리디자인이 상업적 채택의 전환점.",
  "neumorphism": "2019년 Dribbble에서 Alexander Plyuto의 컨셉으로 폭발적 인기. 스큐어모피즘과 플랫 디자인의 혼합. 접근성 문제(낮은 대비)로 전체 UI보다 부분 적용이 많음.",
  "glassmorphism": "2020년 Apple이 macOS Big Sur에서 본격 도입. Microsoft의 Fluent Design System(Acrylic 소재)도 영향. backdrop-filter CSS 지원 확대와 함께 2021-2022년 트렌드로 정착.",
  "skeuomorphism": "2007-2013년 Apple iOS 1-6의 지배적 디자인 언어. Scott Forstall이 주도. 2013년 Jony Ive 체제에서 iOS 7 플랫 전환으로 퇴조. 2020년대 부분적 부활(뉴모피즘 등).",
  "flat-design": "2012년 Microsoft의 Metro UI(Windows 8)가 시초. 2013년 Apple iOS 7이 뒤따르며 글로벌 표준으로. Flat 2.0(미묘한 그림자·그라디언트 허용)으로 진화. Material Design이 이 흐름의 구조화된 버전.",
  "material-design": "2014년 Google I/O에서 발표. Matías Duarte가 설계. 물리적 '종이와 잉크' 메타포에 기반한 체계적 디자인 시스템. 2018년 Material Theming, 2021년 Material You(Material 3)로 진화.",
  "swiss-style": "1950년대 스위스 바젤·취리히에서 시작. Josef Müller-Brockmann, Armin Hofmann이 대표. Helvetica 탄생(1957)과 함께 성장. 그리드 시스템과 객관적 타이포그래피의 원조로, 현대 UI 디자인의 근간.",
  "art-deco": "1920-30년대 파리 만국박람회(1925)에서 정점. Chrysler Building, Empire State Building이 상징. 기하학적 패턴, 대칭, 금·크롬 소재. 웹에서는 럭셔리 호텔·패션 브랜드가 주로 차용.",
  "bauhaus": "1919년 Walter Gropius가 독일 바이마르에 설립한 학교. Kandinsky, Klee, Moholy-Nagy가 교수진. 1933년 나치에 의해 폐교. '형태는 기능을 따른다'는 원칙이 현대 디자인의 DNA가 됨.",
  "memphis-design": "1981년 이탈리아 밀라노에서 Ettore Sottsass가 결성한 Memphis Group. Bob Dylan의 'Stuck Inside of Mobile with the Memphis Blues Again'에서 이름 따옴. 포스트모더니즘 디자인의 아이콘. 2010년대 웹·패션에서 부활.",
  "vaporwave": "2010년 전후 인터넷 음악 장르로 시작. Macintosh Plus 'Floral Shoppe'(2011)가 시각적 정체성 확립. 80-90년대 일본 시티팝, 초기 컴퓨터 그래픽, 소비주의 아이러니의 혼합. Tumblr 미학의 핵심.",
  "y2k": "1997-2004년의 디자인 시대. 밀레니엄 낙관주의, 초기 인터넷, iMac G3의 반투명 플라스틱이 시각 언어를 형성. 2020년대 Gen Z 사이에서 강력한 리바이벌 — TikTok과 패션에서 재유행.",
  "retro-vintage": "특정 시대가 아닌 '과거 향수'를 재현하는 범시대적 접근. 1950-70년대 광고 디자인, 활판인쇄 질감, 핸드레터링에서 주로 차용. Letterpress, 그레인 텍스처, 세피아 톤이 핵심 기법.",
  "dark-mode": "2019년 iOS 13·Android 10의 시스템 다크 모드 지원으로 대중화. OLED 배터리 절약 + 눈 부담 감소가 기술적 동기. Twitter(2016)가 웹 앱 선구자. 2020년대에는 기본 옵션으로 자리잡음.",
  "organic-design": "1940년대 Charles & Ray Eames의 유기적 가구에서 시작. 자연의 곡선을 디지털에 적용. 2018-2020년 blob 형태·어스 톤 트렌드로 웹에서 부활. Headspace·Dropbox 리브랜딩이 대표적 채택 사례.",
  "cyberpunk": "1980년대 SF 소설(William Gibson 'Neuromancer', 1984)에서 출발. Blade Runner(1982)가 시각적 원형. '하이테크, 로우라이프' — 네온·도시·어둠의 삼위일체. 2020년 Cyberpunk 2077이 게임 UI 트렌드를 견인.",
  "maximalism": "미니멀리즘에 대한 반작용으로 반복 등장. Gucci(Alessandro Michele 시대, 2015-2022)가 패션에서 재정의. 웹에서는 스크롤 애니메이션·멀티미디어 실험의 도구. '더 많이, 더 대담하게'가 원칙.",
  "japandi": "2019-2020년 인테리어 트렌드로 부상. 일본 와비사비(불완전함의 아름다움) + 스칸디나비아 휘게(아늑함)의 융합. 자연 소재, 뮤트 팔레트, 절제된 장식. Kinfolk·Cereal Magazine이 디지털 표현의 선구자.",
  "kawaii": "1970년대 일본 산리오(Hello Kitty, 1974)에서 시작된 '귀여움' 문화. 하라주쿠 패션, 파스텔 팔레트, 둥근 캐릭터가 핵심. 웹에서는 LINE, 카카오 등 아시아 메신저 플랫폼이 글로벌 확산을 주도.",
  "corporate-memphis": "2017-2019년 실리콘밸리 테크 기업들의 마케팅에서 표준화. Alice Lee(Slack 일러스트), Buck Design이 스타일 정립. 비례가 과장된 인물·따뜻한 톤. 2022년부터 '너무 획일적'이라는 백래시 시작.",
  "gradient-aurora": "2017년 Stripe가 움직이는 메시 그라디언트로 트렌드를 시작. iOS 14-16 월페이퍼, macOS 배경이 대중화를 견인. WebGL·CSS 그라디언트 기술 발전과 함께 2020년대 SaaS 브랜딩의 표준 배경으로 정착.",
  "claymorphism": "2021년 Michal Malewicz가 명명. Blender·Spline 같은 3D 도구의 대중화로 확산. Nintendo Switch UI, Headspace 3D 캐릭터가 영감. 뉴모피즘의 3D 확장판으로 볼 수 있음.",
  "neo-brutalism": "2020년 Gumroad 리디자인에서 트렌드 시작. Brutalism + 비비드 컬러 + 하드 그림자의 조합. Notion, Figma Community에서도 채택. 기존 브루탈리즘보다 접근 가능하고 밝은 톤. 인디 개발자·크리에이터 도구 사이에서 인기.",
  "kinetic-typography": "1959년 Alfred Hitchcock 'North by Northwest' 타이틀 시퀀스가 원조. 웹에서는 2018-2020년 Locomotive Scroll·GSAP 라이브러리 발전으로 폭발적 성장. 포트폴리오·에이전시 사이트의 핵심 차별화 요소.",
  "frutiger-aero": "2006-2013년 Windows Vista/7, iOS 1-6 시대의 지배적 디자인 언어. Adrian Frutiger의 Segoe UI/Frutiger 서체 + 에어로 유리 효과. 자연(물방울·하늘·잎)과 기술의 낙관적 융합. 2023년부터 Z세대 주도의 강력한 리바이벌.",
  "bento-grid": "2023년 Apple WWDC에서 대중화. 일본 도시락 상자(弁当)에서 착안한 모듈형 레이아웃. Vercel, Linear 등 SaaS가 즉시 채택. CSS Grid/Flexbox 기술 발전이 구현을 가능하게 함. 2024-2025년 가장 핫한 레이아웃 패턴.",
  "dopamine-design": "2022-2023년 Gen Z 타겟 브랜드에서 등장. '도파민 드레싱' 패션 트렌드에서 영감. Duolingo의 캐릭터 마케팅, Headspace의 컬러 시스템이 대표적. 팬데믹 이후 '기쁨을 주는 디자인'에 대한 수요가 배경.",
  "anti-design": "1960년대 이탈리아 Radical Design 운동(Archizoom, Superstudio)에서 시작. 웹에서는 2010년대 중반 David Rudnick, Experimental Jetset의 실험적 포트폴리오가 표본. 의도적 불편함과 규칙 파괴가 핵심.",
  "psychedelic": "1960년대 샌프란시스코 사이키델릭 록 포스터에서 시작. Wes Wilson, Victor Moscoso가 대표 아티스트. 만화경 패턴, 과포화 컬러, 왜곡된 타이포. 1990년대 레이브 문화, 2020년대 페스티벌 브랜딩에서 반복적으로 부활.",
  "cottagecore": "2018-2020년 Tumblr·TikTok에서 Z세대 주도로 부상. 팬데믹(2020) 중 '시골 생활 낭만화'로 폭발적 성장. Taylor Swift 'folklore'(2020)이 대중화에 기여. 꽃무늬, 빈티지 일러스트, 손글씨 서체가 핵심.",
  "steampunk": "1980년대 SF 소설 장르(K.W. Jeter가 1987년 명명)에서 시작. 빅토리아 시대 + 증기기관 + 공상과학의 대체역사. Jules Verne, H.G. Wells의 문학적 뿌리. 웹에서는 톱니바퀴, 황동 텍스처, 고딕 서체로 표현.",
  "solarpunk": "2010년대 초반 Tumblr에서 개념 형성. 사이버펑크의 디스토피아에 대한 낙관적 대안. Studio Ghibli 애니메이션(특히 천공의 성 라퓨타)이 시각적 영감. 식물+기술, 태양광, 유기적 건축이 핵심 모티프.",
  "futurism": "1909년 이탈리아 시인 Filippo Tommaso Marinetti가 선언문 발표. Umberto Boccioni, Giacomo Balla가 대표 아티스트. 속도, 기계, 역동성 찬양. 대각선·방사형 구도가 특징. 현대 모션 디자인과 역동적 타이포의 직접적 조상.",
  "indie-web": "2010년대 '인디웹 운동'에서 시작. 대형 플랫폼(Facebook, Twitter)에서 벗어나 개인 도메인 소유를 주장. 2020년대 Neocities 부활, 개인 홈페이지 문화 재유행. 88x31 배지, 방문자 카운터, 웹링 등 초기 웹의 요소를 의도적으로 되살림."
};

for (const ism of isms) {
  if (grokExamples[ism.id]) {
    ism.examples = grokExamples[ism.id];
  }
  if (histories[ism.id]) {
    ism.history = histories[ism.id];
  }
}

writeFileSync('assets/data/isms.json', JSON.stringify(isms, null, 2) + '\n', 'utf-8');
console.log(`Updated ${isms.length} isms`);
console.log(`Examples updated: ${Object.keys(grokExamples).length}`);
console.log(`Histories added: ${Object.keys(histories).length}`);
