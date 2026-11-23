// Every article in src/blog/posts/*.json, newest first (browser side; the prerender reads the
// same folder with fs, because import.meta.glob exists only inside Vite).
import { sortPosts, type BlogPost } from "./types";

const files = import.meta.glob<BlogPost>("./posts/*.json", { eager: true, import: "default" });

export const POSTS: BlogPost[] = sortPosts(Object.values(files));
export const postBySlug = (slug?: string) => POSTS.find((p) => p.slug === slug);
