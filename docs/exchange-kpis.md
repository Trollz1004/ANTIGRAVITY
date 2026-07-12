# Exchange KPI Dashboard Specifications

Issue: **TRO-311**  
Owner: **Paperclip**  
Stakeholder scope: exchange discovery, matching, and deal intent flow

## 1) KPI goals

The exchange dashboard tracks whether the exchange is:

1. Growing its active base (`MAU`).
2. Increasing available opportunities (`Listings`).
3. Converting supply and demand into meaningful conversations (`Matches`).
4. Encouraging outbound interest through outreach (`Pitches sent`).
5. Capturing commercial interest quality (`Deals marked interested`).

## 2) KPI definitions

For each metric below, data should come from production telemetry with UTC-day bucketization and event timestamps in source systems.

### 2.1 MAU (Monthly Active Users)

- **Definition**: Unique verified users with at least one qualifying exchange event in the last 30 days.
- **Qualifying events**: `exchange_session_start`, `listing_create`, `listing_search`, `match_view`, `pitch_send`, `deal_interest_marked`.
- **Formula**:  
  `MAU = COUNT(DISTINCT user_id) WHERE event_time >= now()-30d AND event_name IN qualifying_events`
- **Primary slice**: `day`, `week`, `month`, `device`, `member_tier`.
- **Target**:
  - Week 2: +15% MoM
  - Week 4: +8% weekly sustained growth
- **Alerting**:
  - Warning if 7-day MAU drops >20% vs prior 7-day average.
  - Critical if 14-day MAU < 60% of baseline after 3-day lookback.

### 2.2 Listings

- **Definition**: Count of new active listings published by users on the exchange.
- **Formula**:  
  `New Listings = COUNT(listing_id) WHERE created_at BETWEEN period AND status = Active`
- **Sub-metrics**:
  - `New Listings by day`
  - `New Listings by category`
  - `Approval latency` = median time from submit to publish
  - `Listing quality rate` = percentage of listings that receive at least one match within 7 days
- **Target**:
  - New listings/day steady-state: 20% week over week after baseline period.
- **Alerting**:
  - Warning if `quality rate` < 25%.
  - Critical if `approval latency p95` > 48h.

### 2.3 Matches

- **Definition**: Number of automated or manual pairings generated and presented to users.
- **Formula**:  
  `Matches = COUNT(match_id) WHERE created_at BETWEEN period`
- **Sub-metrics**:
  - `Match conversion rate` = `(matches that generate first pitch action)/(total matches shown)`
  - `Match response rate` = `% of users who open match details within 24h`
- **Target**:
  - Match conversion rate: >35% on 7-day window.
- **Alerting**:
  - Warning if conversion falls below 25%.
  - Critical if response rate drops below 20% for 3 consecutive days.

### 2.4 Pitches Sent

- **Definition**: Count of initiated outbound pitch intents from one user to another.
- **Formula**:  
  `Pitches sent = COUNT(pitch_id) WHERE status IN ('sent','opened') AND created_at BETWEEN period`
- **Sub-metrics**:
  - `Pitches sent per active match`
  - `Pitch delivery success` = `% of pitches with sent timestamp populated`
  - `Pitch quality` = `% of pitches followed by interest action in 7d`
- **Target**:
  - 1.5–2.5 pitches per matched user per week in stable phase.
  - Delivery success >95%.
- **Alerting**:
  - Warning if delivery success <92%.
  - Critical if pitch quality <10% over 7 days.

### 2.5 Deals Marked Interested

- **Definition**: User-marked positive intent on received pitches/listings.
- **Formula**:  
  `Interested Deals = COUNT(deal_id) WHERE interest_flag = true AND marked_at BETWEEN period`
- **Sub-metrics**:
  - `Interest rate` = `Interested Deals / Pitches Sent`
  - `Time-to-interest` = median minutes from pitch send to interest mark
- **Target**:
  - Interest rate >8% on weekly aggregate.
  - Median `time-to-interest` < 180 minutes.
- **Alerting**:
  - Warning if interest rate <6% for 2 days.
  - Critical if time-to-interest p95 > 24h for 2 consecutive days.

## 3) Dashboard architecture

### 3.1 Panel set

1. **Executive summary row**
   - MAU, New Listings, Matches, Pitches Sent, Interested Deals (current period)
   - YoY and MoM delta
   - Healthy/Warning/Critical status chips

2. **Funnel row**
   - MAU → Listings → Matches → Pitches Sent → Interested Deals
   - Funnel conversion percentages between stages

3. **Operational row**
   - New Listings by category
   - Match response over time (7/14/30-day)
   - Pitch quality and delivery

4. **Quality row**
   - Approval latency distribution
   - Time-to-interest trend and p95
   - Rejection and drop-off reasons

### 3.2 Segmentation controls

- Region
- Device (mobile/web)
- User type (`consumer`, `creator`, `partner`)
- Source channel
- Membership tier
- Listing category

### 3.3 Data freshness and retention

- Dashboard refresh interval: **every 1 minute** (production), **every 15 minutes** if API pressure is elevated.
- Historical retention: minimum **12 months** for trend comparability.
- Granularity:
  - Real-time cards: 1m–5m rolling windows
  - Trend charts: 1h and 1d buckets

## 4) Data model inputs

- `exchange_users`:
  - `user_id`, `created_at`, `status`, `member_tier`
- `exchange_listings`:
  - `listing_id`, `user_id`, `category`, `status`, `submitted_at`, `published_at`, `approved_at`
- `exchange_matches`:
  - `match_id`, `listing_id`, `candidate_user_id`, `created_at`, `presented_at`
- `exchange_pitches`:
  - `pitch_id`, `sender_user_id`, `recipient_user_id`, `match_id`, `created_at`, `sent_at`, `status`
- `exchange_deal_interest`:
  - `pitch_id`, `user_id`, `interest_flag`, `marked_at`

## 5) Event instrumentation requirements

- All metric events MUST include:
  - `event_id`, `user_id`, `exchange_id`, `event_name`, `event_time`, `source_platform`, `payload_version`
- Events must be idempotent on retries and expose immutable `created_at`.
- Add explicit product flags for experiment cohorts when rollout experiments are active.

## 6) Ownership and cadence

- **Owner**: Growth Analytics + Product.
- **Weekly review**: every Monday, validate trend deltas and alert tuning.
- **Monthly review**: validate target resets and instrumentation coverage.
- **Escalation path**:
  - Missing critical metric for two consecutive refresh cycles → on-call
  - Repeat critical misses for 3 consecutive days → product lead + engineering lead
