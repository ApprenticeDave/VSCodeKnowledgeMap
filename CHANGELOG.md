# Change Log

All notable changes to the "vscodeknowledgemap" extension are documented in this file.

## [1.0.1] - 2026-04-24

### Changed

- Bundle the extension output with `esbuild` to improve packaging consistency.
- Reduce packaged VSIX file count from ~3608 files to 38 files to make distribution lighter and faster.

### Notes

- This release focuses on packaging and delivery optimization. Runtime functionality is unchanged.

## [1.0.0] - 2026-04-23

### Added

- Initial stable 1.0.0 release.

### Known Issues

- File change updates after initial graph generation are not yet implemented.
