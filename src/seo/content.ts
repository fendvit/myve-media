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
  home: { path: "/", title: "MYVE — Weby, e-maily, automatizace a aplikace na míru",
          description: "Celá digitální infrastruktura firmy: web, který přivádí poptávky, e-maily a automatizace, aplikace na míru a jejich správa. Cena předem, odpověď do 1 pracovního dne." },
  services: { path: "/sluzby", title: "Služby — web, e-maily, automatizace a aplikace | MYVE",
              description: "Ne jen web. Postavíme a spravujeme celý systém, který firmě přivádí a obsluhuje zákazníky: web, e-mail marketing, automatizace, aplikace na míru a klientský portál." },
  legal: { path: "/pravni-informace", title: "Právní informace a cookies | MYVE",
           description: "Provozovatel webu myve.media, podmínky spolupráce, autorská práva, cookies a řešení sporů." },
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

const WEB_STEPS = [
  { title: "Krátký hovor", text: "Zjistíme, co má web vyřešit a pro koho je. Rozsah, termín i cenu znáte předem." },
  { title: "Návrh", text: "Uvidíte, jak bude web vypadat, ještě než se začne programovat. Nic se nestaví bez vašeho OK." },
  { title: "Stavba", text: "Vlastní kód, testovaný na mobilu, tabletu i počítači. Na zprávu odpovídáme do jednoho pracovního dne." },
  { title: "Spuštění a správa", text: "Spouštíme, až řeknete, že je to hotové. Pak se o web staráme dál." },
];
const WEB_OWNED: Section = {
  h2: "Web, který je opravdu váš",
  text: [
    "Web provozujeme v měsíčním paušálu, který pokrývá zabezpečení, údržbu i prodloužení domény. Žádné další faktury za doménu ani hosting.",
    "Doména je vždy vaše. Kdybychom spolupráci ukončili my, web vám předáme zdarma. A kdykoliv si ho můžete i se zdrojovým kódem odkoupit — vždycky víte, co vlastníte.",
  ],
};

