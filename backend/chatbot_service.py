"""
AI Chatbot Service for SoccerMatch
Handles natural language queries and searches the database accordingly
"""
import os
import json
import re
from typing import List, Dict, Any, Optional
from emergentintegrations.llm.chat import Chat, Message

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# System prompt for the AI assistant
SYSTEM_PROMPT = """Tu es l'assistant IA de SoccerMatch, une plateforme qui connecte les joueurs de football avec les clubs, agents et spécialistes.

Tu peux aider les utilisateurs à:
1. Rechercher des joueurs selon des critères spécifiques (position, nationalité, pied préféré, âge, etc.)
2. Rechercher des clubs et opportunités
3. Répondre aux questions sur la plateforme
4. Donner des conseils selon le profil de l'utilisateur

Quand un utilisateur te demande de rechercher des joueurs, tu dois extraire les critères et les retourner dans un format JSON structuré.

Pour les recherches de joueurs, retourne UNIQUEMENT un JSON avec ce format:
{
  "action": "search_players",
  "criteria": {
    "position": "Midfielder" | "Defender" | "Forward" | "Goalkeeper" | "Striker" | "Winger" | null,
    "nationality": ["France", "Gambia"] | null,
    "preferred_foot": "Left" | "Right" | "Both" | null,
    "min_age": number | null,
    "max_age": number | null,
    "playing_level": "Professional" | "Semi-Professional" | "Amateur" | "Youth Academy" | null,
    "name": "string" | null
  }
}

Pour les recherches d'opportunités/clubs:
{
  "action": "search_opportunities",
  "criteria": {
    "position": "string" | null,
    "country": "string" | null,
    "league_level": "string" | null
  }
}

Pour les autres questions, retourne:
{
  "action": "conversation",
  "response": "Ta réponse ici"
}

IMPORTANT: 
- Réponds toujours en français
- Pour les nationalités multiples (ex: "franco-gambien"), utilise un tableau ["France", "Gambia"]
- "Gaucher" = "Left", "Droitier" = "Right", "Ambidextre" = "Both"
- Les positions en anglais: Milieu de terrain = "Midfielder", Défenseur = "Defender", Attaquant = "Forward"/"Striker", Gardien = "Goalkeeper", Ailier = "Winger"
"""

