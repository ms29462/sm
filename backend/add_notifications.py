with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add notification when application status changes
content = content.replace(
    '    if result.modified_count == 0:\n        raise HTTPException(status_code=404, detail="Application not found")\n    return {"message": "Status updated"}',
    '''    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Notify player of status change
    try:
        application = await db.applications.find_one({"id": application_id}, {"_id": 0})
        if application:
            status_messages = {
                "viewed": "Your application has been viewed",
                "shortlisted": "You have been shortlisted",
                "interview_requested": "An interview has been requested",
                "accepted": "Congratulations! Your application has been accepted",
                "rejected": "Your application status has been updated"
            }
            msg = status_messages.get(status_update.status, f"Your application status changed to {status_update.status}")
            await create_notification(
                application.get("player_id"),
                "application_status",
                f"📋 {msg}",
                {"application_id": application_id, "status": status_update.status}
            )
    except Exception as e:
        print(f"Notification error: {e}")
    
    return {"message": "Status updated"}'''
)

# 2. Add notification when added to pipeline
old_pipeline = 'await db.pipeline.update_one(\n        {"club_id": current_user["user_id"]},\n        {"$push": {"players": pipeline_player.dict()}},\n        upsert=True\n    )\n    return {"message": "Player added to pipeline"}'

new_pipeline = '''await db.pipeline.update_one(
        {"club_id": current_user["user_id"]},
        {"$push": {"players": pipeline_player.dict()}},
        upsert=True
    )
    
    # Notify player they were added to pipeline
    try:
        club = await db.clubs.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        club_name = club.get("name", "An organization") if club else "An organization"
        await create_notification(
            pipeline_player.player_id,
            "pipeline",
            f"🎯 You have been added to a recruitment pipeline",
            {"club_id": current_user["user_id"]}
        )
    except Exception as e:
        print(f"Notification error: {e}")
    
    return {"message": "Player added to pipeline"}'''

if old_pipeline in content:
    content = content.replace(old_pipeline, new_pipeline)
    print("Pipeline notification added!")
else:
    print("Pipeline pattern not found")

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")