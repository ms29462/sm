with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '\n\n@api_router.put("/trial-invitations/{invite_id}/respond")',
    '''

@api_router.delete("/trial-invitations/{invite_id}")
async def delete_trial_invitation(invite_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.trial_invitations.delete_one({
        "id": invite_id,
        "$or": [
            {"player_id": current_user["user_id"]},
            {"club_id": current_user["user_id"]}
        ]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"message": "Deleted"}

@api_router.put("/trial-invitations/{invite_id}/respond")'''
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")