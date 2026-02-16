# TASK QUEUE - YouAndINotAI Marketing Blitz
# Auto-replenish to 100 when remaining drops to 35
# Sentry on T5500 monitors and triggers Opus for new tasks
# Last Updated: 2026-02-16 02:00
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

## BATCH 3: X/Twitter Tier 2 Cities - DONE (22-51)
- [x] 22. Tweet Washington DC | posted
- [x] 23. Tweet Boston | posted
- [x] 24. Tweet Miami | posted
- [x] 25. Tweet Portland | posted
- [x] 26. Tweet Las Vegas | posted
- [x] 27. Tweet Minneapolis | posted
- [x] 28. Tweet Tampa | posted
- [x] 29. Tweet New Orleans | posted
- [x] 30. Tweet Cleveland | posted
- [x] 31. Tweet Orlando | posted
- [x] 32. Tweet St Louis | posted
- [x] 33. Tweet Pittsburgh | posted
- [x] 34. Tweet Cincinnati | posted
- [x] 35. Tweet Kansas City | posted
- [x] 36. Tweet Sacramento | posted
- [x] 37. Tweet Salt Lake City | posted
- [x] 38. Tweet Memphis | posted
- [x] 39. Tweet Baltimore | posted
- [x] 40. Tweet Milwaukee | posted
- [x] 41. Tweet Oklahoma City | posted
- [x] 42. Tweet Raleigh | posted
- [x] 43. Tweet Louisville | posted
- [x] 44. Tweet Richmond | posted
- [x] 45. Tweet Tucson | posted
- [x] 46. Tweet Omaha | posted
- [x] 47. Tweet Virginia Beach | posted
- [x] 48. Tweet Honolulu | posted
- [x] 49. Tweet Albuquerque | posted
- [x] 50. Tweet Birmingham | posted
- [x] 51. Tweet Boise | posted

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
