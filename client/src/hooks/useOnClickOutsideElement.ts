import { useEffect } from "react";

export const useOnClickOutsideElement = <E extends HTMLElement>(
  ref: React.RefObject<E>,
  onClick: () => void
) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClick();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
};

export const useOnClickOutsideElements = <E extends HTMLElement>(
  refs: React.RefObject<E>[],
  onClick: () => void
) => {
  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      for (const ref of refs) {
        if (ref.current && ref.current.contains(event.target as Node)) {
          return;
        }
      }
      onClick();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [...refs]);
};
