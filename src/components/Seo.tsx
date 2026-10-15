import { Helmet } from "react-helmet-async";
import { OG_IMAGE, SITE } from "@/seo/content";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  // schema.org objects for this page (the firm itself is in index.html on every page)
  jsonLd?: object[];
  noindex?: boolean;
}

const Seo = ({ title, description, path, type = "website", image = OG_IMAGE, jsonLd = [], noindex = false }: SeoProps) => {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd.map((o, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(o)}</script>
      ))}
    </Helmet>
  );
};

export default Seo;
