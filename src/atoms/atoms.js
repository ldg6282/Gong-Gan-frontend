import { atom } from "jotai";

export const htmlContentAtom = atom("");

export const zoomScaleAtom = atom(1);

export const soundButtonAtom = atom(true);

export const micButtonAtom = atom(true);

export const toastAtom = atom({ message: "", type: "info" });
