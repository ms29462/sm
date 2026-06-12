with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add college fields to UserRegister
content = content.replace(
    "    country: Optional[str] = None\n    league: Optional[str] = None",
    """    country: Optional[str] = None
    league: Optional[str] = None
    # College registration fields
    institution_type: Optional[str] = None
    competition_level: Optional[str] = None
    athletic_program: Optional[str] = None
    team_gender: Optional[str] = None
    scholarship: Optional[str] = None
    twitter: Optional[str] = None
    recruitment_priorities: Optional[list] = None"""
)

# Find college_doc and update
with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

start = None
end = None
for i, line in enumerate(lines):
    if "college_doc = {" in line:
        start = i
    if start and "await db.colleges.insert_one(college_doc)" in line:
        end = i
        break

if start and end:
    print(f"Found college_doc: lines {start+1} to {end+1}")
    new_block = '''        college_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "country": user.country,
            "institution_type": user.institution_type,
            "competition_level": user.competition_level,
            "athletic_program": user.athletic_program,
            "team_gender": user.team_gender,
            "scholarship": user.scholarship,
            "description": user.description,
            "website": user.website,
            "instagram": user.instagram,
            "facebook": user.facebook,
            "twitter": user.twitter,
            "linkedin": user.linkedin,
            "recruitment_priorities": user.recruitment_priorities or [],
            "rep_first_name": user.rep_first_name,
            "rep_last_name": user.rep_last_name,
            "rep_role": user.rep_role,
            "rep_email": user.rep_email,
            "rep_phone": user.rep_phone,
            "discovery_call_status": "Not Contacted",
            "recommended_tier": user.institution_type,
        }
        await db.colleges.insert_one(college_doc)
'''
    lines = lines[:start] + [new_block] + lines[end+1:]
    with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Backend Done!")
else:
    print("college_doc NOT FOUND")