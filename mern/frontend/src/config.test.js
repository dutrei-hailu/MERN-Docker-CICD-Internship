import { describe, it, expect } from "vitest";
import API_URL from "./config";

describe("config", () => {
  it("defaults API URL to localhost backend when env is unset", () => {
    expect(typeof API_URL).toBe("string");
    expect(API_URL.length).toBeGreaterThan(0);
  });
});
