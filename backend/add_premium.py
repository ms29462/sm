with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

premium_endpoints = """
# ============ PLAYER PREMIUM SUBSCRIPTION ============

@api_router.post("/stripe/create-premium-checkout")
async def create_premium_checkout(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "player":
        raise HTTPException(status_code=403, detail="Players only")
    
    player = await db.players.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if player and player.get("is_premium"):
        raise HTTPException(status_code=400, detail="Already a Premium subscriber")
    
    price_id = os.environ.get("STRIPE_PREMIUM_PRICE_ID")
    if not price_id:
        raise HTTPException(status_code=500, detail="Premium price not configured")
    
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url="https://www.soccermatch.app/player/credits?premium=success",
            cancel_url="https://www.soccermatch.app/player/credits?premium=cancelled",
            metadata={
                "user_id": current_user["user_id"],
                "type": "premium_subscription"
            },
            customer_email=user.get("email") if user else None
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def activate_premium(user_id: str, stripe_subscription_id: str, period_end: int = None):
    from datetime import datetime, timezone
    import time
    end_date = datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat() if period_end else None
    
    await db.players.update_one(
        {"user_id": user_id},
        {"$set": {
            "is_premium": True,
            "premium_status": "active",
            "stripe_subscription_id": stripe_subscription_id,
            "premium_started_at": datetime.now(timezone.utc).isoformat(),
            "premium_expires_at": end_date,
            "badges": ["premium_player"]
        }}
    )
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "plan_id": "player_premium",
            "plan_name": "Player Premium",
            "status": "active",
            "stripe_subscription_id": stripe_subscription_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": end_date,
            "billing_cycle": "yearly"
        }},
        upsert=True
    )

async def grant_premium_credits(user_id: str, stripe_subscription_id: str):
    # Check if already granted for this subscription period
    existing = await db.credit_transactions.find_one({
        "user_id": user_id,
        "type": "premium_subscription_bonus",
        "reference": stripe_subscription_id
    })
    if existing:
        return False
    await add_credits(
        user_id,
        20,
        "premium_subscription_bonus",
        "Player Premium annual bonus credits",
        stripe_subscription_id
    )
    return True
"""

content = content.replace(
    "fastapi_app.include_router(api_router)",
    premium_endpoints + "\nfastapi_app.include_router(api_router)",
    1
)

# Update webhook to handle subscription events
content = content.replace(
    '    if event["type"] == "checkout.session.completed":',
    '''    if event["type"] == "customer.subscription.created" or event["type"] == "customer.subscription.updated":
        sub = event["data"]["object"]
        user_id = sub.get("metadata", {}).get("user_id")
        if not user_id:
            # Try to find by stripe customer
            customer_id = sub.get("customer")
            player = await db.players.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
            if player:
                user_id = player["user_id"]
        if user_id:
            status = sub.get("status")
            period_end = sub.get("current_period_end")
            if status == "active":
                await activate_premium(user_id, sub["id"], period_end)
            elif status in ["canceled", "unpaid", "past_due"]:
                await db.players.update_one(
                    {"user_id": user_id},
                    {"$set": {"is_premium": False, "premium_status": status}}
                )
                await db.subscriptions.update_one(
                    {"user_id": user_id},
                    {"$set": {"status": status}}
                )
    
    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        customer_id = sub.get("customer")
        player = await db.players.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
        if player:
            await db.players.update_one(
                {"user_id": player["user_id"]},
                {"$set": {"is_premium": False, "premium_status": "cancelled"}}
            )
            await db.subscriptions.update_one(
                {"user_id": player["user_id"]},
                {"$set": {"status": "cancelled"}}
            )
    
    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        sub_id = invoice.get("subscription")
        customer_id = invoice.get("customer")
        if sub_id:
            player = await db.players.find_one({"stripe_subscription_id": sub_id}, {"_id": 0})
            if not player:
                player = await db.players.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
            if player:
                await grant_premium_credits(player["user_id"], sub_id)
    
    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        sub_id = invoice.get("subscription")
        if sub_id:
            player = await db.players.find_one({"stripe_subscription_id": sub_id}, {"_id": 0})
            if player:
                await db.players.update_one(
                    {"user_id": player["user_id"]},
                    {"$set": {"premium_status": "past_due"}}
                )
    
    elif event["type"] == "checkout.session.completed":'''
)

# Handle premium checkout session
content = content.replace(
    '''        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id")
        pack_id = metadata.get("pack_id")
        credits = int(metadata.get("credits", 0))
        session_id = session.get("id")
        
        # Idempotency check
        existing = await db.credit_transactions.find_one({"reference": session_id})
        if existing:
            return {"status": "already processed"}
        
        if user_id and credits > 0:
            await add_credits(
                user_id,
                credits,
                "credit_purchase",
                f"Purchase: {pack_id} pack ({credits} credits)",
                session_id
            )
            # Send confirmation email
            try:
                player = await db.players.find_one({"user_id": user_id}, {"_id": 0})
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user and player:
                    pack_info = CREDIT_PACKS_STRIPE.get(pack_id, {})
                    amount = f"${pack_info.get('price', 0)/100:.2f}"
                    await send_credit_purchase_confirmation(
                        user["email"],
                        player.get("name", "Player"),
                        credits,
                        pack_info.get("name", pack_id),
                        amount
                    )
            except Exception as e:
                print(f"Email error: {e}")''',
    '''        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id")
        session_type = metadata.get("type", "credit_purchase")
        session_id = session.get("id")
        
        if session_type == "premium_subscription":
            # Premium subscription - will be handled by subscription webhooks
            sub_id = session.get("subscription")
            if user_id and sub_id:
                period_end = None
                try:
                    sub = stripe.Subscription.retrieve(sub_id)
                    period_end = sub.get("current_period_end")
                    await activate_premium(user_id, sub_id, period_end)
                    await grant_premium_credits(user_id, sub_id)
                except Exception as e:
                    print(f"Premium activation error: {e}")
        else:
            pack_id = metadata.get("pack_id")
            credits = int(metadata.get("credits", 0))
            
            # Idempotency check
            existing = await db.credit_transactions.find_one({"reference": session_id})
            if existing:
                return {"status": "already processed"}
            
            if user_id and credits > 0:
                await add_credits(
                    user_id,
                    credits,
                    "credit_purchase",
                    f"Purchase: {pack_id} pack ({credits} credits)",
                    session_id
                )
                try:
                    player = await db.players.find_one({"user_id": user_id}, {"_id": 0})
                    user = await db.users.find_one({"id": user_id}, {"_id": 0})
                    if user and player:
                        pack_info = CREDIT_PACKS_STRIPE.get(pack_id, {})
                        amount = f"${pack_info.get('price', 0)/100:.2f}"
                        await send_credit_purchase_confirmation(
                            user["email"],
                            player.get("name", "Player"),
                            credits,
                            pack_info.get("name", pack_id),
                            amount
                        )
                except Exception as e:
                    print(f"Email error: {e}")'''
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")