# Changelog

## [0.4.0](https://github.com/Versune/enerthya-host/compare/v0.3.0...v0.4.0) (2026-11-21)


### Features

* **install:** container-first installer that configures the whole stack ([#32](https://github.com/Versune/enerthya-host/issues/32)) ([0d0fb04](https://github.com/Versune/enerthya-host/commit/0d0fb04f2b02f7d8200b04cace9a3802846062c1))

## [0.3.0](https://github.com/Versune/enerthya-host/compare/v0.2.0...v0.3.0) (2026-11-21)


### Features

* **projects:** create projects with production and staging, gated by role ([#30](https://github.com/Versune/enerthya-host/issues/30)) ([96a8f70](https://github.com/Versune/enerthya-host/commit/96a8f70a9df35bdef48560ce1999d08aa42a1efb))
* **servers:** pin the SSH host key and refuse a changed one ([#26](https://github.com/Versune/enerthya-host/issues/26)) ([11f8dc3](https://github.com/Versune/enerthya-host/commit/11f8dc345fc45452fd18ff67d8f07d649a2bfd87))


### Bug Fixes

* **dev:** generate apps/web/.env on first pnpm dev ([#29](https://github.com/Versune/enerthya-host/issues/29)) ([6421eeb](https://github.com/Versune/enerthya-host/commit/6421eeb34106339dc863f1cbbc2b5f354d428b42))

## [0.2.0](https://github.com/Versune/enerthya-host/compare/v0.1.0...v0.2.0) (2026-11-20)


### Features

* add the Tailwind and shadcn foundation for the panel shell ([#10](https://github.com/Versune/enerthya-host/issues/10)) ([7749732](https://github.com/Versune/enerthya-host/commit/774973203ab43080eb1ea4dd90bb3e7e68934ea7))
* **auth:** replace the local account store with better-auth screens ([#12](https://github.com/Versune/enerthya-host/issues/12)) ([cda4c05](https://github.com/Versune/enerthya-host/commit/cda4c058fb52f96c1e12fd47151bca548f90c3c2))
* rebuild Enerthya Host as a self-hosted panel ([ce1c4ba](https://github.com/Versune/enerthya-host/commit/ce1c4bad11b0220a975fdc260337fa1b4b2cbc94))
* rebuild the panel as a pnpm monorepo with Drizzle and better-auth ([#11](https://github.com/Versune/enerthya-host/issues/11)) ([56441b5](https://github.com/Versune/enerthya-host/commit/56441b57aad4eaeb33b9b64877d4a5b0cf48d535))
* **servers:** register machines with encrypted keys and a runtime probe ([#25](https://github.com/Versune/enerthya-host/issues/25)) ([bce2bca](https://github.com/Versune/enerthya-host/commit/bce2bca02c27eff70ff201e2e5c554a4d7798ecb))
* **shell:** add the dashboard shell, sidebar and command palette ([#18](https://github.com/Versune/enerthya-host/issues/18)) ([2e372aa](https://github.com/Versune/enerthya-host/commit/2e372aacd155712c5426d68eef7f1bf08075618c))
* **ui:** default the panel to dark with a persisted theme toggle ([#15](https://github.com/Versune/enerthya-host/issues/15)) ([97ea521](https://github.com/Versune/enerthya-host/commit/97ea521d3d19b83129219c67c6a39a3b43d85a86))


### Bug Fixes

* reject any username length without throwing, and compare versions by value ([#7](https://github.com/Versune/enerthya-host/issues/7)) ([38da18a](https://github.com/Versune/enerthya-host/commit/38da18a3b533e408c78dc4473e6d5ebd8865638d))

## 0.1.0 (2026-11-20)


### Features

* add the Tailwind and shadcn foundation for the panel shell ([#10](https://github.com/Versune/enerthya-host/issues/10)) ([7749732](https://github.com/Versune/enerthya-host/commit/774973203ab43080eb1ea4dd90bb3e7e68934ea7))
* **auth:** replace the local account store with better-auth screens ([#12](https://github.com/Versune/enerthya-host/issues/12)) ([cda4c05](https://github.com/Versune/enerthya-host/commit/cda4c058fb52f96c1e12fd47151bca548f90c3c2))
* rebuild Enerthya Host as a self-hosted panel ([ce1c4ba](https://github.com/Versune/enerthya-host/commit/ce1c4bad11b0220a975fdc260337fa1b4b2cbc94))
* rebuild the panel as a pnpm monorepo with Drizzle and better-auth ([#11](https://github.com/Versune/enerthya-host/issues/11)) ([56441b5](https://github.com/Versune/enerthya-host/commit/56441b57aad4eaeb33b9b64877d4a5b0cf48d535))
* **shell:** add the dashboard shell, sidebar and command palette ([#18](https://github.com/Versune/enerthya-host/issues/18)) ([2e372aa](https://github.com/Versune/enerthya-host/commit/2e372aacd155712c5426d68eef7f1bf08075618c))
* **ui:** default the panel to dark with a persisted theme toggle ([#15](https://github.com/Versune/enerthya-host/issues/15)) ([97ea521](https://github.com/Versune/enerthya-host/commit/97ea521d3d19b83129219c67c6a39a3b43d85a86))


### Bug Fixes

* reject any username length without throwing, and compare versions by value ([#7](https://github.com/Versune/enerthya-host/issues/7)) ([38da18a](https://github.com/Versune/enerthya-host/commit/38da18a3b533e408c78dc4473e6d5ebd8865638d))
