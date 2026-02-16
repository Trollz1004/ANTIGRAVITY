# TASK QUEUE - YouAndINotAI Marketing Blitz
# Auto-replenish to 100 when remaining drops to 35
# Sentry on T5500 monitors and triggers Opus for new tasks
# Last Updated: 2026-02-15 21:00
# Executor: Haiku sub-agents + Ollama on T5500/9020

## STATUS KEY
- [ ] Pending | [x] Done | [>] In Progress | [!] Blocked

---

## BATCH 1: X/Twitter City Tweets - DONE (1-15)
- [x] 1. Tweet NYC | status/2023204018538111058
- [x] 2. Tweet LA | status/2023204303456829547
- [x] 3. Tweet Chicago | status/2023204556092694979
- [x] 4. Tweet Houston | status/2023204818630656373
- [x] 5. Tweet Dallas | status/2023205052928659895
- [x] 6. Tweet Atlanta | status/2023205283141460396
- [x] 7. Tweet Phoenix | status/2023207740135428577
- [x] 8. Tweet Philly | status/2023208180109467905
- [x] 9. Tweet San Antonio | posted
- [x] 10. Tweet San Diego | status/2023208845770736126
- [x] 11. Tweet Austin | status/2023209103489696061
- [x] 12. Tweet Jacksonville | status/2023209304862409089
- [x] 13. Tweet SF | status/2023209659855769980
- [x] 14. Tweet Seattle | status/2023209853116690581
- [x] 15. Tweet Denver | status/2023210042263048458

## BATCH 2: X/Twitter Remaining Tier 1 - DONE (16-21)
- [x] 16. Tweet Nashville | status/2023212992813527111
- [x] 17. Tweet Charlotte | status/2023213230089232761
- [x] 18. Tweet Indianapolis | status/2023214174227099816
- [x] 19. Tweet Columbus | status/2023214677166014470
- [x] 20. Tweet Fort Worth | status/2023214961586028700
- [x] 21. Tweet San Jose | status/2023216273807520022

## BATCH 3: X/Twitter Tier 2 Cities (22-51)
- [ ] 22. Tweet Washington DC #DC #DMV
- [ ] 23. Tweet Boston #Boston #Massachusetts
- [ ] 24. Tweet Miami #Miami #SoFlo
- [ ] 25. Tweet Portland #Portland #Oregon
- [ ] 26. Tweet Las Vegas #Vegas #Nevada
- [ ] 27. Tweet Minneapolis #Minneapolis #Minnesota
- [ ] 28. Tweet Tampa #Tampa #Florida
- [ ] 29. Tweet New Orleans #NOLA #Louisiana
- [ ] 30. Tweet Cleveland #Cleveland #Ohio
- [ ] 31. Tweet Orlando #Orlando #Florida
- [ ] 32. Tweet St Louis #STL #Missouri
- [ ] 33. Tweet Pittsburgh #Pittsburgh #Pennsylvania
- [ ] 34. Tweet Cincinnati #Cincinnati #Ohio
- [ ] 35. Tweet Kansas City #KC #Missouri
- [ ] 36. Tweet Sacramento #Sacramento #California
- [ ] 37. Tweet Salt Lake City #SLC #Utah
- [ ] 38. Tweet Memphis #Memphis #Tennessee
- [ ] 39. Tweet Baltimore #Baltimore #Maryland
- [ ] 40. Tweet Milwaukee #Milwaukee #Wisconsin
- [ ] 41. Tweet Oklahoma City #OKC #Oklahoma
- [ ] 42. Tweet Raleigh #Raleigh #NorthCarolina
- [ ] 43. Tweet Louisville #Louisville #Kentucky
- [ ] 44. Tweet Richmond #Richmond #Virginia
- [ ] 45. Tweet Tucson #Tucson #Arizona
- [ ] 46. Tweet Omaha #Omaha #Nebraska
- [ ] 47. Tweet Virginia Beach #VirginiaBeach #Virginia
- [ ] 48. Tweet Honolulu #Honolulu #Hawaii
- [ ] 49. Tweet Albuquerque #ABQ #NewMexico
- [ ] 50. Tweet Birmingham #Birmingham #Alabama
- [ ] 51. Tweet Boise #Boise #Idaho

