with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update status mappings
content = content.replace(
    '''STATUS_TO_PIPELINE_STAGE = {
    "submitted": "submitted",
    "viewed": "viewed",
    "shortlisted": "shortlisted",
    "interview_requested": "interview_requested",
    "accepted": "accepted",
    "rejected": "rejected",
}''',
    '''STATUS_TO_PIPELINE_STAGE = {
    "submitted": "scouting",
    "under_review": "scouting",
    "interested": "scouting",
    "rejected": "rejected",
}

APPLICATION_STATUS_LABELS = {
    "submitted": "Application Submitted",
    "under_review": "Under Review",
    "interested": "Selected for Evaluation",
    "rejected": "Not Selected",
}'''
)

content = content.replace(
    '''PIPELINE_STAGE_TO_STATUS = {
    "submitted": "submitted",
    "viewed": "viewed",
    "shortlisted": "shortlisted",
    "interview_requested": "interview_requested",
    "accepted": "accepted",
    "rejected": "rejected",
}''',
    '''PIPELINE_STAGE_TO_STATUS = {
    "scouting": "under_review",
    "video_analysis": "under_review",
    "interview": "under_review",
    "trial_scheduled": "under_review",
    "contract_discussion": "under_review",
    "offer_sent": "interested",
    "signed": "interested",
    "rejected": "rejected",
}

PIPELINE_STAGE_PLAYER_LABELS = {
    "scouting": "Under Evaluation",
    "video_analysis": "Video Analysis",
    "interview": "Interview Scheduled",
    "trial_scheduled": "Trial Scheduled",
    "contract_discussion": "Contract Discussion",
    "offer_sent": "Offer Received",
    "signed": "Signed",
    "rejected": "Not Selected",
}'''
)

# 2. Update auto-pipeline creation - trigger on "interested" instead of shortlisted
content = content.replace(
    '            AUTO_PIPELINE_STATUSES = ["shortlisted", "interview_requested", "offer_received", "accepted"]',
    '            AUTO_PIPELINE_STATUSES = ["interested"]'
)

# 3. Update player status label when app status changes
content = content.replace(
    '    player_label = PIPELINE_STAGE_TO_PLAYER_STATUS.get(STATUS_TO_PIPELINE_STAGE.get(status_update.status, ""), "")',
    '    player_label = APPLICATION_STATUS_LABELS.get(status_update.status, status_update.status)'
)

# 4. Update pipeline stage player labels
content = content.replace(
    'PIPELINE_STAGE_TO_PLAYER_STATUS = {',
    'PIPELINE_STAGE_TO_PLAYER_STATUS_OLD = {'
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")