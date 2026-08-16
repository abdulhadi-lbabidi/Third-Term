type ParsedVoucher = {
  datePart: string;
  prefix: string;
  sequence: number;
  padLength: number;
};

/** YY-MM-exp-00001 أو YY-MM-rev-00001 */
const VOUCHER_PATTERN = /^(\d{2})-(\d{2})-(exp|rev)-(\d+)$/i;

/** exp-00001-YY-MM (صيغة قديمة) */
const LEGACY_VOUCHER_PATTERN = /^(exp|rev)-(\d+)-(\d{2}-\d{2})$/i;

function getCurrentDatePart() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseVoucherNumber(value?: string | null): ParsedVoucher | null {
  if (!value) return null;

  const trimmed = value.trim();

  const match = trimmed.match(VOUCHER_PATTERN);
  if (match) {
    return {
      datePart: `${match[1]}-${match[2]}`,
      prefix: match[3].toLowerCase(),
      sequence: Number(match[4]),
      padLength: match[4].length,
    };
  }

  const legacyMatch = trimmed.match(LEGACY_VOUCHER_PATTERN);
  if (legacyMatch) {
    return {
      datePart: legacyMatch[3],
      prefix: legacyMatch[1].toLowerCase(),
      sequence: Number(legacyMatch[2]),
      padLength: legacyMatch[2].length,
    };
  }

  return null;
}

function compareVouchers(a: ParsedVoucher, b: ParsedVoucher) {
  if (a.datePart !== b.datePart) {
    return a.datePart.localeCompare(b.datePart);
  }
  return a.sequence - b.sequence;
}

export function getNextVoucherNumber(
  voucherNumbers: Array<string | null | undefined>,
  fallbackPrefix?: 'exp' | 'rev',
) {
  const parsed = voucherNumbers
    .map(parseVoucherNumber)
    .filter((item): item is ParsedVoucher => item !== null);

  const filtered = fallbackPrefix
    ? parsed.filter((item) => item.prefix === fallbackPrefix)
    : parsed;

  const candidates = filtered.length > 0 ? filtered : parsed;

  const latest = candidates.reduce<ParsedVoucher | null>((currentLatest, item) => {
    if (!currentLatest) return item;
    return compareVouchers(item, currentLatest) > 0 ? item : currentLatest;
  }, null);

  if (!latest) {
    const prefix = fallbackPrefix ?? 'exp';
    return `${getCurrentDatePart()}-${prefix}-00001`;
  }

  const nextSequence = String(latest.sequence + 1).padStart(Math.max(latest.padLength, 5), '0');
  return `${latest.datePart}-${latest.prefix}-${nextSequence}`;
}

export function getNextVoucherNumberFromRecords<T extends { id?: number; voucher_number?: string | null }>(
  records: T[],
  fallbackPrefix?: 'exp' | 'rev',
) {
  const sorted = [...records].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  return getNextVoucherNumber(
    sorted.map((record) => record.voucher_number),
    fallbackPrefix,
  );
}

export function resolveVoucherHint(options: {
  isEditMode: boolean;
  voucherNumber?: string | null;
  nextVoucherNumber?: string | null;
}) {
  if (options.isEditMode && options.voucherNumber) {
    return options.voucherNumber;
  }

  return options.nextVoucherNumber ?? null;
}
