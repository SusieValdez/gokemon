import { matchesQuery } from "./utils";

test("same string matches", () => {
  expect(matchesQuery("squirtle", "squirtle")).toBe(true);
});

test("substring matches", () => {
  expect(matchesQuery("squirtle", "squ")).toBe(true);
});

test("empty string matches everything", () => {
  expect(matchesQuery("squirtle", "")).toBe(true);
});

test("number can match too", () => {
  expect(matchesQuery("9", "9")).toBe(true);
});

test("substring numbers can match too", () => {
  expect(matchesQuery("90", "9")).toBe(true);
});

test("case doesn't matter", () => {
  expect(matchesQuery("sQuirtle", "SqU")).toBe(true);
});

test("if not substring, doesn't match", () => {
  expect(matchesQuery("squirtle", "char")).toBe(false);
});
