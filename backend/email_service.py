import resend
import os
from datetime import datetime

resend.api_key = os.environ.get("RESEND_API_KEY", "")

FROM_EMAIL = "Soccer Match <noreply@soccer-match.org>"
PLATFORM_URL = "https://www.soccermatch.app"

def get_base_template(content: str, title: str = "Soccer Match") -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:30px;text-align:center;border-bottom:1px solid #222;">
              <img src="https://www.soccermatch.app/logo.png" alt="Soccer Match" height="40" style="height:40px;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#111;border:1px solid #222;border-top:none;padding:40px 30px;">
              {content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="color:#555;font-size:12px;margin:0;">© 2026 Soccer Match Inc. — Montréal, Québec, Canada</p>
              <p style="color:#555;font-size:12px;margin:8px 0 0;">
                <a href="https://www.soccermatch.app/privacy-policy" style="color:#555;text-decoration:none;">Privacy Policy</a> · 
                <a href="mailto:contact@soccermatch.app" style="color:#555;text-decoration:none;">Contact</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

async def send_email(to: str, subject: str, html: str):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

async def send_player_welcome(email: str, name: str, verification_link: str = None):
    content = f"""
      <h1 style="color:#c8f135;font-size:24px;margin:0 0 16px;font-family:Georgia,serif;text-transform:uppercase;">Welcome to Soccer Match</h1>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi {name},</p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Your Soccer Match account has been created. Complete your profile to become visible to clubs, federations, universities and agents worldwide.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#c8f135;border-radius:4px;padding:14px 28px;">
            <a href="{PLATFORM_URL}/player/profile" style="color:#000;font-weight:700;font-size:14px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Complete My Profile</a>
          </td>
        </tr>
      </table>
      <p style="color:#555;font-size:13px;line-height:1.6;margin:0;">
        Required for visibility: Profile photo, position, nationality, competition level and highlight video.
      </p>
    """
    verify_section = f'''
      <div style="margin-top:24px;padding:16px;background:#1a1a1a;border:1px solid #333;border-left:3px solid #c8f135;border-radius:4px;">
        <p style="color:#c8f135;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Verify Your Email — Earn +1 Credit</p>
        <p style="color:#ccc;font-size:13px;margin:0 0 12px;">Click below to verify your email and receive your first free credit.</p>
        <a href="{verification_link}" style="background:#c8f135;color:#000;font-weight:700;font-size:13px;padding:10px 20px;border-radius:4px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Verify Email</a>
      </div>''' if verification_link else ''
    content_html = content.replace("{verify_section}", verify_section)
    await send_email(email, "Welcome to Soccer Match 🎯", get_base_template(content_html, "Welcome to Soccer Match"))

async def send_org_application_received(email: str, name: str, org_type: str):
    content = f"""
      <h1 style="color:#c8f135;font-size:24px;margin:0 0 16px;font-family:Georgia,serif;text-transform:uppercase;">Application Received</h1>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi {name},</p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Thank you for registering your {org_type} on Soccer Match. Your application has been successfully submitted and is currently under review.
      </p>
      <div style="background-color:#1a1a1a;border:1px solid #333;border-left:3px solid #c8f135;padding:16px 20px;margin:0 0 24px;border-radius:4px;">
        <p style="color:#c8f135;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Current Status</p>
        <p style="color:#fff;font-size:16px;font-weight:700;margin:0;">Pending Review</p>
      </div>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 8px;">A member of our team will contact you within <strong style="color:#fff;">48 hours</strong> to:</p>
      <ul style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
        <li>Verify your {org_type}</li>
        <li>Understand your recruitment needs</li>
        <li>Present the platform</li>
        <li>Determine the most appropriate subscription plan</li>
      </ul>
      <p style="color:#555;font-size:13px;">Questions? Contact us at <a href="mailto:contact@soccermatch.app" style="color:#c8f135;">contact@soccermatch.app</a></p>
    """
    await send_email(email, f"Your {org_type} Application — Soccer Match", get_base_template(content))

async def send_org_approved(email: str, name: str, org_type: str):
    content = f"""
      <h1 style="color:#c8f135;font-size:24px;margin:0 0 16px;font-family:Georgia,serif;text-transform:uppercase;">Application Approved ✓</h1>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi {name},</p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Great news! Your {org_type} application has been approved. You now have full access to Soccer Match's recruitment and scouting ecosystem.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#c8f135;border-radius:4px;padding:14px 28px;">
            <a href="{PLATFORM_URL}/login" style="color:#000;font-weight:700;font-size:14px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Access Platform</a>
          </td>
        </tr>
      </table>
    """
    await send_email(email, f"Your {org_type} is Approved — Soccer Match", get_base_template(content))

async def send_analyst_invitation(email: str, name: str, activation_link: str):
    content = f"""
      <h1 style="color:#c8f135;font-size:24px;margin:0 0 16px;font-family:Georgia,serif;text-transform:uppercase;">You've Been Invited</h1>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi {name},</p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">
        You have been invited to join Soccer Match as a <strong style="color:#fff;">Certified Analyst</strong>. Click the button below to activate your account and set your password.
      </p>
      <div style="background-color:#1a1a1a;border:1px solid #333;border-left:3px solid #a78bfa;padding:16px 20px;margin:0 0 24px;border-radius:4px;">
        <p style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Your Badge</p>
        <p style="color:#fff;font-size:15px;font-weight:700;margin:0;">⭐ Soccer Match Certified Analyst</p>
      </div>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#c8f135;border-radius:4px;padding:14px 28px;">
            <a href="{activation_link}" style="color:#000;font-weight:700;font-size:14px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Activate My Account</a>
          </td>
        </tr>
      </table>
      <p style="color:#555;font-size:13px;">This link expires in 7 days. If you did not expect this invitation, please ignore this email.</p>
    """
    await send_email(email, "You've Been Invited as a Soccer Match Certified Analyst", get_base_template(content))

async def send_application_status_update(email: str, player_name: str, status: str, opportunity_title: str = ""):
    status_map = {
        "interested": ("You've Been Shortlisted 🎯", "#c8f135", "An organization has marked you as interested and added you to their recruitment pipeline."),
        "rejected": ("Application Update", "#ef4444", "After careful review, the organization has decided not to move forward with your application at this time."),
        "under_review": ("Application Under Review", "#f59e0b", "Your application is currently being reviewed by the organization."),
    }
    subject_text, color, message = status_map.get(status, ("Application Update", "#c8f135", "Your application status has been updated."))
    content = f"""
      <h1 style="color:{color};font-size:24px;margin:0 0 16px;font-family:Georgia,serif;text-transform:uppercase;">{subject_text}</h1>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi {player_name},</p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">{message}</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#c8f135;border-radius:4px;padding:14px 28px;">
            <a href="{PLATFORM_URL}/player/applications" style="color:#000;font-weight:700;font-size:14px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">View My Applications</a>
          </td>
        </tr>
      </table>
    """
    await send_email(email, f"{subject_text} — Soccer Match", get_base_template(content))
async def send_credit_purchase_confirmation(email: str, name: str, credits: int, pack_name: str, amount: str):
    content = f"""
      <h1 style="color:#c8f135;font-size:24px;margin:0 0 16px;font-family:Georgia,serif;text-transform:uppercase;">Payment Confirmed ✓</h1>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi {name},</p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Your payment of <strong style="color:#fff;">{amount}</strong> has been confirmed. Your credits have been added to your account.
      </p>
      <div style="background-color:#1a1a1a;border:1px solid #333;border-left:3px solid #c8f135;padding:16px 20px;margin:0 0 24px;border-radius:4px;">
        <p style="color:#c8f135;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Credits Added</p>
        <p style="color:#fff;font-size:28px;font-weight:700;margin:0;">+{credits} credits</p>
        <p style="color:#999;font-size:13px;margin:4px 0 0;">{pack_name}</p>
      </div>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#c8f135;border-radius:4px;padding:14px 28px;">
            <a href="{PLATFORM_URL}/player/credits" style="color:#000;font-weight:700;font-size:14px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">View My Credits</a>
          </td>
        </tr>
      </table>
      <p style="color:#555;font-size:13px;">Questions? Contact us at <a href="mailto:contact@soccer-match.org" style="color:#c8f135;">contact@soccer-match.org</a></p>
    """
    await send_email(email, f"Payment Confirmed - {pack_name} — Soccer Match", get_base_template(content))
