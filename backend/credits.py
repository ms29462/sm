
# Credit reward types
REWARD_TYPES = {
    "email_verification": 1,
    "profile_completion": 1,
    "highlights_uploaded": 1,
    "referral_reward": 3,
}

MAX_FREE_CREDITS = 6

# Opportunity tiers and credit costs
OPPORTUNITY_TIERS = {
    "amateur": 2,
    "semi_professional": 5,
    "university": 5,
    "professional": 10,
}

CREDIT_PACKS = {
    "starter": {"name": "Starter Pack", "credits": 10, "price": 4.99, "stripe_price_id": None},
    "standard": {"name": "Standard Pack", "credits": 25, "price": 9.99, "stripe_price_id": None},
    "pro": {"name": "Pro Pack", "credits": 75, "price": 24.99, "stripe_price_id": None},
    "elite": {"name": "Elite Pack", "credits": 200, "price": 59.99, "stripe_price_id": None},
}

def get_tier_cost(tier: str) -> int:
    return OPPORTUNITY_TIERS.get(tier.lower().replace("-", "_").replace(" ", "_"), 2)

def get_pack(pack_id: str) -> dict:
    return CREDIT_PACKS.get(pack_id, {})