export const SERVICES: ServicePageData[] = [
  {
    slug: "tvorba-webu",
    path: "/tvorba-webu",
    title: "Tvorba webů pro firmy — web, který přivádí poptávky | MYVE",
    description: "Tvorba firemních webů na míru po celém Česku: rychlý web s technickým SEO, napojený na e-maily a vaše systémy, se správou v měsíčním paušálu. Cena a termín předem.",
    service: "Tvorba firemních webů",
    eyebrow: "Firemní weby",
    h1: "Tvorba webů pro firmy",
    lead: "Web není leták na internetu. Je to první díl systému, který vám má přivádět zákazníky: stránka, kterou lidé najdou, formulář, který poptávku zachytí, e-maily, které ji dovedou k obchodu, a někdo, kdo se o to celé stará. Takové weby stavíme pro firmy z celého Česka — běžně do 14 dní od zadání.",
    sections: [
      {
        h2: "Co s webem dostanete",
        bullets: [
          "Návrh na míru vaší firmě a vašim zákazníkům, žádná krabicová šablona.",
          "Technický základ pro Google od prvního dne: rychlé načítání, správné nadpisy, titulek a popis každé stránky, mapa webu a strukturovaná data o firmě.",
          "Formuláře napojené na e-mail a vaše nástroje, aby se žádná poptávka neztratila v cizí schránce.",
          "Web postavený nejdřív pro mobil a testovaný na tabletu i počítači.",
          "Pomoc s texty a strukturou — stačí říct, co děláte a pro koho.",
        ],
      },
      {
        h2: "Web je teprve začátek",
        text: [
          "Hezký web, o který se nikdo nestará, za rok přestane vydělávat. Proto ho umíme napojit na zbytek infrastruktury: e-mail marketing a automatizace, které zákazníkům píšou za vás, a aplikace na míru, když hotová řešení nestačí. Všechno od jednoho člověka, kterému napíšete.",
        ],
      },
      WEB_OWNED,
    ],
    steps: WEB_STEPS,
    references: [
      "garvys-web-pro-generovani-poptavek-v-oblasti-vrat-a-stinici-techniky",
      "realtixo-web-pro-blockchainovou-investicni-platformu",
      "zabava-za-skolou",
      "the-next-level-newsletterova-landing-page",
    ],
    faq: [
      { q: "Kolik stojí tvorba webu?", a: "Záleží na rozsahu — jiný je jednostránkový web a jiný web s rezervacemi nebo napojením na vaše systémy. Po krátkém hovoru dostanete přesnou cenu a termín dřív, než cokoliv začne. Konzultace je zdarma a nezávazná." },
      { q: "Jak dlouho tvorba webu trvá?", a: "Běžný firemní web spouštíme v průměru do 14 dní od zadání. Větší projekty podle rozsahu; termín znáte předem." },
      { q: "Pracujete i pro firmy mimo Jaroměř?", a: "Ano, pro firmy z celého Česka. Většinu věcí vyřešíme online a průběh projektu vidíte v naší klientské aplikaci." },
      { q: "Postaráte se i o doménu, hosting a správu?", a: "Ano. Doménu, hosting, zabezpečení i údržbu pokrývá měsíční paušál, takže nemusíte nic řešit sami." },
      { q: "Bude můj web vidět na Googlu?", a: "Každý web stavíme tak, aby mu Google rozuměl: rychlé načítání, správné nadpisy, titulky a popisy stránek, mapa webu a strukturovaná data. Konkrétní pořadí ve výsledcích vám poctivě nikdo zaručit nemůže, ale základ, bez kterého to nejde, dostanete vždy." },
      { q: "Musím mít připravené texty a fotky?", a: "Nemusíte. Stačí říct, co děláte a pro koho — s texty i strukturou pomůžeme." },
    ],
    related: { label: "Co dalšího pro vás postavíme: všechny služby", path: "/sluzby" },
  },
  {
    slug: "emailing-a-automatizace",
    path: "/emailing-a-automatizace",
    title: "E-mail marketing a automatizace pro firmy | MYVE",
    description: "E-maily, které chodí do doručené pošty, automatické sekvence pro nové zákazníky a propojení formulářů, tabulek a systémů. Nastavíme a spravujeme. Pro firmy po celém Česku.",
    service: "E-mail marketing a automatizace procesů",
    eyebrow: "E-maily a automatizace",
    h1: "E-mail marketing a automatizace",
    lead: "Většina firem má kontakty, které nikdo neosloví, a lidi, kteří ručně přepisují data z jednoho systému do druhého. Postavíme vám infrastrukturu, která to dělá sama: e-maily, které chodí do doručené pošty a ne do spamu, automatické sekvence, které zákazníkům napíšou ve správnou chvíli, a propojené nástroje, mezi kterými nikdo nic nepřepisuje.",
    sections: [
      {
        h2: "Co nastavíme",
        cards: [
          { title: "Doručitelnost", text: "Správně nastavená doména (SPF, DKIM, DMARC), aby e-maily nekončily ve spamu. Čistá struktura seznamů, štítků a segmentů." },
          { title: "Automatické sekvence", text: "Uvítací série, připomínky a follow-upy po poptávce — e-maily, které se odešlou samy ve chvíli, kdy dávají smysl, a s jasnou podmínkou, kdy přestat." },
          { title: "Šablony a newslettery", text: "Šablony ve vašem stylu, které zvládnete posílat i sami, a pravidelný newsletter, pokud ho chcete." },
          { title: "Propojení systémů", text: "Formuláře z webu, tabulky, CRM a e-mail napojíme na sebe. Klientům takhle odpadá přes 40 hodin ruční práce měsíčně." },
        ],
      },
      {
        h2: "Sběr kontaktů v souladu s GDPR",
        text: [
          "Formuláře stavíme se souhlasem a dvojitým potvrzením (double opt-in) a každý e-mail má odhlášení. Pracujeme s nástroji jako Brevo nebo Ecomail; když už nějaký používáte, navážeme na něj.",
        ],
      },
    ],
    steps: [
      { title: "Kde ztrácíte", text: "Projdeme, kde vám utíkají kontakty a kde se ručně přepisují data. Rozsah, termín i cena jsou jasné předem." },
      { title: "Mapa automatizací", text: "Navrhneme, jaký e-mail přijde komu a kdy, a co se kam propojí. Nic se nenastavuje bez vašeho OK." },
      { title: "Nastavení a test", text: "Nastavíme doménu, šablony, sekvence a propojení a všechno otestujeme na skutečných datech." },
      { title: "Provoz a správa", text: "Hlídáme doručitelnost a výsledky a upravujeme, co je potřeba. Na zprávu odpovídáme do jednoho pracovního dne." },
    ],
    references: [
      "the-next-level-newsletterova-landing-page",
      "realflows-saas-platforma-pro-generovani-realitnich-poptavek",
    ],
    faq: [
      { q: "Jaký nástroj na e-maily použijete?", a: "Ten, který vám dává smysl — často Brevo nebo Ecomail. Když už nějaký máte, navážeme na něj a nemusíte nic stěhovat." },
      { q: "Proč mi e-maily padají do spamu?", a: "Nejčastěji kvůli chybějícímu nastavení domény (SPF, DKIM, DMARC) nebo kvůli posílání na neověřené kontakty. To je první věc, kterou zkontrolujeme." },
      { q: "Musím e-maily psát sám?", a: "Nemusíte. Připravíme šablony i texty sekvencí, vy je jen schválíte." },
      { q: "Kolik to stojí?", a: "Podle rozsahu — jiné je nastavení jednoho newsletteru a jiné propojení celého obchodního procesu. Cenu i termín znáte předem a konzultace je zdarma." },
      { q: "Postaráte se o to i dlouhodobě?", a: "Ano. Automatizace i e-maily můžeme spravovat průběžně: hlídat doručitelnost, upravovat sekvence a přidávat nové." },
    ],
    related: { label: "Co dalšího pro vás postavíme: všechny služby", path: "/sluzby" },
  },
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
      WEB_OWNED,
      {
        h2: "Pro firmy z Jaroměře a okolí",
        text: [
          `Sídlíme v Jaroměři, takže se můžeme klidně potkat osobně. Weby děláme pro firmy z Jaroměře a Josefova, z Dvora Králové nad Labem, Náchoda, Hradce Králové, Trutnova, České Skalice, Smiřic i Nového Města nad Metují — a díky online schůzkám i odkudkoliv z Česka.`,
        ],
      },
    ],
    steps: WEB_STEPS,
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
    related: { label: "Nejste z okolí Jaroměře? Tvorba webů pro firmy z celého Česka", path: "/tvorba-webu" },
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
    related: { label: "Co dalšího pro vás postavíme: všechny služby", path: "/sluzby" },
  },
];

