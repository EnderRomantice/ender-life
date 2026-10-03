import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { MailIcon, MarkGithubIcon, RssIcon } from "@primer/octicons-react";
import { site } from "@/lib/site";
import { markdown } from "@/lib/markdown";
import { getDictionary, isLocale } from "@/lib/i18n";
import Magnet from "@/components/reactbits/Magnet";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getDictionary(lang).aboutTitle : "About" };
}

/* 图标来自 GitHub 官方的 Octicons（MIT）：邮件与 GitHub 标志，同一套线宽 */
export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const bio = site.bio[lang];

  return (
    <ViewTransition>
    <article className="about">
      {/* 光标靠近时，头像轻轻倾向光标 */}
      <Magnet
        wrapperClassName="avatar-magnet"
        padding={48}
        magnetStrength={10}
        maxOffset={7}
        activeTransition="transform 0.45s cubic-bezier(0.2, 0, 0, 1)"
        inactiveTransition="transform 0.9s cubic-bezier(0.2, 0, 0, 1)"
      >
        <figure className="avatar">
          {site.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.avatar} alt={site.name} />
          ) : (
            <span aria-hidden>{site.name.charAt(0)}</span>
          )}
        </figure>
      </Magnet>

      {/* 名字已在左上角，这里只留给读屏软件 */}
      <h1 className="sr-only">{site.name}</h1>
      {site.motto && <p className="motto">“{site.motto}”</p>}

      {bio.length > 0 && <div className="bio" dangerouslySetInnerHTML={{ __html: markdown(bio.join("\n\n")) }} />}

      {(site.email || site.github) && (
        <section className="contact">
          <h2>{t.contact}</h2>
          {site.email && (
            <p>
              <a className="about-link" href={`mailto:${site.email}`}>
                <MailIcon className="about-icon" size={16} aria-hidden />
                <span>{site.email}</span>
              </a>
            </p>
          )}
          {site.github && (
            <p>
              <a
                className="about-link"
                href={`https://github.com/${site.github}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MarkGithubIcon className="about-icon" size={16} aria-hidden />
                <span>github.com/{site.github}</span>
              </a>
            </p>
          )}
          <p>
            <a className="about-link" href="/feed.xml" type="application/rss+xml" title={t.rssTitle}>
              <RssIcon className="about-icon" size={16} aria-hidden />
              <span>RSS</span>
            </a>
          </p>
        </section>
      )}

      {site.intro.length > 0 && (
        <div className="verses">
          {site.intro.map((v, i) => (
            <section key={i} className="verse">
              <div className="body">
                {v.text.split("\n\n").map((stanza, k) => (
                  <p key={k}>
                    {stanza.split("\n").map((line, j) => (
                      <span key={j} className="line">
                        {line}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
              {v.source && <p className="source">{v.source}</p>}
            </section>
          ))}
        </div>
      )}
    </article>
    </ViewTransition>
  );
}
