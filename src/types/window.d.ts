// Расширение глобального объекта Window для PWA
export {};

declare global {
  interface Window {
    showPWAUpdateNotification?: (onUpdate: () => void) => void;
  }
}
