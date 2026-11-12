import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Every page the app serves, found from the page files, so a new page that nothing links to fails the navigation tests. */
export function pageRoutes(directory = join(import.meta.dirname, '..', 'app'), root = directory): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith('_') || entry.name === 'api' ? [] : pageRoutes(path, root);
    if (entry.name !== 'page.tsx') return [];
    const segments = relative(root, directory)
      .split(sep)
      .filter((segment) => segment !== '' && !(segment.startsWith('(') && segment.endsWith(')')));
    return [`/${segments.join('/')}`];
  });
}
