import { consoleReport } from '../src/cli/console-report.ts';
import { runScript } from '../src/cli/run.ts';
import { RunRequestSchema } from '../src/demo/events.ts';
import { runDemo } from '../src/demo/runs.ts';

/** Runs one demo action from the terminal: node scenarios/run.ts <reset|scenario-1|scenario-2|scenario-3|scenario-4|revoke>. */
const request = RunRequestSchema.parse({ kind: process.argv[2] });
await runScript(request.kind, (client) => runDemo(request, client, consoleReport));
