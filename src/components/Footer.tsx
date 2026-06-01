import { Instagram, Facebook, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative pt-12 pb-8 overflow-hidden">
      {/* Wave SVG divider */}
      <div className="absolute top-0 left-0 right-0 -translate-y-[99%]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 60V20C240 0 480 40 720 30C960 20 1200 0 1440 20V60H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 lg:px-12">
        {/* Motto */}
        <p className="text-center text-muted-foreground text-sm mb-8 font-display">
          Tvoříme s vášní, doručujeme s péčí
        </p>

        {/* Social icons */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { icon: Instagram, href: "https://www.instagram.com/myve.media/", label: "Instagram" },
            { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100092353287649", label: "Facebook" },
            { icon: Mail, href: "mailto:fendvit.bis@gmail.com", label: "Email" },
          ].map((social) => (
            <motion.a
              key={social.label}
              href={social.href}
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              aria-label={social.label}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <social.icon className="w-4 h-4" />
            </motion.a>
          ))}
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm text-muted-foreground text-center md:text-left">
          <div>
            <p className="font-semibold text-foreground mb-1">Adresa</p>
            <p>Obránců míru 449</p>
            <p>551 01, Jaroměř - Jakubské Předměstí</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Kontakt</p>
            <p>
              <a href="tel:+420602513145" className="hover:text-primary transition-colors">+420 602 513 145</a>
            </p>
            <p>
              <a href="mailto:fendvit.bis@gmail.com" className="hover:text-primary transition-colors">fendvit.bis@gmail.com</a>
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">IČO</p>
            <p>24512362</p>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-sm text-muted-foreground">
            © {new Date().getFullYear()} <span className="text-gradient font-semibold">MYVE</span> — Making You Visible Everywhere
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/zasady-ochrany-osobnich-udaju" className="hover:text-primary transition-colors">
              Zásady ochrany osobních údajů
            </Link>
            <span>Vít Fendrych</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
