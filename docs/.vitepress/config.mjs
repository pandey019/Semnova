import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Semnova",
  description: "Zero API keys. Zero cloud costs. Local AI-powered semantic search for Node.js.",
  base: "/Semnova/",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/what-is-semnova' },
      { text: 'API', link: '/api/' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Semnova?', link: '/guide/what-is-semnova' },
          { text: 'Getting Started', link: '/guide/getting-started' },
        ]
      },
      {
        text: 'Adapters',
        items: [
          { text: 'Memory (Default)', link: '/adapters/memory' },
          { text: 'SQLite', link: '/adapters/sqlite' },
          { text: 'PostgreSQL (pgvector)', link: '/adapters/pgvector' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api/' },
          { text: 'Examples', link: '/guide/examples' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/pandey019/Semnova' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present Semnova Contributors'
    }
  }
})
