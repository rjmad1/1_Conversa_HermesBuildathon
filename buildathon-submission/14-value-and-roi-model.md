# Value and ROI Model (Illustrative)

> All numbers below are assumptions for modeling, not measured production outcomes.

## Inputs
- Meetings per employee per week = `M`
- Manual follow-up minutes per meeting = `F`
- Number of users = `U`
- Follow-up effort reduction = `R` (0..1)
- Loaded hourly cost = `C`

## Formula
- Weekly hours saved = `U * M * (F/60) * R`
- Weekly value = `Weekly hours saved * C`
- Annual value = `Weekly value * 52`

## Scenario A — Small Team
- U=10, M=8, F=20, R=0.20, C=$80
- Weekly hours saved = 53.3
- Weekly value ≈ $4,266
- Annual value ≈ $221,832

## Scenario B — Department
- U=80, M=8, F=20, R=0.20, C=$90
- Weekly hours saved = 426.7
- Weekly value ≈ $38,403
- Annual value ≈ $1,996,956

## Scenario C — Enterprise Pilot
- U=300, M=6, F=18, R=0.15, C=$95
- Weekly hours saved = 810
- Weekly value ≈ $76,950
- Annual value ≈ $4,001,400

## Additional KPI hypothesis
- Action completion rate uplift (assumed) from explicit ownership + audit visibility.

## Disclosure
These are directional planning models only and should be replaced with measured pilot telemetry.
