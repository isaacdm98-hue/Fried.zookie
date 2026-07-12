# Biome scenery plates — Higgsfield asset ledger

Generated with the Higgsfield MCP connector, model **`soul_location`**, aspect
**21:9** (2560×1080), using the locked *marigold-over-plum* style token. These
are the "realistic scenery passing" backdrops seen through the carriage windows.

The HD build (`main.js`) loads each biome in this order, with graceful fallback:

1. **local** — `assets/scenery/<slug>.png` (drop the downloaded PNG here)
2. **Higgsfield CDN** — the URL below (works on any normal network)
3. **procedural** — a gradient sky + parallax silhouettes (always available, offline-safe)

> This sandbox's egress policy blocks the Higgsfield CDN host, so the plates
> could not be committed to the repo from here. On a normal network the CDN
> URLs load directly; to bundle them, download each PNG (from the Higgsfield
> app or the URL) and save it under this folder with the matching `<slug>.png`.

| Biome | slug | Higgsfield job id | URL |
|---|---|---|---|
| Dusk Desert | `dusk_desert` | `ccfafb04-018f-46ef-9466-f88dd625ce51` | https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/hf_20260712_103128_ccfafb04-018f-46ef-9466-f88dd625ce51.png |
| Aurora Tundra | `aurora_tundra` | `825507c0-10b6-4afc-a2fb-fa788bbe8656` | https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/hf_20260712_103137_825507c0-10b6-4afc-a2fb-fa788bbe8656.png |
| Sea Viaduct | `sea_viaduct` | `a7ef1615-86bf-454d-9aa2-af6d0ee30bd3` | https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/hf_20260712_103144_a7ef1615-86bf-454d-9aa2-af6d0ee30bd3.png |
| Marmalade Canyon | `marmalade_canyon` | `4fa139ab-96b4-40f7-bed2-a31b0553cbed` | https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/hf_20260712_103152_4fa139ab-96b4-40f7-bed2-a31b0553cbed.png |
| Glass Prairie | `glass_prairie` | `c29e4414-986d-417d-a1cf-813cbaf83184` | https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/hf_20260712_103344_c29e4414-986d-417d-a1cf-813cbaf83184.png |
| The Still's Edge | `stills_edge` | `0b64c894-28d8-424d-884a-f7fd693f237a` | https://d8j0ntlcm91z4.cloudfront.net/user_3GOi38u71dNlmcLnlyx8X2gLWJE/hf_20260712_103352_0b64c894-28d8-424d-884a-f7fd693f237a.png |

**Credits spent:** 6 generations × ~1 credit ≈ **6 credits** (of the 30 approved).
