import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

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
                {site.email}
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
                github.com/{site.github}
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
