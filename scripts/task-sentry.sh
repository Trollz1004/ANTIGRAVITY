#!/bin/bash
# TASK SENTRY - Runs on T5500 (192.168.0.15)
# Monitors TASK-QUEUE-100.md and triggers replenishment at 35 remaining
# Deploy: scp to T5500, run with: nohup bash task-sentry.sh &

QUEUE_FILE="/home/aicol/opus/TASK-QUEUE-100.md"
REMOTE_QUEUE="joshl@192.168.0.5:/c/OPUS/TASK-QUEUE-100.md"
CHECK_INTERVAL=300  # 5 minutes
REPLENISH_THRESHOLD=35
LOG_FILE="/home/aicol/opus/sentry.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

count_remaining() {
    # Count unchecked tasks (pending)
    grep -c '^\- \[ \]' "$QUEUE_FILE" 2>/dev/null || echo 0
}

count_completed() {
    grep -c '^\- \[x\]' "$QUEUE_FILE" 2>/dev/null || echo 0
}

sync_from_9020() {
    scp "$REMOTE_QUEUE" "$QUEUE_FILE" 2>/dev/null
}

generate_new_tasks() {
    log "REPLENISH TRIGGERED - Generating new tasks via Ollama..."

    # Use Ollama on T5500 to generate new marketing tasks
    PROMPT="Generate 65 new marketing tasks for YouAndINotAI dating app (youandinotai.com).
    Format each as: - [ ] NUMBER. TASK_DESCRIPTION
    Categories: city tweets (Tier 3 cities), hashtag engagement, SEO content, influencer outreach,
    email campaigns, partnership pitches, A/B testing, community building.
    USP: V8 Cloud Verification, No Bots, Real Humans, \$14.99/mo founding member.
    Start numbering from 101."

    NEW_TASKS=$(ollama run llama3.2:3b "$PROMPT" 2>/dev/null)

    if [ -n "$NEW_TASKS" ]; then
        echo "" >> "$QUEUE_FILE"
        echo "## AUTO-GENERATED BATCH (Sentry $(date '+%Y-%m-%d %H:%M'))" >> "$QUEUE_FILE"
        echo "$NEW_TASKS" >> "$QUEUE_FILE"

        # Sync back to 9020
        scp "$QUEUE_FILE" "$REMOTE_QUEUE" 2>/dev/null
        log "New tasks generated and synced back to 9020"
    else
        log "ERROR: Ollama failed to generate tasks. Is ollama running?"
        # Fallback: use pre-built task templates
        cat >> "$QUEUE_FILE" << 'FALLBACK'

## AUTO-GENERATED BATCH (Fallback Templates)
- [ ] 101. Tweet - El Paso #ElPaso #Texas
- [ ] 102. Tweet - Fresno #Fresno #California
- [ ] 103. Tweet - Mesa #Mesa #Arizona
- [ ] 104. Tweet - Atlanta suburb tweets (Marietta, Decatur)
- [ ] 105. Tweet - Detroit #Detroit #Michigan
- [ ] 106. Tweet - Bakersfield #Bakersfield #California
- [ ] 107. Tweet - Aurora #Aurora #Colorado
- [ ] 108. Tweet - Stockton #Stockton #California
- [ ] 109. Tweet - Henderson #Henderson #Nevada
- [ ] 110. Tweet - Newark #Newark #NewJersey
- [ ] 111. Tweet - Rochester #Rochester #NewYork
- [ ] 112. Tweet - Toledo #Toledo #Ohio
- [ ] 113. Tweet - Buffalo #Buffalo #NewYork
- [ ] 114. Tweet - Anchorage #Anchorage #Alaska
- [ ] 115. Tweet - Lexington #Lexington #Kentucky
- [ ] 116. Engage trending #SingleLife hashtag
- [ ] 117. Engage trending #DatingApps hashtag
- [ ] 118. Engage trending #ValentinesDay hashtag
- [ ] 119. Quote-tweet dating complaint with YouAndINotAI pitch
- [ ] 120. Reply to viral dating tweet with app mention
- [ ] 121. Post dating poll on X (favorite first date spot)
- [ ] 122. Post dating poll on X (biggest dating app red flag)
- [ ] 123. Create thread: "Why 47% of dating profiles are bots"
- [ ] 124. Create thread: "How V8 Cloud Verification works"
- [ ] 125. Create thread: "5 signs you're talking to a bot"
- [ ] 126. LinkedIn article: Online Dating Safety in 2026
- [ ] 127. LinkedIn article: Why Video Verification Matters
- [ ] 128. Facebook Group post: Singles Over 30
- [ ] 129. Facebook Group post: Dating After Divorce
- [ ] 130. Facebook Group post: Christian Singles
- [ ] 131. Email campaign: Pre-order confirmation
- [ ] 132. Email campaign: Feature preview
- [ ] 133. Email campaign: Launch countdown
- [ ] 134. Email campaign: Founding member benefits
- [ ] 135. Email campaign: Referral incentive
- [ ] 136. DM 10 dating influencers on Instagram
- [ ] 137. DM 10 dating coaches on TikTok
- [ ] 138. DM 10 relationship bloggers
- [ ] 139. Submit app to dating app review sites
- [ ] 140. Submit press release to tech blogs
- [ ] 141. Create Quora answers about dating app bots
- [ ] 142. Create Medium article about bot-free dating
- [ ] 143. Submit to Product Hunt
- [ ] 144. Submit to Hacker News Show HN
- [ ] 145. Create comparison infographic vs competitors
- [ ] 146. Tweet - Plano #Plano #Texas
- [ ] 147. Tweet - Chandler #Chandler #Arizona
- [ ] 148. Tweet - Scottsdale #Scottsdale #Arizona
- [ ] 149. Tweet - Madison #Madison #Wisconsin
- [ ] 150. Tweet - Durham #Durham #NorthCarolina
- [ ] 151. Tweet - Savannah #Savannah #Georgia
- [ ] 152. Tweet - Charleston #Charleston #SouthCarolina
- [ ] 153. Tweet - Knoxville #Knoxville #Tennessee
- [ ] 154. Tweet - Chattanooga #Chattanooga #Tennessee
- [ ] 155. Tweet - Little Rock #LittleRock #Arkansas
- [ ] 156. Schedule Monday motivation posts for week
- [ ] 157. Schedule Tips Tuesday posts for week
- [ ] 158. Schedule Wins Wednesday posts for week
- [ ] 159. Schedule Feature Friday posts for week
- [ ] 160. Schedule Story Saturday posts for week
- [ ] 161. Retweet and engage with dating content creators
- [ ] 162. Follow 50 dating-related accounts
- [ ] 163. Follow 50 local city singles accounts
- [ ] 164. Create Twitter List: Dating Influencers
- [ ] 165. Create Twitter List: City Singles Groups
FALLBACK
        scp "$QUEUE_FILE" "$REMOTE_QUEUE" 2>/dev/null
        log "Fallback tasks added and synced"
    fi
}

# MAIN LOOP
log "=== TASK SENTRY STARTED ==="
log "Monitoring: $QUEUE_FILE"
log "Threshold: $REPLENISH_THRESHOLD remaining"
log "Check interval: ${CHECK_INTERVAL}s"

while true; do
    # Sync latest from 9020
    sync_from_9020

    REMAINING=$(count_remaining)
    COMPLETED=$(count_completed)

    log "Status: $REMAINING pending | $COMPLETED completed"

    if [ "$REMAINING" -le "$REPLENISH_THRESHOLD" ]; then
        log "!!! THRESHOLD HIT ($REMAINING <= $REPLENISH_THRESHOLD) - REPLENISHING !!!"
        generate_new_tasks
    fi

    sleep $CHECK_INTERVAL
done
