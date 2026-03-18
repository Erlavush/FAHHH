import { describe, expect, it } from "vitest";
import { generateInviteCode, normalizeInviteCode } from "../src/lib/utils/inviteCode";

describe("inviteCode helpers", () => {
  it("generates a six-character code with a dash separator", () => {
    const code = generateInviteCode();

    expect(code).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  });

  it("normalizes free-form values into invite format", () => {
    expect(normalizeInviteCode("ab c-123!")).toBe("ABC-123");
    expect(normalizeInviteCode("xy")).toBe("XY");
  });
});
