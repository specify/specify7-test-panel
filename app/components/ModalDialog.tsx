import React from 'react';
import Modal from 'react-modal';
import css from 'styled-jsx/css';

export function ModalDialog({
  isOpen = true,
  title,
  buttons,
  children,
  onClose: handleClose,
}: {
  readonly isOpen?: boolean;
  readonly title: string;
  readonly buttons?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly onClose?: () => void;
}): JSX.Element {
  const { className } = css.resolve``;

  Modal.setAppElement('#__next');

  return (
    <div className="modal-root contents">
      <Modal
        className="w-full outline-none"
        closeTimeoutMS={100}
        contentLabel={title}
        isOpen={isOpen}
        overlayClassName={`
          w-screen h-screen absolute inset-0 flex items-center
          justify-center bg-shadow transition-opacity
        `}
        portalClassName={`${className}`}
        shouldCloseOnEsc={typeof handleClose === 'function'}
      >
        <div className="m-auto w-auto w-1/2 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-gray-50 p-4">
            <h3 className="text-lg text-gray-900">{title}</h3>
            {handleClose && (
              <div
                className={`
                  flex cursor-pointer items-center
                  justify-center rounded-full bg-red-100 sm:h-10
                  sm:w-10
                `}
                onClick={handleClose}
              >
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            )}
          </div>
          <div
            className="overflow-auto p-4 text-sm text-gray-500"
            style={{ maxHeight: '80vh' }}
          >
            {children}
          </div>
          <div className="flex justify-end gap-x-2 bg-gray-50 p-4">
            {buttons}
          </div>
        </div>
      </Modal>
      <style global jsx>{`
        .${className} > :global(.ReactModal__Overlay--after-open) {
          opacity: 1 !important;
        }

        .${className} > :global(.ReactModal__Overlay--before-close) {
          opacity: 0 !important;
        }
      `}</style>
    </div>
  );
}

export function Loading(): JSX.Element {
  return (
    <ModalDialog title="Loading...">
      {/* TODO: add a fancy loading bar here */}
      Loading...
    </ModalDialog>
  );
}
