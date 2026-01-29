export interface Token {
  text: string;
  type: 'keyword' | 'string' | 'number' | 'comment' | 'method' | 'type' | 'operator' | 'property' | 'default';
}

const KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'const', 'let', 'var',
  'function', 'async', 'await', 'return', 'if', 'else', 'for', 'of', 'in',
  'new', 'throw', 'try', 'catch', 'finally', 'class', 'extends', 'implements',
  'interface', 'type', 'enum', 'true', 'false', 'null', 'undefined',
  'typeof', 'instanceof', 'void', 'this', 'super', 'static',
  'public', 'private', 'protected', 'readonly',
]);

const TYPE_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comments
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ text: line.slice(i), type: 'comment' });
      return tokens;
    }

    // Strings (single, double, backtick)
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++; // skip escaped chars
        j++;
      }
      j++; // include closing quote
      tokens.push({ text: line.slice(i, j), type: 'string' });
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i]) && (i === 0 || /[\s,(\[{:=+\-*/]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9._xXa-fA-F]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    // Words (identifiers, keywords, types)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);

      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, type: 'keyword' });
      } else if (TYPE_PATTERN.test(word) && !['JSON', 'Math', 'Date', 'Error', 'Promise', 'console', 'window', 'document'].includes(word)) {
        tokens.push({ text: word, type: 'type' });
      } else if (j < line.length && line[j] === '(') {
        tokens.push({ text: word, type: 'method' });
      } else if (i > 0 && line[i - 1] === '.') {
        tokens.push({ text: word, type: 'property' });
      } else {
        tokens.push({ text: word, type: 'default' });
      }
      i = j;
      continue;
    }

    // Operators
    if ('=<>!&|+-*/%?:'.includes(line[i])) {
      let j = i;
      while (j < line.length && '=<>!&|+-*/%?:'.includes(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'operator' });
      i = j;
      continue;
    }

    // Everything else (whitespace, brackets, punctuation)
    tokens.push({ text: line[i], type: 'default' });
    i++;
  }

  return tokens;
}

export const TOKEN_COLORS: Record<Token['type'], string> = {
  keyword: 'text-[#FF79C6]',
  string: 'text-[#F1FA8C]',
  number: 'text-[#BD93F9]',
  comment: 'text-white/40 italic',
  method: 'text-[#50FA7B]',
  type: 'text-[#8BE9FD]',
  operator: 'text-[#FF79C6]',
  property: 'text-[#50FA7B]',
  default: 'text-white/90',
};
