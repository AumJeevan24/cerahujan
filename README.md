# Cerahujan

**Cuaca, panas, ribut dan jerebu untuk Malaysia — di atas peta 3D.**
**Weather, heat, storms and haze for Malaysia — on a 3D map.**

Cerahujan ("cerah" + "hujan", sunshine + rain) is a free, phone-first web app. A friendly hornbill flies across a 3D map of Malaysia and lands where you are, then tells you about today's weather, heat and UV, storm risk, whether it's a good day to dry laundry (*boleh jemur kain?*), the best time to go outside, and whether haze is heading your way.

- Free, no login, no accounts, no ads
- Bahasa Malaysia and English
- Works on budget Android phones and on desktop

> **Not an official warning service.** All values are estimates. For official forecasts and warnings, see [MET Malaysia](https://www.met.gov.my/), [DOE / APIMS](https://eqms.doe.gov.my/APIMS/main), [JPS / Public InfoBanjir](https://publicinfobanjir.water.gov.my/) and [NADMA](https://www.nadma.gov.my/).

![Screenshot placeholder](docs/screenshot.png)

*Screenshot coming soon.*

## Status

In early development (Phase 1). See [CHANGELOG.md](CHANGELOG.md).

## Running locally

Requires Node.js 20+.

```bash
npm install
npm run dev        # UI only, calls Open-Meteo directly from the browser
npm run preview    # full stack with Cloudflare Pages Functions (wrangler)
npm test           # unit tests
npm run typecheck
```

All local settings go in one file: copy `.env.example` to `.env` and fill in your own values. `.env` is git-ignored. Never commit real keys.

## Data credits

Cerahujan uses only free, open data. All data belongs to its providers.

| Data | Provider |
|---|---|
| Weather forecast, UV, apparent temperature | [Open-Meteo](https://open-meteo.com/) (CC BY 4.0) |
| PM2.5 / air quality forecast | [Open-Meteo](https://open-meteo.com/) with Copernicus Atmosphere Monitoring Service (CAMS) |
| Fire hotspots | [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (VIIRS) |
| Official forecasts and warnings | MET Malaysia via [data.gov.my](https://data.gov.my/) |
| Air quality stations | [World Air Quality Index Project (WAQI)](https://waqi.info/) and DOE Malaysia |
| Base map | [OpenFreeMap](https://openfreemap.org/), © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors |
| Terrain | [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen / Tilezen) |

## License

Code is released under the [MIT License](LICENSE). Data shown in the app belongs to its respective providers and is subject to their terms.
