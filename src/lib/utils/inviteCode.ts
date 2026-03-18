const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    const nextIndex = Math.floor(Math.random() * INVITE_ALPHABET.length);
    code += INVITE_ALPHABET[nextIndex];
  }

  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export function normalizeInviteCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (cleaned.length <= 3) {
    return cleaned;
  }

  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
}
