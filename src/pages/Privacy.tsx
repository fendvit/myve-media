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
              Tyto údaje potřebuji k jedinému účelu: abych vám mohl odpovědět na vaši poptávku, probrat s vámi detaily projektu a případně s vámi uzavřít spolupráci.
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
              K vašim údajům mám přístup primárně já. Aby mi však web a e-maily správně fungovaly, mohu využívat prověřené poskytovatele softwaru (např. poskytovatele e-mailových schránek nebo webhostingu), kteří s daty nakládají rovněž v souladu s GDPR. Vaše data nikdy neprodávám třetím stranám.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold mt-8 mb-3">5. Jaká jsou vaše práva?</h2>
            <p>
              Podle GDPR máte právo mě kdykoliv požádat o informaci, jaká data o vás zpracovávám, chtít jejich úpravu, nebo požádat o jejich kompletní smazání z mé databáze. Stačí mi napsat na e-mail.
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
