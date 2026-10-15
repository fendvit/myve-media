import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Zásady ochrany osobních údajů (GDPR) | MYVE"
        description="Jak studio MYVE zpracovává osobní údaje v souladu s GDPR."
        path="/zasady-ochrany-osobnich-udaju"
      />
      <Navbar />
      <main className="container mx-auto px-6 lg:px-12 pt-32 pb-20 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 text-gradient">
          Zásady ochrany osobních údajů (GDPR)
        </h1>
        <p className="text-sm text-muted-foreground -mt-4 mb-8">Aktualizováno 15. 10. 2026 · <Link to="/pravni-informace#cookies" className="hover:text-primary">Cookies a právní informace</Link></p>

        <div className="space-y-6 text-foreground/90 leading-relaxed">
          <p>
            Vážíme si vaší důvěry a s vašimi osobními údaji nakládáme zodpovědně a v souladu s platnými právními předpisy (GDPR). Zde se stručně a srozumitelně dozvíte, jak a proč vaše data zpracováváme.
          </p>

          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">1. Kdo vaše údaje zpracovává?</h2>
            <p>
              Správcem vašich osobních údajů jsem já, Vít Fendrych, zakladatel digitální agentury MYVE.media, se sídlem Obránců míru 449, Jaroměř 551 01, IČO: 24512362. Kontaktovat mě můžete na e-mailu{" "}
              <a href="mailto:fendvit.bis@gmail.com" className="text-primary hover:underline">fendvit.bis@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">2. Jaká data sbíráme a proč?</h2>
            <p>
              Pokud mě kontaktujete prostřednictvím formuláře na webu nebo napřímo e-mailem, zpracovávám údaje, které mi sami sdělíte (nejčastěji jméno, e-mail, telefon a obsah zprávy).
            </p>
            <p className="mt-3">
              Tyto údaje potřebuji k jedinému účelu: abych vám mohl odpovědět na vaši poptávku, probrat s vámi detaily projektu a případně s vámi uzavřít spolupráci. Právním základem je jednání o smlouvě na vaši žádost (čl. 6 odst. 1 písm. b) GDPR) a po uzavření spolupráce její plnění a mé zákonné povinnosti (např. účetnictví).
            </p>
            <p className="mt-3">
              Na webu používám také vlastní měření návštěvnosti, abych věděl, odkud lidé na web přicházejí a zda funguje kontaktní formulář. Zaznamenávají se zobrazené stránky, kliknutí na tlačítka a odkazy, odeslání formuláře, zdroj návštěvy, typ zařízení a země. Používám k tomu vlastní měření a službu Vercel Web Analytics. Ani jedno nepoužívá cookies a do vašeho zařízení nic neukládá. IP adresa se neukládá: z ní a z údajů o prohlížeči vzniká anonymní otisk, který se každý den mění, takže vás nelze rozpoznat ani propojit vaše návštěvy v různých dnech. K údajům z formuláře se tato data nepřipojují. Právním základem je můj oprávněný zájem na fungování webu (čl. 6 odst. 1 písm. f) GDPR). Podrobné záznamy mažu po 180 dnech, dále zůstávají jen souhrnná čísla. Data jsou uložena v EU (Supabase, Irsko). Proti tomuto měření můžete vznést námitku na kontaktním e-mailu výše.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">3. Jak dlouho vaše data uchováváme?</h2>
            <p>
              Vaše údaje uchovávám pouze po dobu nezbytně nutnou. Pokud se nedomluvíme na spolupráci, vaše kontaktní údaje do 1 roku od naší poslední komunikace smažu. Pokud se stanete mým klientem, uchovávám data nutná pro fakturaci a vzájemnou komunikaci po dobu trvání spolupráce a následně dle zákonných lhůt (např. zákon o účetnictví).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">4. Kdo další má k datům přístup?</h2>
            <p>
              K vašim údajům mám přístup primárně já. Aby web a e-maily fungovaly, využívám tyto zpracovatele: Vercel (provoz webu, odeslání formuláře a měření návštěvnosti), Resend (doručení zprávy z kontaktního formuláře do mé schránky), Google (e-mailová schránka a písma webu) a Supabase (databáze měření a klientského portálu, uložená v EU). Někteří z nich sídlí v USA; předávání údajů tam probíhá na základě záruk podle GDPR (rozhodnutí o odpovídající ochraně pro EU-US Data Privacy Framework nebo standardní smluvní doložky). Vaše data nikdy neprodávám třetím stranám.
            </p>
          </section>

          {/* Apple requires the policy linked from an App Store listing to cover
              what the app itself collects, not just the website. Without this
              section a reviewer opens a document that never mentions the app —
              guideline 5.1.1. */}
          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">5. Klientský portál (aplikace MYVE Portál)</h2>
            <p>
              Klientský portál běží na <strong>portal.myve.media</strong> a jako mobilní aplikace <strong>MYVE Portál</strong>. Používají ho výhradně klienti se smlouvou — účty vydávám já, veřejná registrace neexistuje.
            </p>
            <p className="mt-3">
              V portálu zpracovávám jméno klienta a kontaktní údaje, které jste mi sdělili, zprávy a přílohy, které si v portálu vyměníme, a technický identifikátor zařízení pro doručení upozornění, pokud si je sami zapnete. Nesbírám polohu a aplikace neobsahuje reklamu ani analytické nástroje.
            </p>
            <p className="mt-3">
              Data portálu jsou uložena u zpracovatele <strong>Supabase</strong> (databáze a přílohy). Upozornění doručují <strong>Apple Push Notification service</strong> a <strong>Firebase Cloud Messaging</strong>; předává se jim pouze identifikátor zařízení a text upozornění. Obsah portálu vidíme jen vy a já — jeden klient nikdy nevidí obsah druhého.
            </p>
            <p className="mt-3">
              Obsah portálu uchovávám po dobu spolupráce. Po jejím skončení vám na požádání smažu účet i jeho obsah — stačí napsat na e-mail výše.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">6. Jaká jsou vaše práva?</h2>
            <p>
              Podle GDPR máte právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování a přenositelnost a právo vznést námitku proti zpracování založenému na oprávněném zájmu (například proti měření návštěvnosti). Stačí mi napsat na e-mail. Pokud se domníváte, že s vašimi údaji nenakládám správně, můžete podat stížnost u Úřadu pro ochranu osobních údajů (www.uoou.gov.cz).
            </p>
          </section>

          <div className="pt-8">
            <Link to="/" className="text-primary hover:underline">← Zpět na hlavní stránku</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
