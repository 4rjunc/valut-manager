use anchor_lang::prelude::*;

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
pub struct Initialize {}
