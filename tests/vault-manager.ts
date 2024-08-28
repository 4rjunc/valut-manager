import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VaultManager } from "../target/types/vault_manager";
import { expect } from "chai";

describe("vault-manager", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VaultManager as Program<VaultManager>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);

    // Fetch the program logs
    const txLogs = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
    });

    // Check if the logs contain the expected message
    const expectedMessage = `Program ${program.programId.toBase58()} invoke [1]`;
    const logContainsMessage = txLogs?.meta?.logMessages?.some((log) =>
      log.includes(expectedMessage)
    );

    expect(logContainsMessage).to.be.true;
  });
});
