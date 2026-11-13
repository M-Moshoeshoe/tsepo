import { ArrowRight } from '@untitledui/icons';
import Link from 'next/link';
import { Section, TEXT_LINK } from '../section.tsx';

const QUESTIONS: { question: string; answer: string; proof: { label: string; href: string } }[] = [
  {
    question: 'What may the agent do?',
    answer: 'It may do only what its spending rules allow: a limit per payment, a limit per day and an end date. The agent cannot change them.',
    proof: { label: 'See the spending rules', href: '/business/rules' },
  },
  {
    question: 'Who can it pay?',
    answer: 'It can pay only the approved recipients named in the signed rules. A payment to anyone else is refused before it is sent.',
    proof: { label: 'See the approved recipients', href: '/business/rules' },
  },
  {
    question: 'How do I stop it?',
    answer: 'You revoke it. Your business key deletes its credential from the ledger, and within seconds every payment it asks for is refused.',
    proof: { label: 'Watch a revocation live', href: '/business?tour=4' },
  },
  {
    question: 'How do I prove what it did and why?',
    answer: 'Every payment keeps its instruction, its decision and the reasons, its Travel Rule details and its ledger record.',
    proof: { label: 'See the payments and their evidence', href: '/business/payments' },
  },
];

/** The four questions a CFO asks, each answered with a link to its proof in the product. */
export function CfoQuestions() {
  return (
    <Section id="questions" title="The four questions your CFO will ask." intro="Each answer links to its proof in the product.">
      <dl className="grid gap-px overflow-hidden rounded-2xl bg-border-secondary ring-1 ring-secondary md:grid-cols-2">
        {QUESTIONS.map((item) => (
          <div key={item.question} className="grid content-start gap-3 bg-primary p-6 md:p-8">
            <dt className="text-xl font-medium text-primary">{item.question}</dt>
            <dd className="grid gap-4">
              <p className="text-md text-tertiary">{item.answer}</p>
              <Link href={item.proof.href} className={TEXT_LINK}>
                {item.proof.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
