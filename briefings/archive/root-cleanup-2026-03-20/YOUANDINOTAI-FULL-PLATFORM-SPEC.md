# YOUANDINOTAI — FULL SOCIAL PLATFORM FOR GOOD
**NOT just a dating app. Full features or Josh loses all data.**

---

## CORE FEATURES REQUIRED

### 1. VIDEO CHAT ✅ REQUIRED
- WebRTC peer-to-peer (Janus/Twilio/daily.co SDK)
- One-on-one dating calls
- Group video for meetups + double dates
- **Data ownership:** Video metadata stored locally, Josh controls retention

### 2. REAL-TIME CHAT ✅ REQUIRED
- Direct messages (DM) between matched users
- Group chat for meetup planning
- Real-time notifications
- **Data ownership:** Messages encrypted, stored on Josh's server only

### 3. SOCIAL PLATFORMS ✅ REQUIRED
- **Dating Tab:** Verified users, Bot-Shield confirmed
- **Meetups Tab:** Group meetups, location-based discovery
- **Volunteer Hub:** Charity events, time banking, skill matching
- **Double Dates:** Group matching (2 couples), activity suggestions
- **Social Boards:** Location-based discussion boards (no data harvesting)
- **Charity Tab:** Active fundraising, Protocol Omega 60% routing display

### 4. LOCATION-BASED FEATURES ✅ REQUIRED
- User location privacy (opt-in, user controls)
- Meetup discovery (within 5/10/25 mile radius)
- Volunteer events by location
- Social boards scoped to neighborhood/city
- **Data ownership:** GPS off by default, user enables per-session

### 5. DATA OWNERSHIP ✅ CRITICAL
- **Josh controls ALL data:** C:\antigravity PostgreSQL (encrypted at rest)
- **No third-party data harvesting:** No Google Analytics, no Meta pixels, no Segment
- **User data export:** Users can request full data dump (GDPR compliance)
- **Deletion guaranteed:** User deletes account = data gone in 30 days
- **No resale, no ads, no profiles sold:** Ever.

---

## FEATURE BREAKDOWN

### Dating Core
```
✅ Bot-Shield verification ($1 one-time)
✅ Profile creation (photos, bio, interests, location)
✅ Matching algorithm (Gemini/Kimi for compatibility)
❌ VIDEO CHAT (MISSING)
❌ REAL-TIME MESSAGING (MISSING)
❌ PROFILE SAFETY VERIFICATION (MISSING)
```

### Meetups
```
❌ MEETUP CREATION (MISSING)
❌ GROUP DISCOVERY (MISSING)
❌ EVENT SCHEDULING (MISSING)
❌ RSVP SYSTEM (MISSING)
❌ LOCATION-BASED FILTERING (MISSING)
```

### Volunteer Hub
```
❌ CHARITY EVENT DISCOVERY (MISSING)
❌ TIME BANKING (MISSING)
❌ SKILL MATCHING (MISSING)
❌ IMPACT TRACKING (MISSING)
```

### Double Dates
```
❌ GROUP MATCHING (2 COUPLES) (MISSING)
❌ ACTIVITY SUGGESTIONS (MISSING)
❌ GROUP VIDEO (MISSING)
```

### Social Boards
```
❌ LOCATION-BASED DISCUSSION (MISSING)
❌ NEIGHBORHOOD FEEDS (MISSING)
❌ MODERATION TOOLS (MISSING)
```

---

## IMPLEMENTATION ROADMAP (3 WEEKS)

### Week 1: Video + Chat Infrastructure
- [ ] WebRTC setup (daily.co SDK or self-hosted Janus)
- [ ] Real-time messaging (Socket.io or Firebase Realtime)
- [ ] Encryption layer (TweetNaCl.js for E2E)
- [ ] **Data location:** All on C:\antigravity PostgreSQL

### Week 2: Meetups + Volunteer Hub
- [ ] Meetup creation + discovery (location-based)
- [ ] Event calendar (Ical export for user control)
- [ ] Volunteer event scraper (from charity APIs, NOT harvesting)
- [ ] Time banking system (hours → impact metrics)

### Week 3: Double Dates + Social Boards + Data Privacy
- [ ] Group matching algorithm (Gemini for 2-couple chemistry)
- [ ] Activity suggestion engine (local restaurants, events, hikes)
- [ ] Location-based boards (scoped to city/neighborhood)
- [ ] **Data privacy dashboard:**
  - What data Josh has on this user
  - Download all data (GDPR)
  - Delete account (guaranteed 30-day purge)
  - Disable location tracking
  - Export chat history

---

