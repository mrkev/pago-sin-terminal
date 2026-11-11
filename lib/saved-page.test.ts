import { describe, expect, it } from "vitest";

import {
  EMPTY_EDITOR_FORM,
  anonEditorSchema,
  editorSnapshot,
  formToPageRow,
  pageRowToForm,
  savedPageFormSchema,
} from "./saved-page";
import { slugSchema, suggestSlug, toSlugInput } from "./slug";
import { normalizeHandle, socialSchema } from "./socials";

const CLABE = "032180000118359719";
const CARD = "5555555555554444";

describe("slugs", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    for (const slug of ["cafe", "cafe-ejemplar", "tacos-2go", "abc"]) {
      expect(slugSchema.safeParse(slug).success, slug).toBe(true);
    }
  });

  it("rejects bad shapes and reserved words", () => {
    for (const slug of [
      "ab",
      "a".repeat(31),
      "2cafe",
      "-cafe",
      "cafe-",
      "cafe--ejemplar",
      "Cafe",
      "café",
      "auth",
      "admin",
    ]) {
      expect(slugSchema.safeParse(slug).success, slug).toBe(false);
    }
  });

  it("cleans input while typing", () => {
    expect(toSlugInput("Café Ejemplar")).toBe("cafe-ejemplar");
    expect(toSlugInput("Tacos  & Más ")).toBe("tacos-mas-");
    expect(toSlugInput("123 Cafe")).toBe("cafe");
    expect(toSlugInput("a".repeat(40))).toHaveLength(30);
  });

  it("suggests a finished slug from a title", () => {
    expect(suggestSlug("Chaneque Studio")).toBe("chaneque-studio");
    expect(suggestSlug("Tacos & Más!")).toBe("tacos-mas");
  });
});

describe("social handles", () => {
  it("strips @ and pulls handles out of profile URLs", () => {
    expect(normalizeHandle("@chaneque.studio")).toBe("chaneque.studio");
    expect(normalizeHandle("https://www.instagram.com/chaneque.studio/")).toBe(
      "chaneque.studio",
    );
    expect(normalizeHandle("https://www.tiktok.com/@chaneque?lang=es")).toBe(
      "chaneque",
    );
    expect(normalizeHandle("facebook.com/chanequestudio")).toBe(
      "chanequestudio",
    );
  });

  it("validates per network, with blank allowed", () => {
    expect(socialSchema("instagram").safeParse("").success).toBe(true);
    expect(socialSchema("instagram").safeParse("chaneque.studio").success).toBe(
      true,
    );
    expect(socialSchema("instagram").safeParse("no spaces").success).toBe(
      false,
    );
    expect(socialSchema("facebook").safeParse("abc").success).toBe(false);
  });
});

describe("saved page form", () => {
  const form = {
    ...EMPTY_EDITOR_FORM,
    titulo: "Chaneque",
    cuenta: CLABE,
    nombre: "Ana",
    slug: "chaneque",
  };

  it("requires a short link when signed in, but not when signed out", () => {
    expect(savedPageFormSchema.safeParse(form).success).toBe(true);
    expect(savedPageFormSchema.safeParse({ ...form, slug: "" }).success).toBe(
      false,
    );
    expect(anonEditorSchema.safeParse({ ...form, slug: "" }).success).toBe(
      true,
    );
  });

  it("still requires a bank for cards", () => {
    const card = { ...form, cuenta: CARD };
    expect(savedPageFormSchema.safeParse(card).success).toBe(false);
    expect(
      savedPageFormSchema.safeParse({ ...card, banco: "014" }).success,
    ).toBe(true);
  });

  it("converts to a row with nulls for blanks, and back", () => {
    const row = formToPageRow(
      { ...form, banco: "014", instagram: "chaneque.studio" },
      "user-1",
    );
    // A CLABE encodes its bank, so a picked one isn't stored.
    expect(row).toMatchObject({
      owner_id: "user-1",
      slug: "chaneque",
      banco: null,
      whatsapp: null,
      instagram: "chaneque.studio",
      tiktok: null,
    });
    const back = pageRowToForm({
      ...row,
      id: 1,
      owner_id: "user-1",
      banco: null,
      whatsapp: null,
      instagram: "chaneque.studio",
      tiktok: null,
      facebook: null,
      logo_path: null,
      fondo_path: null,
      estilo: "no-existe",
      created_at: "",
      updated_at: "",
    });
    expect(back).toEqual({
      ...form,
      instagram: "chaneque.studio",
      estilo: "neutral",
    });
  });

  it("detects changes regardless of key order", () => {
    const reordered = Object.fromEntries(Object.entries(form).reverse());
    expect(editorSnapshot(reordered)).toBe(editorSnapshot(form));
    expect(editorSnapshot({ ...form, titulo: "Otro" })).not.toBe(
      editorSnapshot(form),
    );
  });
});
