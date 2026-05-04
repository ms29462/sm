"""
Player Matching Algorithm for SoccerMatch
Based on Transfermarkt data analysis and league benchmarking
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
import re
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timezone

# =========================================================
# CONFIG
# =========================================================
BASE = "https://www.transfermarkt.us"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

# Expanded leagues — 25 leagues across 6 continents
DEFAULT_LEAGUES = {
    # North America
    "CPL":                  "https://www.transfermarkt.us/canadian-premier-league/startseite/wettbewerb/CDN1",
    "USL Championship":     "https://www.transfermarkt.us/usl-championship/startseite/wettbewerb/USL",
    "USL League One":       "https://www.transfermarkt.us/usl-league-one/startseite/wettbewerb/USC3",
    "MLS":                  "https://www.transfermarkt.us/major-league-soccer/startseite/wettbewerb/MLS1",
    "Liga MX":              "https://www.transfermarkt.us/liga-mx-apertura/startseite/wettbewerb/MEX1",

    # Europe — Top 5
    "Premier League":       "https://www.transfermarkt.us/premier-league/startseite/wettbewerb/GB1",
    "La Liga":              "https://www.transfermarkt.us/laliga/startseite/wettbewerb/ES1",
    "Bundesliga":           "https://www.transfermarkt.us/bundesliga/startseite/wettbewerb/L1",
    "Serie A":              "https://www.transfermarkt.us/serie-a/startseite/wettbewerb/IT1",
    "Ligue 1":              "https://www.transfermarkt.us/ligue-1/startseite/wettbewerb/FR1",

    # Europe — Secondary
    "Eredivisie":           "https://www.transfermarkt.us/eredivisie/startseite/wettbewerb/NL1",
    "Primeira Liga":        "https://www.transfermarkt.us/liga-nos/startseite/wettbewerb/PO1",
    "Pro League":           "https://www.transfermarkt.us/jupiler-pro-league/startseite/wettbewerb/BE1",
    "Challenger Pro League":"https://www.transfermarkt.us/challenger-pro-league/startseite/wettbewerb/BE2",
    "Championship":         "https://www.transfermarkt.us/championship/startseite/wettbewerb/GB2",
    "League One":           "https://www.transfermarkt.us/league-one/startseite/wettbewerb/GB3",
    "League Two":           "https://www.transfermarkt.us/league-two/startseite/wettbewerb/GB4",

    # Africa
    "South African PSL":    "https://www.transfermarkt.us/dstv-premiership/startseite/wettbewerb/SA1",
    "Egyptian Premier":     "https://www.transfermarkt.us/egyptian-premier-league/startseite/wettbewerb/EGY1",
    "Botola Pro":           "https://www.transfermarkt.us/botola-pro/startseite/wettbewerb/MAR1",

    # Asia & Middle East
    "Saudi Pro League":     "https://www.transfermarkt.us/saudi-professional-league/startseite/wettbewerb/SA1L",
    "J1 League":            "https://www.transfermarkt.us/j1-league/startseite/wettbewerb/JAP1",

    # South America
    "Brasileirao":          "https://www.transfermarkt.us/campeonato-brasileiro-serie-a/startseite/wettbewerb/BRA1",
    "Primera Division":     "https://www.transfermarkt.us/superliga/startseite/wettbewerb/AR1N",
    "Colombian Primera":    "https://www.transfermarkt.us/liga-betplay-dimayor/startseite/wettbewerb/COL1",
}

# Expanded league strength ratings
LEAGUE_STRENGTH = {
    # Elite
    "Premier League":       1.80,
    "La Liga":              1.70,
    "Bundesliga":           1.60,
    "Serie A":              1.55,
    "Ligue 1":              1.45,

    # Strong
    "Eredivisie":           1.35,
    "Primeira Liga":        1.30,
    "Pro League":           1.25,
    "Saudi Pro League":     1.25,
    "Brasileirao":          1.20,
    "MLS":                  1.20,
    "Liga MX":              1.15,
    "Primera Division":     1.10,
    "Colombian Primera":    1.05,

    # Mid
    "Challenger Pro League":1.10,
    "Championship":         1.05,
    "J1 League":            1.00,
    "USL Championship":     0.95,
    "Egyptian Premier":     0.95,
    "South African PSL":    0.90,
    "Botola Pro":           0.85,
    "League One":           0.90,
    "CPL":                  0.85,
    "USL League One":       0.75,
    "League Two":           0.80,

    # Lower
    "National League":      0.70,
    "Semi-Professional":    0.60,
    "Amateur":              0.50,
}

CURRENT_SEASON = 2025
USE_PREVIOUS_SEASON_ONLY = True
ANALYSIS_SEASON = CURRENT_SEASON - 1 if USE_PREVIOUS_SEASON_ONLY else CURRENT_SEASON

# Performance tuning
MAX_WORKERS_CLUBS = 10   # increased from 6
MAX_WORKERS_STATS = 16   # increased from 8
BENCHMARK_TTL_HOURS = 48 # re-scrape only if data is older than 48 hours
K_SMALL_SAMPLE = 900
MIN_ROLE_PLAYERS = 8
K_NEIGHBORS = 5

session = requests.Session()
session.headers.update(HEADERS)

# In-memory cache to avoid re-scraping within the same server session
_scrape_cache: Dict[str, Any] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour

def get_soup_cached(url: str, timeout: int = 30) -> Optional[BeautifulSoup]:
    """Cached version of get_soup — avoids hitting the same URL twice"""
    import time
    now = time.time()
    if url in _scrape_cache:
        cached_at, soup = _scrape_cache[url]
        if now - cached_at < CACHE_TTL_SECONDS:
            return soup
    try:
        r = session.get(url, timeout=timeout)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            _scrape_cache[url] = (now, soup)
            return soup
    except Exception:
        pass
    return None

# =========================================================
# HELPERS
# =========================================================
def get_soup(url: str, timeout: int = 30) -> Optional[BeautifulSoup]:
    try:
        r = session.get(url, timeout=timeout)
        if r.status_code == 200:
            return BeautifulSoup(r.text, "html.parser")
    except Exception:
        pass
    return None


def parse_market_value(mv: str) -> float:
    mv = str(mv).strip().lower().replace("€", "").replace(" ", "").replace(",", ".")
    if mv in ["-", "", "nan", "none"]:
        return np.nan
    if mv.endswith("k"):
        return float(mv[:-1]) * 1_000
    if mv.endswith("m"):
        return float(mv[:-1]) * 1_000_000
    mv_num = re.sub(r"[^\d.]", "", mv)
    return float(mv_num) if mv_num else np.nan


def clean_position(player_name: str, position: str) -> str:
    position = str(position).strip()
    if position.startswith(str(player_name)):
        position = position[len(str(player_name)):].strip()
    return position


def position_group(pos: str) -> str:
    pos = str(pos).lower()
    if "goalkeeper" in pos:
        return "GK"
    if any(x in pos for x in [
        "centre-back", "center-back", "left-back", "right-back",
        "defender", "back", "sweeper", "centre back", "center back"
    ]):
        return "DEF"
    if any(x in pos for x in [
        "midfield", "midfielder", "defensive midfield", "holding midfield",
        "central midfield", "attacking midfield", "offensive midfield",
        "wing-back"
    ]):
        return "MID"
    if any(x in pos for x in [
        "forward", "striker", "winger", "second striker",
        "centre-forward", "center-forward", "centre forward", "center forward"
    ]):
        return "FWD"
    return "OTHER"


def position_role_from_text(position_clean: str) -> str:
    pos = str(position_clean).lower()
    if "goalkeeper" in pos:
        return "GK"
    if any(x in pos for x in ["centre-back", "center-back", "central defender", "centre back", "center back"]):
        return "CB"
    if any(x in pos for x in ["left-back", "right-back", "full-back", "wing-back", "left back", "right back"]):
        return "FB"
    if any(x in pos for x in ["defensive midfield", "holding midfield"]):
        return "DM"
    if any(x in pos for x in ["central midfield"]):
        return "CM"
    if any(x in pos for x in ["attacking midfield", "offensive midfield"]):
        return "AM"
    if any(x in pos for x in ["left winger", "right winger", "winger"]):
        return "W"
    if any(x in pos for x in ["centre-forward", "center-forward", "striker", "second striker", "centre forward", "center forward"]):
        return "ST"
    return "OTHER"


def build_stats_url(player_url: str, season: int = ANALYSIS_SEASON) -> str:
    stats_url = re.sub(r"/profil/", "/leistungsdatendetails/", player_url)
    stats_url = re.sub(r"/saison/\d{4}", "", stats_url)
    return stats_url.rstrip("/") + f"/saison/{season}"


def clean_stat_value(x: str) -> int:
    x = str(x).strip()
    if x in ["-", "", "nan", "None"]:
        return 0
    x = x.replace("'", "")
    x = re.sub(r"[^\d]", "", x)
    return int(x) if x else 0


def safe_div(a: float, b: float) -> float:
    if pd.isna(a) or pd.isna(b) or b == 0:
        return 0
    return a / b


def logistic_score(value: float, benchmark: float, k: float = 4) -> float:
    if pd.isna(value) or pd.isna(benchmark) or benchmark == 0:
        return np.nan
    ratio = value / benchmark
    return 100 / (1 + np.exp(-k * (ratio - 1)))


def weighted_score(score_dict: Dict, weights: Dict) -> float:
    weighted_sum = sum((0 if pd.isna(score_dict[k]) else score_dict[k]) * w for k, w in weights.items())
    weight_sum = sum((0 if pd.isna(score_dict[k]) else 1) * w for k, w in weights.items())
    return weighted_sum / weight_sum if weight_sum > 0 else np.nan


def suitability_label(score: float) -> str:
    if pd.isna(score):
        return "Insufficient data"
    if score >= 75:
        return "Excellent fit"
    if score >= 65:
        return "Strong fit"
    if score >= 55:
        return "Possible fit"
    if score >= 45:
        return "Borderline fit"
    return "Weak fit"


def level_label(score: float) -> str:
    if pd.isna(score):
        return "Insufficient data"
    if score >= 120:
        return "Overqualified"
    if score >= 105:
        return "Above level"
    if score >= 85:
        return "League level"
    if score >= 70:
        return "Borderline"
    return "Below level"


def compute_level_prior(player_source_league: str, target_league: str) -> float:
    source_strength = LEAGUE_STRENGTH.get(player_source_league, 1.00)
    target_strength = LEAGUE_STRENGTH.get(target_league, 1.00)
    ratio = source_strength / target_strength
    return min(140, ratio * 100)


def to_numeric_no_nan(x: Any, default: float = 0.0) -> float:
    if pd.isna(x):
        return default
    try:
        x = float(x)
        if np.isinf(x):
            return default
        return x
    except (ValueError, TypeError):
        return default


# =========================================================
# SCRAPING REFERENCE DATA (for benchmark generation)
# =========================================================
def get_clubs(league_name: str, league_url: str) -> pd.DataFrame:
    soup = get_soup(league_url)
    if soup is None:
        return pd.DataFrame(columns=["league", "club", "kader_url"])

    table = soup.find("table", class_="items")
    if table is None:
        return pd.DataFrame(columns=["league", "club", "kader_url"])

    clubs = []
    kader_urls = []

    for row in table.find_all("tr"):
        club_cell = row.find("td", class_="hauptlink")
        if club_cell and club_cell.find("a"):
            club_name = club_cell.get_text(strip=True)
            club_url = BASE + club_cell.find("a")["href"]
            kader_url = club_url.replace("/startseite/", "/kader/")
            clubs.append(club_name)
            kader_urls.append(kader_url)

    return pd.DataFrame({
        "league": league_name,
        "club": clubs,
        "kader_url": kader_urls
    }).drop_duplicates().reset_index(drop=True)


def get_players_from_club(league_name: str, club_name: str, kader_url: str) -> List[Dict]:
    soup = get_soup(kader_url)
    if soup is None:
        return []

    table = soup.find("table", class_="items")
    if table is None:
        return []

    players = []
    rows = table.find_all("tr", class_=re.compile(r"odd|even"))

    for tr in rows:
        name_cell = tr.find("td", class_="hauptlink")
        if not name_cell or not name_cell.find("a"):
            continue

        a = name_cell.find("a")
        player_name = a.get_text(strip=True)
        player_href = a.get("href", "")
        player_url = BASE + player_href

        m = re.search(r"/spieler/(\d+)", player_href)
        player_id = m.group(1) if m else None

        pos_cell = tr.find("td", class_="posrela")
        position_raw = pos_cell.get_text(strip=True) if pos_cell else None
        position_clean_val = clean_position(player_name, position_raw)
        pos_group = position_group(position_clean_val)
        pos_role = position_role_from_text(position_clean_val)

        age = None
        centered = tr.find_all("td", class_="zentriert")
        for c in reversed(centered):
            txt = c.get_text(strip=True)
            if txt.isdigit():
                val = int(txt)
                if 15 <= val <= 45:
                    age = val
                    break

        mv_cell = tr.find("td", class_=re.compile(r"rechts"))
        market_value_raw = mv_cell.get_text(strip=True) if mv_cell else None
        market_value_eur = parse_market_value(market_value_raw)

        players.append({
            "league": league_name,
            "club": club_name,
            "player_name": player_name,
            "player_id": player_id,
            "player_url": player_url,
            "stats_url": build_stats_url(player_url, ANALYSIS_SEASON),
            "season_used": ANALYSIS_SEASON,
            "position_clean": position_clean_val,
            "position_group": pos_group,
            "position_role": pos_role,
            "age": age,
            "market_value_raw": market_value_raw,
            "market_value_eur": market_value_eur
        })

    return players


def extract_total_stats(player_id: str, stats_url: str) -> Dict:
    soup = get_soup(stats_url)
    if soup is None:
        return {"player_id": player_id, "appearances": np.nan, "goals": np.nan, "assists": np.nan, "minutes": np.nan}

    tables = soup.find_all("table")
    if len(tables) < 2:
        return {"player_id": player_id, "appearances": np.nan, "goals": np.nan, "assists": np.nan, "minutes": np.nan}

    summary_table = tables[1]
    rows = summary_table.find_all("tr")

    for row in rows[1:]:
        cells = [cell.get_text(" ", strip=True) for cell in row.find_all(["td", "th"])]
        if len(cells) >= 8:
            competition = cells[1]
            if competition == "":
                return {
                    "player_id": player_id,
                    "appearances": clean_stat_value(cells[3]),
                    "goals": clean_stat_value(cells[4]),
                    "assists": clean_stat_value(cells[5]),
                    "minutes": clean_stat_value(cells[-1])
                }

    return {"player_id": player_id, "appearances": np.nan, "goals": np.nan, "assists": np.nan, "minutes": np.nan}


def build_league_players_df(league_name: str, league_url: str) -> pd.DataFrame:
    df_clubs = get_clubs(league_name, league_url)
    all_players = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS_CLUBS) as executor:
        futures = [
            executor.submit(get_players_from_club, row["league"], row["club"], row["kader_url"])
            for _, row in df_clubs.iterrows()
        ]
        for future in as_completed(futures):
            try:
                all_players.extend(future.result())
            except Exception:
                pass

    df_players = pd.DataFrame(all_players)
    if not df_players.empty:
        df_players = df_players.drop_duplicates(subset=["league", "player_id", "player_name"]).reset_index(drop=True)

    return df_players


def build_player_stats_df(df_players: pd.DataFrame) -> pd.DataFrame:
    rows = df_players[["player_id", "stats_url"]].drop_duplicates().to_dict("records")
    results = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS_STATS) as executor:
        futures = [executor.submit(extract_total_stats, row["player_id"], row["stats_url"]) for row in rows]
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception:
                pass

    return pd.DataFrame(results)


def add_features(df_players_full: pd.DataFrame, k_small_sample: int = K_SMALL_SAMPLE) -> tuple:
    df = df_players_full.copy()

    df["goals_per_90"] = np.where(
        (df["minutes"].notna()) & (df["minutes"] > 0),
        (df["goals"] / df["minutes"]) * 90, 0
    )
    df["assists_per_90"] = np.where(
        (df["minutes"].notna()) & (df["minutes"] > 0),
        (df["assists"] / df["minutes"]) * 90, 0
    )

    avg_apps_by_league_pos = df.groupby(["league", "position_group"])["appearances"].mean().to_dict()

    def get_appearance_rate(row):
        avg_apps = avg_apps_by_league_pos.get((row["league"], row["position_group"]), np.nan)
        if pd.isna(row["appearances"]) or pd.isna(avg_apps) or avg_apps == 0:
            return 0
        return row["appearances"] / avg_apps

    df["appearance_rate"] = df.apply(get_appearance_rate, axis=1)

    def production_score_raw(row):
        pos_role = row["position_role"]
        pos_grp = row["position_group"]
        g90 = row["goals_per_90"]
        a90 = row["assists_per_90"]
        app_rate = row["appearance_rate"]

        if pos_role == "GK":
            return app_rate
        elif pos_role == "CB":
            return 0.15 * g90 + 0.35 * a90 + 0.50 * app_rate
        elif pos_role == "FB":
            return 0.20 * g90 + 0.50 * a90 + 0.30 * app_rate
        elif pos_role == "DM":
            return 0.15 * g90 + 0.25 * a90 + 0.60 * app_rate
        elif pos_role == "CM":
            return 0.35 * g90 + 0.35 * a90 + 0.30 * app_rate
        elif pos_role == "AM":
            return 0.55 * g90 + 0.45 * a90
        elif pos_role == "W":
            return 0.60 * g90 + 0.40 * a90
        elif pos_role == "ST":
            return 0.75 * g90 + 0.25 * a90
        else:
            if pos_grp == "FWD":
                return g90 + 0.5 * a90
            if pos_grp == "MID":
                return g90 + a90
            if pos_grp == "DEF":
                return 0.7 * a90 + 0.3 * app_rate
            if pos_grp == "GK":
                return app_rate
            return np.nan

    df["production_score_raw"] = df.apply(production_score_raw, axis=1)
    df["minutes_weight"] = np.where(df["minutes"].notna(), df["minutes"] / (df["minutes"] + k_small_sample), 0)
    df["production_score_adj_raw"] = df["production_score_raw"] * df["minutes_weight"]

    prod_minmax = (
        df.groupby(["league", "position_group"])["production_score_adj_raw"]
        .agg(["min", "max"])
        .reset_index()
        .rename(columns={"min": "prod_min", "max": "prod_max"})
    )

    df = df.merge(prod_minmax, on=["league", "position_group"], how="left")

    def normalize_prod(row):
        raw = row["production_score_adj_raw"]
        mn = row["prod_min"]
        mx = row["prod_max"]
        if pd.isna(raw) or pd.isna(mn) or pd.isna(mx):
            return np.nan
        if mx == mn:
            return 50
        return ((raw - mn) / (mx - mn)) * 100

    df["production_score"] = df.apply(normalize_prod, axis=1)
    return df, prod_minmax


def build_benchmark_role(df_model: pd.DataFrame) -> pd.DataFrame:
    return (
        df_model.groupby(["league", "position_role"])
        .agg(
            players=("player_name", "count"),
            avg_age=("age", "mean"),
            avg_market_value=("market_value_eur", "mean"),
            avg_appearances=("appearances", "mean"),
            avg_minutes=("minutes", "mean"),
            avg_goals=("goals", "mean"),
            avg_assists=("assists", "mean"),
            avg_production_score=("production_score", "mean")
        )
        .reset_index()
    )


def build_benchmark_group(df_model: pd.DataFrame) -> pd.DataFrame:
    return (
        df_model.groupby(["league", "position_group"])
        .agg(
            players=("player_name", "count"),
            avg_age=("age", "mean"),
            avg_market_value=("market_value_eur", "mean"),
            avg_appearances=("appearances", "mean"),
            avg_minutes=("minutes", "mean"),
            avg_goals=("goals", "mean"),
            avg_assists=("assists", "mean"),
            avg_production_score=("production_score", "mean")
        )
        .reset_index()
    )


async def generate_benchmark_data(db, leagues_dict: Dict[str, str] = None) -> Dict:
    """Generate benchmark data from specified leagues and store in database"""
    if leagues_dict is None:
        leagues_dict = DEFAULT_LEAGUES

    all_players = []
    for league_name, league_url in leagues_dict.items():
        df_league = build_league_players_df(league_name, league_url)
        all_players.append(df_league)

    if not all_players:
        return {"error": "No players found"}

    df_players_full = pd.concat(all_players, ignore_index=True)
    df_stats = build_player_stats_df(df_players_full)
    df_players_full = df_players_full.merge(df_stats, on="player_id", how="left")

    df_model, prod_minmax = add_features(df_players_full)
    benchmark_role = build_benchmark_role(df_model)
    benchmark_group = build_benchmark_group(df_model)

    # Store in database
    benchmark_doc = {
        "id": "current_benchmark",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "analysis_season": ANALYSIS_SEASON,
        "leagues": list(leagues_dict.keys()),
        "player_count": len(df_model),
        "df_model": df_model.to_json(),
        "benchmark_role": benchmark_role.to_json(),
        "benchmark_group": benchmark_group.to_json(),
        "prod_minmax": prod_minmax.to_json()
    }

    await db.benchmark_data.update_one(
        {"id": "current_benchmark"},
        {"$set": benchmark_doc},
        upsert=True
    )

    return {
        "message": "Benchmark data generated successfully",
        "player_count": len(df_model),
        "leagues": list(leagues_dict.keys()),
        "generated_at": benchmark_doc["generated_at"]
    }


async def load_benchmark_data(db) -> Optional[Dict]:
    """Load benchmark data from database"""
    benchmark_doc = await db.benchmark_data.find_one({"id": "current_benchmark"}, {"_id": 0})
    if not benchmark_doc:
        return None

    from io import StringIO
    
    return {
        "df_model": pd.read_json(StringIO(benchmark_doc["df_model"])),
        "benchmark_role": pd.read_json(StringIO(benchmark_doc["benchmark_role"])),
        "benchmark_group": pd.read_json(StringIO(benchmark_doc["benchmark_group"])),
        "prod_minmax": pd.read_json(StringIO(benchmark_doc["prod_minmax"])),
        "generated_at": benchmark_doc.get("generated_at"),
        "leagues": benchmark_doc.get("leagues", [])
    }


# =========================================================
# PLAYER PARSING FROM TRANSFERMARKT
# =========================================================
def extract_player_id_from_url(player_url: str) -> Optional[str]:
    m = re.search(r"/spieler/(\d+)", str(player_url))
    return m.group(1) if m else None


def extract_player_name_from_profile(soup: BeautifulSoup) -> Optional[str]:
    if soup is None:
        return None
    h1 = soup.find("h1")
    if h1:
        txt = h1.get_text(" ", strip=True)
        txt = re.sub(r"#\d+\s*", "", txt).strip()
        if txt:
            return txt
    meta_title = soup.find("meta", attrs={"property": "og:title"})
    if meta_title and meta_title.get("content"):
        return meta_title["content"].split("|")[0].strip()
    return None


def extract_age_from_profile(soup: BeautifulSoup) -> float:
    if soup is None:
        return np.nan
    text = soup.get_text("\n", strip=True)
    patterns = [r"Date of birth/Age:\s*.*?\((\d{1,2})\)", r"Age:\s*(\d{1,2})"]
    for pat in patterns:
        m = re.search(pat, text, flags=re.IGNORECASE | re.DOTALL)
        if m:
            age = int(m.group(1))
            if 15 <= age <= 45:
                return age
    return np.nan


def extract_market_value_from_profile(soup: BeautifulSoup) -> float:
    if soup is None:
        return np.nan
    text = soup.get_text(" ", strip=True)
    patterns = [
        r"Current market value:\s*€\s*([\d.,]+\s*[mk]?)",
        r"Market value:\s*€\s*([\d.,]+\s*[mk]?)",
        r"€\s*([\d.,]+\s*[mk])"
    ]
    for pat in patterns:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            return parse_market_value("€" + m.group(1))
    return np.nan


def extract_main_position_from_profile(soup: BeautifulSoup) -> Optional[str]:
    if soup is None:
        return None
    text = soup.get_text("\n", strip=True)
    patterns = [r"Main position:\s*([A-Za-z \-]+)", r"Position:\s*[A-Za-z]+\s*-\s*([A-Za-z \-]+)"]
    for pat in patterns:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
    known_positions = [
        "Goalkeeper", "Centre-Back", "Center-Back", "Left-Back", "Right-Back",
        "Defensive Midfield", "Central Midfield", "Attacking Midfield",
        "Left Winger", "Right Winger", "Winger", "Second Striker",
        "Centre-Forward", "Center-Forward", "Striker"
    ]
    full_text = soup.get_text(" ", strip=True)
    for pos in known_positions:
        if pos.lower() in full_text.lower():
            return pos
    return None


def extract_source_league_from_profile(soup: BeautifulSoup) -> Optional[str]:
    if soup is None:
        return None
    text = soup.get_text(" ", strip=True)
    known_leagues = list(LEAGUE_STRENGTH.keys())
    for lg in known_leagues:
        if lg.lower() in text.lower():
            return lg
    return None


def build_player_dict_from_transfermarkt_url(player_url: str, analysis_season: int = ANALYSIS_SEASON) -> Dict:
    """Scrape player data from Transfermarkt URL"""
    soup = get_soup(player_url)
    if soup is None:
        raise ValueError("Cannot load player profile page")

    player_id = extract_player_id_from_url(player_url)
    if player_id is None:
        raise ValueError("Cannot extract player_id from URL")

    player_name = extract_player_name_from_profile(soup)
    position_clean_val = extract_main_position_from_profile(soup)
    position_group_value = position_group(position_clean_val)
    position_role_value = position_role_from_text(position_clean_val)
    age = extract_age_from_profile(soup)
    market_value_eur = extract_market_value_from_profile(soup)
    source_league = extract_source_league_from_profile(soup)

    stats_url = build_stats_url(player_url, analysis_season)
    stats = extract_total_stats(player_id, stats_url)

    return {
        "player_name": player_name,
        "player_id": player_id,
        "player_url": player_url,
        "stats_url": stats_url,
        "source_league": source_league,
        "season_used": analysis_season,
        "position_clean": position_clean_val,
        "position_group": position_group_value,
        "position_role": position_role_value,
        "age": age,
        "market_value_eur": market_value_eur,
        "appearances": stats.get("appearances", np.nan),
        "goals": stats.get("goals", np.nan),
        "assists": stats.get("assists", np.nan),
        "minutes": stats.get("minutes", np.nan)
    }


# =========================================================
# EVALUATION
# =========================================================
def get_reference_pool(df_reference: pd.DataFrame, league: str, position_role: str, 
                       position_group_val: str, min_role_players: int = MIN_ROLE_PLAYERS) -> tuple:
    role_pool = df_reference[
        (df_reference["league"] == league) &
        (df_reference["position_role"] == position_role)
    ].copy()

    if len(role_pool) >= min_role_players:
        return role_pool, "role"

    group_pool = df_reference[
        (df_reference["league"] == league) &
        (df_reference["position_group"] == position_group_val)
    ].copy()

    return group_pool, "group"


def compute_player_production(player_dict: Dict, avg_appearances: float, position_role: str, 
                              position_group_val: str, k_small_sample: int = K_SMALL_SAMPLE) -> Dict:
    goals = player_dict.get("goals", np.nan)
    assists = player_dict.get("assists", np.nan)
    minutes = player_dict.get("minutes", np.nan)
    appearances = player_dict.get("appearances", np.nan)

    goals_per_90 = (goals / minutes) * 90 if pd.notna(minutes) and minutes > 0 and pd.notna(goals) else 0
    assists_per_90 = (assists / minutes) * 90 if pd.notna(minutes) and minutes > 0 and pd.notna(assists) else 0
    appearance_rate = safe_div(appearances, avg_appearances)

    if position_role == "GK":
        prod_raw = appearance_rate
    elif position_role == "CB":
        prod_raw = 0.15 * goals_per_90 + 0.35 * assists_per_90 + 0.50 * appearance_rate
    elif position_role == "FB":
        prod_raw = 0.20 * goals_per_90 + 0.50 * assists_per_90 + 0.30 * appearance_rate
    elif position_role == "DM":
        prod_raw = 0.15 * goals_per_90 + 0.25 * assists_per_90 + 0.60 * appearance_rate
    elif position_role == "CM":
        prod_raw = 0.35 * goals_per_90 + 0.35 * assists_per_90 + 0.30 * appearance_rate
    elif position_role == "AM":
        prod_raw = 0.55 * goals_per_90 + 0.45 * assists_per_90
    elif position_role == "W":
        prod_raw = 0.60 * goals_per_90 + 0.40 * assists_per_90
    elif position_role == "ST":
        prod_raw = 0.75 * goals_per_90 + 0.25 * assists_per_90
    else:
        if position_group_val == "FWD":
            prod_raw = goals_per_90 + 0.5 * assists_per_90
        elif position_group_val == "MID":
            prod_raw = goals_per_90 + assists_per_90
        elif position_group_val == "DEF":
            prod_raw = 0.7 * assists_per_90 + 0.3 * appearance_rate
        elif position_group_val == "GK":
            prod_raw = appearance_rate
        else:
            prod_raw = np.nan

    minutes_weight = safe_div(minutes, minutes + k_small_sample) if pd.notna(minutes) else 0
    prod_adj_raw = prod_raw * minutes_weight if pd.notna(prod_raw) else np.nan

    return {"production_score_adj_raw": prod_adj_raw}


def calculate_match_score_for_opportunity(
    player_dict: Dict,
    opportunity_league: str,
    opportunity_position: str,
    benchmark_data: Dict
) -> Dict:
    """Calculate match score for a player against a specific opportunity"""
    _df_model = benchmark_data["df_model"]  # Available for future use
    benchmark_role_df = benchmark_data["benchmark_role"]
    benchmark_group_df = benchmark_data["benchmark_group"]
    prod_minmax_df = benchmark_data["prod_minmax"]

    player = player_dict.copy()
    position_group_val = player.get("position_group", "OTHER")
    position_role_val = player.get("position_role", "OTHER")

    # Map opportunity position to position group
    opp_position_group = position_group(opportunity_position)

    weights_fit = {
        "age_score": 0.15,
        "value_score": 0.15,
        "appearances_score": 0.20,
        "minutes_score": 0.20,
        "production_score": 0.30
    }

    # Find benchmark for target league
    bench_role = benchmark_role_df[
        (benchmark_role_df["league"] == opportunity_league) &
        (benchmark_role_df["position_role"] == position_role_val)
    ].copy()

    bench_group = benchmark_group_df[
        (benchmark_group_df["league"] == opportunity_league) &
        (benchmark_group_df["position_group"] == position_group_val)
    ].copy()

    if not bench_role.empty:
        bench = bench_role.iloc[0]
        benchmark_level = "role"
    elif not bench_group.empty:
        bench = bench_group.iloc[0]
        benchmark_level = "group"
    else:
        # No benchmark data for this league - return basic score
        return {
            "fit_score": None,
            "level_score": None,
            "fit_label": "No benchmark data",
            "level_label": "No benchmark data",
            "position_match": position_group_val == opp_position_group,
            "position_match_bonus": 10 if position_group_val == opp_position_group else 0
        }

    # Compute production score
    prod = compute_player_production(
        player_dict=player,
        avg_appearances=bench["avg_appearances"],
        position_role=position_role_val,
        position_group_val=position_group_val
    )

    row_minmax = prod_minmax_df[
        (prod_minmax_df["league"] == opportunity_league) &
        (prod_minmax_df["position_group"] == position_group_val)
    ].copy()

    if not row_minmax.empty:
        mn = row_minmax["prod_min"].iloc[0]
        mx = row_minmax["prod_max"].iloc[0]
        raw = prod.get("production_score_adj_raw", np.nan)
        if pd.isna(raw) or pd.isna(mn) or pd.isna(mx):
            production_score = np.nan
        elif mx == mn:
            production_score = 50
        else:
            production_score = ((raw - mn) / (mx - mn)) * 100
    else:
        production_score = np.nan

    # Calculate component scores
    age_score = (
        max(0, 100 - abs(player.get("age", np.nan) - bench["avg_age"]) * 6)
        if pd.notna(player.get("age", np.nan)) and pd.notna(bench["avg_age"])
        else np.nan
    )

    value_score = (
        min(140, (player.get("market_value_eur", np.nan) / bench["avg_market_value"]) * 100)
        if pd.notna(player.get("market_value_eur", np.nan))
        and pd.notna(bench["avg_market_value"])
        and bench["avg_market_value"] > 0
        else np.nan
    )

    value_score_fit = min(value_score, 115) if pd.notna(value_score) else np.nan

    appearances_score = logistic_score(player.get("appearances", np.nan), bench["avg_appearances"], k=3)
    minutes_score = logistic_score(player.get("minutes", np.nan), bench["avg_minutes"], k=3)

    fit_scores = {
        "age_score": age_score,
        "value_score": value_score_fit,
        "appearances_score": appearances_score,
        "minutes_score": minutes_score,
        "production_score": production_score
    }

    fit_score = weighted_score(fit_scores, weights_fit)

    # Position match bonus
    position_match = position_group_val == opp_position_group
    position_bonus = 10 if position_match else -5

    # Adjust fit score with position match
    if pd.notna(fit_score):
        fit_score = min(100, fit_score + position_bonus)

    # Calculate level score
    market_value_level = (
        (player.get("market_value_eur", np.nan) / bench["avg_market_value"]) * 100
        if pd.notna(player.get("market_value_eur", np.nan))
        and pd.notna(bench["avg_market_value"])
        and bench["avg_market_value"] > 0
        else np.nan
    )

    source_league = player.get("source_league", None)
    prior_level = compute_level_prior(source_league, opportunity_league) if source_league else np.nan

    level_components = []
    level_weights = []

    if pd.notna(market_value_level):
        level_components.append(min(160, market_value_level))
        level_weights.append(0.45)

    if pd.notna(production_score):
        level_components.append(min(140, production_score))
        level_weights.append(0.35)

    if pd.notna(prior_level):
        level_components.append(min(140, prior_level))
        level_weights.append(0.20)

    level_score = np.average(level_components, weights=level_weights) if len(level_components) > 0 else np.nan

    return {
        "fit_score": round(fit_score, 1) if pd.notna(fit_score) else None,
        "level_score": round(level_score, 1) if pd.notna(level_score) else None,
        "fit_label": suitability_label(fit_score),
        "level_label": level_label(level_score),
        "position_match": position_match,
        "position_match_bonus": position_bonus,
        "age_score": round(age_score, 1) if pd.notna(age_score) else None,
        "value_score": round(value_score_fit, 1) if pd.notna(value_score_fit) else None,
        "production_score": round(production_score, 1) if pd.notna(production_score) else None,
        "benchmark_level": benchmark_level
    }


async def get_player_match_scores(
    db,
    player_transfermarkt_url: str,
    opportunities: List[Dict]
) -> List[Dict]:
    """Get match scores for a player against multiple opportunities"""
    
    # Load benchmark data
    benchmark_data = await load_benchmark_data(db)
    if not benchmark_data:
        return [{"error": "Benchmark data not available. Please ask admin to generate it."}]

    # Fetch player data from Transfermarkt
    try:
        player_dict = build_player_dict_from_transfermarkt_url(player_transfermarkt_url)
    except Exception as e:
        return [{"error": f"Failed to fetch player data: {str(e)}"}]

    results = []
    for opp in opportunities:
        opp_league = opp.get("league_level", "USL Championship")  # Default league
        opp_position = opp.get("position", "")

        match_score = calculate_match_score_for_opportunity(
            player_dict=player_dict,
            opportunity_league=opp_league,
            opportunity_position=opp_position,
            benchmark_data=benchmark_data
        )

        results.append({
            "opportunity_id": opp.get("id"),
            "opportunity_position": opp_position,
            "opportunity_league": opp_league,
            **match_score
        })

    return results


# Available leagues for selection in opportunities
AVAILABLE_LEAGUES = list(LEAGUE_STRENGTH.keys())
