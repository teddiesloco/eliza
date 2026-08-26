/**
 * Public agent-wallet address caching is tested without exposing vault-backed
 * private keys or replacing explicit operator-selected wallet sources.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CLOUD_EVM_ADDRESS_ENV_KEY,
  cacheAgentWalletAddresses,
  getWalletAddresses,
  WALLET_SOURCE_EVM_ENV_KEY,
} from "./wallet.ts";

const EVM_ADDRESS = "0x1111111111111111111111111111111111111111";
const CLOUD_EVM_ADDRESS = "0x2222222222222222222222222222222222222222";
const SOLANA_ADDRESS = "So11111111111111111111111111111111111111112";

const ENV_KEYS = [
  "EVM_PRIVATE_KEY",
  "SOLANA_PRIVATE_KEY",
  "STEWARD_EVM_ADDRESS",
  "STEWARD_SOLANA_ADDRESS",
  "ELIZA_MANAGED_EVM_ADDRESS",
  "ELIZA_MANAGED_SOLANA_ADDRESS",
  CLOUD_EVM_ADDRESS_ENV_KEY,
  "ELIZA_CLOUD_SOLANA_ADDRESS",
  WALLET_SOURCE_EVM_ENV_KEY,
  "WALLET_SOURCE_SOLANA",
] as const;

let originalEnv: Record<string, string | undefined>;

beforeEach(() => {
  originalEnv = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]]),
  );
  for (const key of ENV_KEYS) delete process.env[key];
  cacheAgentWalletAddresses({ evmAddress: null, solanaAddress: null });
});

afterEach(() => {
  cacheAgentWalletAddresses({ evmAddress: null, solanaAddress: null });
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("agent wallet public-address cache", () => {
  it("makes both vault-backed public identities available without env keys", () => {
    cacheAgentWalletAddresses({
      evmAddress: EVM_ADDRESS,
      solanaAddress: SOLANA_ADDRESS,
    });

    expect(getWalletAddresses()).toEqual({
      evmAddress: EVM_ADDRESS,
      solanaAddress: SOLANA_ADDRESS,
    });
    expect(process.env.EVM_PRIVATE_KEY).toBeUndefined();
    expect(process.env.SOLANA_PRIVATE_KEY).toBeUndefined();
  });

  it("keeps an explicit cloud source authoritative", () => {
    cacheAgentWalletAddresses({
      evmAddress: EVM_ADDRESS,
      solanaAddress: SOLANA_ADDRESS,
    });
    process.env[WALLET_SOURCE_EVM_ENV_KEY] = "cloud";
    process.env[CLOUD_EVM_ADDRESS_ENV_KEY] = CLOUD_EVM_ADDRESS;

    expect(getWalletAddresses().evmAddress).toBe(CLOUD_EVM_ADDRESS);
  });

  it("rejects malformed public identities", () => {
    expect(() =>
      cacheAgentWalletAddresses({
        evmAddress: "not-an-address",
        solanaAddress: null,
      }),
    ).toThrow(TypeError);
  });
});
