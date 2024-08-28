import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VaultManager } from "../target/types/vault_manager";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import {
  Account,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
} from "@solana/spl-token";

// airdrops sol to the account
async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor
    .getProvider()
    .connection.requestAirdrop(
      publicKey,
      amount * anchor.web3.LAMPORTS_PER_SOL
    );
  await confirmTransaction(airdropTx);
}

// confirms transaction
async function confirmTransaction(tx) {
  const latestBlockHash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

describe("vault-manager", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  let accounts: any[];
  let walletAlice: anchor.web3.Signer;
  let mintAlice: anchor.web3.PublicKey;
  let ataAlice: Account;
  const amountAlice = 6;

  const decimals = 0;
  let connection: anchor.web3.Connection;
  const program = anchor.workspace.VaultManager as Program<VaultManager>;
  connection = provider.connection;

  it("Is initialized!", async () => {
    //create account
    let account = anchor.web3.Keypair.generate();
    await airdropSol(account.publicKey, 10);
    accounts.push(account);

    walletAlice = accounts[0];

    // mint account
    try {
      mintAlice = await createMint(
        connection,
        walletAlice,
        walletAlice.publicKey,
        null,
        decimals
      );
    } catch (err) {
      console.log(err);
    }
    console.log("Mint Alice => ", mintAlice.toBase58());

    try {
      // ATA
      ataAlice = await getOrCreateAssociatedTokenAccount(
        connection,
        walletAlice,
        mintAlice,
        walletAlice.publicKey
      );
    } catch (err) {
      console.log(err);
    }
    console.log("ATA Alice => ", ataAlice.address.toBase58());

    try {
      let mintTx = await mintTo(
        connection,
        walletAlice,
        mintAlice,
        ataAlice.address,
        walletAlice.publicKey,
        amountAlice
      );
      console.log("Mint Transaction => ", mintTx);

      await setAuthority(
        connection,
        walletAlice,
        mintAlice,
        walletAlice.publicKey,
        0,
        null
      );
      console.log("****Authority is set for Alice****");

      const tokenAccountInfo = await getAccount(connection, ataAlice.address);

      const balanceToken =
        tokenAccountInfo.amount / BigInt(Math.pow(10, decimals));
      console.log("Balance Token => " + balanceToken);
    } catch (err) {
      console.log(err);
    }

    let [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("VAULT_MANAGER")],
      program.programId
    );
    console.log("TokenAccountOwnerPda => " + tokenAccountOwnerPda);

    let confirmOptions = {
      skipPreflight: true,
    };

    try {
      let initVaultTx = await program.methods
        .initialize()
        .accounts({
          tokenAccountOwnerPda: tokenAccountOwnerPda,
          signer: program.provider.publicKey,
        })
        .rpc(confirmOptions);

      await logTransaction(connection, initVaultTx);
    } catch (err) {
      console.log(err);
    }
  });

  it("deposit(): multiple deposit on one unique vault", async () => {
    const pda = await getVaultPda(program, "SSF_PDA_VAULT", mintAlice);

    let [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("VAULT_MANAGER")],
      program.programId
    );

    let tx = await program.methods
      .deposit(new anchor.BN(3))
      .accounts({
        tokenAccountOwnerPda: tokenAccountOwnerPda,
        vault: pda.pubkey,
        signer: walletAlice.publicKey,
        mintAccount: mintAlice,
        senderTokenAccount: ataAlice.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletAlice])
      .rpc();
    console.log("    (deposit +3) https://solana.fm/tx/" + tx);
    console.log("");

    tx = await program.methods
      .deposit(new anchor.BN(2))
      .accounts({
        tokenAccountOwnerPda: tokenAccountOwnerPda,
        vault: pda.pubkey,
        signer: walletAlice.publicKey,
        mintAccount: mintAlice,
        senderTokenAccount: ataAlice.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([walletAlice])
      .rpc();
    console.log("    (deposit +2) https://solana.fm/tx/" + tx);
    console.log("");
  });
});

async function logTransaction(connection, txHash) {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature: txHash,
  });

  console.log(`    https://explorer.solana.com/tx/${txHash}`);
}