class SoccerMatchChatbot:
    def __init__(self):
        self.chat = Chat(
            api_key=EMERGENT_LLM_KEY,
            model="gemini-2.0-flash",
            system_prompt=SYSTEM_PROMPT
        )
    
    async def process_query(self, user_message: str, user_role: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Process a user query and return either search results or a conversation response
        """
        # Add context about user role
        context = f"[Contexte: L'utilisateur est un(e) {self._translate_role(user_role)}]\n\n{user_message}"
        
        # Build messages from history
        messages = []
        if conversation_history:
            for msg in conversation_history[-5:]:  # Keep last 5 messages for context
                messages.append(Message(
                    role="user" if msg.get("role") == "user" else "assistant",
                    content=msg.get("content", "")
                ))
        
        messages.append(Message(role="user", content=context))
        
        try:
            response = self.chat.message(messages=messages)
            return self._parse_response(response)
        except Exception as e:
            return {
                "action": "error",
                "response": f"Désolé, une erreur s'est produite: {str(e)}"
            }
    
    def _translate_role(self, role: str) -> str:
        translations = {
            "player": "joueur",
            "club": "club",
            "federation": "fédération",
            "agent": "agent",
            "specialist": "spécialiste",
            "admin": "administrateur"
        }
        return translations.get(role, role)
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse the LLM response and extract JSON if present"""
        # Try to find JSON in the response
        try:
            # Look for JSON block
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group()
                parsed = json.loads(json_str)
                return parsed
        except json.JSONDecodeError:
            pass
        
        # If no valid JSON, return as conversation
        return {
            "action": "conversation",
            "response": response
        }


async def search_players_from_criteria(db, criteria: Dict) -> List[Dict]:
    """Search players in the database based on criteria"""
    query = {"approved": True}
    
    if criteria.get("position"):
        query["position"] = {"$regex": criteria["position"], "$options": "i"}
    
    if criteria.get("nationality"):
        nationalities = criteria["nationality"]
        if isinstance(nationalities, list):
            # Search across all nationality fields
            nat_conditions = []
            for nat in nationalities:
                nat_conditions.extend([
                    {"nationality": {"$regex": nat, "$options": "i"}},
                    {"nationality_1": {"$regex": nat, "$options": "i"}},
                    {"nationality_2": {"$regex": nat, "$options": "i"}},
                    {"nationality_3": {"$regex": nat, "$options": "i"}}
                ])
            # For multiple nationalities, player should match ALL
            if len(nationalities) > 1:
                query["$and"] = [{"$or": [
                    {"nationality": {"$regex": nat, "$options": "i"}},
                    {"nationality_1": {"$regex": nat, "$options": "i"}},
                    {"nationality_2": {"$regex": nat, "$options": "i"}},
                    {"nationality_3": {"$regex": nat, "$options": "i"}}
                ]} for nat in nationalities]
            else:
                query["$or"] = nat_conditions
        else:
            query["$or"] = [
                {"nationality": {"$regex": nationalities, "$options": "i"}},
                {"nationality_1": {"$regex": nationalities, "$options": "i"}},
                {"nationality_2": {"$regex": nationalities, "$options": "i"}},
                {"nationality_3": {"$regex": nationalities, "$options": "i"}}
            ]
    
    if criteria.get("preferred_foot"):
        query["preferred_foot"] = {"$regex": criteria["preferred_foot"], "$options": "i"}
    
    if criteria.get("min_age"):
        query["age"] = {"$gte": criteria["min_age"]}
    
    if criteria.get("max_age"):
        if "age" in query:
            query["age"]["$lte"] = criteria["max_age"]
        else:
            query["age"] = {"$lte": criteria["max_age"]}
    
    if criteria.get("playing_level"):
        query["playing_level"] = {"$regex": criteria["playing_level"], "$options": "i"}
    
    if criteria.get("name"):
        query["name"] = {"$regex": criteria["name"], "$options": "i"}
    
    players = await db.players.find(query, {"_id": 0}).to_list(50)
    return players


async def search_opportunities_from_criteria(db, criteria: Dict) -> List[Dict]:
    """Search opportunities in the database based on criteria"""
    query = {}
    
    if criteria.get("position"):
        query["position"] = {"$regex": criteria["position"], "$options": "i"}
    
    if criteria.get("country"):
        query["club_country"] = {"$regex": criteria["country"], "$options": "i"}
    
    if criteria.get("league_level"):
        query["league_level"] = {"$regex": criteria["league_level"], "$options": "i"}
    
    opportunities = await db.opportunities.find(query, {"_id": 0}).to_list(50)
    return opportunities


def format_player_results(players: List[Dict]) -> str:
    """Format player results for display"""
    if not players:
        return "Aucun joueur trouvé correspondant à vos critères."
    
    result = f"J'ai trouvé **{len(players)} joueur(s)** correspondant à vos critères:\n\n"
    
    for i, player in enumerate(players[:10], 1):  # Limit to 10 results
        name = player.get('name', 'Nom inconnu')
        position = player.get('position', 'N/A')
        age = player.get('age', 'N/A')
        nationality = player.get('nationality') or player.get('nationality_1', 'N/A')
        foot = player.get('preferred_foot', 'N/A')
        club = player.get('current_club', 'Sans club')
        level = player.get('playing_level', 'N/A')
        
        result += f"**{i}. {name}**\n"
        result += f"   • Position: {position} | Âge: {age} ans\n"
        result += f"   • Nationalité: {nationality} | Pied: {foot}\n"
        result += f"   • Club: {club} | Niveau: {level}\n\n"
    
    if len(players) > 10:
        result += f"_...et {len(players) - 10} autres joueurs_"
    
    return result


def format_opportunity_results(opportunities: List[Dict]) -> str:
    """Format opportunity results for display"""
    if not opportunities:
        return "Aucune opportunité trouvée correspondant à vos critères."
    
    result = f"J'ai trouvé **{len(opportunities)} opportunité(s)**:\n\n"
    
    for i, opp in enumerate(opportunities[:10], 1):
        club = opp.get('club_name', 'Club inconnu')
        position = opp.get('position', 'N/A')
        country = opp.get('club_country', 'N/A')
        level = opp.get('league_level', 'N/A')
        
        result += f"**{i}. {club}**\n"
        result += f"   • Position: {position} | Pays: {country}\n"
        result += f"   • Niveau: {level}\n\n"
    
    return result
