with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. When opportunity is created, set status to pending_review
content = content.replace(
    '"status": "active",\n            "created_at"',
    '"status": "pending_review",\n            "admin_status": "pending_review",\n            "credit_cost": None,\n            "admin_notes": "",\n            "public_feedback": "",\n            "created_at"'
)

# 2. Filter player-facing opportunities to only show published
content = content.replace(
    'query = {"status": "active"}',
    'query = {"status": "published"}'
)

content = content.replace(
    'query = {"status": "active", ',
    'query = {"status": "published", '
)

# 3. Add admin opportunities endpoints
admin_opp_endpoints = """
@api_router.get("/admin/opportunities")
async def admin_get_opportunities(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    opps = await db.opportunities.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return opps

@api_router.put("/admin/opportunities/{opp_id}")
async def admin_update_opportunity(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    data.pop("_id", None)
    await db.opportunities.update_one({"id": opp_id}, {"$set": data})
    return {"message": "Updated"}

@api_router.post("/admin/opportunities/{opp_id}/approve")
async def admin_approve_opportunity(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    credit_cost = data.get("credit_cost", 1)
    await db.opportunities.update_one(
        {"id": opp_id},
        {"$set": {
            "status": "published",
            "admin_status": "approved",
            "credit_cost": credit_cost,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": current_user["user_id"],
        }}
    )
    return {"message": "Opportunity approved and published"}

@api_router.post("/admin/opportunities/{opp_id}/reject")
async def admin_reject_opportunity(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    await db.opportunities.update_one(
        {"id": opp_id},
        {"$set": {
            "status": "rejected",
            "admin_status": "rejected",
            "public_feedback": data.get("feedback", ""),
            "admin_notes": data.get("notes", ""),
        }}
    )
    return {"message": "Opportunity rejected"}

@api_router.post("/admin/opportunities/{opp_id}/request-changes")
async def admin_request_changes(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    await db.opportunities.update_one(
        {"id": opp_id},
        {"$set": {
            "status": "changes_requested",
            "admin_status": "changes_requested",
            "public_feedback": data.get("feedback", ""),
            "admin_notes": data.get("notes", ""),
        }}
    )
    return {"message": "Changes requested"}
"""

content = content.replace(
    "fastapi_app.include_router(api_router)",
    admin_opp_endpoints + "\nfastapi_app.include_router(api_router)",
    1
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")