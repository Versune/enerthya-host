# Changelog

## [0.12.1](https://github.com/Versune/enerthya-host/compare/v0.12.0...v0.12.1) (2026-11-21)


### Features

* **deployments:** stream the deploy log to the panel ([#59](https://github.com/Versune/enerthya-host/issues/59)) ([697465e](https://github.com/Versune/enerthya-host/commit/697465e992858f4534dd257b4ebe424f33cc2dcb))

## [0.12.0](https://github.com/Versune/enerthya-host/compare/v0.11.0...v0.12.0) (2026-11-21)


### Features

* **deployments:** record every deploy step and show it ([#56](https://github.com/Versune/enerthya-host/issues/56)) ([86b84be](https://github.com/Versune/enerthya-host/commit/86b84bede8aaa830e65e295b08cfc72c4d974e9d))

## [0.11.0](https://github.com/Versune/enerthya-host/compare/v0.10.0...v0.11.0) (2026-11-21)


### Features

* **applications:** per-application deploy keys for private repositories ([#54](https://github.com/Versune/enerthya-host/issues/54)) ([95376ed](https://github.com/Versune/enerthya-host/commit/95376ed6a163b8c4336dd894e46ce85cc3f9f84d))

## [0.10.0](https://github.com/Versune/enerthya-host/compare/v0.9.0...v0.10.0) (2026-11-21)


### Features

* **domains:** route a domain to the port its deployment published ([#52](https://github.com/Versune/enerthya-host/issues/52)) ([1f791f7](https://github.com/Versune/enerthya-host/commit/1f791f7d4652e841e0fe801fe0558736fab85fcd))

## [0.9.0](https://github.com/Versune/enerthya-host/compare/v0.8.0...v0.9.0) (2026-11-21)


### Features

* **applications:** queue a deployment on a signed GitHub push ([#50](https://github.com/Versune/enerthya-host/issues/50)) ([2f764fc](https://github.com/Versune/enerthya-host/commit/2f764fc4a667ba5d4d757828a51d088d2a295da1))
* **env-vars:** store secrets per application and inject them at deploy ([#49](https://github.com/Versune/enerthya-host/issues/49)) ([dd5aeb9](https://github.com/Versune/enerthya-host/commit/dd5aeb98975c5dd8008ceb0da3d18ee036efc229))

## [0.8.0](https://github.com/Versune/enerthya-host/compare/v0.7.0...v0.8.0) (2026-11-21)


### Features

* **deployments:** roll back to the previous image that reached running ([#46](https://github.com/Versune/enerthya-host/issues/46)) ([786d216](https://github.com/Versune/enerthya-host/commit/786d216b844302399df94ba7e6bcf5c7c96a7557))
* **shell:** give the navigation section icons ([#47](https://github.com/Versune/enerthya-host/issues/47)) ([0679d7b](https://github.com/Versune/enerthya-host/commit/0679d7bb1efdcdbf17f3d0cd0bea672fc37bbe9d))

## [0.7.0](https://github.com/Versune/enerthya-host/compare/v0.6.1...v0.7.0) (2026-11-21)


### Features

* **install:** ship the deploy worker as an opt-in runtime profile ([#43](https://github.com/Versune/enerthya-host/issues/43)) ([e18754c](https://github.com/Versune/enerthya-host/commit/e18754c390f7efab86ee7a089e65bbcc2f07c3ef))

## [0.6.1](https://github.com/Versune/enerthya-host/compare/v0.6.0...v0.6.1) (2026-11-21)


### Bug Fixes

* **copy:** stop saying nothing deploys ([#41](https://github.com/Versune/enerthya-host/issues/41)) ([62ac271](https://github.com/Versune/enerthya-host/commit/62ac27112957df528d3d608e1e7272aac387b002))

## [0.6.0](https://github.com/Versune/enerthya-host/compare/v0.5.0...v0.6.0) (2026-11-21)


### Features

* **deploy:** run deployments on a Docker or Podman runtime ([#39](https://github.com/Versune/enerthya-host/issues/39)) ([4128a35](https://github.com/Versune/enerthya-host/commit/4128a354c89255af035402d9a03d2f02be94ef18))

## [0.5.0](https://github.com/Versune/enerthya-host/compare/v0.4.0...v0.5.0) (2026-11-21)


### Features

* **applications:** attach applications to environments with build settings ([#36](https://github.com/Versune/enerthya-host/issues/36)) ([f4fdff8](https://github.com/Versune/enerthya-host/commit/f4fdff87b2ec807b52bb94a11d3e6c1fd53efa4e))
* **deployments:** queue deployments and resolve their source in the worker ([#38](https://github.com/Versune/enerthya-host/issues/38)) ([9c0eb5e](https://github.com/Versune/enerthya-host/commit/9c0eb5e0e9f588d1a9e91e90d39bf0a0f39547a5))

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
