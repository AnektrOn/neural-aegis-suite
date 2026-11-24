export async function deliverConfirmationFirst<T>(jobs: T[], send: (job: T) => Promise<void>) {
  const welcome = jobs[0];
  if (!welcome) throw new Error('Confirmation job missing');
  await send(welcome);
  for (const job of jobs.slice(1)) {
    try { await send(job); } catch { console.error('AppSumo operator notice failed'); }
  }
}