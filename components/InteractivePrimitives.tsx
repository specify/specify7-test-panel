import React from 'react';

const baseButtonStyle =
  'inline-flex px-4 py-2 rounded-md sm:text-sm justify-center text-white';
export const primaryButtonClassName = `${baseButtonStyle} bg-white
  hover:bg-grey-500 border`;
export const secondaryButtonClassName = `${baseButtonStyle} bg-grey-200
  hover:bg-grey-700 border`;
export const dangerButtonClassName = `${baseButtonStyle} bg-red-600
  hover:bg-red-700`;
export const successButtonClassName = `${baseButtonStyle} bg-green-600
  hover:bg-green-700`;
export const extraButtonClassName = `${baseButtonStyle} bg-purple-600
  hover:bg-purple-700`;

export const fieldClassName = 'border p-1.5 rounded-md bg-gray-200';

export function LabeledField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <label className="first:border-none flex flex-col">
      <span className="pb-1 text-sm">{label}</span>
      <span className={fieldClassName}>{children}</span>
    </label>
  );
}
