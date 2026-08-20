export function normalizeText(input: string): string {
  const lines = input.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const normalized: string[] = [];
  let inCodeFence = false;
  let previousBlank = false;

  for (const rawLine of lines) {
    const fence = rawLine.trimStart().startsWith('```') || rawLine.trimStart().startsWith('~~~');
    if (fence) {
      inCodeFence = !inCodeFence;
      normalized.push(rawLine.trimEnd());
      previousBlank = false;
      continue;
    }

    if (inCodeFence) {
      normalized.push(rawLine);
      previousBlank = false;
      continue;
    }

    const line = rawLine.trim().replace(/[\t ]+/g, ' ');
    if (!line) {
      if (!previousBlank && normalized.length > 0) normalized.push('');
      previousBlank = true;
      continue;
    }

    normalized.push(line);
    previousBlank = false;
  }

  while (normalized.at(-1) === '') normalized.pop();
  return normalized.join('\n').trim();
}
