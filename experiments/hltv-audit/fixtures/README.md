# Offline fixtures

All HTML samples in this directory are synthetic, authored for this audit from the library's selector contract. They were NOT downloaded from HLTV and are NOT evidence of the current live DOM. Team/player names and numbers are test values.

`legacy-*` reproduces the selectors expected by hltv 3.5.0. Rating 2.1/3.0, missing fields, whitespace, renamed selectors, changed score delimiters, and changed performance graphs are deliberate local mutations used to measure robustness. They must not be described as captured modern HLTV pages.

Only registry/GitHub source access was used during preparation. Tests inject every page through `loadPage`; HTTP, HTTPS, fetch, sockets, DNS and HTTP/2 are blocked during execution. Any unlisted fixture route throws. Result pagination has a hard fixture-call budget.
