# Changelog

## [0.12.27](https://github.com/Versune/enerthya-host/compare/v0.12.26...v0.12.27) (2026-11-28)


### Bug Fixes

* **release:** stage standalone static assets as real files ([#139](https://github.com/Versune/enerthya-host/issues/139)) ([482cfeb](https://github.com/Versune/enerthya-host/commit/482cfeb389195654d940df3f6136e53fd0d2fe3e))

## [0.12.26](https://github.com/Versune/enerthya-host/compare/v0.12.25...v0.12.26) (2026-11-28)


### Features

* **web:** dashboard design refresh and accessibility pass ([#130](https://github.com/Versune/enerthya-host/issues/130)) ([5e8b783](https://github.com/Versune/enerthya-host/commit/5e8b7839eb8e6875551a38aa604625ea8c09e17d))


### Bug Fixes

* **core:** use default ssh2 import so utils resolves under Node 24 ESM ([#129](https://github.com/Versune/enerthya-host/issues/129)) ([906e198](https://github.com/Versune/enerthya-host/commit/906e19818d9d15cfabd429bbe78603632ac56c8c))
* **security:** audit remediation across mounts, CSRF, backups and API caps ([#136](https://github.com/Versune/enerthya-host/issues/136)) ([f24219c](https://github.com/Versune/enerthya-host/commit/f24219c7d18d8a64b8abdb0e1da50d63c30606db))

## [0.12.25](https://github.com/Versune/enerthya-host/compare/v0.12.24...v0.12.25) (2026-11-24)


### Bug Fixes

* **install:** verify, prove and switch — or leave the running version alone ([#127](https://github.com/Versune/enerthya-host/issues/127)) ([07a81b4](https://github.com/Versune/enerthya-host/commit/07a81b400d44ee5aa1670c2be1b2103c35e6fbab))

## [0.12.24](https://github.com/Versune/enerthya-host/compare/v0.12.23...v0.12.24) (2026-11-24)


### Bug Fixes

* **web:** the invitation page must not live behind the session layout ([#124](https://github.com/Versune/enerthya-host/issues/124)) ([f8f558b](https://github.com/Versune/enerthya-host/commit/f8f558b442a36c56ba46b1475d8eca4e658c077c))

## [0.12.23](https://github.com/Versune/enerthya-host/compare/v0.12.22...v0.12.23) (2026-11-24)


### Bug Fixes

* **compose:** keep a local backup in a volume, not in the worker's layer ([#122](https://github.com/Versune/enerthya-host/issues/122)) ([fa5b56d](https://github.com/Versune/enerthya-host/commit/fa5b56d5427706b9aeb4a7ee0f97530704a1c05c))

## [0.12.22](https://github.com/Versune/enerthya-host/compare/v0.12.21...v0.12.22) (2026-11-24)


### Bug Fixes

* **proxy:** serialize the route table, and republish when a domain changes ([#120](https://github.com/Versune/enerthya-host/issues/120)) ([5e8ba1e](https://github.com/Versune/enerthya-host/commit/5e8ba1eb01163d11f24fa5431b8a6a66fd20b183))

## [0.12.21](https://github.com/Versune/enerthya-host/compare/v0.12.20...v0.12.21) (2026-11-23)


### Bug Fixes

* **worker:** serialize per application, and let nothing after the swap fail ([#117](https://github.com/Versune/enerthya-host/issues/117)) ([82cff66](https://github.com/Versune/enerthya-host/commit/82cff668091f36e6d0ed5b1a18fc9d2e683a3099))

## [0.12.20](https://github.com/Versune/enerthya-host/compare/v0.12.19...v0.12.20) (2026-11-23)


### Features

* **compose:** give the worker the SMTP and S3 settings it already reads ([#115](https://github.com/Versune/enerthya-host/issues/115)) ([457f116](https://github.com/Versune/enerthya-host/commit/457f116f06a2765756226fd8af379898d2f99b58))

## [0.12.19](https://github.com/Versune/enerthya-host/compare/v0.12.18...v0.12.19) (2026-11-23)


### Features

* **auth:** let an invited person create the account the invitation names ([#113](https://github.com/Versune/enerthya-host/issues/113)) ([cd20349](https://github.com/Versune/enerthya-host/commit/cd20349f8e009083bd8d05a183e495171ed86462))

## [0.12.18](https://github.com/Versune/enerthya-host/compare/v0.12.17...v0.12.18) (2026-11-23)


### Features

* **auth:** close registration after the first account ([#111](https://github.com/Versune/enerthya-host/issues/111)) ([2229237](https://github.com/Versune/enerthya-host/commit/22292376b3e299c1e6214fc659f2fd79c3ae1610))

## [0.12.17](https://github.com/Versune/enerthya-host/compare/v0.12.16...v0.12.17) (2026-11-23)


### Features

* **applications:** run a background service, not only an HTTP app ([#107](https://github.com/Versune/enerthya-host/issues/107)) ([b134240](https://github.com/Versune/enerthya-host/commit/b13424050207b36d661e66b9256b74bfa13334fe))
* **deploy:** resume an interrupted deployment instead of restarting it ([#101](https://github.com/Versune/enerthya-host/issues/101)) ([2854f63](https://github.com/Versune/enerthya-host/commit/2854f63aeb00fa56781f4a2189e22f81ce89ff1d))


### Bug Fixes

* **core:** publish to loopback, require 2xx from the health check ([#104](https://github.com/Versune/enerthya-host/issues/104)) ([4eceacf](https://github.com/Versune/enerthya-host/commit/4eceacfe14917913f1b719be4b28a7d3954570b2))
* **web:** encrypt the webhook secret and show it only to writers ([#106](https://github.com/Versune/enerthya-host/issues/106)) ([2292590](https://github.com/Versune/enerthya-host/commit/2292590d1552bbda667feb8ca4aa4865bdf1b562))
* **web:** make server and terminal writes admin-only ([#102](https://github.com/Versune/enerthya-host/issues/102)) ([f3edee0](https://github.com/Versune/enerthya-host/commit/f3edee001f54d39392284563850b433e832f1733))

## [0.12.16](https://github.com/Versune/enerthya-host/compare/v0.12.15...v0.12.16) (2026-11-22)


### Features

* **deploy:** move the traffic before the old container stops ([#98](https://github.com/Versune/enerthya-host/issues/98)) ([ef44ecd](https://github.com/Versune/enerthya-host/commit/ef44ecd25b207b72835b0a9166be8e6b5ac76e94))

## [0.12.15](https://github.com/Versune/enerthya-host/compare/v0.12.14...v0.12.15) (2026-11-22)


### Bug Fixes

* **install:** stop the piped script from eating itself ([#96](https://github.com/Versune/enerthya-host/issues/96)) ([737c849](https://github.com/Versune/enerthya-host/commit/737c8498bccd52f3b9445df17c8dd7f993fa4e3b))

## [0.12.14](https://github.com/Versune/enerthya-host/compare/v0.12.13...v0.12.14) (2026-11-22)


### Bug Fixes

* **deps:** pin esbuild and minimatch past their advisories ([#94](https://github.com/Versune/enerthya-host/issues/94)) ([adaa673](https://github.com/Versune/enerthya-host/commit/adaa6736f18f9c761b7de672f34d595ffbc94ba0))

## [0.12.13](https://github.com/Versune/enerthya-host/compare/v0.12.12...v0.12.13) (2026-11-22)


### Features

* **members:** invite people, change roles, remove members ([#90](https://github.com/Versune/enerthya-host/issues/90)) ([0416aeb](https://github.com/Versune/enerthya-host/commit/0416aeb8084881b07d44cd8cff01c53d97721eac))

## [0.12.12](https://github.com/Versune/enerthya-host/compare/v0.12.11...v0.12.12) (2026-11-21)


### Features

* **metrics:** read the host the worker runs on ([#89](https://github.com/Versune/enerthya-host/issues/89)) ([9fe35c7](https://github.com/Versune/enerthya-host/commit/9fe35c7eec0300b6116b40ce49cc509b5a1897ef))
* **web:** chart container CPU with react-query and recharts ([#87](https://github.com/Versune/enerthya-host/issues/87)) ([b1aa480](https://github.com/Versune/enerthya-host/commit/b1aa480f6a3901a6798ce369611a29899aefd2b0))

## [0.12.11](https://github.com/Versune/enerthya-host/compare/v0.12.10...v0.12.11) (2026-11-21)


### Features

* **notifications:** deliver deployment failures by email ([#85](https://github.com/Versune/enerthya-host/issues/85)) ([3dab57f](https://github.com/Versune/enerthya-host/commit/3dab57f9d50973e11230c3f9c6b818cf6a3b7623))

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
