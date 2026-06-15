
from datetime import datetime, timezone, timedelta

SUBSCRIPTION_PLANS = {
    # Player Plans
    "player_free": {
        "id": "player_free",
        "name": "Free",
        "role": "player",
        "price_monthly": 0,
        "price_yearly": 0,
        "currency": "EUR",
        "features": {
            "apply_limit": 3,
            "reply_limit": 1,
            "send_messages": False,
            "college_fit": False,
            "advanced_analytics": False,
            "premium_badge": False,
            "priority_visibility": False,
        },
        "stripe_price_id": None,
    },
    "player_premium": {
        "id": "player_premium",
        "name": "Premium",
        "role": "player",
        "price_monthly": 9.99,
        "price_yearly": 79,
        "currency": "EUR",
        "features": {
            "apply_limit": None,
            "reply_limit": None,
            "send_messages": True,
            "college_fit": True,
            "advanced_analytics": True,
            "premium_badge": True,
            "priority_visibility": True,
        },
        "stripe_price_id": None,
    },
    # Club Plans
    "club_amateur": {
        "id": "club_amateur",
        "name": "Amateur Club",
        "role": "club",
        "price_monthly": 49,
        "price_yearly": 490,
        "currency": "EUR",
        "features": {
            "opportunity_limit": 1,
            "player_search": True,
            "applications": True,
            "pipeline": True,
            "scouting": False,
            "analytics": False,
            "team_members": 2,
        },
        "stripe_price_id": None,
    },
    "club_semi_pro": {
        "id": "club_semi_pro",
        "name": "Semi-Professional Club",
        "role": "club",
        "price_monthly": 99,
        "price_yearly": 990,
        "currency": "EUR",
        "features": {
            "opportunity_limit": 3,
            "player_search": True,
            "applications": True,
            "pipeline": True,
            "scouting": True,
            "analytics": True,
            "team_members": 5,
        },
        "stripe_price_id": None,
    },
    "club_professional": {
        "id": "club_professional",
        "name": "Professional Club",
        "role": "club",
        "price_monthly": 199,
        "price_yearly": 1990,
        "currency": "EUR",
        "features": {
            "opportunity_limit": None,
            "player_search": True,
            "applications": True,
            "pipeline": True,
            "scouting": True,
            "analytics": True,
            "team_members": None,
            "priority_support": True,
        },
        "stripe_price_id": None,
    },
    # College Plans
    "college_plan": {
        "id": "college_plan",
        "name": "College Plan",
        "role": "college",
        "price_monthly": 79,
        "price_yearly": 790,
        "currency": "EUR",
        "features": {
            "opportunity_limit": 5,
            "player_search": True,
            "applications": True,
            "college_fit": True,
            "pipeline": True,
        },
        "stripe_price_id": None,
    },
    "university_plan": {
        "id": "university_plan",
        "name": "University Plan",
        "role": "college",
        "price_monthly": 149,
        "price_yearly": 1490,
        "currency": "EUR",
        "features": {
            "opportunity_limit": None,
            "player_search": True,
            "applications": True,
            "college_fit": True,
            "pipeline": True,
            "analytics": True,
            "priority_support": True,
        },
        "stripe_price_id": None,
    },
    # Federation Plan
    "federation_plan": {
        "id": "federation_plan",
        "name": "Federation Plan",
        "role": "federation",
        "price_monthly": 299,
        "price_yearly": 2990,
        "currency": "EUR",
        "features": {
            "player_search": True,
            "scouting": True,
            "national_team_tools": True,
            "watchlists": True,
            "analytics": True,
            "team_members": None,
        },
        "stripe_price_id": None,
    },
    # Agent Plan
    "agent_plan": {
        "id": "agent_plan",
        "name": "Agent Plan",
        "role": "agent",
        "price_monthly": 79,
        "price_yearly": 790,
        "currency": "EUR",
        "features": {
            "player_search": True,
            "opportunity_limit": 5,
            "pipeline": True,
            "scouting": True,
            "messaging": True,
        },
        "stripe_price_id": None,
    },
    # Specialist Plan
    "specialist_plan": {
        "id": "specialist_plan",
        "name": "Specialist Plan",
        "role": "specialist",
        "price_monthly": 29,
        "price_yearly": 290,
        "currency": "EUR",
        "features": {
            "public_profile": True,
            "receive_messages": True,
            "profile_analytics": True,
        },
        "stripe_price_id": None,
    },
}

SUBSCRIPTION_STATUSES = ["trial", "active", "expired", "cancelled", "none"]

DEFAULT_PLANS = {
    "player": "player_free",
    "club": None,
    "college": None,
    "federation": None,
    "agent": None,
    "specialist": None,
    "analyst": None,
}

def get_default_plan(role: str) -> str:
    return DEFAULT_PLANS.get(role)

def get_plan(plan_id: str) -> dict:
    return SUBSCRIPTION_PLANS.get(plan_id, {})

def get_plans_for_role(role: str) -> list:
    return [p for p in SUBSCRIPTION_PLANS.values() if p["role"] == role]

def create_subscription(plan_id: str, billing: str = "yearly") -> dict:
    from datetime import datetime, timezone, timedelta
    plan = get_plan(plan_id)
    now = datetime.now(timezone.utc)
    if billing == "yearly":
        end_date = now + timedelta(days=365)
    else:
        end_date = now + timedelta(days=30)
    return {
        "plan_id": plan_id,
        "plan_name": plan.get("name", ""),
        "status": "active",
        "billing_cycle": billing,
        "started_at": now.isoformat(),
        "expires_at": end_date.isoformat(),
        "stripe_subscription_id": None,
        "stripe_customer_id": None,
        "auto_renew": True,
    }

def is_subscription_active(subscription: dict) -> bool:
    if not subscription:
        return False
    if subscription.get("status") != "active":
        return False
    expires_at = subscription.get("expires_at")
    if not expires_at:
        return True
    from datetime import datetime, timezone
    try:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        return datetime.now(timezone.utc) < expiry
    except:
        return False
