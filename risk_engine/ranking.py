from typing import List, Dict, Any

CRITICALITY_MULTIPLIERS = {
    "Critical": 1.5,
    "High": 1.25,
    "Medium": 1.0,
    "Low": 0.75,
}

def calculate_priority_rank_score(
    residual_risk: float,
    eal: float,
    business_criticality: str = "Medium",
    max_eal: float = 10000000.0,
) -> float:
    """
    Computes a deterministic, explainable composite priority ranking score.
    Combines:
    1. Residual Risk (0 - 100 scale, 50% weight)
    2. Normalized Financial EAL (0 - 100 scale, 35% weight)
    3. Asset Criticality Multiplier (15% weight)
    """
    res = max(0.0, min(100.0, float(residual_risk)))
    norm_eal = min(100.0, (float(eal) / max(1.0, max_eal)) * 100.0) if max_eal > 0 else 0.0
    crit_mult = CRITICALITY_MULTIPLIERS.get(business_criticality, 1.0)
    
    score = (0.50 * res) + (0.35 * norm_eal) + (0.15 * (crit_mult * 20.0))
    return round(score, 2)

def rank_risks(risks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deterministically ranks risks descending by composite priority score.
    Returns ranked list with assigned rank position (1, 2, 3...).
    """
    if not risks:
        return []
    
    max_eal = max([float(r.get("eal", 0.0)) for r in risks] or [1.0])
    
    scored_risks = []
    for r in risks:
        res = float(r.get("residual_risk", 0.0))
        eal = float(r.get("eal", 0.0))
        crit = r.get("criticality", "Medium")
        rank_score = calculate_priority_rank_score(res, eal, crit, max_eal)
        
        scored_risks.append({
            **r,
            "_rank_score": rank_score
        })
        
    # Sort deterministically: highest rank score first, secondary sort by EAL, tertiary by residual_risk
    sorted_risks = sorted(
        scored_risks,
        key=lambda x: (x["_rank_score"], x.get("eal", 0.0), x.get("residual_risk", 0.0)),
        reverse=True
    )
    
    for idx, item in enumerate(sorted_risks, start=1):
        item["priority_rank"] = idx
        
    return sorted_risks
