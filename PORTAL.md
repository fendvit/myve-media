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
| `supabase/migrations/20260826120000_portal_schema.sql` | Tabulky, RLS, storage |
| `supabase/functions/redeem-code/` | Výměna kódu za session |

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

`config.toml` byl přepsaný na správný ref (byl tam `gewjbombgrhqlebkwcjq`,
což je jiný projekt). Lokální soubory v `supabase/migrations/` mají stejné
verze jako vzdálená historie, takže `supabase db push` je nebude aplikovat znovu.

Bootstrap adminů proběhl a vytvořil **jeden** profil — v projektu byl jediný
auth uživatel (vy). Není co promazávat.

### 2. Edge funkce — ⚠️ zbývá udělat

```bash
supabase functions deploy redeem-code
```

`verify_jwt = false` je už v `config.toml` — funkci volají lidé, kteří ještě
žádnou session nemají, a autentizaci si řeší sama (kód + rate limit). Env
proměnné (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
doplňuje Supabase sám.

Dokud tohle neproběhne, kód na přihlašovací obrazovce nebude fungovat —
všechno ostatní (schéma, RLS, build) je připravené.

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

## Denní používání

1. **Nový klient** → vyplníte jméno (a rovnou první projekt). Kód se vygeneruje
   v databázi sám.
2. **Pošlete kód** klientovi. Jeden kód = jeden klient = všechny jeho projekty,
   takže druhý projekt přidáte a klient ho uvidí pod stejným kódem.
3. **Průběh** měníte posuvníkem a stavovými štítky, **log** píšete pod projektem.
4. **Chat** je jedno vlákno na klienta napříč projekty, realtime, s přílohami.

Přílohy jdou do privátního bucketu `portal-attachments` pod `<client_id>/…`,
odkazy se podepisují na hodinu.

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

## Co záměrně ještě není

- **Push notifikace.** Chtěly by service worker, VAPID klíče a odesílací cestu.
  Radši nic než mrtvý přepínač v nastavení — až budete chtít, je to samostatný
  krok a schéma na něj je připravené.
- **Nativní appka.** Portál je teď instalovatelná PWA („Přidat na plochu").
  Na App Store / Google Play to dostane **Capacitor**, který zabalí přesně
  tenhle kód — proto ne Expo, který by znamenal přepsat celý design systém
  do React Native.
- **Faktury z Fakturoidu**, archivace klientů, více adminů.
