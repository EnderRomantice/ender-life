import type { Metadata } from "next";
import { MailIcon, MarkGithubIcon } from "@primer/octicons-react";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

/* 图标来自 GitHub 官方的 Octicons（MIT）：邮件与 GitHub 标志，同一套线宽 */
export default function AboutPage() {
  return (
    <article className="about">
      <figure className="avatar">
        {site.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.avatar} alt={site.name} />
        ) : (
          <span aria-hidden>{site.name.charAt(0)}</span>
        )}
      </figure>

      {/* 名字已在左上角，这里只留给读屏软件 */}
      <h1 className="sr-only">{site.name}</h1>
      {site.motto && <p className="motto">“{site.motto}”</p>}

      {site.bio.length > 0 && (
        <div className="bio">
          {site.bio.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {(site.email || site.github) && (
        <section className="contact">
          <h2>Contact</h2>
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
  );
}
