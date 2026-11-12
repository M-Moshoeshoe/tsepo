/**
 * How a payment moves through Tšepo, drawn as plain SVG. A wide layout for
 * larger screens and a stacked layout for phones, so the labels stay readable.
 */

function Node({ x, y, w, title, note }: { x: number; y: number; w: number; title: string; note: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={56} rx={6} className="fill-surface stroke-border" strokeWidth={1} />
      <text x={x + w / 2} y={y + 24} textAnchor="middle" className="fill-ink text-[14px] font-semibold">
        {title}
      </text>
      <text x={x + w / 2} y={y + 42} textAnchor="middle" className="fill-muted text-[12px]">
        {note}
      </text>
    </g>
  );
}

function Label({ x, y, children, anchor = 'middle' }: { x: number; y: number; children: string; anchor?: 'start' | 'middle' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="fill-muted text-[12px]">
      {children}
    </text>
  );
}

function Arrowhead({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" className="fill-teal" />
    </marker>
  );
}

const LINE = 'stroke-teal';

function WideDiagram() {
  return (
    <svg viewBox="0 0 1000 330" className="hidden h-auto w-full md:block" role="img" aria-labelledby="flow-wide-title flow-wide-desc">
      <title id="flow-wide-title">How a payment moves through Tšepo</title>
      <desc id="flow-wide-desc">
        The business sends its agent an instruction and gives the policy service signed limits. The agent asks the policy service
        to co-sign, and the policy service reads the agent credential from the XRP Ledger before it signs. The agent sends the
        travel package to the exchange first, then pays on the ledger with two signatures. The exchange agent lane accepts only
        agents that hold a valid credential.
      </desc>
      <defs>
        <Arrowhead id="flow-wide-arrow" />
      </defs>
      <g fill="none" strokeWidth={1.5} markerEnd="url(#flow-wide-arrow)">
        <path d="M190 198 H266" className={LINE} />
        <path d="M105 170 V68 H426" className={LINE} />
        <path d="M410 170 L470 100" className={LINE} markerStart="url(#flow-wide-arrow)" />
        <path d="M580 96 L650 166" className={LINE} />
        <path d="M430 198 H606" className={LINE} />
        <path d="M770 198 H846" className={LINE} />
        <path d="M350 226 V296 H915 V230" className={LINE} strokeDasharray="5 4" />
      </g>
      <Node x={20} y={170} w={170} title="Business" note="sets limits, can revoke" />
      <Node x={270} y={170} w={160} title="AI agent" note="reads the instruction" />
      <Node x={430} y={40} w={180} title="Policy service" note="co-signs within limits" />
      <Node x={610} y={170} w={160} title="XRP Ledger" note="holds the credential" />
      <Node x={850} y={170} w={140} title="Exchange" note="agent lane" />
      <Label x={228} y={188}>instruction</Label>
      <Label x={118} y={58} anchor="start">
        limits, signed by the business
      </Label>
      <Label x={452} y={150} anchor="start">
        co-signature
      </Label>
      <Label x={624} y={124} anchor="start">
        reads the credential
      </Label>
      <Label x={518} y={188}>payment, two signatures</Label>
      <Label x={808} y={248}>credential required</Label>
      <Label x={632} y={318}>travel package, sent before the payment</Label>
    </svg>
  );
}

function StackedDiagram() {
  const nodes = [
    { title: 'Business', note: 'sets limits, can revoke' },
    { title: 'AI agent', note: 'reads the instruction' },
    { title: 'Policy service', note: 'co-signs within limits' },
    { title: 'XRP Ledger', note: 'holds the credential' },
    { title: 'Exchange', note: 'agent lane' },
  ];
  const edges = ['instruction and signed limits', 'asks for a co-signature', 'payment with two signatures', 'credential required'];
  const step = 108;
  return (
    <svg viewBox="0 0 340 560" className="h-auto w-full md:hidden" role="img" aria-labelledby="flow-stacked-title flow-stacked-desc">
      <title id="flow-stacked-title">How a payment moves through Tšepo</title>
      <desc id="flow-stacked-desc">
        From top to bottom: the business gives the agent an instruction and the policy service signed limits; the agent asks the
        policy service to co-sign; the payment goes to the XRP Ledger with two signatures; the exchange agent lane accepts only
        agents with a valid credential. The travel package reaches the exchange before the payment.
      </desc>
      <defs>
        <Arrowhead id="flow-stacked-arrow" />
      </defs>
      {edges.map((edge, index) => (
        <g key={edge}>
          <path
            d={`M100 ${index * step + 56} V${(index + 1) * step - 4}`}
            fill="none"
            strokeWidth={1.5}
            className={LINE}
            markerEnd="url(#flow-stacked-arrow)"
          />
          <Label x={112} y={index * step + 86} anchor="start">
            {edge}
          </Label>
        </g>
      ))}
      {nodes.map((node, index) => (
        <Node key={node.title} x={20} y={index * step} w={200} title={node.title} note={node.note} />
      ))}
      <Label x={20} y={548} anchor="start">
        The travel package reaches the exchange first.
      </Label>
    </svg>
  );
}

export function FlowDiagram() {
  return (
    <>
      <WideDiagram />
      <StackedDiagram />
    </>
  );
}
