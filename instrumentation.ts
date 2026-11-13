/** Runs once when the server starts. On the Node.js server it starts the payout schedule's timer. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startScheduleTimer } = await import('./src/schedule/timer.ts');
  startScheduleTimer(process.env.PORT ?? '3000');
}
