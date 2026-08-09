const APP_NAME = 'd3SRT'
const APP_LONG_NAME = 'd3 Sight Reading Trainer'
const AUTHOR_NAME = 'Charlie Cossé'
const AUTHOR_EMAIL = 'ccosse@gmail.com'
const AUTHOR_SITE = 'https://www.asymptopia.com/'
const AUTHOR_GITHUB = 'https://github.com/ccosse'
const SOURCE_REPO = 'https://github.com/ccosse/d3SightReadingTrainer'
const DESCRIPTION = 'Interactive music-learning and composition web app linking grand staff notation, piano keyboard, guitar fretboard, Circle of Fifths, chord exploration, generated sight-reading, playback, and Web MIDI.'
const KEYWORDS = 'd3SRT, sight reading, music theory, piano, guitar, Circle of Fifths, chords, staff notation, MIDI, Web MIDI, music composition, music education, Asymptopia'

function currentCanonicalUrl() {
  if (typeof window === 'undefined') return AUTHOR_SITE
  return `${window.location.origin}${window.location.pathname}`
}

function setMeta(selector, attributes) {
  if (typeof document === 'undefined') return
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.dataset.d3srtMeta = 'true'
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
}

function setLink(rel, href) {
  if (typeof document === 'undefined') return
  let element = document.head.querySelector(`link[rel="${rel}"][data-d3srt-meta]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    element.dataset.d3srtMeta = 'true'
    document.head.appendChild(element)
  }
  element.href = href
}

function setJsonLd(id, data) {
  if (typeof document === 'undefined') return
  let element = document.getElementById(id)
  if (!element) {
    element = document.createElement('script')
    element.id = id
    element.type = 'application/ld+json'
    element.dataset.d3srtMeta = 'true'
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

export function installSiteMetadata() {
  if (typeof document === 'undefined') return

  const canonicalUrl = currentCanonicalUrl()
  document.title = APP_NAME

  setMeta('meta[name="application-name"]', { name: 'application-name', content: APP_NAME })
  setMeta('meta[name="author"]', { name: 'author', content: AUTHOR_NAME })
  setMeta('meta[name="author-email"]', { name: 'author-email', content: AUTHOR_EMAIL })
  setMeta('meta[name="creator"]', { name: 'creator', content: AUTHOR_NAME })
  setMeta('meta[name="publisher"]', { name: 'publisher', content: 'Asymptopia Software' })
  setMeta('meta[name="description"]', { name: 'description', content: DESCRIPTION })
  setMeta('meta[name="keywords"]', { name: 'keywords', content: KEYWORDS })
  setMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' })

  setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
  setMeta('meta[property="og:title"]', { property: 'og:title', content: `${APP_NAME} — ${APP_LONG_NAME}` })
  setMeta('meta[property="og:description"]', { property: 'og:description', content: DESCRIPTION })
  setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Asymptopia Software' })

  setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' })
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: `${APP_NAME} — ${APP_LONG_NAME}` })
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: DESCRIPTION })

  setLink('canonical', canonicalUrl)
  setLink('author', AUTHOR_SITE)

  setJsonLd('d3srt-structured-data', {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${AUTHOR_SITE}#charlie-cosse`,
        name: AUTHOR_NAME,
        email: `mailto:${AUTHOR_EMAIL}`,
        url: AUTHOR_SITE,
        sameAs: [AUTHOR_GITHUB]
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonicalUrl}#d3srt`,
        name: APP_NAME,
        alternateName: APP_LONG_NAME,
        url: canonicalUrl,
        description: DESCRIPTION,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        author: { '@id': `${AUTHOR_SITE}#charlie-cosse` },
        publisher: {
          '@type': 'Organization',
          name: 'Asymptopia Software',
          url: AUTHOR_SITE
        },
        sameAs: [SOURCE_REPO, AUTHOR_SITE],
        keywords: KEYWORDS
      }
    ]
  })
}

// Set the compact tab title immediately when this module is evaluated.
if (typeof document !== 'undefined') document.title = APP_NAME
