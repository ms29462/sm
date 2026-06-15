
from typing import Optional

# Permission definitions per role and status
PERMISSIONS = {
    "player": {
        "active": {
            "view_opportunities": True,
            "apply_opportunities": True,
            "apply_limit": 3,  # Free limit
            "view_profiles": True,
            "receive_messages": True,
            "send_messages": False,  # Premium only
            "reply_messages": True,
            "reply_limit": 1,  # 1 per conversation free
            "college_fit": False,
            "advanced_analytics": False,
            "premium": False,
        },
        "premium": {
            "view_opportunities": True,
            "apply_opportunities": True,
            "apply_limit": None,  # Unlimited
            "view_profiles": True,
            "receive_messages": True,
            "send_messages": True,
            "reply_messages": True,
            "reply_limit": None,
            "college_fit": True,
            "advanced_analytics": True,
            "premium": True,
        },
        "incomplete": {
            "view_opportunities": True,
            "apply_opportunities": False,
            "view_profiles": False,
            "receive_messages": False,
            "send_messages": False,
            "college_fit": False,
        },
        "pending_email_verification": {
            "view_opportunities": True,
            "apply_opportunities": False,
            "view_profiles": False,
            "receive_messages": False,
            "send_messages": False,
        }
    },
    "club": {
        "approved": {
            "search_players": True,
            "view_profiles": True,
            "publish_opportunities": True,
            "manage_applications": True,
            "scouting_tools": True,
            "message_players": True,
            "recruitment_pipeline": True,
            "watchlists": True,
        },
        "pending": {
            "search_players": False,
            "view_profiles": False,
            "publish_opportunities": False,
            "manage_applications": False,
            "scouting_tools": False,
            "message_players": False,
            "recruitment_pipeline": False,
        }
    },
    "college": {
        "approved": {
            "search_players": True,
            "view_profiles": True,
            "publish_opportunities": True,
            "manage_applications": True,
            "message_players": True,
            "recruitment_pipeline": True,
            "college_fit_access": True,
        },
        "pending": {
            "search_players": False,
            "view_profiles": False,
            "publish_opportunities": False,
        }
    },
    "federation": {
        "approved": {
            "search_players": True,
            "view_profiles": True,
            "scouting_tools": True,
            "watchlists": True,
            "national_team_tools": True,
            "message_players": True,
        },
        "pending": {
            "search_players": False,
            "view_profiles": False,
            "scouting_tools": False,
        }
    },
    "agent": {
        "approved": {
            "search_players": True,
            "view_profiles": True,
            "publish_opportunities": True,
            "message_players": True,
            "recruitment_pipeline": True,
            "scouting_tools": True,
        },
        "pending": {
            "search_players": False,
            "view_profiles": False,
            "publish_opportunities": False,
        }
    },
    "specialist": {
        "approved": {
            "maintain_profile": True,
            "receive_messages": True,
            "search_players": False,
            "publish_opportunities": False,
            "scouting_tools": False,
        },
        "pending": {
            "maintain_profile": False,
            "receive_messages": False,
        }
    },
    "analyst": {
        "active": {
            "analyst_dashboard": True,
            "create_reports": True,
            "view_assigned": True,
            "search_players": False,
            "publish_opportunities": False,
        },
        "invited": {
            "analyst_dashboard": False,
        },
        "suspended": {
            "analyst_dashboard": False,
        }
    },
    "admin": {
        "any": {
            "all": True,
        }
    }
}

def get_user_status(role: str, user_data: dict) -> str:
    if role == "admin":
        return "any"
    if role == "player":
        profile_status = user_data.get("profile_status", "incomplete")
        is_premium = user_data.get("is_premium", False)
        if is_premium:
            return "premium"
        return profile_status
    if role in ["club", "college", "federation", "agent", "specialist"]:
        if user_data.get("approved") or user_data.get("status") == "approved":
            return "approved"
        return "pending"
    if role == "analyst":
        return user_data.get("status", "invited")
    return "unknown"

def has_permission(role: str, status: str, permission: str) -> bool:
    role_perms = PERMISSIONS.get(role, {})
    # Admin has all permissions
    if role == "admin":
        return True
    status_perms = role_perms.get(status, {})
    return status_perms.get(permission, False)

def get_permissions(role: str, status: str) -> dict:
    role_perms = PERMISSIONS.get(role, {})
    if role == "admin":
        return {"all": True}
    return role_perms.get(status, {})
