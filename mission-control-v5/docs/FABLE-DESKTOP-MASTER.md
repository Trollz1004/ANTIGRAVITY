# Mission Control v5 Desktop â€” Sanitized Master Manifest

> **Purpose:** Shareable source-only inventory for independent review. It excludes populated environment files, secrets, credentials, tokens, dependency trees, build output, temporary output, and coverage artifacts.

## Evidence Snapshot

| Field | Value |
| --- | --- |
| Generated UTC | 2026-08-20T23:58:32Z |
| Canonical path | `C:\ANTIGRAVITY\mission-control-v5` |
| Git HEAD | `5ccf2fa5c7f7c2a507cdd390cebe27d7ebe59e6b` |
| HEAD subject | docs: attestation chain v2 for gospel verified-live update |
| Included files | 106 |
| Secret policy | No populated environment, secret, credential, or token file was read or listed. |
| Runtime status | Not probed or started by this manifest operation. |

## Review Boundary

A matching SHA-256 verifies only the local bytes at generation time. It does not prove that a file is committed, authorized for delivery, or runtime-verified. Run the approved static gate and compare current Git status before any delivery decision.

## Working-Tree Status - Sanitized Paths

- ` M ../.claude/hooks/guard-protected-paths.ps1`
- ` M ../.codex/config.toml`
- ` M ../.obsidian/graph.json`
- ` M ../agent/skills/agent-reach/SKILL_en.md`
- `A  ../apps/youandinotai-static/afterglow-bot-shield.html`
- `A  ../apps/youandinotai-static/afterglow-landing.html`
- `A  ../apps/youandinotai-static/afterglow-login.html`
- `A  ../apps/youandinotai-static/afterglow-orbit.html`
- `A  ../apps/youandinotai-static/afterglow-profile.html`
- `A  ../apps/youandinotai-static/afterglow-verify.html`
- `A  ../apps/youandinotai-static/afterglow.css`
- `A  ../apps/youandinotai-static/afterglow.js`
- `A  ../apps/youandinotai-static/papermates-launch.html`
- `A  ../apps/youandinotai-static/papermates-safety-center.html`
- `A  ../apps/youandinotai-static/tests/afterglow-static.test.ps1`
- `M  client/src/App.tsx`
- `M  client/src/api.ts`
- `A  client/src/components/ControlCenter.test.tsx`
- `A  client/src/components/ControlCenter.tsx`
- `M  client/src/components/CouncilPanel.test.tsx`
- `M  client/src/components/CouncilPanel.tsx`
- `M  client/src/components/Header.tsx`
- `A  client/src/components/PaperMatesPanel.tsx`
- `M  client/src/styles.css`
- `M  client/src/types.ts`
- `AM docs/FABLE-DESKTOP-MASTER.md`
- `AM docs/FABLE-PAPERMATES-REVIEW-BRIEFING.md`
- `M  electron/main.js`
- `M  package-lock.json`
- `M  package.json`
- `AM server/src/attestation.test.ts`
- `AM server/src/attestation.ts`
- `M  server/src/brainStore.ts`
- `A  server/src/control-center.test.ts`
- `A  server/src/control-center.ts`
- `A  server/src/control-store.ts`
- `M  server/src/index.ts`
- `M  server/src/materialize.ts`
- `M  server/src/official-vote-engine.test.ts`
- `M  server/src/official-vote-engine.ts`
- `M  server/src/official-vote-routes.ts`
- `M  server/src/omniroute.ts`
- `M  server/src/swarm.ts`
- ` M ../ops/skills/skills-hub-reference.md`
- `?? .tmp/`

## Desktop Application Files

