import { transformFilter } from "./transformFilter";

it("returns undefined for a missing filter", () => {
  expect(transformFilter(undefined as any)).toBeUndefined();
});

it("maps @ilike to fakerest's own case-insensitive contains suffix", () => {
  expect(transformFilter({ "first_name@ilike": "ana" })).toEqual({
    first_name_q: "ana",
  });
});

it("maps @like the same way as @ilike", () => {
  expect(transformFilter({ "last_name@like": "garcia" })).toEqual({
    last_name_q: "garcia",
  });
});

it("passes an unsuffixed key through unchanged", () => {
  expect(transformFilter({ id: 1 })).toEqual({ id: 1 });
});
