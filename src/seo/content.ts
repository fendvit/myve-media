// One source for everything Google reads: page titles, descriptions, the service landing
// pages and the structured data about the firm. Used by the React pages (via <Seo />) AND by
// scripts/prerender.ts, which writes the same text into static HTML at build time, so a
// crawler gets each page's own title and content without running any JavaScript.
//
// Every claim here already stands elsewhere on the site (14 days, 1 working day, 40+ hours,
// 7+ projects, price and scope agreed up front) or is Vít's confirmed standard deal (monthly
// fee incl. domain; free handover if he ends it; buyout). Don't add a number nobody confirmed.

export const SITE = "https://myve.media";
export const OG_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/fb58e36b-ed3d-4476-82a5-1c24c74bbd55";

export const BUSINESS = {
  name: "MYVE — Vít Fendrych",
  phone: "+420602513145",
  phoneDisplay: "+420 602 513 145",
  email: "fendvit.bis@gmail.com",
  street: "Obránců míru 449",
  locality: "Jaroměř",
  postalCode: "551 01",
  region: "Královéhradecký kraj",
  ico: "24512362",
  sameAs: ["https://www.instagram.com/myve.media/", "https://www.facebook.com/profile.php?id=100092353287649"],
};

export const AREA = ["Jaroměř", "Josefov", "Dvůr Králové nad Labem", "Náchod", "Hradec Králové", "Trutnov",
                     "Česká Skalice", "Smiřice", "Nové Město nad Metují"];

export interface PageMeta { path: string; title: string; description: string }

export const PAGES: Record<string, PageMeta> = {
  home: { path: "/", title: "MYVE — Tvorba webů a aplikací na míru | Jaroměř",
          description: "Tvorba webů, webových a mobilních aplikací a softwaru na míru pro firmy. Vít Fendrych, Jaroměř. Web do 14 dní, cena předem, odpověď do 1 pracovního dne." },
  projects: { path: "/projekty", title: "Projekty a reference — weby a aplikace | MYVE",
              description: "Reference studia MYVE: firemní weby, webové aplikace, SaaS a mobilní aplikace. Případové studie s ukázkami a odkazy na živé projekty." },
  how: { path: "/jak-to-delame", title: "Jak to děláme — Proces vývoje | MYVE",
         description: "Čtyři kroky od zadání ke spuštění — s jasným rozsahem, termínem i cenou předem. Podívejte se, jak v MYVE vyvíjíme weby, aplikace a software na míru." },
  privacy: { path: "/zasady-ochrany-osobnich-udaju", title: "Zásady ochrany osobních údajů (GDPR) | MYVE",
             description: "Jak studio MYVE zpracovává osobní údaje v souladu s GDPR." },
};

export interface Faq { q: string; a: string }
export interface Section { h2: string; text?: string[]; bullets?: string[]; cards?: { title: string; text: string }[] }
export interface ServicePageData extends PageMeta {
  slug: string;
  service: string;          // schema.org Service name
  eyebrow: string;
  h1: string;
  lead: string;
  sections: Section[];
  steps: { title: string; text: string }[];
  references: string[];     // project slugs on /projekty
  faq: Faq[];
  related: { label: string; path: string };
}

