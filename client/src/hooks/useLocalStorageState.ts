import { SetStateAction, useEffect, useState } from "react";

export const useLocalStorageState = <T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      setValue(JSON.parse(storedValue));
    }
  }, []);
  return [
    value,
    (newValue: SetStateAction<T>) => {
      localStorage.setItem(key, JSON.stringify(newValue));
      setValue(newValue);
    },
  ];
};
