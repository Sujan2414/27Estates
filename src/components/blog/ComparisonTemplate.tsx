import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema } from '@/lib/seo/schema';

type Side = { name: string; bullets: string[] };
type Criterion = { label: string; left: string; right: string };
type Faq = { question: string; answer: string };

type Props = {
    title: string;
    intro: string;
    left: Side;
    right: Side;
    criteria: Criterion[];
    verdict: string;
    faqs: Faq[];
};

export default function ComparisonTemplate({
    title,
    intro,
    left,
    right,
    criteria,
    verdict,
    faqs,
}: Props) {
    return (
        <article className="prose max-w-3xl mx-auto px-4 py-8">
            <h1>{title}</h1>
            <p>{intro}</p>

            <h2>At a Glance</h2>
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>{left.name}</th>
                        <th>{right.name}</th>
                    </tr>
                </thead>
                <tbody>
                    {criteria.map((c) => (
                        <tr key={c.label}>
                            <td>{c.label}</td>
                            <td>{c.left}</td>
                            <td>{c.right}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>{left.name} — Highlights</h2>
            <ul>{left.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>

            <h2>{right.name} — Highlights</h2>
            <ul>{right.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>

            <h2>Verdict</h2>
            <p>{verdict}</p>

            <h2>Frequently Asked Questions</h2>
            <dl>
                {faqs.map((f, i) => (
                    <div key={i}>
                        <dt><strong>{f.question}</strong></dt>
                        <dd>{f.answer}</dd>
                    </div>
                ))}
            </dl>

            <JsonLd data={buildFaqSchema(faqs)} />
        </article>
    );
}