// /sluzby: the offer, built per agents\prodej\offer.md — 3 pillars, extras as bonuses, the four
// dials (result, certainty, time, effort), and the risk answered on the page, not held back.
// Only guarantees that exist: nothing built without OK, price up front, the website contract's
// domain / buyout / free-handover clauses.
export const OFFER = {
  eyebrow: "Služby",
  h1: "Ne jen web. Celý systém, který přivádí a obsluhuje zákazníky.",
  lead: "Hezký web, o který se nikdo nestará, za rok přestane vydělávat. Proto stavíme celou digitální infrastrukturu firmy — web, který lidé najdou, e-maily a automatizace, které pracují za vás, a aplikace, když hotová řešení nestačí. A pak se o to celé staráme. Jeden partner, jedna faktura, jeden člověk, kterému napíšete.",
  pillars: [
    { title: "Web, který přivádí poptávky", path: "/tvorba-webu",
      text: "Firemní web na míru s technickým SEO, napojený na e-maily a vaše nástroje. Běžně do 14 dní od zadání." },
    { title: "E-maily a automatizace, které běží samy", path: "/emailing-a-automatizace",
      text: "E-mail marketing, který chodí do doručené pošty, automatické sekvence a propojené systémy. Klientům odpadá přes 40 hodin ruční práce měsíčně." },
    { title: "Aplikace a software na míru", path: "/aplikace-na-miru",
      text: "Mobilní aplikace pro Android i iPhone, webové aplikace a interní systémy — když hotová krabice nestačí." },
  ],
  bonuses: [
    { title: "Klientská aplikace MYVE Portál", text: "Průběh projektu, týdenní zápisy a chat s přílohami na jednom místě — v telefonu i v počítači. Žádné hledání v e-mailech." },
    { title: "Správa a bezpečnost", text: "Údržbu, zabezpečení a prodloužení domény pokrývá měsíční paušál. Když se něco změní, napíšete a je to." },
    { title: "Odpověď do jednoho pracovního dne", text: "Na každou zprávu. Po celou dobu projektu i po spuštění." },
  ],
  dials: [
    { k: "Co dostanete", v: "Systém, který přivádí poptávky a šetří čas. Ne soubor, který vám předáme a zmizíme." },
    { k: "Proč tomu věřit", v: "Návrh uvidíte dřív, než se začne programovat. Rozsah, termín i cena jsou jasné předem." },
    { k: "Jak rychle", v: "Běžný web do 14 dní od zadání. Větší systémy po částech, s termínem předem." },
    { k: "Co musíte udělat vy", v: "Skoro nic. Doménu, hosting, texty, nastavení e-mailů i správu řešíme my. Vy schvalujete." },
  ],
  risks: [
    { q: "Co když výsledek nebude takový, jaký jsem chtěl?", a: "Nic se nestaví bez vašeho OK. Nejdřív vidíte návrh, pak testovací verzi, a spouštíme až ve chvíli, kdy řeknete, že je to hotové." },
    { q: "Co když se to prodraží?", a: "Rozsah, termín i cenu dostanete předem a písemně. Když se uprostřed rozhodnete pro něco navíc, víte předem, kolik to bude stát." },
    { q: "Co když spolupráce skončí?", a: "U webů je doména vždy vaše. Web si můžete kdykoliv odkoupit i se zdrojovým kódem, a kdybychom spolupráci ukončili my, předáme vám ho zdarma." },
  ],
};

