import katex from 'katex';

const MATH_TOKEN_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

/**
 * MathText — renders inline $...$ and display $$...$$ LaTeX chemistry notation
 * via KaTeX in a single-pass tokenizer, falling back to plain text on malformed LaTeX.
 */
const MathText = ({ text, className = '' }) => {
  if (text === null || text === undefined || text === '') return null;

  const source = String(text);
  const tokens = source.split(MATH_TOKEN_REGEX);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
        if (!token) return null;

        const isDisplay = token.startsWith('$$') && token.endsWith('$$') && token.length > 4;
        const isInline = !isDisplay && token.startsWith('$') && token.endsWith('$') && token.length > 2;

        if (!isDisplay && !isInline) {
          return <span key={idx}>{token}</span>;
        }

        const latex = isDisplay ? token.slice(2, -2).trim() : token.slice(1, -1).trim();
        if (!latex) {
          return <span key={idx}>{token}</span>;
        }

        try {
          const html = katex.renderToString(latex, {
            displayMode: isDisplay,
            throwOnError: false,
            strict: false,
            trust: false,
          });
          return (
            <span
              key={idx}
              className={isDisplay ? 'block my-2 overflow-x-auto' : 'inline'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={idx}>{token}</span>;
        }
      })}
    </span>
  );
};

export default MathText;
