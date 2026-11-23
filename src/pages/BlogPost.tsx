import { Link, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import ConsultationDialog from "@/components/ConsultationDialog";
import CallLink from "@/components/CallLink";
import GradientRimButton from "@/components/ui/GradientRimButton";
import NotFound from "./NotFound";
import { POSTS, postBySlug } from "@/blog/posts";
import { czDate, parts, postLd, readMinutes } from "@/blog/types";

const Rich = ({ s }: { s: string }) => (
  <>{parts(s).map((p, i) => p.href
    ? <Link key={i} to={p.href} className="text-primary hover:underline">{p.text}</Link>
    : <span key={i}>{p.text}</span>)}</>
);

// /blog/:slug — one article (src/blog/posts/<slug>.json)
const BlogPost = () => {
  const { slug } = useParams();
  const p = postBySlug(slug);
  if (!p) return <NotFound />;
  const more = POSTS.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Seo title={p.seoTitle} description={p.description} path={`/blog/${p.slug}`} type="article" jsonLd={postLd(p)} />
      <Navbar />
      <main className="pt-32 pb-24 lg:pt-44">
        <article className="container mx-auto px-6 lg:px-12 max-w-3xl">
          <nav aria-label="Drobečková navigace" className="text-sm text-muted-foreground mb-10">
            <Link to="/" className="hover:text-foreground transition-colors">MYVE</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </nav>
          <p className="text-sm text-muted-foreground">{czDate(p.date)} · {readMinutes(p)} min čtení · Vít Fendrych, MYVE</p>
          <h1 className="font-display font-bold text-foreground text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05] mt-4">{p.title}</h1>
          <p className="text-foreground/90 text-lg md:text-xl leading-relaxed mt-8"><Rich s={p.lead} /></p>

          {p.sections.map((s) => (
            <section key={s.h2} className="mt-12">
              <h2 className="font-display font-semibold text-foreground text-2xl md:text-3xl mb-5">{s.h2}</h2>
              {s.text?.map((t) => <p key={t} className="text-muted-foreground text-lg leading-relaxed mb-4"><Rich s={t} /></p>)}
              {s.bullets && (
                <ul className="grid gap-3 mt-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-foreground/90 text-lg leading-relaxed">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-1.5" aria-hidden />
                      <span><Rich s={b} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {p.faq.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display font-semibold text-foreground text-2xl md:text-3xl mb-6">Časté otázky</h2>
              <div className="grid gap-5">
                {p.faq.map((f) => (
                  <div key={f.q} className="rounded-2xl bg-card border border-border p-6">
                    <h3 className="font-display font-semibold text-foreground text-lg">{f.q}</h3>
                    <p className="text-muted-foreground leading-relaxed mt-2"><Rich s={f.a} /></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-14 rounded-2xl bg-card border border-border p-7 md:p-9">
            <h2 className="font-display font-semibold text-foreground text-2xl">Chcete to řešit u vás ve firmě?</h2>
            <p className="text-muted-foreground leading-relaxed mt-3">Po krátkém nezávazném hovoru vám řekneme, co má smysl, kolik to bude stát a kdy to bude hotové.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <ConsultationDialog source={`blog-${p.slug}`}>
                <GradientRimButton as="button" variant="filled">
                  <span>Zjistit, co by to stálo</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </GradientRimButton>
              </ConsultationDialog>
              <CallLink source={`blog-${p.slug}`} />
            </div>
          </section>

          {(p.related.length > 0 || more.length > 0) && (
            <nav aria-label="Související" className="mt-14">
              <h2 className="font-display font-semibold text-foreground text-xl mb-4">Mohlo by vás zajímat</h2>
              <ul className="grid gap-2">
                {p.related.map((r) => <li key={r.path}><Link to={r.path} className="text-primary hover:underline">{r.label}</Link></li>)}
                {more.map((m) => <li key={m.slug}><Link to={`/blog/${m.slug}`} className="text-primary hover:underline">{m.title}</Link></li>)}
              </ul>
            </nav>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
