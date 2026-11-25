import { useEffect, useState } from "react";
export function useMedia(q: string): boolean {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => { const mq = matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener("change", on); on(); return () => mq.removeEventListener("change", on); }, [q]);
  return m;
}
