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
        isOpen={isOpen}
        closeTimeoutMS={100}
        contentLabel={title}
        portalClassName={`${className}`}
        overlayClassName={
          'w-screen h-screen absolute inset-0 flex items-center ' +
          'justify-center bg-shadow transition-opacity'
        }
        className={'w-full outline-none'}
        shouldCloseOnEsc={typeof handleClose === 'function'}
      >
        <div className="w-auto w-1/2 m-auto bg-white shadow-xl">
          <div
            className={`bg-gray-50 p-4 flex justify-between
          items-center`}
          >
            <h3 className="text-lg text-gray-900">{title}</h3>
            {handleClose && (
              <div
                className={`flex items-center justify-center
                rounded-full bg-red-100 sm:h-10 sm:w-10
                cursor-pointer`}
                onClick={handleClose}
              >
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>
          <div
            className="p-4 overflow-auto text-sm text-gray-500"
            style={{ maxHeight: '80vh' }}
          >
            {children}
          </div>
          <div className="bg-gray-50 gap-x-2 flex justify-end p-4">
            {buttons}
          </div>
        </div>
      </Modal>
      <style jsx global>{`
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
