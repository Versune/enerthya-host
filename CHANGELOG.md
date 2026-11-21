# Changelog

## [0.12.10](https://github.com/Versune/enerthya-host/compare/v0.12.9...v0.12.10) (2026-11-21)


### Features

* **terminal:** a shell inside the running container ([#84](https://github.com/Versune/enerthya-host/issues/84)) ([010eac4](https://github.com/Versune/enerthya-host/commit/010eac489ea1bbe6e9d296f357810c90618929da))
* **worker:** structured logs with pino, relative time with date-fns ([#81](https://github.com/Versune/enerthya-host/issues/81)) ([f98b043](https://github.com/Versune/enerthya-host/commit/f98b043e83a878a8a05fa846edbf241e72967b03))


### Bug Fixes

* **install:** stop dropping operator settings from .env ([#82](https://github.com/Versune/enerthya-host/issues/82)) ([3022943](https://github.com/Versune/enerthya-host/commit/30229434912518e7f8070ac8f1b03086388bfd95))

## [0.12.9](https://github.com/Versune/enerthya-host/compare/v0.12.8...v0.12.9) (2026-11-21)


### Features

* **backups:** schedule backups per database, with retention ([#80](https://github.com/Versune/enerthya-host/issues/80)) ([b06351b](https://github.com/Versune/enerthya-host/commit/b06351b487fc5038aea946df5ba7fe939eecfb9d))


### Bug Fixes

* **install:** start the runtime whenever the profile asks for it ([#79](https://github.com/Versune/enerthya-host/issues/79)) ([63929be](https://github.com/Versune/enerthya-host/commit/63929be5d2c006db07992e2553a6c7d8e499de1b))

## [0.12.8](https://github.com/Versune/enerthya-host/compare/v0.12.7...v0.12.8) (2026-11-21)


### Bug Fixes

* **install:** keep COMPOSE_PROFILES across an upgrade ([#75](https://github.com/Versune/enerthya-host/issues/75)) ([378af91](https://github.com/Versune/enerthya-host/commit/378af91fe83726133391fea6ea9a0a8f95c6ceb8))

## [0.12.7](https://github.com/Versune/enerthya-host/compare/v0.12.6...v0.12.7) (2026-11-21)


### Features

* **backups:** upload verified dumps to an S3-compatible bucket ([#72](https://github.com/Versune/enerthya-host/issues/72)) ([d75eec9](https://github.com/Versune/enerthya-host/commit/d75eec910a22c65733ca77268a1a067a0e422a39))


### Bug Fixes

* **web:** refresh dashboard copy to match what ships ([#74](https://github.com/Versune/enerthya-host/issues/74)) ([b8ee3e7](https://github.com/Versune/enerthya-host/commit/b8ee3e7a048622eadbb6d058010d30a649303d0e))

## [0.12.6](https://github.com/Versune/enerthya-host/compare/v0.12.5...v0.12.6) (2026-11-21)


### Features

* **backups:** a backup only counts after its restore is verified ([#71](https://github.com/Versune/enerthya-host/issues/71)) ([2d5f833](https://github.com/Versune/enerthya-host/commit/2d5f83325bfa05d2abbcce42caff870d706ecba2))
* **databases:** provision a managed Postgres with its own volume ([#69](https://github.com/Versune/enerthya-host/issues/69)) ([d747894](https://github.com/Versune/enerthya-host/commit/d7478946c96367c708b241a66c80b20e93454c62))

## [0.12.5](https://github.com/Versune/enerthya-host/compare/v0.12.4...v0.12.5) (2026-11-21)


### Bug Fixes

* **install:** wait for the release artifact instead of failing on 404 ([#67](https://github.com/Versune/enerthya-host/issues/67)) ([b62a25d](https://github.com/Versune/enerthya-host/commit/b62a25d06e84ed1c4b07f981f0b24cbfe0a74906))

## [0.12.4](https://github.com/Versune/enerthya-host/compare/v0.12.3...v0.12.4) (2026-11-21)


### Features

* **metrics:** sample CPU and memory per running container ([#65](https://github.com/Versune/enerthya-host/issues/65)) ([50f44fe](https://github.com/Versune/enerthya-host/commit/50f44fee47dd9c34bbb2117c933c587709310448))

## [0.12.3](https://github.com/Versune/enerthya-host/compare/v0.12.2...v0.12.3) (2026-11-21)


### Features

* **notifications:** report a failed deployment to Discord or a webhook ([#63](https://github.com/Versune/enerthya-host/issues/63)) ([8c43bf4](https://github.com/Versune/enerthya-host/commit/8c43bf4c407e81dae37360a2ce18a6e65c3f9090))

## [0.12.2](https://github.com/Versune/enerthya-host/compare/v0.12.1...v0.12.2) (2026-11-21)


### Features

* **applications:** stream the running container's output ([#61](https://github.com/Versune/enerthya-host/issues/61)) ([931eed9](https://github.com/Versune/enerthya-host/commit/931eed97f427670481212d459d478ab84b2e8ea5))

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
