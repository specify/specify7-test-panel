import React from 'react';

export type RawTagProps<TAG extends keyof React.ReactHTML> = Exclude<
  Parameters<React.ReactHTML[TAG]>[0],
  null | undefined
>;

const className = 'resize-none rounded-md bg-gray-200 p-2';

export function AutoGrowTextArea({
  containerClassName,
  ...props
}: RawTagProps<'textarea'> & {
  readonly containerClassName?: string;
}): JSX.Element {
  const [textArea, setTextArea] = React.useState<HTMLTextAreaElement | null>(
    null
  );
  const [shadow, setShadow] = React.useState<HTMLDivElement | null>(null);
  /*
   * If user manually resized the textarea, need to keep the shadow in sync
   * Fixes https://github.com/specify/specify7/issues/1783
   * Can't simply convert auto growing textarea into a regular one on the fly
   * because that interrupts the resize operation
   */
  React.useEffect(() => {
    if (
      textArea === null ||
      shadow === null ||
      globalThis.ResizeObserver === undefined
    )
      return undefined;
    const observer = new globalThis.ResizeObserver(() => {
      shadow.style.height = textArea.style.height;
      shadow.style.width = textArea.style.width;
    });
    observer.observe(textArea);
    return (): void => observer.disconnect();
  }, [textArea, shadow]);

  return (
    <div
      className={`
        relative min-h-[calc(theme(spacing.7)*var(--rows))] overflow-hidden
        ${containerClassName ?? ''}
      `}
      style={{ '--rows': props.rows ?? 3 } as React.CSSProperties}
    >
      {/*
       * Shadow a textarea with a div, allowing it to autoGrow. Source:
       * https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
       */}
      <div
        className={`
          textarea-shadow invisible whitespace-pre-wrap [grid-area:1/1/2/2]
          print:hidden ${className}
        `}
        ref={setShadow}
      >
        {`${props.value?.toString() ?? ''} `}
      </div>
      <textarea
        {...props}
        className={`
          absolute top-0 h-full [grid-area:1/1/2/2] ${className}
          ${props.className ?? ''}
        `}
        ref={setTextArea}
      />
    </div>
  );
}