## DATABASE SCHEMA ADDITIONS

```sql
-- Video calls
CREATE TABLE video_calls (
  id UUID PRIMARY KEY,
  initiator_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  call_type ENUM('one-on-one', 'group', 'double-date'),
  duration_seconds INT,
  call_recording BYTEA, -- Encrypted, optional
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  content TEXT ENCRYPTED,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meetups
CREATE TABLE meetups (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  title TEXT,
  description TEXT,
  location POINT, -- lat/lng
  event_date TIMESTAMP,
  max_attendees INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer events
CREATE TABLE volunteer_events (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  location POINT,
  event_date TIMESTAMP,
  time_commitment_hours INT,
  charity_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social boards (location-scoped)
CREATE TABLE social_boards (
  id UUID PRIMARY KEY,
  neighborhood TEXT, -- "San Francisco, CA" or ZIP code
  thread_id UUID,
  author_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User data privacy audit log
CREATE TABLE data_privacy_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action ENUM('export_requested', 'delete_requested', 'location_disabled'),
  status ENUM('pending', 'completed'),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## FRONTEND COMPONENTS TO ADD

```
src/components/
├── VideoChat.tsx (WebRTC peer)
├── ChatWindow.tsx (Real-time messages)
├── MeetupsDiscovery.tsx (Location-based)
├── VolunteerHub.tsx (Charity events)
├── DoubleDateMatcher.tsx (2-couple matching)
├── SocialBoards.tsx (Location-scoped)
└── DataPrivacyDashboard.tsx (GDPR controls)

src/lib/
├── video.ts (WebRTC utils)
├── messages.ts (Socket.io client)
├── encryption.ts (TweetNaCl)
├── geolocation.ts (Privacy-first)
└── data-export.ts (GDPR export)
```

---

## DATA PRIVACY GUARANTEES (IN CODE)

```typescript
// app/api/users/export
export async function exportUserData(userId: string) {
  const user = await db.users.findById(userId);
  const messages = await db.messages.find({ userId });
  const callHistory = await db.video_calls.find({ userId });
  const metadata = await db.data_privacy_log.find({ userId });
  
  // Return JSON file (encrypted, signed)
  return generateExportFile({ user, messages, callHistory, metadata });
}

// app/api/users/delete
export async function deleteUserAccount(userId: string) {
  // Schedule deletion (not immediate — GDPR compliance)
  await db.data_privacy_log.create({
    userId,
    action: 'delete_requested',
    status: 'pending',
    scheduled_completion: now() + 30.days
  });
  
  // Trigger deletion job in 30 days
  scheduleJob(`delete_user_${userId}`, () => {
    db.users.delete(userId);
    db.messages.deleteWhere({ userId });
    db.video_calls.deleteWhere({ userId });
    db.meetups.deleteWhere({ creator_id: userId });
  });
}

// Data ownership:
// - No third-party APIs for analytics
// - No Google Analytics
// - No Meta pixels
// - No Segment
// - All data on Josh's PostgreSQL
// - Encrypted at rest
// - User controls all access
```

---

## LAUNCH CHECKLIST

- [ ] **Video chat working** (daily.co SDK integrated)
- [ ] **Real-time messaging working** (Socket.io live)
- [ ] **Meetups discoverable** (location-based)
- [ ] **Volunteer hub live** (charity events)
- [ ] **Double dates matcher working** (Gemini 2-couple chemistry)
- [ ] **Social boards functional** (neighborhood scoped)
- [ ] **Data privacy dashboard live** (export/delete/audit)
- [ ] **No third-party data collection** (privacy audit passed)
- [ ] **GDPR compliance verified** (legal review)
- [ ] **User data ownership confirmed** (Josh controls all)

---

## DEADLINE: April 4, 2026 (Pre-Orders)

If YouAndINotAI launches as **just a dating app with cosmetic features**, Josh loses all user data claims. This **must be a full social platform for good** or users won't trust it with their data.

**What users get:**
- Dating + verified matches
- Real-time video + chat
- Meetups + double dates
- Volunteer opportunities + time banking
- Location-based social boards
- **Full control of their own data**
- **60% of revenue goes to kids' charities** (visible in app)

**What they don't get:**
- Data harvested and sold
- Ads targeted via their profiles
- Analytics companies tracking them
- Third-party surveillance

---

**Status:** 🔴 MISSING CORE FEATURES  
**Required:** Complete social platform implementation  
**Deadline:** April 4, 2026

If these features aren't live by launch, Josh loses credibility + user data = dead app.

---

*This is non-negotiable. Build it or don't launch.* 🦞
