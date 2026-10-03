import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

/* 细线图标：与正文同色系，描边 1.25 */
function MailIcon() {
  return (
    <svg className="about-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="about-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="5.5" r="2" />
      <circle cx="6" cy="18.5" r="2" />
      <circle cx="18" cy="7.5" r="2" />
      <path d="M6 7.5v9" />
      <path d="M18 9.5c0 4.5-6 4-10.6 7.6" />
    </svg>
  );
}

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

      <h1 className="name">{site.name}</h1>
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
                <MailIcon />
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
                <CodeIcon />
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