export const SERVICES: ServicePageData[] = [
  {
    slug: "tvorba-webu-jaromer",
    path: "/tvorba-webu-jaromer",
    title: "Tvorba webů Jaroměř — weby na míru pro firmy | MYVE",
    description: "Tvorba webových stránek v Jaroměři a okolí. Web na míru do 14 dní, cena předem, správa i doména v měsíčním paušálu. Vít Fendrych, MYVE.",
    service: "Tvorba webových stránek",
    eyebrow: "Jaroměř a okolí",
    h1: "Tvorba webů v Jaroměři",
    lead: "Za MYVE stojí Vít Fendrych z Jaroměře. Tvoříme weby pro firmy a živnostníky z celého Královéhradeckého kraje — ne šablonu, ale web na míru, který je rychlý, dobře vypadá na mobilu a přivádí poptávky. Běžný web spouštíme v průměru do 14 dní od zadání.",
    sections: [
      {
        h2: "Co s webem dostanete",
        bullets: [
          "Návrh na míru vaší firmě, žádná krabicová šablona.",
          "Web postavený nejdřív pro mobil, kde dnes hledá velká část zákazníků.",
          "Technický základ pro Google od prvního dne: rychlé načítání, správné nadpisy, titulek a popis každé stránky, mapa webu a strukturovaná data o vaší firmě.",
          "Kontaktní formulář a telefon na jedno kliknutí, aby se vám zákazník ozval co nejsnáz.",
          "Pomoc s texty a strukturou — stačí říct, co děláte a pro koho.",
        ],
      },
      {
        h2: "Web, který je opravdu váš",
        text: [
          "Web provozujeme v měsíčním paušálu, který pokrývá zabezpečení, údržbu i prodloužení domény. Žádné další faktury za doménu ani hosting.",
          "Kdybychom spolupráci ukončili my, web vám předáme zdarma. A kdykoliv si ho můžete i se zdrojovým kódem odkoupit — vždycky víte, co vlastníte.",
        ],
      },
      {
        h2: "Pro firmy z Jaroměře a okolí",
        text: [
          `Sídlíme v Jaroměři, takže se můžeme klidně potkat osobně. Weby děláme pro firmy z Jaroměře a Josefova, z Dvora Králové nad Labem, Náchoda, Hradce Králové, Trutnova, České Skalice, Smiřic i Nového Města nad Metují — a díky online schůzkám i odkudkoliv z Česka.`,
        ],
      },
    ],
    steps: [
      { title: "Krátký hovor", text: "Zjistíme, co má web vyřešit a pro koho je. Rozsah, termín i cenu znáte předem." },
      { title: "Návrh", text: "Uvidíte, jak bude web vypadat, ještě než se začne programovat. Nic se nestaví bez vašeho OK." },
      { title: "Stavba", text: "Vlastní kód, testovaný na mobilu, tabletu i počítači. Na zprávu odpovídáme do jednoho pracovního dne." },
      { title: "Spuštění a správa", text: "Spouštíme, až řeknete, že je to hotové. Pak se o web staráme dál." },
    ],
    references: [
      "garvys-web-pro-generovani-poptavek-v-oblasti-vrat-a-stinici-techniky",
      "zabava-za-skolou",
      "the-next-level-newsletterova-landing-page",
      "arve-web-pro-hotel-na-hranici-lesa",
    ],
    faq: [
      { q: "Kolik stojí tvorba webu?", a: "Záleží na rozsahu — jiný je jednostránkový web pro řemeslníka a jiný web s rezervacemi. Po krátkém hovoru dostanete přesnou cenu a termín dřív, než cokoliv začne. Konzultace je zdarma a nezávazná." },
      { q: "Jak dlouho tvorba webu trvá?", a: "Běžný firemní web spouštíme v průměru do 14 dní od zadání. Větší projekty podle rozsahu; termín znáte předem." },
      { q: "Postaráte se i o doménu a hosting?", a: "Ano. Doménu, hosting, zabezpečení i údržbu pokrývá měsíční paušál, takže nemusíte nic řešit sami." },
      { q: "Bude můj web vidět na Googlu?", a: "Každý web stavíme tak, aby mu Google rozuměl: rychlé načítání, správné nadpisy, titulky a popisy stránek, mapa webu a strukturovaná data. Konkrétní pořadí ve výsledcích vám poctivě nikdo zaručit nemůže, ale základ, bez kterého to nejde, dostanete vždy." },
      { q: "Musím mít připravené texty a fotky?", a: "Nemusíte. Stačí říct, co děláte a pro koho — s texty i strukturou pomůžeme." },
      { q: "Nejsem z Jaroměře. Vadí to?", a: "Nevadí. Většinu věcí vyřešíme online a schůzka se dá domluvit i jinde v kraji." },
    ],
    related: { label: "Potřebujete spíš aplikaci? Aplikace na míru", path: "/aplikace-na-miru" },
  },
  {
    slug: "aplikace-na-miru",
    path: "/aplikace-na-miru",
    title: "Aplikace na míru — mobilní a webové aplikace | MYVE",
    description: "Vývoj aplikací na míru pro firmy: mobilní aplikace pro Android i iPhone, webové aplikace a interní systémy. Cena a termín předem, návrh dřív než kód.",
    service: "Vývoj aplikací na míru",
    eyebrow: "Mobilní i webové aplikace",
    h1: "Aplikace na míru",
    lead: "Když vám hotový software nestačí, postavíme vlastní. Vyvíjíme mobilní aplikace pro Android i iPhone, webové aplikace a interní systémy, které firmám šetří čas — od prvního návrhu po vydání v obchodech a správu po spuštění.",
    sections: [
      {
        h2: "Co stavíme",
        cards: [
          { title: "Mobilní aplikace pro Android i iPhone", text: "Jedna aplikace pro oba systémy, vydaná na Google Play i v App Storu — s přihlášením, notifikacemi a napojením na vaše data. Třeba náš klientský portál MYVE Portál nebo aplikace UltraQuest." },
          { title: "Webové aplikace a SaaS", text: "Aplikace, které běží v prohlížeči na počítači i mobilu bez instalace: správa turnajů, zákaznické portály, sběr a vyhodnocení poptávek. Třeba Sport Academy nebo RealFlows." },
          { title: "Interní systémy a automatizace", text: "Z procesu, který zdržuje, uděláme systém, který šlape. Formuláře, tabulky a e-maily, které dnes někdo přepisuje ručně, propojíme. Klientům takhle odpadá přes 40 hodin ruční práce měsíčně." },
        ],
      },
      {
        h2: "Proč na míru, a ne hotová krabice",
        text: [
          "Hotový software je na začátku levnější, ale nutí vás přizpůsobit se jemu. Aplikace na míru dělá přesně to, co potřebuje vaše firma, a dá se kdykoliv rozšířit o další funkce. Nestavíme na šabloně, která vás za rok zastaví.",
        ],
      },
    ],
    steps: [
      { title: "Co má aplikace vyřešit", text: "Začínáme u vašeho byznysu: kde ztrácíte čas nebo peníze. Rozsah, termín i cena jsou jasné před začátkem prací." },
      { title: "Návrh dřív než kód", text: "Uvidíte, jak bude aplikace vypadat a fungovat, do posledního tlačítka. Dokud návrh neschválíte, nepokračujeme." },
      { title: "Vývoj", text: "Vlastní kód, databáze a integrace, průběžně testované. Víte, v jaké fázi jsme; na zprávu odpovídáme do jednoho pracovního dne." },
      { title: "Vydání a správa", text: "Vydáme aplikaci na Google Play i do App Storu a staráme se o aktualizace, opravy a nové verze systémů." },
    ],
    references: [
      "ultraquest-webova-platforma-pro-virtualni-ultra-zavody",
      "sport-academy-aplikace-pro-spravu-florbalovych-turnaju",
      "realflows-saas-platforma-pro-generovani-realitnich-poptavek",
    ],
    faq: [
      { q: "Kolik stojí vývoj aplikace na míru?", a: "Záleží na tom, co má aplikace umět. Po konzultaci dostanete rozsah, termín i cenu dřív, než začneme. Konzultace je zdarma a nezávazná." },
      { q: "Jak dlouho vývoj aplikace trvá?", a: "Jednodušší webovou aplikaci jde spustit v řádu týdnů, větší systém stavíme po částech. Přesný termín znáte předem." },
      { q: "Vyvíjíte pro Android i iPhone?", a: "Ano. Aplikace stavíme tak, aby z jednoho kódu běžely na Androidu i iPhonu, a vydáváme je na Google Play i do App Storu." },
      { q: "Kdo se o aplikaci stará po spuštění?", a: "My. Po spuštění řešíme aktualizace, opravy, nové verze Androidu a iOS i další funkce." },
      { q: "Nevím přesně, co potřebuju. Můžu se i tak ozvat?", a: "Určitě. Stačí popsat, co vás dnes zdržuje nebo stojí peníze. Na konzultaci zjistíme, jestli dává smysl aplikace, nebo stačí jednodušší řešení — a když to nedává smysl, řekneme vám to na rovinu." },
    ],
    related: { label: "Potřebujete hlavně web? Tvorba webů Jaroměř", path: "/tvorba-webu-jaromer" },
  },
];

