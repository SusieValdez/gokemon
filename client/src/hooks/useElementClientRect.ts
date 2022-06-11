import { useEffect, useState } from "react";

export const useElementClientRect = <E extends HTMLElement>(
  ref: React.RefObject<E>
): DOMRect => {
  const [rect, setRect] = useState<DOMRect>(new DOMRect());
  useEffect(() => {
    const onResize = () => {
      if (ref.current) {
        setRect(ref.current.getBoundingClientRect());
      }
    };
    if (ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [ref]);
  return rect;
};
