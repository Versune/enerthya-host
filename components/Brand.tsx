export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Enerthya Host panel, home">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
          <path
            fillRule="evenodd"
            d="M20 128A108 108 0 1 1 236 128A108 108 0 1 1 20 128Z M77.6 187.76C60.32 158.96 63.2 120.08 87.68 95.6C112.16 71.12 149.6 58.16 195.68 61.04C184.16 81.2 165.44 99.92 142.4 111.44C164 115.76 184.16 124.4 194.24 138.8C179.84 141.68 165.44 143.12 152.48 147.44C135.2 153.2 123.68 163.28 119.36 176.24C113.6 189.2 97.76 197.84 77.6 187.76Z"
          />
        </svg>
      </span>
      <span className="brand__word">Enerthya</span>
      <span className="brand__suffix">Host</span>
    </a>
  );
}