// /jak-to-delame: the four steps (HowWeWork.tsx adds the icons)
export const HOW_STEPS = [
  { number: "01", title: "Přesně víte, do čeho jdete", body: "Většina projektů selže dřív, než padne první řádek kódu — protože nikdo pořádně nezjistil, co má vlastně vyřešit. Proto začínáme u vašeho byznysu: kdo jsou vaši zákazníci, kde ztrácíte čas nebo peníze a co se musí stát, aby se investice vrátila. Výstupem je jasný rozsah, termín i cena — víte, co dostanete a za kolik, ještě než začneme.",
    badge: { title: "Víte, za co platíte.", subtitle: "Rozsah, termín i cena jsou jasné před začátkem prací." } },
  { number: "02", title: "Vidíte to, než to začneme stavět", body: "Než se začne programovat, uvidíte, jak bude váš web nebo aplikace vypadat a fungovat — do posledního tlačítka. Návrhy spolu procházíme a upravujeme, dokud nesedí. Právě teď jsou změny nejrychlejší a nejlevnější; přepisovat hotový kód stojí násobně víc. Dokud návrh neschválíte, nepokračujeme dál.",
    badge: { title: "Nic se neprogramuje bez vašeho OK.", subtitle: "Úpravy návrhu řešíme obratem, dokud nesedí." } },
  { number: "03", title: "Stavíme na míru, ne na krabici", body: "Teď se staví. Píšeme vlastní kód, napojujeme databáze a integrace a průběžně testujeme na mobilech, tabletech i desktopech. Nestavíme na šabloně, která vás za rok zastaví — řešení jde kdykoliv rozšířit o další funkce. Po celou dobu víte, v jaké fázi jsme, a na zprávu odpovídáme do jednoho pracovního dne.",
    badge: { title: "Rychlé, bezpečné a rozšiřitelné.", subtitle: "Vlastní kód, na kterém se dá stavět dál — ne šablona." } },
  { number: "04", title: "Poslední slovo máte vy", body: "Testovací verzi dostanete dřív, než ji uvidí kterýkoliv z vašich zákazníků. V klidu si všechno proklikáte a co nesedí, doladíme. Spouštíme až ve chvíli, kdy řeknete, že je to hotové. A po spuštění nekončíme — ozvat se můžete kdykoliv, když bude potřeba cokoliv upravit nebo doplnit.",
    badge: { title: "Spouštíme, až řeknete vy.", subtitle: "Testovací verzi vidíte první — a po spuštění nezůstanete sami." } },
];

