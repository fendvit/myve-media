# MYVE Portál — portal.myve.media

Klientský portál: klient zadá kód, uvidí stav svých projektů, log průběhu a chat.
Admin (vy) vidí všechny klienty, spravuje projekty, píše do logu a chatuje.

Žije ve stejném repu jako marketingový web a sdílí s ním design systém,
komponenty i Supabase klienta — je to druhý Vite entry, ne druhá aplikace.

## Struktura

| Cesta | Co to je |
| --- | --- |
| `portal.html` | HTML entry portálu (Vite ho staví vedle `index.html`) |
| `src/portal/` | Veškerý kód portálu |
| `src/portal/lib/types.ts` | Ručně psané typy portálových tabulek |
| `src/portal/lib/db.ts` | Typovaný klient, redeem kódu, přílohy |
| `src/portal/lib/theme.tsx` | Přepínač světlý/tmavý režim |
| `src/portal/lib/richText.ts` | Sanitizace HTML v záznamech logu |
| `supabase/migrations/20260826120000_portal_schema.sql` | Tabulky, RLS, storage |
| `supabase/functions/redeem-code/` | Výměna kódu za session |
| `supabase/functions/portal-mcp/` | MCP server pro Clauda |

Marketingový web se nezměnil — jen `vite.config.ts` (druhý entry) a
`vercel.json` (rewrite podle hostname).

## Jak funguje přihlášení kódem

Supabase neumí „přihlásit se libovolným kódem", takže to řeší edge funkce:

1. Klient zadá kód (`XXXX-XXXX`, 8 znaků z 32-znakové abecedy bez `I/O/0/1`).
2. `redeem-code` kód ověří service rolí, najde klienta a vytvoří mu (jednou
   provždy) skrytého auth uživatele `<client_id>@clients.myve.media`.
3. Funkce tomu uživateli **nastaví nové náhodné heslo**, hned se s ním přihlásí
   a vrátí tokeny. Heslo se nikde neukládá — existuje jen po dobu requestu.
4. `supabase-js` si session uloží a sám ji obnovuje → klient zůstane přihlášený
   v prohlížeči i v nainstalované appce.

Proti hádání kódu chrání `portal_code_attempts`: 8 neúspěchů z jedné IP za
15 minut a další pokusy dostanou 429.