## BATCH 4: Cross-Platform Posts (52-65)
- [x] 52. Facebook nationwide post
- [x] 53. LinkedIn professional post
- [x] 54. Discord AiCollabForTheKids
- [x] 55. Telegram YouAndiNotAi.com broadcast
- [!] 56. Instagram post (needs image)
- [!] 57. Instagram story (needs image)
- [!] 58. TikTok video (needs video)
- [!] 59. Pinterest pin (needs image)
- [!] 60. YouTube community post (needs 500+ subs)
- [ ] 61. Facebook city post - NYC
- [ ] 62. Facebook city post - LA
- [ ] 63. Facebook city post - Miami
- [ ] 64. Facebook city post - Chicago
- [ ] 65. Facebook city post - Houston

## BATCH 5: Second Account Engagement (66-80)
- [ ] 66. Comment on NYC tweet (2nd acct)
- [ ] 67. Comment on LA tweet (2nd acct)
- [ ] 68. Comment on Chicago tweet (2nd acct)
- [ ] 69. Comment on Houston tweet (2nd acct)
- [ ] 70. Comment on Dallas tweet (2nd acct)
- [ ] 71. Comment on Atlanta tweet (2nd acct)
- [ ] 72. Comment on Phoenix tweet (2nd acct)
- [ ] 73. Comment on Philly tweet (2nd acct)
- [ ] 74. Comment on San Antonio tweet (2nd acct)
- [ ] 75. Comment on San Diego tweet (2nd acct)
- [ ] 76. Comment on Austin tweet (2nd acct)
- [ ] 77. Comment on Jacksonville tweet (2nd acct)
- [ ] 78. Comment on SF tweet (2nd acct)
- [ ] 79. Comment on Seattle tweet (2nd acct)
- [ ] 80. Comment on Denver tweet (2nd acct)

## BATCH 6: Later.com Scheduling (81-88)
- [ ] 81. Schedule Instagram posts via Later.com
- [ ] 82. Schedule Facebook posts via Later.com
- [ ] 83. Schedule LinkedIn posts via Later.com
- [ ] 84. Schedule TikTok posts via Later.com
- [ ] 85. Schedule Pinterest pins via Later.com
- [ ] 86. Schedule YouTube Shorts via Later.com
- [ ] 87. Create content calendar (Mon-Sun themes)
- [ ] 88. Set up auto-publish all platforms

## BATCH 7: Platform Expansion (89-94)
- [ ] 89. Log into Bluesky and post
- [ ] 90. Log into Mastodon and post
- [ ] 91. Log into Threads and post
- [ ] 92. Post in Reddit dating subreddits
- [ ] 93. Post in Facebook singles/dating Groups
- [ ] 94. Post on Nextdoor communities

## BATCH 8: Content Generation (95-100)
- [ ] 95. Generate 10 engagement tweets (polls/questions)
- [ ] 96. Generate 10 success story tweets (social proof)
- [ ] 97. Generate 10 V8 feature highlight tweets
- [ ] 98. Generate 10 city-specific dating meme captions
- [ ] 99. Generate email campaign copy for pre-orders
- [ ] 100. Generate 5 LinkedIn articles on dating safety

---

## REPLENISH TRIGGER (at 35 remaining)
Next batch priorities:
- Tier 3 city tweets (50 more cities)
- Trending hashtag engagement
- SEO blog posts
- Influencer DM templates
- A/B tweet copy variants
- Partnership pitch outreach
- App store listing optimization
- Review/testimonial generation

## SENTRY: T5500 (192.168.0.15)
- Monitors this file every 5 min
- Counts remaining [ ] tasks
- When <= 35, triggers Opus to generate new batch
- Script: /home/aicol/sentry/task-watcher.sh
