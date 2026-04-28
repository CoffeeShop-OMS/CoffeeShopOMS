import { Toaster } from 'sonner';

const toasterTheme = {
  '--normal-bg': '#FDFAF6',
  '--normal-border': '#E7D9CC',
  '--normal-text': '#1C100A',
  '--success-bg': '#FDFAF6',
  '--success-border': '#D4A87A',
  '--success-text': '#8B5E3C',
  '--error-bg': '#FFF8F8',
  '--error-border': '#F5C0C0',
  '--error-text': '#C0392B',
  '--warning-bg': '#FFFCF0',
  '--warning-border': '#E8D57A',
  '--warning-text': '#B8960C',
  '--info-bg': '#F8F6FF',
  '--info-border': '#C4B8F0',
  '--info-text': '#5B4FCF',
  '--border-radius': '14px',
};

export default function StyledToastContainer() {
  return (
    <>
      <style>{`
        [data-sonner-toaster] {
          --width: 360px;
          font-family: "Segoe UI", sans-serif;
        }

        .inventory-toast {
          padding: 14px 16px !important;
          gap: 10px !important;
          box-shadow: 0 4px 24px rgba(61, 38, 29, 0.1), 0 1px 4px rgba(61, 38, 29, 0.06) !important;
          backdrop-filter: blur(4px);
        }

        .inventory-toast-title {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.45;
        }

        .inventory-toast-description {
          font-size: 12px;
          line-height: 1.4;
          color: rgba(28, 16, 10, 0.78);
        }

        .inventory-toast-content {
          gap: 2px;
        }

        .inventory-toast-icon {
          width: 18px;
          height: 18px;
        }

        .inventory-toast-close {
          width: 20px !important;
          height: 20px !important;
          color: #9e8a7a !important;
          border-color: rgba(212, 168, 122, 0.35) !important;
        }

        .inventory-toast-close:hover {
          color: #3d261d !important;
          background: rgba(255, 255, 255, 0.92) !important;
        }

        @media (max-width: 640px) {
          [data-sonner-toaster] {
            --width: calc(100vw - 1.5rem);
          }

          .inventory-toast {
            padding: 12px 14px !important;
          }
        }
      `}</style>

      <Toaster
        position="bottom-right"
        theme="light"
        richColors
        closeButton
        duration={3500}
        visibleToasts={5}
        offset="1.5rem"
        mobileOffset="0.75rem"
        toastOptions={{
          style: toasterTheme,
          classNames: {
            toast: 'inventory-toast',
            title: 'inventory-toast-title',
            description: 'inventory-toast-description',
            content: 'inventory-toast-content',
            icon: 'inventory-toast-icon',
            closeButton: 'inventory-toast-close',
          },
        }}
      />
    </>
  );
}
