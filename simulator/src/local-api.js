export function createLocalApi() {
  return { async call(name, params={}) {
    const response=await fetch(`/api/sim/${name}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params),
      signal:AbortSignal.timeout(15000),
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.message || 'Simulator request failed.');
    return data;
  }};
}
