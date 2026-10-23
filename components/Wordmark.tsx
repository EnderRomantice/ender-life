import Link from "next/link";

export default function Wordmark({ name, href }: { name: string; href: string }) {
  return (
    <Link href={href} className="wordmark" aria-label={name}>
      {name}
    </Link>
  );
}
