import create from "zustand";

export const useStore = create((set) => ({
  showToast: false,
  toastMessage: "Oops! something went wrong. Please try again later.",
  showToastFunc: (toastMessage) => {
    set((state) => ({ showToast: true }));
    set((state) => ({ toastMessage }));
    setTimeout(() => {
      set((state) => ({ showToast: false }));
    }, 5000);
  },
  minutes: 0,
  setMinutes: (value) => set((state) => ({ minutes: value })),
  currentBalance: 0,
  setCurrentBalance: (value) => ({ currentBalance: value }),
  ceramic: null,
  threeID: null,
  setCeramic: (value) => set((state) => ({ ceramic: value })),
  setThreeID: (value) => set((state) => ({ threeID: value })),
}));
