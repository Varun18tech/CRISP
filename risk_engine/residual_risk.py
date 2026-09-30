from typing import List, Dict, Any, Tuple

def calculate_residual_risk(
    inherent_risk: float,
    control_effectiveness: float,
) -> Tuple[float, float]:
    """
    Calculates residual risk without overwriting inherent risk.
    control_effectiveness is a normalized 0-100 metric.
    
    Formula:
    ResidualRisk = InherentRisk * (1 - (ControlEffectiveness / 100))
    
    Returns:
    (inherent_risk, residual_risk) - ensuring both are preserved.
    """
    inh = max(0.0, min(100.0, float(inherent_risk)))
    eff = max(0.0, min(100.0, float(control_effectiveness)))
    
    reduction_factor = eff / 100.0
    res = inh * (1.0 - reduction_factor)
    
    return round(inh, 2), round(max(0.0, min(100.0, res)), 2)

def calculate_composite_control_effectiveness(
    controls: List[Dict[str, float]]
) -> float:
    """
    Combines multiple controls based on effectiveness and fleet coverage.
    Each control has 'effectiveness' (0-100) and 'coverage' (0-100).
    Uses independent defensive layers model:
    Overall Failure Rate = Product(1 - (eff_i * cov_i / 10000))
    Overall Effectiveness = (1 - Overall Failure Rate) * 100
    """
    if not controls:
        return 0.0
    
    unmitigated_fraction = 1.0
    for ctl in controls:
        eff = max(0.0, min(100.0, float(ctl.get("effectiveness", 0.0))))
        cov = max(0.0, min(100.0, float(ctl.get("coverage", 100.0))))
        mitigation = (eff * cov) / 10000.0
        unmitigated_fraction *= (1.0 - mitigation)
        
    combined_effectiveness = (1.0 - unmitigated_fraction) * 100.0
    return round(max(0.0, min(100.0, combined_effectiveness)), 2)
