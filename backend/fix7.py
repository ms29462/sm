with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '''        if org:
                requester_role = req.get("requester_type", "club")
                if requester_role == "specialist":
                    # Specialists show name + speciality
                    req["display_name"] = org.get("name", "Specialist")
                    req["display_label"] = org.get("specialist_type", "Specialist")
                else:
                    # Clubs/agents/colleges show playing level only
                    req["display_name"] = None
                    req["display_label"] = org.get("playing_level") or org.get("league_level") or requester_role.capitalize()
                req["org_playing_level"] = org.get("playing_level") or org.get("league_level")
                req["org_name"] = org.get("name") or org.get("agency_name")
                req["specialist_type"] = org.get("specialist_type")
            enriched.append(req)''',
    '''        if org:
                requester_role = req.get("requester_type", "club")
                org_country = org.get("country", "")
                if requester_role == "specialist":
                    req["display_name"] = org.get("name", "Specialist")
                    req["display_label"] = org.get("specialist_type", "Specialist")
                else:
                    playing_level = org.get("playing_level") or org.get("league_level") or requester_role.capitalize()
                    req["display_name"] = None
                    req["display_label"] = f"{playing_level}{(' · ' + org_country) if org_country else ''}"
                req["org_playing_level"] = org.get("playing_level") or org.get("league_level")
                req["org_name"] = org.get("name") or org.get("agency_name")
                req["org_country"] = org_country
                req["specialist_type"] = org.get("specialist_type")
            enriched.append(req)'''
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")