def calculate_eal(
    annual_frequency: float,
    loss_magnitude: float,
) -> float:
    """
    Calculates Expected Annual Loss (EAL):
    EAL = Annualized Incident Frequency * Expected Loss Per Incident
    """
    freq = max(0.0, float(annual_frequency))
    loss = max(0.0, float(loss_magnitude))
    eal = freq * loss
    return round(eal, 2)

def calculate_investment_benefit(
    current_eal: float,
    residual_eal: float,
    investment_cost: float,
) -> dict:
    """
    Calculates financial mitigation benefit and ROI:
    Estimated Financial Benefit = Current EAL - Residual EAL
    ROI = (Benefit - Cost) / Cost * 100
    """
    c_eal = max(0.0, float(current_eal))
    r_eal = max(0.0, float(residual_eal))
    cost = max(0.0, float(investment_cost))
    
    benefit = max(0.0, c_eal - r_eal)
    roi = 0.0
    if cost > 0:
        roi = round(((benefit - cost) / cost) * 100.0, 2)
        
    return {
        "annual_eal_reduction": round(benefit, 2),
        "investment_cost": round(cost, 2),
        "projected_residual_eal": round(r_eal, 2),
        "roi_percentage": roi,
    }
