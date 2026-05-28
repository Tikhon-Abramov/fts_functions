import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import { applyPatches } from "./patch";

describe("applyPatches", () => {
  let tmpDir: string;
  let logSpy: MockInstance<typeof console.log>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "patch-test-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const writeTmp = async (name: string, content: string): Promise<string> => {
    const filePath = path.join(tmpDir, name);
    await fs.writeFile(filePath, content);
    return filePath;
  };

  describe("literal string patterns", () => {
    it("replaces a literal string and writes the file", async () => {
      const file = await writeTmp("a.txt", "hello world");

      const [result] = await applyPatches({
        [file]: [{ pattern: "world", replacement: "vitest" }],
      });

      expect(result).toEqual({
        filePath: file,
        changed: true,
        replacements: 1,
      });
      await expect(fs.readFile(file, "utf8")).resolves.toBe("hello vitest");
    });

    it("replaces every occurrence of a literal string", async () => {
      const file = await writeTmp("b.txt", "a a a");

      const [result] = await applyPatches({
        [file]: [{ pattern: "a", replacement: "b" }],
      });

      expect(result?.replacements).toBe(3);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("b b b");
    });

    it("does not double-count overlapping needles (advances by needle length)", async () => {
      // 'aaaa' contains two non-overlapping 'aa' matches, not three.
      const file = await writeTmp("overlap.txt", "aaaa");

      const [result] = await applyPatches({
        [file]: [{ pattern: "aa", replacement: "x" }],
      });

      expect(result?.replacements).toBe(2);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("xx");
    });

    it("rejects an empty string pattern", async () => {
      const file = await writeTmp("empty.txt", "anything");

      await expect(
        applyPatches({ [file]: [{ pattern: "", replacement: "x" }] }),
      ).rejects.toThrow(/String pattern must not be empty/);
    });
  });

  describe("regex patterns", () => {
    it("upgrades a non-global regex to global automatically", async () => {
      const file = await writeTmp("c.txt", "foo1 foo2 foo3");

      const [result] = await applyPatches({
        [file]: [{ pattern: /foo(\d)/, replacement: "bar$1" }],
      });

      expect(result?.replacements).toBe(3);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("bar1 bar2 bar3");
    });

    it("respects existing flags when adding global", async () => {
      const file = await writeTmp("flags.txt", "FOO foo Foo");

      const [result] = await applyPatches({
        [file]: [{ pattern: /foo/i, replacement: "X" }],
      });

      expect(result?.replacements).toBe(3);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("X X X");
    });

    it("keeps an already-global regex untouched", async () => {
      const file = await writeTmp("already-global.txt", "a a a");

      const [result] = await applyPatches({
        [file]: [{ pattern: /a/g, replacement: "b" }],
      });

      expect(result?.replacements).toBe(3);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("b b b");
    });
  });

  describe("required + maxReplacements guards", () => {
    it("throws when a required pattern is not found", async () => {
      const file = await writeTmp("d.txt", "nothing to match");

      await expect(
        applyPatches({
          [file]: [{ pattern: "missing", replacement: "x" }],
        }),
      ).rejects.toThrow(/Patch failed: pattern not found/);
    });

    it("does not throw when an optional pattern is not found", async () => {
      const file = await writeTmp("e.txt", "still nothing");

      const [result] = await applyPatches({
        [file]: [{ pattern: "missing", replacement: "x", required: false }],
      });

      expect(result).toEqual({
        filePath: file,
        changed: false,
        replacements: 0,
      });
    });

    it("throws when replacements exceed maxReplacements", async () => {
      const file = await writeTmp("f.txt", "x x x");

      await expect(
        applyPatches({
          [file]: [{ pattern: "x", replacement: "y", maxReplacements: 2 }],
        }),
      ).rejects.toThrow(/matched 3 times, max allowed 2/);
    });

    it("accepts replacements at exactly maxReplacements", async () => {
      const file = await writeTmp("exact.txt", "x x");

      const [result] = await applyPatches({
        [file]: [{ pattern: "x", replacement: "y", maxReplacements: 2 }],
      });

      expect(result?.replacements).toBe(2);
    });
  });

  describe("write modes", () => {
    it("does not modify the file when dryRun is true", async () => {
      const file = await writeTmp("g.txt", "hello");

      const [result] = await applyPatches(
        { [file]: [{ pattern: "hello", replacement: "bye" }] },
        { dryRun: true },
      );

      expect(result?.changed).toBe(true);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("hello");
    });

    it("creates a .bak file when backup is true", async () => {
      const file = await writeTmp("h.txt", "alpha");

      await applyPatches(
        { [file]: [{ pattern: "alpha", replacement: "beta" }] },
        { backup: true },
      );

      await expect(fs.readFile(`${file}.bak`, "utf8")).resolves.toBe("alpha");
      await expect(fs.readFile(file, "utf8")).resolves.toBe("beta");
    });

    it("does not create a .bak file when there are no changes", async () => {
      const file = await writeTmp("nochange.txt", "untouched");

      await applyPatches(
        {
          [file]: [{ pattern: "absent", replacement: "x", required: false }],
        },
        { backup: true },
      );

      await expect(fs.access(`${file}.bak`)).rejects.toThrow();
    });
  });

  describe("logging", () => {
    it("logs by default (silent defaults to false)", async () => {
      const file = await writeTmp("i.txt", "say hi");

      await applyPatches({
        [file]: [{ pattern: "hi", replacement: "bye" }],
      });

      expect(logSpy).toHaveBeenCalled();
      const lines = logSpy.mock.calls.map(([line]) => String(line));
      expect(lines.some((line) => line.includes(file))).toBe(true);
      expect(lines.some((line) => line.includes("1×"))).toBe(true);
    });

    it("stays quiet when silent is true", async () => {
      const file = await writeTmp("j.txt", "shh");

      await applyPatches(
        { [file]: [{ pattern: "shh", replacement: "ssh" }] },
        { silent: true },
      );

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe("multi-patch and multi-file", () => {
    it("applies multiple sequential patches against the same file", async () => {
      const file = await writeTmp("l.txt", "one two three");

      const [result] = await applyPatches({
        [file]: [
          { pattern: "one", replacement: "1" },
          { pattern: "two", replacement: "2" },
          { pattern: "three", replacement: "3" },
        ],
      });

      expect(result?.replacements).toBe(3);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("1 2 3");
    });

    it("processes multiple files and returns a result per file", async () => {
      const fileA = await writeTmp("multi-a.txt", "aaa");
      const fileB = await writeTmp("multi-b.txt", "bbb");

      const results = await applyPatches({
        [fileA]: [{ pattern: "a", replacement: "A" }],
        [fileB]: [{ pattern: "b", replacement: "B" }],
      });

      expect(results).toHaveLength(2);
      await expect(fs.readFile(fileA, "utf8")).resolves.toBe("AAA");
      await expect(fs.readFile(fileB, "utf8")).resolves.toBe("BBB");
    });

    it("lets later patches see edits made by earlier patches", async () => {
      const file = await writeTmp("chain.txt", "red");

      const [result] = await applyPatches({
        [file]: [
          { pattern: "red", replacement: "green" },
          // This second patch only matches if the first one ran first.
          { pattern: "green", replacement: "blue" },
        ],
      });

      expect(result?.replacements).toBe(2);
      await expect(fs.readFile(file, "utf8")).resolves.toBe("blue");
    });
  });
});