Vy se přihlašujete normálně e-mailem a heslem (tlačítko „Jsem správce") —
stejný účet jako do stávající `/admin`.

## Nasazení

### 1. Databáze — ✅ hotovo

Migrace jsou nasazené v projektu **Myve Media** (`nkfefurnjhupzealopym`):

| Verze | Migrace |
| --- | --- |
| `20260826111227` | `portal_schema` — tabulky, RLS, storage, realtime |
| `20260826111433` | `portal_restrict_function_execution` — odebrání RPC přístupu roli `anon` |
| `20260826114803` | `portal_push_subscriptions` — odběry push notifikací |
| `20260826124808` | `portal_updates_rich_text` — sloupec `is_html` pro formátovaný log |

`config.toml` byl přepsaný na správný ref (byl tam `gewjbombgrhqlebkwcjq`,
což je jiný projekt). Lokální soubory v `supabase/migrations/` mají stejné
verze jako vzdálená historie, takže `supabase db push` je nebude aplikovat znovu.

Bootstrap adminů proběhl a vytvořil **jeden** profil — v projektu byl jediný
auth uživatel (vy). Není co promazávat.

### 2. Edge funkce

| Funkce | Stav |
| --- | --- |
| `redeem-code` | ✅ nasazená (`verify_jwt = false`) |
| `send-push` | ✅ nasazená |
| `portal-mcp` | ⚠️ zbývá — viz [MCP](#mcp--ovládání-portálu-claudem) |

`verify_jwt = false` u `redeem-code` je záměr — funkci volají lidé, kteří ještě
žádnou session nemají, a autentizaci si řeší sama (kód + rate limit). Env
proměnné (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
doplňuje Supabase sám.

### 3. Doména

**Druhý Vercel projekt není potřeba.** Ve Vercelu k **existujícímu** projektu
přidejte doménu `portal.myve.media` (u registrátora `CNAME portal →
cname.vercel-dns.com`).

#### Proč `routes` a ne `rewrites`

`vercel.json` používá starší pole `routes`, i když by `rewrites` vypadalo
čistěji. Důvod je pořadí vyhodnocování ve Vercelu:

```
redirects → headers → filesystem → rewrites
```

`rewrites` se vyhodnocují **až za** filesystemem. Požadavek na `/` z domény
`portal.myve.media` by tak nejdřív našel `dist/index.html` a poslal
marketingový web — na rewrite by vůbec nedošlo. Přesně tenhle příznak
(„subdoména ukazuje normální web") to způsobuje.

`routes` běží **před** filesystemem, takže se dá `/` odchytit dřív:

1. `/` na portálové doméně → `portal.html` (ještě před filesystemem)
2. `handle: filesystem` → skutečné soubory (`/assets/*`, favicony, manifest)
3. cokoli dalšího na portálové doméně → `portal.html` (SPA fallback)
4. cokoli dalšího jinde → `index.html` (SPA fallback marketingu)

Pozor: `routes` se nedá kombinovat s `rewrites`, `redirects` ani `headers` —
buď jedno, nebo druhé.

### 4. Nasazení do gitu

Vercel staví z GitHubu, takže dokud portál není zacommitovaný a pushnutý,
subdoména bude servírovat starý build (= marketingový web):

```bash
git add portal.html src/portal public/portal-manifest.webmanifest \
        supabase vercel.json vite.config.ts PORTAL.md
git commit -m "Add client portal at portal.myve.media"
git push
```

### 5. Zkouška

Lokálně: `npm run dev` → <http://localhost:8080/portal.html>

Ostrý provoz: přihlaste se jako správce → „Nový klient" → zkopírujte kód →
otevřete v anonymním okně a kód zadejte.

## Vzhled

Portál má **světlý režim jako výchozí** — klienti ho čtou přes den a na
telefonu. Tmavý je na jedno kliknutí (ikona slunce/měsíce v hlavičce, na
desktopu přepínač v levém panelu, klient také v **Kontakt → Vzhled**). Volba se
ukládá do `localStorage` pro dané zařízení.

**Marketingový web zůstává tmavý a nic z toho se ho netýká.** Světlá paleta je
schovaná pod `:root[data-portal-theme='light']` a ten atribut nastavuje jedině
`portal.html` — inline skriptem *před* prvním vykreslením, aby při startu
neproblikla bílá. Ze stejného důvodu je i Tailwind varianta `dark:`
nakonfigurovaná na tenhle atribut, ne na `.dark`.

Značka se nemění: korálová zůstává korálová, text na ní je v obou režimech
tmavý (bílá na korálové má kontrast jen 3,3 : 1).

### Mobil vs. počítač

Jedny routy, dvě šasi. Do šířky `lg` je to appka — horní lišta a spodní
záložky pod palcem. Od `lg` výš je to desktopová aplikace — trvalý levý panel,
žádné spodní záložky, širší obsah. Řeší to `PortalShell`, stránky o tom nevědí.

## Odznaky nepřečtených

Jako na telefonu: korálová bublinka s počtem na ikoně.

- **Klient** ji vidí na **Chat** (nové zprávy od vás) a na **Projekt** (nové
  záznamy v logu).
- **Vy** ji vidíte na **Klienti** (součet) a u konkrétního klienta v seznamu,
  který navíc zvýrazní rámeček a ztuční jméno.

Zprávy, které jste poslal sám, se nikdy nepočítají jako nepřečtené.

Stav čtení drží `portal_read_state` — dvě značky (`messages_seen_at`,
`updates_seen_at`) na dvojici uživatel + klient. Ne příznak u každé zprávy:
odpovědět na otázku „je něco nového?" jedním `upsert` je levnější než přepsat N
řádků, a stejný mechanismus pokrývá i log, který žádný sloupec o přečtení nemá.
Značka je v databázi, takže odznaky sedí i když se přihlásíte na jiném zařízení.

Počty vrací jediné volání `portal_unread_summary()`. Seznam klientů by jinak
potřeboval dotaz na klienta a PostgREST neumí grupovat na klientovi.

Odznak naskočí **živě** — `portal_messages` i `portal_updates` už jsou
v publikaci `supabase_realtime`. Co dorazí na obrazovku, na kterou se zrovra
díváte, se rovnou označí jako přečtené, takže vám nenaskočí bublinka na kartě,
kterou máte otevřenou.

## Formátovaný log

Záznamy v logu se píšou v editoru s formátováním (tučně, kurzíva, mezinadpis,
odrážky, odkazy) a ukládají se jako HTML. Sloupec `is_html` říká, čím záznam
je — staré záznamy mají `false` a renderují se dál jako čistý text. Hádat to
podle obsahu by rozbilo každý záznam, který legitimně obsahuje `<`.

HTML se sanitizuje **dvakrát**: při uložení a znovu při vykreslení
(`sanitizeRichText`, allowlist). Do logu píše jen admin, takže to není poslední
obranná linie — je to pojistka proti tomu, aby se z portálu stalo uložené XSS.

### Markdown

Editor rozumí Markdownu, takže se nemusíte trefovat do tlačítek:

| Napíšete | Dostanete |
| --- | --- |
| `# `, `## `, `### ` | nadpis (tři úrovně) |
| `- ` / `1. ` | odrážky / číslovaný seznam |
| `**tučně**`, `*kurzíva*` | tučně, kurzíva |
| `> ` | citace |

**Kopírování formátování funguje oběma směry.** Vložíte-li text s nadpisy
(z dokumentu, z jiného záznamu), nadpisy zůstanou — proto editor povoluje tři
úrovně nadpisů, ne jednu. Vložíte-li **čistý text**, který vypadá jako Markdown,
převede se na skutečné formátování; jinak by se `##` a `-` vysypaly na zem jako
obyčejné znaky.

Převodník `markdownToHtml` je **jeden** a sdílí ho editor i MCP server, takže
Markdown znamená totéž, ať píše člověk nebo Claude. Vstup se nejdřív
naescapuje a HTML se pak skládá jen z povolených značek — proto tam není žádný
sanitizer a ani být nemusí. Test hlídá, že výstup projde `sanitizeRichText`
beze změny; kdyby se rozešly, MCP by uměl vyrobit značky, které portál zahodí.

## Denní používání

1. **Nový klient** → vyplníte jméno (a rovnou první projekt). Kód se vygeneruje
   v databázi sám.
2. **Pošlete kód** klientovi. Jeden kód = jeden klient = všechny jeho projekty,
   takže druhý projekt přidáte a klient ho uvidí pod stejným kódem.
3. **Průběh** měníte posuvníkem a stavovými štítky, **log** píšete pod projektem.
4. **Chat** je jedno vlákno na klienta napříč projekty, realtime, s přílohami.

Přílohy jdou do privátního bucketu `portal-attachments` pod `<client_id>/…`,
odkazy se podepisují na hodinu.

## Push notifikace

Klient i vy můžete zapnout upozornění na nové zprávy — v portálu je přepínač
(klient: **Kontakt**, vy: nahoře v seznamu klientů). Funguje i se zavřeným
portálem.

### Jak to funguje

1. Prohlížeč se zaregistruje u push služby a subscription se uloží do
   `portal_push_subscriptions` (jeden řádek na zařízení).
2. Po odeslání zprávy zavolá odesílatelův prohlížeč funkci `send-push`.
3. Ta ověří JWT, dohledá **protistranu** (klient napsal → všichni admini;
   vy jste napsal → ten konkrétní klient) a rozešle notifikaci.
4. Mrtvé subscriptions (404/410) se rovnou mažou.

Volání z prohlížeče místo databázového triggeru s `pg_net` je záměr: žádné
tajemství ve vaultu, žádná další infrastruktura. Nejhorší případ — odesílateli
spadne karta uprostřed requestu — znamená nedoručenou notifikaci, ne
ztracenou zprávu.

### Nastavení (jednorázově)

```bash
npx web-push generate-vapid-keys
```

**Veřejný klíč** → do `.env.local` a do Vercelu (Settings → Environment
Variables) jako `VITE_VAPID_PUBLIC_KEY`. Je součástí buildu, takže po jeho
přidání musíte znovu nasadit.

**Privátní klíč** → jen do Supabase, nikdy do repa. Vše na **jednom řádku** —
PowerShell nezná `\` jako pokračování řádku (bere ho jako další argument, což
skončí chybou „Invalid secret pair"). Hodnoty v uvozovkách, aby se `@` a `:`
nerozbily:

```powershell
supabase secrets set "VAPID_PUBLIC_KEY=xxx" "VAPID_PRIVATE_KEY=yyy" "VAPID_SUBJECT=mailto:fendvit.bis@gmail.com" --project-ref nkfefurnjhupzealopym
```

```powershell
supabase functions deploy send-push --project-ref nkfefurnjhupzealopym
```

Kontrola, že se secrets uložily:

```powershell
supabase secrets list --project-ref nkfefurnjhupzealopym
```

### Na čem to funguje

| Platforma | Stav |
| --- | --- |
| Android Chrome/Edge | funguje i v prohlížeči |
| Desktop Chrome/Edge/Firefox | funguje |
| **iPhone / iPad** | **jen po „Přidat na plochu"** — Apple push webu v Safari nedává |

Portál to pozná a na iOS místo přepínače rovnou ukáže návod na instalaci.

`portal-sw.js` schválně **nic necachuje**. Klientský portál, který ukazuje
zastaralý stav projektu nebo starý chat, je horší než ten, co chce připojení.

## MCP — ovládání portálu Claudem

`supabase/functions/portal-mcp/` je MCP server. Po připojení umí Claude zakládat
klienty, přidávat projekty, měnit stav a průběh, psát formátované záznamy do
logu, číst chat a sbírat podklady na reporty.

| Nástroj | Co dělá |
| --- | --- |
| `list_clients` | Seznam klientů s projekty a kódy |
| `get_client` | Detail klienta včetně posledních záznamů |
| `create_client` | Nový klient (kód vygeneruje databáze) |
| `create_project` / `update_project` | Projekty, stav, průběh, odkaz |
| `post_update` | Záznam do logu — píše se v Markdownu |
| `list_updates` / `read_chat` | Čtení logu a konverzace |
| `send_message` | Zpráva klientovi do chatu |
| `project_report` | Podklady pro report za období |

Klienta i projekt lze pojmenovat ID, kódem nebo jménem. Když jméno sedí na víc
záznamů, nástroj **skončí chybou a vypíše kandidáty** — netipuje, protože špatný
tip zapisuje do portálu cizího klienta.

### ⚠️ Než to nasadíte

`PORTAL_MCP_TOKEN` je jediný sdílený token a stojí zastupuje service role:
**kdo ho má, má plný přístup ke všem datům všech klientů.** Nedávejte ho nikam,
kam byste nedali service role key. Rotace = změnit secret a znovu nasadit.

### Nastavení

Vygenerujte token (klidně čímkoli, co dá dost náhody):

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Uložte ho do Supabase a nasaďte funkci:

```powershell
supabase secrets set "PORTAL_MCP_TOKEN=sem-ten-token" --project-ref nkfefurnjhupzealopym
supabase functions deploy portal-mcp --project-ref nkfefurnjhupzealopym
```

`verify_jwt = false` je už v `config.toml` — volá to desktopový asistent, který
žádnou Supabase session nemá, a autentizaci si funkce řeší sama tím tokenem.

### Připojení v Claude Code

```powershell
claude mcp add --transport http myve-portal `
  https://nkfefurnjhupzealopym.supabase.co/functions/v1/portal-mcp `
  --header "Authorization: Bearer sem-ten-token"
```

Ověření, že server odpovídá:

```powershell
curl -X POST https://nkfefurnjhupzealopym.supabase.co/functions/v1/portal-mcp `
  -H "Authorization: Bearer sem-ten-token" -H "Content-Type: application/json" `
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Co MCP nedělá

- **Zprávy z `send_message` neposílají push.** Push funkce ověřuje JWT
  přihlášeného uživatele a MCP žádné nemá. Zpráva dorazí, notifikace ne.
- **Reporty nepíše server.** `project_report` vrátí data — text napíše Claude a
  teprve `post_update` ho zveřejní. Jinak by reporty psal kus kódu v edge funkci.
- **Není tam OAuth**, takže vlastní konektor na claude.ai (který OAuth chce)
  tímhle nepřipojíte. Claude Code s hlavičkou ano.

## Bezpečnost — co zbývá v linteru

Supabase security linter po nasazení hlásí ještě tohle a **je to v pořádku**:

- *Signed-In Users Can Execute SECURITY DEFINER Function* (3×) — `portal_is_admin()`
  a `portal_my_client_id()` volají samotné RLS politiky, takže roli
  `authenticated` musí zůstat právo je spustit; jinak se politiky rozbijí.
  Každá funkce prozradí jen údaje o volajícím samotném. Roli `anon` už přístup
  odebraný má.
- *RLS Enabled No Policy* na `portal_code_attempts` — záměr. Žádná politika =
  nikdo kromě service role (edge funkce) se k tabulce nedostane.

Jedna věc k zapnutí ručně v dashboardu (Authentication → Policies):
**Leaked password protection**. Týká se to vašeho admin hesla, kontroluje ho
proti HaveIBeenPwned.

## Nativní appka — kde na to portál je

Portál je teď instalovatelná PWA. Do App Store / Google Play ho dostane
**Capacitor**, ne Expo: Capacitor zabalí přesně tenhle kód, Expo by znamenalo
přepsat celý design systém (Tailwind, shadcn, Radix) do React Native. Nic
z toho, co je níž, ten závěr nemění — jen upřesňuje, kolik práce zbývá.

### Co funguje beze změny

| | Proč |
| --- | --- |
| Přihlášení a session | `localStorage` + `persistSession`; WebView ho drží stejně jako prohlížeč |
| Realtime (chat, odznaky) | WebSocket ve WebView funguje |
| Celý vzhled | je to web CSS — přesně důvod, proč Capacitor |
| Bezpečné zóny (výřez, home indicator) | `env(safe-area-inset-*)` a `viewport-fit=cover` už v kódu jsou |
| Mobilní rozvržení | spodní záložky a horní lišta jsou appka už teď |

### Android — hotovo (26. 8. 2026)

Capacitor je nastavený a `android/` projekt se staví. Příkazy:

| Příkaz | Co dělá |
| --- | --- |
| `npm run build:native` | postaví **jen** portál do `dist-native/` |
| `npm run sync:native` | totéž + `cap sync android` |
| `npm run build:aab` | celý řetěz až po AAB pro Play |
| `npm run icons` | přegeneruje ikony z `public/favicon.png` |
| `npm run open:android` | otevře projekt v Android Studiu |

Tři věci, které na tom nejsou zřejmé:

1. **`--mode native` staví do `dist-native/` a přejmenuje `portal.html`
   na `index.html`.** WebView otevírá dokument v kořeni, takže bez přejmenování
   naběhne prázdná obrazovka. Dělá to plugin `nativePayload` ve `vite.config.ts`.
2. **Nativní build vypíná `publicDir`.** V `public/` je ~40 MB marketingových
   frames a videí, které portál nikdy nenačte — zkopírovaná dovnitř dělala 98 %
   payloadu (41 MB → 1,1 MB). Zpátky se kopíruje jen allowlist ve `vite.config.ts`.
3. **Cesta k repu má diakritiku** (`Střední škola…`, `soukromé`), což Android
   Gradle Plugin na Windows odmítá. Řeší to `android.overridePathCheck=true`
   v `android/gradle.properties`. Funguje to, ale Google to označuje za
   nepodporované — když nativní build začne selhávat divně, hledej to tady první.

**Podepisování**: klíč a hesla jsou **mimo repo**, v `~/.keys/myve-android/`
(`myve-upload.jks` + `keystore.properties`). Ne kvůli gitu — ten je řeší
`.gitignore` — ale kvůli **OneDrivu**: celá pracovní kopie se synchronizuje do
cloudu a na všechny počítače pod účtem, a podpisový klíč je jediná věc, která
se nedá rotovat. Jinou cestu nastavíš proměnnou `MYVE_KEYSTORE_PROPERTIES`;
čtou ji `android/app/build.gradle` i `scripts/build-aab.ts`.
`android/keystore.properties.example` je návod včetně `keytool` příkazu.

Bez toho souboru se AAB postaví **nepodepsaný** — Gradle to hlásí jako úspěch
a Play to odmítne až při uploadu. `npm run build:aab` proto podpis kontroluje
sám: chybí-li konfigurace úplně, jen varuje (hodí se na lokální testování);
je-li rozdělaná, build rovnou zastaví, aby nepadal až v Gradlu.

Certifikát je platný do roku 2054 (Play vyžaduje aspoň do října 2033).
`versionCode` je zatím `1` — před každým dalším uploadem ho zvyš.

### Co je potřeba dodělat

1. **Push notifikace — hlavní kus práce.** Web Push (service worker + VAPID)
   v Capacitoru na iOS **nefunguje vůbec** a na Androidu je nespolehlivý.
   Nativně se musí přes `@capacitor/push-notifications` → FCM (Android) + APNs
   (iOS). To znamená: jiný typ tokenu v `portal_push_subscriptions`, větev
   v `send-push` (web-push vs. FCM/APNs), účet Apple Developer (2 500 Kč/rok)
   a projekt ve Firebase. Zatím `getPushState()` na nativu vrací
   `native-pending` a přepínač to říká na rovinu místo aby předstíral, že to jde.
2. **Přílohy.** `target="_blank"` na podepsané odkazy chce `@capacitor/browser`,
   jinak se soubor otevře uvnitř appky nebo vůbec. Focení přílohy chce
   `@capacitor/camera`.
3. **iOS.** `cap add ios` potřebuje macOS a účet Apple Developer.
4. **Play Console.** Osobní účty registrované po listopadu 2023 musí před
   produkcí projít **uzavřeným testem: 12 testerů, 14 dní**.

Krátká odpověď: **Android build je hotový, zbývá push, přílohy a Play účet.**

## Co záměrně ještě není

- **Faktury z Fakturoidu**, archivace klientů, více adminů.
- **Odznaky u jednotlivých projektů.** Značka je na klienta, ne na projekt, takže
  otevření jednoho projektu smaže odznak i pro ostatní. U klienta s jedním
  projektem (běžný případ) se to nepozná; jinak by to chtělo druhou tabulku.
