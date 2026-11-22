import { describe, expect, it } from "vitest";
import { splitContact } from "@/components/ContactForm";

describe("splitContact (one field: phone or e-mail)", () => {
  it("reads an e-mail", () => {
    expect(splitContact(" jana@firma.cz ")).toEqual({ email: "jana@firma.cz" });
  });
  it("reads Czech phone formats", () => {
    expect(splitContact("602 123 456")).toEqual({ phone: "602 123 456" });
    expect(splitContact("+420602123456")).toEqual({ phone: "+420602123456" });
  });
  it("rejects anything else", () => {
    expect(splitContact("123")).toEqual({});
    expect(splitContact("jana")).toEqual({});
  });
});
