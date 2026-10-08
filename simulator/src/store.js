export function createStore(initial) {
  let value = initial;
  const listeners = new Set();
  return { get:()=>value, set(patch) { value={...value,...patch}; for(const listener of listeners) listener(value); },
    subscribe(listener) { listeners.add(listener); return ()=>listeners.delete(listener); } };
}
