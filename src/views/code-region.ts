/**
 * Cuts one marked region out of a source file, so a page can show the code
 * of a runnable example exactly as it is written. A region sits between
 * "// #region name" and "// #endregion name"; its common indentation is
 * removed. A missing region is an error, never an empty block.
 */
export function codeRegion(source: string, name: string): string {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `// #region ${name}`);
  const end = lines.findIndex((line, index) => index > start && line.trim() === `// #endregion ${name}`);
  if (start === -1 || end === -1) throw new Error(`The region "${name}" is missing from the example`);
  const body = lines.slice(start + 1, end);
  const indent = Math.min(...body.filter((line) => line.trim() !== '').map((line) => line.length - line.trimStart().length));
  return body.map((line) => line.slice(Number.isFinite(indent) ? indent : 0)).join('\n').trim();
}
