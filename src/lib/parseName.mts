const nameParticles = new Set([
  'ab',
  'af',
  'al',
  'am',
  'ap',
  'av',
  'da',
  'das',
  'de',
  'degli',
  'dei',
  'del',
  'della',
  'delle',
  'den',
  'der',
  'des',
  'di',
  'do',
  'dos',
  'du',
  'fitz',
  'la',
  'las',
  'le',
  'los',
  'mac',
  'mc',
  "o'",
  'ó',
  'saint',
  'st.',
  'te',
  'ten',
  'ter',
  'tot',
  'van',
  'verch',
  'von',
  'vom',
  'y',
  'zu',
  'zum',
  'zur',
]);

interface ParsedName {
  firstName: string;
  lastName: string;
}

export const parseName = (fullName: string): ParsedName => {
  const normalizedName = fullName.trim().replace(/\s+/gu, ' ');

  if (!normalizedName) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  const nameParts = normalizedName.split(' ');
  const firstNamePart = nameParts[0];

  if (!firstNamePart || nameParts.length === 1) {
    return {
      firstName: normalizedName,
      lastName: '',
    };
  }

  let firstNameLength = 1;

  if (nameParticles.has(firstNamePart.toLowerCase())) {
    while (
      firstNameLength < nameParts.length
      && nameParticles.has(nameParts[firstNameLength]?.toLowerCase() ?? '')
    ) {
      firstNameLength += 1;
    }

    firstNameLength = Math.min(firstNameLength + 1, nameParts.length);
  }

  return {
    firstName: nameParts.slice(0, firstNameLength).join(' '),
    lastName: nameParts.slice(firstNameLength).join(' '),
  };
};