| Path | SHA-256 | Bytes | Role |
| --- | --- | ---: | --- |
| `.github\workflows\deno.yml` | `43ab68ce3834dee952bda63b962e8b4bf1c0d64e5460b8a488c5947504ba7295` | 1042 | Supporting desktop application asset |
| `.github\workflows\npm-publish.yml` | `5af8e3eda277740e0db13f06c5abed3aaf0e365d8379d1be70150742502c1be6` | 866 | Supporting desktop application asset |
| `.gitignore` | `77934a8c44f41925dc5a341a5c4c2e0031023c9be3ab5ec2734c9c3f1906ed04` | 312 | Supporting desktop application asset |
| `client\e2e\council-flow.spec.ts` | `e19935302a5773310c826a5cb2476c6ccf3fcd2cc264c3d422adadccf09479ea` | 1706 | Client build or configuration asset |
| `client\e2e\dashboard.spec.ts` | `92e4a96b0aab4e7fc8e39ac05f92617b43a4769cab600ab9f68135a57e967ff0` | 1084 | Client build or configuration asset |
| `client\index.html` | `26a85cdcff1c78efbeadcd3cd5e6ea444875034a1300ce82a4e3199064461749` | 706 | Client build or configuration asset |
| `client\package.json` | `06e1546925d98cf1a43764e3b77486f70e0cb99036bb9815ab29d81924d572e2` | 891 | Client build or configuration asset |
| `client\package-lock.json` | `f348f98ab72eb12f51cb70f33b424f1b85549a2a0354f8c7e3d151665bbf9535` | 125948 | Client build or configuration asset |
| `client\playwright.config.ts` | `4921bd06b4d33d4371eae2e4782e17e2f123c5488f3dfe0f9f14e20f73b0bb03` | 336 | Client build or configuration asset |
| `client\src\api.ts` | `d44e775ea70778211628531333f3b37e63a90f4ecd5be6d40f6aba3e9e4d8e42` | 6374 | Desktop dashboard interface source and tests |
| `client\src\App.tsx` | `564ab135d1dc0ab340799298977cb8981f9fd51d42279820cd77b461437e443b` | 4785 | Desktop dashboard interface source and tests |
| `client\src\components\AgentLibrary.tsx` | `51e777c05068bbd732a3cb3951c854653188efbb6057ae62bc669674518dc764` | 3459 | Desktop dashboard interface source and tests |
| `client\src\components\BrainPanel.tsx` | `bfe67e4a33d06ed15c3d8263d44a9c38eaedf35f787b957aa9c08b7838af0b60` | 12806 | Desktop dashboard interface source and tests |
| `client\src\components\BridgePanel.tsx` | `cca958b4d1e2f7213248f78db6ff5ee9e8da05b73d7edff2445a0baaaa512855` | 4972 | Desktop dashboard interface source and tests |
| `client\src\components\BrowserPanel.tsx` | `d2d50b996599152e678b579d799943f08cb09c8270179225e842d94518b8f7a7` | 4486 | Desktop dashboard interface source and tests |
| `client\src\components\ControlCenter.test.tsx` | `1bd8a5b8601127017626d37304cf2f02f880c4e7e11d5c6a318a434a81eae02b` | 1374 | Desktop dashboard interface source and tests |
| `client\src\components\ControlCenter.tsx` | `96922e4513dc913cc363a19966b905fec763fc776190728c7fe0bb8c6de1adc3` | 14014 | Desktop dashboard interface source and tests |
| `client\src\components\CouncilPanel.test.tsx` | `25b36fc5dfd148e02d7f29ce19a8b5c17442808f44da5dc6707f6200eed1926a` | 2607 | Desktop dashboard interface source and tests |
| `client\src\components\CouncilPanel.tsx` | `9b9811c13ee85375dc2aec67525aea396d913d4c2f7b61780b16a47610d61a38` | 6102 | Desktop dashboard interface source and tests |
| `client\src\components\Graphy.tsx` | `ced3e29da82f1fe39d35c48b7089ecb47f32ce19e53c52993ae537047727fc33` | 8544 | Desktop dashboard interface source and tests |
| `client\src\components\Header.tsx` | `213925dda10a5369df798e1a928643e8d43623852353ed4d1395393cd1743288` | 1660 | Desktop dashboard interface source and tests |
| `client\src\components\KanbanBoard.tsx` | `11442efc31a36c5ecc5f7076d7621327beecc8307782b4cd8b27b5156b9fb126` | 4262 | Desktop dashboard interface source and tests |
| `client\src\components\KnowledgeGraph.tsx` | `0c5a1cf14ad3efbfacbf83d707103a5d70e65b76a66c8d1566a834b595f2fa50` | 7134 | Desktop dashboard interface source and tests |
| `client\src\components\PaperMatesPanel.tsx` | `8f52a78af7ae5b37d564f6c5a230f3f0e9ce87c83a134e986e8182952aec6ae1` | 10616 | Desktop dashboard interface source and tests |
| `client\src\components\ServicesPanel.tsx` | `6f7471948405b41bbf9868eed53672785948fd536d7a7139b00f8ff9f57f0bf5` | 3029 | Desktop dashboard interface source and tests |
| `client\src\components\shared.tsx` | `9559ff1ffae73750ee44c65bf366df789282b706cfdd300fff5662dfdffaab9e` | 4244 | Desktop dashboard interface source and tests |
| `client\src\components\SwarmEngine.tsx` | `b9f15e3eb7dfbc5c3eace889e1d090ce1e09ce2f3c60d03e18534a1c5b195543` | 5309 | Desktop dashboard interface source and tests |
| `client\src\graphy.css` | `0d9710aa99fbd4971754c90fa164b72e165f200a30d95311dfd38c749226649b` | 4568 | Desktop dashboard interface source and tests |
| `client\src\main.tsx` | `86aa292fef78967aaad3330e2436fe1d16dfcef78d957b79144a33b7fdad35ce` | 272 | Desktop dashboard interface source and tests |
| `client\src\shared\browser-sites.json` | `ab79d734f5ec3b06c93c3c81a16b46f3f83eea7b8fa9cf4dd01c223c22c61fcb` | 1541 | Desktop dashboard interface source and tests |
| `client\src\styles.css` | `365d1d8b1e2148041d2f990e17c692a1a15b27616f5324312ee6ce0db9e3256a` | 52518 | Desktop dashboard interface source and tests |
| `client\src\test\setup.ts` | `f71ca1cf640eac1977e9a2c151d989dbaebb2eaea41c87bfee752c8734520fc9` | 44 | Desktop dashboard interface source and tests |
| `client\src\types.ts` | `4cf74ca4b434aeb4aa30f32b78971e7467834d21f8e7d4c1ab61cbab95319584` | 8584 | Desktop dashboard interface source and tests |
| `client\tsconfig.json` | `9423f8f99bfd53762a395cf7ba479a96bce201956463afbb5fd823fb0e91e1d4` | 544 | Client build or configuration asset |
| `client\vite.config.ts` | `16ed8aab07492c2289ea03310862182b6bcbf15c15ae582a447fda776e4f5839` | 498 | Client build or configuration asset |
| `client\VOTE_UI_REVIEW_2026-08-19.md` | `aedabea937bd3cb5519cb65421b74d92ffe9224e557af5875d026c74886a7cf4` | 2747 | Client build or configuration asset |
| `docs\FABLE-PAPERMATES-REVIEW-BRIEFING.md` | `7b7239a4628b994bc42e557912a83e213d3bb18032a2707ff96f25d5a394fa53` | 8690 | Project documentation or audit evidence |
| `electron\main.js` | `d3edc24a9b26a6a429af2835d1cd734af093c3e92791612e66981007127dc35b` | 5164 | Electron desktop shell and sandbox boundary |
| `electron\preload.js` | `796a02934bf03a743e5e5ef6706a561feedcc0ab7aeec9064f5ce270e32a596d` | 901 | Electron desktop shell and sandbox boundary |
| `MC_SURFACE_REVIEW_2026-08-19.md` | `28524562a1230c493ef4ac3bb752712697733f9655efbcaccb4b7de0a9643021` | 3477 | Supporting desktop application asset |
| `Modelfile.ornith-cpu` | `3521f9daf180e709275a8980bc8fbd3c1675077b62545c116c7155e1a8b61395` | 35 | Supporting desktop application asset |
| `package.json` | `53fc91df300aeb22b1264d61b0b636b59cf50868423951ac4fc2f71322dab43e` | 1473 | Project build, test, or usage configuration |
| `package-lock.json` | `c82ec4614ab48525179a1482748d582d940e84f8729804bd50e4c0a82c069517` | 24345 | Project build, test, or usage configuration |
| `README.md` | `98268ebe007f1955a3bfdf1d1ae9b1a2ea3e07aa9ed6aa60bcad95015b1248f5` | 3862 | Project build, test, or usage configuration |
| `scripts\bootstrap.ps1` | `cc482229e6a23de026da9c9d85cc37c23f0e14481709dc6815d0e969ac5bafd7` | 24470 | Supporting desktop application asset |
| `scripts\install-bootstrap.ps1` | `d8bfd2fc7b1507d2f501c005acadcb19393a923cfe6e8bd44f503bd5529f2de2` | 5099 | Supporting desktop application asset |
| `scripts\launch-stack.cmd` | `151cbee84e0f1beaa3e4911e0c2d407c1d6934661abc3f1a9a24e29e8a1f2423` | 359 | Supporting desktop application asset |
| `scripts\merge-env.ps1` | `e4c3629a54aefdb79a944464c6a46b33dd4d011098cc7e4b6e7ba575bd8c97c3` | 2958 | Supporting desktop application asset |
| `scripts\require-runtime-gate.mjs` | `506e9ec3f75317622b4259ab19c4dadece5fd61153e5d7a6320c5ed134533cd2` | 192 | Supporting desktop application asset |
| `scripts\retire-hermes-dateapp.ps1` | `3a65adb8fca21acd7ffb6857706f68bd02b3decb568d9154b89de24211cd2e73` | 5126 | Supporting desktop application asset |
| `scripts\stack-status.ps1` | `0efc71dc7daccb2ec4bfb5218df09d17e985b4e81dd11eed3235b139992565d5` | 4662 | Supporting desktop application asset |
| `scripts\tab-dateapp.cmd` | `1d87183bce46a9e0b330a051d3ea96e5c9acec3174e7feefa2c75769528cb3b7` | 1622 | Supporting desktop application asset |
| `scripts\tab-dateapp-api.ps1` | `e55dcb60db738f32f4dfe82fff395a9faf31a38d2988f909f6491545be964acb` | 2877 | Supporting desktop application asset |
| `scripts\tab-hermes-dash.cmd` | `426ed9eeebe1425aa389ab3a46b4e121d3411cd76a02e80ef310b3d19395f283` | 477 | Supporting desktop application asset |
| `scripts\tab-llamacpp-embed.cmd` | `d804cd90c440128acf2836bae6728833209d31841fb7c1eb2e3d2a1f0419eb98` | 909 | Supporting desktop application asset |
| `scripts\tab-mission-control.cmd` | `6e058a19fbf6248baeb505b020b8cf485e9f5c907126e1e3995724aa5b2731c7` | 845 | Supporting desktop application asset |
| `scripts\tab-mission-control-v6.cmd` | `3373466dee2b3755249be8addc0c15be3a1939a667cb6d1b95e66666825a965f` | 1156 | Supporting desktop application asset |
| `scripts\tab-ollama.cmd` | `04597bbf16e1c93a0d17aab76e9a1e569d2fbddd971b0e0c7e0c79cae9027cf6` | 857 | Supporting desktop application asset |
| `scripts\tab-omniroute.cmd` | `6bbe551113eb522a42618c35dd447a5bb73f86e8fcbecbb7607ccafbc431a106` | 171 | Supporting desktop application asset |
| `scripts\tab-openclaw-tui.cmd` | `ac239c648c80993b45844583625ff8bcf9c5215d531cdfdf8657b238f58fc6c1` | 1559 | Supporting desktop application asset |
| `scripts\WATCHDOG.DISABLED` | `59e0b6f8311c628df1663a4814613dd9eebc861dbfa351d66cc68c6c8621d248` | 340 | Supporting desktop application asset |
| `SECURITY.md` | `f1eeb89d80a2b39428616c848cfac99edb15d77b59dcc11d0c9dede412a22754` | 640 | Supporting desktop application asset |
| `server\data\brain\free-claude-code.audit.jsonl` | `f76f2184a52eb7727ef66afd6ab9e363c28c7c6eb9a4b4c127a93f344daa32f0` | 1048 | Server build or configuration asset |
| `server\data\brain\free-claude-code.STATE.md` | `2d4488c0a8ff06cc6421c806bd1ce9b9f8a718ae94e4f62ff2a4d0c8369257d6` | 1049 | Server build or configuration asset |
| `server\data\brain\hermes.audit.jsonl` | `6ae4f809407c25c4a32596bac5785af509d45c0626a3c5e2279da98f2efdbd4f` | 1149 | Server build or configuration asset |
| `server\data\brain\openclaw.audit.jsonl` | `3ddc2df94099c5bec00c032def1a1ba6437321513f1cbc2b5ae7f804e9f3b6cc` | 1149 | Server build or configuration asset |
| `server\data\brain\opencode.audit.jsonl` | `e8ab62cf13712883c1828e8a44e04ae1fdff86b782386325eb5c469655bce27f` | 345 | Server build or configuration asset |
| `server\data\brain\ornith.audit.jsonl` | `02b22d1c0ed58254a5ee1e9569193c18e5b7fe4555afb9d793fa331cf58a4a07` | 804 | Server build or configuration asset |
| `server\data\brain-platforms.example.json` | `a10452a18eb6d08ca5ee013eb43009e099251dadc1fe44f33c741e60bc3901b5` | 524 | Server build or configuration asset |
| `server\data\brain-platforms.json` | `a5e70bea5564671c4835e54d25f9e67147eae7e4abb2837c9951ab1a63291142` | 501 | Server build or configuration asset |
| `server\package.json` | `a1a5e0dc610cae93167298542af74e0a275c28e40d7c97f5b1063342172987fd` | 623 | Server build or configuration asset |
| `server\package-lock.json` | `38e295f30c5fe33e7973ace43ba9414cbf6bdd8a841d5346c217d8e315a88a9d` | 91575 | Server build or configuration asset |
| `server\pnpm-lock.yaml` | `97ef04374fe42609e7f951dd4ef336abbcbd265dcae135be72031f51483dda49` | 54807 | Server build or configuration asset |
| `server\ROLE_WALL_REVIEW_2026-08-19.md` | `4445a2726ca074a5a4e79e3024af3c07f8518cd8827016728ec5362320ac3fb2` | 2541 | Server build or configuration asset |
| `server\scripts\role-wall-check.mjs` | `004004f7c4cf32e8c959cc2c6656ed797991afdf0d6b56eba9f997e354d26ee7` | 2340 | Server build or configuration asset |
| `server\src\agents.ts` | `6e484fe00e1252830bcb8f98f1c5e60da950ea68777a8d353014184e06cd5540` | 4698 | Local control-plane source and tests |
| `server\src\attestation.test.ts` | `f957e92e23f4f246a54b86d1ae7be3386d4e2b2aaa8cc0d76399087b1b9da3df` | 4223 | Local control-plane source and tests |
| `server\src\attestation.ts` | `58f0db82e5f9f6dd3070da2a58da2784656a5a7d2ce7dc1f9568c91e6f2ea5f3` | 6169 | Local control-plane source and tests |
| `server\src\brain.integration-status.test.ts` | `fa3fec939fc9cd4a48b8785c6512bde4990c85fe685938739ace196c889508db` | 1418 | Local control-plane source and tests |
| `server\src\brain.ts` | `314f412fe6966105628ad96bff8cf75e004a44d6eb6e3552d595b6442bfcb768` | 6479 | Local control-plane source and tests |
| `server\src\brainStore.ts` | `3a30cf0f67561495b084f7e9481a25f3bb416e19500a306b24e124552f7033b8` | 8864 | Local control-plane source and tests |
| `server\src\bridge.ts` | `d7034b715015700cc1b46b298f2aa12a6bbe8fcf83d10e04505cea882e6384c3` | 4855 | Local control-plane source and tests |
| `server\src\catalog.ts` | `736eaa3ec5e7c2ab18d79ba315bb19a8083e735b11d50a65b201bc14b9267108` | 7642 | Local control-plane source and tests |
| `server\src\control-center.test.ts` | `d64aa05dab2a6e7357a7414d20f16c7046fcbd861ec9656c1407cdd8f7fb4a6d` | 1612 | Local control-plane source and tests |
| `server\src\control-center.ts` | `402a8f90e773e4be9daf49b858c0c4fbe389c897bd379696633131067cf2658d` | 2496 | Local control-plane source and tests |
| `server\src\control-store.ts` | `7e8e1d9b0d481525016ca2e91faf1c85131167fb4b7d61b9f8722e95af34759e` | 9656 | Local control-plane source and tests |
| `server\src\hermes-authoring.test.ts` | `b71b434eb9c5384f6583d74f48d52ca4668173d03c933281b78e3715eb096037` | 1341 | Local control-plane source and tests |
| `server\src\hermes-authoring.ts` | `1f12edbba297cc63914d172017e640e5c928396f856ea973e518f52f33c66f49` | 3737 | Local control-plane source and tests |
| `server\src\index.ts` | `ceb8ad20718faf9ab4908d5bb737bf29171af8a05a43841d3cc0080370de0550` | 25610 | Local control-plane source and tests |
| `server\src\knowledge.ts` | `6bb17eb88c85a653958f10c4878f1f9884b0ca85cfb234ce0a5185678924bae9` | 8952 | Local control-plane source and tests |
| `server\src\materialize.ts` | `5597c4e5ba65e56211a748aa1400cc08e83057575cf3d222bdde22c392e7a98d` | 7121 | Local control-plane source and tests |
| `server\src\mcpServer.ts` | `22342c7a68b90d715cf4e212f919b2c70512f737259ec22fb7fabfd2f3ee4bd3` | 9710 | Local control-plane source and tests |
| `server\src\official-vote-engine.test.ts` | `10f98c17931ddbe45397378d5ad7c692ed3fe3f47e5e4af79900f5586d2c10de` | 4505 | Local control-plane source and tests |
| `server\src\official-vote-engine.ts` | `f4c110b5672249ba43296e327a143d0f08c955b19a3c8f4d57afe732725ff3ce` | 10778 | Local control-plane source and tests |
| `server\src\official-vote-routes.ts` | `6053614e399fe97b335bf8d2c47bcf6198038238893ea895f37116bdda20eb9a` | 2625 | Local control-plane source and tests |
| `server\src\omniroute.ts` | `07d5ce434936cb61613e6e5d8f92b8ee4350479aa98e234c60eb1e28a58f5f06` | 12180 | Local control-plane source and tests |
| `server\src\role-wall.test.ts` | `dbb2cd4250cb3eb5758eac936f21c36c14da114f715a00d33722e2391fe8437f` | 2818 | Local control-plane source and tests |
| `server\src\role-wall.ts` | `262722ea2f5596f924f102bc0e043fd5219dc859548131749092c168e7f7eee1` | 990 | Local control-plane source and tests |
| `server\src\service-health.test.ts` | `02a87e116448b15b5013c9f5b4f49dd08f3d1bb16b88794cd62fde1aa91b3373` | 3958 | Local control-plane source and tests |
| `server\src\service-health.ts` | `a9221dee20d5b3c637b86466a8cf120f8e8fba1cc5e4da31652a63d0aed7bafc` | 4542 | Local control-plane source and tests |
| `server\src\store.ts` | `fdffa00aedd309164783742d51fb10596ac5c95432371c0cba2f03ca387f91b6` | 2547 | Local control-plane source and tests |
| `server\src\swarm.ts` | `0699f9ccbf28ce0a7e0c80a0bbfab2dacf15932a7f6e6cd23acda4900c6a5f12` | 13397 | Local control-plane source and tests |
| `server\src\types.ts` | `9dedcd50e3838ebc62a28234d5838f9b28d0d39bc396e37e80f90972b4ea072e` | 2074 | Local control-plane source and tests |
| `server\tsconfig.json` | `d5e439b9f18e7d9c504ce5381929d443e7f072b22484d96126ad0962a8280a9a` | 440 | Server build or configuration asset |
| `TEST_GATE_REVIEW_2026-08-19.md` | `1b26e2681da7b4f3ac5be77469af964b7ce633631caf3f6ade7a588a4e73de6d` | 2656 | Supporting desktop application asset |
| `VOTE_ENGINE_REVIEW_2026-08-19.md` | `57074695bcbc514a2e646fd4accef3bcab872971812663c8a497da9a080944d8` | 2750 | Supporting desktop application asset |

## Independent Verification

```powershell
Set-Location 'C:\ANTIGRAVITY\mission-control-v5'
Get-FileHash -Algorithm SHA256 .\server\src\index.ts
git -C 'C:\ANTIGRAVITY\mission-control-v5' status --short
git -C 'C:\ANTIGRAVITY\mission-control-v5' rev-parse HEAD
```

> Never paste populated environment files or credentials into a review chat. Official judge evidence must remain independently verified and advisory.
