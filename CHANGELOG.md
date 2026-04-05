# Changelog

## [0.2.0](https://github.com/zerocity/ensure.chan.run/compare/v0.1.0...v0.2.0) (2026-04-05)


### ⚠ BREAKING CHANGES

* rename package from @chan.run/fault to @chan.run/ensure
* rename expect to ensure, rewrite README

### Features

* add named error types, match exhaustiveness, type-level tests ([a769aa0](https://github.com/zerocity/ensure.chan.run/commit/a769aa050f9e4e4b86cea76bbed6ff9caa2da19d))
* add pi skills and project docs ([effb513](https://github.com/zerocity/ensure.chan.run/commit/effb5138f8674011454097cbb7e4abdde5fa1b13))
* bootstrap fault product ([811d0e5](https://github.com/zerocity/ensure.chan.run/commit/811d0e53d4983b97a45d1d0b62eb09c36d000b59))
* composeDeclares, serialize/deserialize, benchmarks ([69c1ee0](https://github.com/zerocity/ensure.chan.run/commit/69c1ee0cfbb523e01842d51414db2cd060c3a5e3))
* ensure accepts string (EnsureError) or class-only (optional message) ([2331217](https://github.com/zerocity/ensure.chan.run/commit/2331217813f569e0bcd270b58df0ac5c95f3c25d))
* match() handles native errors (TypeError, AbortError, etc.) ([1058f6a](https://github.com/zerocity/ensure.chan.run/commit/1058f6aebf99365526aafc725e4e3adff422deb1))


### Bug Fixes

* address all code review findings, eliminate any ([ca70f14](https://github.com/zerocity/ensure.chan.run/commit/ca70f142b031e5982bb6adcf418b3544cfee034f))
* detoJSON→fromJSON, collapse FaultErrorClass to alias, tighten type guard ([40b19fd](https://github.com/zerocity/ensure.chan.run/commit/40b19fd5dd899b0ca2f7e733884042999a98b285))


### Code Refactoring

* rename expect to ensure, rewrite README ([773acc5](https://github.com/zerocity/ensure.chan.run/commit/773acc5182976d418528c1a1fb411da44a733ef8))
* rename package from [@chan](https://github.com/chan).run/fault to [@chan](https://github.com/chan).run/ensure ([7196dd9](https://github.com/zerocity/ensure.chan.run/commit/7196dd9140d660c01f59fa3128e4fcd22c949b92))