// /jak-to-delame: what happens after launch (the steps above end at "spouštíme")
export const HOW_AFTER = {
  h2: "Po spuštění to teprve začíná",
  lead: "Web ani aplikace nejsou hotové jednou provždy. Ceny se mění, přibudou služby, něco je potřeba napojit. Proto po spuštění nekončíme.",
  items: [
    { title: "Správa a bezpečnost", text: "Údržba, zabezpečení a prodloužení domény v měsíčním paušálu." },
    { title: "MYVE Portál", text: "Průběh, zápisy a chat s námi v klientské aplikaci — v telefonu i v počítači." },
    { title: "E-maily a automatizace", text: "Na hotový web napojíme e-mail marketing a automatizace, které pracují za vás." },
    { title: "Další rozvoj", text: "Nové funkce, stránky nebo celé aplikace stavíme na tom, co už máte — nic se nepřepisuje od nuly." },
  ],
};

// /pravni-informace. Facts from the trade register extract (firma\ico\VypisROS); no birth
// date, no VAT claim (not confirmed). Not legal advice — Vít's to have checked.
export const LEGAL: { updated: string; sections: { h2: string; id?: string; text: string[] }[] } = {
  updated: "15. 10. 2026",
  sections: [
    { h2: "Provozovatel", text: [
      "Web myve.media provozuje Vít Fendrych, podnikající fyzická osoba zapsaná v živnostenském rejstříku, IČO 24512362, s místem podnikání Obránců míru 449, Jakubské Předměstí, 551 01 Jaroměř. MYVE (MYVE.media) je obchodní označení, pod kterým tyto služby poskytuje.",
      "Kontakt: fendvit.bis@gmail.com, +420 602 513 145.",
    ] },
    { h2: "Podmínky spolupráce", text: [
      "Každá zakázka se řídí písemnou smlouvou nebo potvrzenou objednávkou, která stanoví rozsah, cenu, termín a podmínky případné správy. Informace a ceny uvedené na tomto webu nejsou návrhem na uzavření smlouvy.",
    ] },
    { h2: "Autorská práva", text: [
      "Texty, grafika a další obsah tohoto webu jsou chráněny autorským právem a bez souhlasu provozovatele je nelze dále šířit. Ukázky projektů slouží jako reference; práva k nim náleží jejich vlastníkům.",
    ] },
    { h2: "Cookies a měření návštěvnosti", id: "cookies", text: [
      "Tento web nepoužívá reklamní ani sledovací cookies, proto se vás na ně neptá. Návštěvnost měříme bez cookies (Vercel Web Analytics a vlastní měření MYVE): do vašeho zařízení se nic neukládá a IP adresa se neuchovává. Podrobnosti jsou v zásadách ochrany osobních údajů.",
      "Úložiště prohlížeče se používá jen technicky — k udržení přihlášení do administrace a do klientského portálu.",
    ] },
    { h2: "Řešení sporů", text: [
      "Jste-li spotřebitel, můžete se v případě sporu se mnou obrátit na Českou obchodní inspekci (www.coi.cz), která je subjektem mimosoudního řešení spotřebitelských sporů.",
    ] },
    { h2: "Odkazy na jiné weby", text: [
      "Za obsah webů, na které odkazujeme (například ukázky projektů), neodpovídáme.",
    ] },
  ],
};

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
