# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Be Kenyalang: fly a 3D rhinoceros hornbill across Malaysia in a chase view. Steer with the arrow keys/WASD (Space climb, C dive, Shift boost) or the on-screen joystick and boost button; "Fly to a town" takes you anywhere on autopilot, and steering takes over at any time.
- A live weather strip over the flight view for the place below Kenyalang (or the nearest one when out at sea): temperature, conditions, rain in the next 3 hours, thunderstorm risk, UV and heat, with full details one tap away.
- Start near you (location used only on the device) or at Kuala Lumpur; later visits continue where you left off.

- Weather for the chosen place: temperature now, "feels like", UV level, heat level, thunderstorm risk ("Thunderstorm likely around 16:00"), chance of rain, the next 12 hours, and MET Malaysia's official forecast for today (translated to English when the app is in English). Every card is marked as an estimate, with a link to MET.

- Hosting on Cloudflare Pages at cerahujan.pages.dev: the live site updates when a release is published, and every pull request gets its own preview link.

### Changed

- Brighter map: blue sea, greener land and parks, and buildings coloured by height (warm low-rise, glass-blue towers).
- The map now shows only Malaysia, Singapore, Brunei and Indonesia; countries further away are hidden.
- The opening view fits the whole country and then tilts gently into 3D.

## [0.1.0] - 2026-11-11

### Added

- README, license and repository conventions.
- App scaffold (Vite, React, TypeScript, Tailwind CSS, Vitest) with the "Langit Cerah" look and a BM | EN language toggle that remembers your choice.
- 3D map of Malaysia, Sumatra and Borneo with terrain and 3D buildings (OpenFreeMap + AWS Terrain Tiles), in the sidebar (desktop) and bottom-panel (phone) layout.
- "Lite 3D" for weaker devices (lower resolution, flatter terrain) and a clear message when WebGL2 is unavailable.
- Town search ("Terbang ke bandar" / "Fly to a town") across all 424 MET Malaysia forecast places: towns, districts, Sarawak and Sabah divisions and recreation spots. Major cities are listed first, common names like "KL", "Penang" and "Genting Highlands" work, and the map flies to your pick and remembers it.

[Unreleased]: https://github.com/AumJeevan24/cerahujan/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/AumJeevan24/cerahujan/releases/tag/v0.1.0
