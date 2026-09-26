import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,

  // pg is a server-only dependency; keep it out of any client bundle.
  serverExternalPackages: ['pg'],

  /**
   * The demo corpus reads data/codes/*.yaml at request time with a path built
   * from process.cwd(). Next's tracer cannot follow a dynamic path like that, so
   * on a serverless host the file is absent and the page returns a 500 that never
   * appears in a local build. Naming it here forces it into the bundle.
   */
  outputFileTracingIncludes: {
    '/**': ['./data/codes/**'],
  },
}

export default config
