import { ShortAddress } from '../display.tsx';

export interface RecipientRow {
  name: string;
  address: string;
  destinationTag: number | undefined;
  paidThrough: string | undefined;
}

const HEAD = 'px-4 py-2.5 text-left text-xs font-semibold text-quaternary lg:px-5';
const CELL = 'px-4 py-2.5 lg:px-5';

/** The people the agent may pay, as a compact plain table. */
export function RecipientsTable({ recipients }: { recipients: RecipientRow[] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Approved recipients</caption>
      <thead className="bg-secondary">
        <tr>
          <th scope="col" className={HEAD}>
            Name
          </th>
          <th scope="col" className={HEAD}>
            Paid through
          </th>
          <th scope="col" className={`${HEAD} text-right`}>
            Account number at the exchange
          </th>
          <th scope="col" className={`${HEAD} max-sm:hidden`}>
            Account
          </th>
        </tr>
      </thead>
      <tbody>
        {recipients.map((recipient) => (
          <tr key={`${recipient.address}-${String(recipient.destinationTag)}`} className="border-t border-secondary">
            <th scope="row" className={`${CELL} text-left font-medium text-primary`}>
              {recipient.name}
            </th>
            <td className={`${CELL} text-secondary`}>{recipient.paidThrough ?? 'Paid directly'}</td>
            <td className={`${CELL} text-right text-secondary tabular-nums`}>{recipient.destinationTag ?? 'None'}</td>
            <td className={`${CELL} max-sm:hidden`}>
              <ShortAddress address={recipient.address} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
