# 01: Enable iOS safe-area padding for the mobile control bar

**What to build:** On iPhones with rounded lower edges and a home indicator, the dashboard's fixed control bar extends into the device safe area while its controls remain above the indicator. Dashboard content continues to scroll clear of the full control-bar height.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] The viewport opts into iOS safe-area insets so the mobile control bar gains lower padding on affected devices.
- [x] The fixed control bar and dashboard content clearance stay aligned, with automated coverage preventing removal of the viewport opt-in.
- [x] Demo-mode dashboard data loads and the mobile control bar remains usable.
