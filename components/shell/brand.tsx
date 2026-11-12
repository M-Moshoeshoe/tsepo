import { Mark } from '../display.tsx';

/** The Tšepo mark and name, as shown at the top of the sidebar and the phone header. */
export function Brand() {
  return (
    <span className="flex items-center gap-2 text-md font-semibold text-primary">
      <Mark className="size-6" />
      Tšepo
    </span>
  );
}
