import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { POSTS } from "@/blog/posts";
import { BLOG_META, czDate, readMinutes } from "@/blog/types";
import { SITE, breadcrumbLd } from "@/seo/content";

// /blog — every article, newest first (articles: src/blog/posts/*.json)
const Blog = () => (
  <div className="min-h-screen bg-background">
    <Seo title={BLOG_META.title} description={BLOG_META.description} path="/blog"
      jsonLd={[breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Blog", path: "/blog" }]),
        { "@context": "https://schema.org", "@type": "Blog", name: "Blog MYVE", url: `${SITE}/blog`, inLanguage: "cs-CZ",
          publisher: { "@id": `${SITE}/#business` } }]} />
    <Navbar />
    <main className="pt-32 pb-24 lg:pt-44 container mx-auto px-6 lg:px-12 max-w-5xl">
      <nav aria-label="Drobečková navigace" className="text-sm text-muted-foreground mb-10">
        <Link to="/" className="hover:text-foreground transition-colors">MYVE</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground/80">Blog</span>
      </nav>
      <p className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-4">Blog</p>
      <h1 className="display-type text-foreground text-[clamp(1.6rem,9vw,6rem)] leading-[0.95]">Weby, AI a automatizace v praxi</h1>
      <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mt-8 max-w-3xl">
        Odpovědi na otázky, které nám firmy kladou nejčastěji: jak využít umělou inteligenci, co se dá zautomatizovat a jak postavit web, který přivádí zákazníky.
      </p>
      {POSTS.length === 0 ? (
        <p className="text-muted-foreground mt-16">První článek připravujeme.</p>
      ) : (
        <ul className="grid gap-6 mt-16">
          {POSTS.map((p) => (
            <li key={p.slug}>
              <Link to={`/blog/${p.slug}`} className="group block rounded-2xl bg-card border border-border p-7 md:p-9 hover:border-primary/40 transition-colors">
                <p className="text-sm text-muted-foreground">{czDate(p.date)} · {readMinutes(p)} min čtení</p>
                <h2 className="font-display font-semibold text-foreground text-2xl md:text-3xl mt-3 group-hover:text-primary transition-colors">{p.title}</h2>
                <p className="text-muted-foreground leading-relaxed mt-3 max-w-3xl">{p.description}</p>
                <span className="inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-5">
                  Číst článek <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
    <Footer />
  </div>
);

export default Blog;
