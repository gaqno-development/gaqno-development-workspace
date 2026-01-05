import { IWhiteLabelConfig } from '../types/whitelabel'

const hexToHSL = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  if (!result) return ''

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  h = Math.round(h * 360)
  s = Math.round(s * 100)
  const lightness = Math.round(l * 100)

  return `${h} ${s}% ${lightness}%`
}

export const applyWhiteLabelStyles = (config: IWhiteLabelConfig) => {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  if (config.primaryColor) {
    const hslValue = hexToHSL(config.primaryColor)
    root.style.setProperty('--primary', hslValue)
  }

  if (config.secondaryColor) {
    const hslValue = hexToHSL(config.secondaryColor)
    root.style.setProperty('--secondary', hslValue)
  }

  if (config.fontFamily) {
    root.style.setProperty('font-family', config.fontFamily)
  }

  if (config.logoUrl) {
    const logoElements = document.querySelectorAll('.whitelabel-logo')
    logoElements.forEach(el => {
      const img = el as HTMLImageElement
      img.src = config.logoUrl!
    })
  }

  if (config.faviconUrl) {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      favicon.href = config.faviconUrl
    } else {
      const newFavicon = document.createElement('link')
      newFavicon.rel = 'icon'
      newFavicon.href = config.faviconUrl
      document.head.appendChild(newFavicon)
    }
  }

  if (config.appName) {
    document.title = config.appName
  }

  if (config.customCss) {
    let styleElement = document.getElementById('whitelabel-custom-css')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'whitelabel-custom-css'
      document.head.appendChild(styleElement)
    }
    styleElement.textContent = config.customCss
  }
}

export const removeWhiteLabelStyles = () => {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  root.style.removeProperty('--primary')
  root.style.removeProperty('--secondary')
  root.style.removeProperty('--font-family')

  const customCss = document.getElementById('whitelabel-custom-css')
  if (customCss) {
    customCss.remove()
  }
}