// ------------------------------------------------------------------ structured data (schema.org)
export function businessLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE}/#business`,
    name: BUSINESS.name,
    alternateName: ["MYVE", "MYVE.media"],
    url: `${SITE}/`,
    image: OG_IMAGE,
    logo: `${SITE}/favicon.png`,
    founder: { "@type": "Person", name: "Vít Fendrych" },
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    vatID: BUSINESS.ico,
    address: { "@type": "PostalAddress", streetAddress: BUSINESS.street, addressLocality: BUSINESS.locality,
               postalCode: BUSINESS.postalCode, addressRegion: BUSINESS.region, addressCountry: "CZ" },
    areaServed: [...AREA.map((name) => ({ "@type": "City", name })), { "@type": "Country", name: "Česko" }],
    knowsAbout: ["tvorba webových stránek", "webové aplikace", "mobilní aplikace", "software na míru", "automatizace procesů", "SEO"],
    sameAs: BUSINESS.sameAs,
  };
}

export function serviceLd(s: ServicePageData) {
  return [
    { "@context": "https://schema.org", "@type": "Service", name: s.service, serviceType: s.service, url: `${SITE}${s.path}`,
      description: s.description, provider: { "@id": `${SITE}/#business` },
      areaServed: AREA.map((name) => ({ "@type": "City", name })) },
    { "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: s.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    breadcrumbLd([{ name: "MYVE", path: "/" }, { name: s.h1, path: s.path }]),
  ];
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
           itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE}${it.path}` })) };
}
