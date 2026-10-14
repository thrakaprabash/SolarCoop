// Seed the first board silently. Remember IDs for the session so polling,
// duplicate Realtime events, acceptance and reconnection cannot repeat a chime.
export function createFaultInbox() {
  let initialized=false;
  const seen=new Set();
  return {
    update(jobs) {
      const incoming=[];
      for(const job of jobs) {
        if(initialized && !seen.has(job.id) && job.status==='pending' && job.source==='telemetry') incoming.push(job);
        seen.add(job.id);
      }
      initialized=true;
      const urgency={urgent:0,medium:1,low:2};
      return incoming.sort((a,b)=>(urgency[a.urgency]??3)-(urgency[b.urgency]??3)||String(b.createdAt).localeCompare(String(a.createdAt)));
    },
  };
}
