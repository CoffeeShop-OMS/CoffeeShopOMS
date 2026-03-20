import { ToastContainer } from "react-toastify";

export default function StyledToastContainer() {
  return (
    <>
      <style>{`
        .Toastify__toast-container--bottom-right {
          bottom: 1.5rem !important;
          right: 1.5rem !important;
          padding: 0 !important;
          width: 360px !important;
        }

        .Toastify__toast {
          font-family: 'DM Sans', sans-serif;
          border-radius: 14px !important;
          padding: 14px 16px !important;
          min-height: unset !important;
          margin-bottom: 10px !important;
          box-shadow: 0 4px 24px rgba(61, 38, 29, 0.10), 0 1px 4px rgba(61, 38, 29, 0.06) !important;
          border: 1px solid transparent;
          backdrop-filter: blur(4px);
        }

        .Toastify__toast--success {
          background: #FDFAF6 !important;
          border-color: #D4A87A !important;
        }

        .Toastify__toast--error {
          background: #FFF8F8 !important;
          border-color: #F5C0C0 !important;
        }

        .Toastify__toast--warning {
          background: #FFFCF0 !important;
          border-color: #E8D57A !important;
        }

        .Toastify__toast--info {
          background: #F8F6FF !important;
          border-color: #C4B8F0 !important;
        }

        .Toastify__toast-body {
          padding: 0 !important;
          margin: 0 !important;
          align-items: center !important;
          gap: 10px !important;
        }

        .Toastify__toast-body > div:last-child {
          font-size: 13px !important;
          font-weight: 500 !important;
          line-height: 1.45 !important;
          color: #1C100A !important;
        }

        /* Icons */
        .Toastify__toast-icon {
          width: 18px !important;
          margin-right: 0 !important;
          flex-shrink: 0;
        }

        .Toastify__toast--success .Toastify__toast-icon svg { color: #8B5E3C; }
        .Toastify__toast--error   .Toastify__toast-icon svg { color: #C0392B; }
        .Toastify__toast--warning .Toastify__toast-icon svg { color: #B8960C; }
        .Toastify__toast--info    .Toastify__toast-icon svg { color: #5B4FCF; }

        /* Progress bar */
        .Toastify__progress-bar {
          height: 2px !important;
          border-radius: 0 0 14px 14px !important;
          opacity: 1 !important;
        }

        .Toastify__progress-bar--success {
          background: linear-gradient(to right, #8B5E3C, #C4935A) !important;
        }

        .Toastify__progress-bar--error {
          background: linear-gradient(to right, #C0392B, #E57373) !important;
        }

        .Toastify__progress-bar--warning {
          background: linear-gradient(to right, #B8960C, #D4B83A) !important;
        }

        .Toastify__progress-bar--info {
          background: linear-gradient(to right, #5B4FCF, #8B80E8) !important;
        }

        /* Close button */
        .Toastify__close-button {
          color: #9E8A7A !important;
          opacity: 1 !important;
          align-self: center !important;
          transition: color 0.15s !important;
        }

        .Toastify__close-button:hover {
          color: #3D261D !important;
        }

        .Toastify__close-button > svg {
          width: 14px !important;
          height: 14px !important;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .Toastify__toast-container--bottom-right {
            bottom: 0.75rem !important;
            right: 0.75rem !important;
            left: 0.75rem !important;
            width: auto !important;
          }

          .Toastify__toast {
            border-radius: 12px !important;
            padding: 12px 14px !important;
          }
        }
      `}</style>

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
      />
    </>
  );
}