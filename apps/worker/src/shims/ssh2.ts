/**
 * dockerode's client loads ssh2 at import time for its `ssh://` transport. The
 * worker only speaks to the runtime over a local socket, and ssh2 carries a
 * native addon that cannot be bundled into the release artifact — so the build
 * aliases the package to this module. Nothing in the worker reaches either
 * export; if something ever does, it fails loudly instead of half-working.
 */
const UNUSED = "ssh2 is not part of the worker bundle; it is only used by the panel.";

export class Client {
  constructor() {
    throw new Error(UNUSED);
  }
}

export const utils = {};

export default { Client, utils };
