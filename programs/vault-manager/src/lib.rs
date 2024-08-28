use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

declare_id!("2eH4VtkkB5X5592hmuQqFQvQ9QKaTEmRZyvQgf9EWyxp");

#[program]
pub mod vault_manager {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
		init_if_needed,
		payer = signer,
		seeds = [b"SSF_ACCOUNT_VAULT"],
		bump,
		space = 8
	)]
	/// CHECK: Struct field "token_account_owner_pda" is unsafe, but is not documented.
	token_account_owner_pda: AccountInfo<'info>,

	#[account(mut)]
	signer: Signer<'info>,

	system_program: Program<'info, System>,
	token_program:  Program<'info, Token>,
	rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info>{
	#[account(mut,
		seeds=[b"SSF_ACCOUNT_VAULT"],
		bump
	)]
	token_account_owner_pda: AccountInfo<'info>,
	#[account(
		init_if_needed,
		seeds = [
			b"SSF_PDA_VAULT".as_ref(),
			mint_account.key().as_ref()
		],
		token::mint      = mint_account,
		token::authority = token_account_owner_pda,
		payer            = signer,
		bump
	)]
	pub vault: Account<'info, TokenAccount>,

	#[account(mut)]
	pub signer: Signer<'info>,

	pub mint_account: Account<'info, Mint>,

	#[account(mut)]
	pub sender_token_account: Account<'info, TokenAccount>,

	pub token_program:  Program<'info, Token>,
	pub system_program: Program<'info, System>,
}


#[error_code]
pub enum VaultError {
	#[msg("Insufficient Funds in Wallet!")]
	InsufficientFunds,
}
