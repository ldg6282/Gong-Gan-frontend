import { useEffect } from "react";
import { useAtom } from "jotai";
import { toastAtom } from "../atoms/atoms";

export default function ToastPopup() {
  const [toast, setToast] = useAtom(toastAtom);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ ...toast, message: "" });
      }, 1500);

      return () => clearTimeout(timer);
    }

    return () => {};
  }, [toast, setToast]);

  if (!toast.message) return null;

  return (
    <div className="fixed w-80 h-12 top-4 pt-2.5 left-1/2 transform -translate-x-1/2 bg-blue font-sans text-center text-lg rounded">
      {toast.message}
    </div>
  );
}
