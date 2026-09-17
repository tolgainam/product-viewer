/**
 * The viewer's stylesheet. Everything that inline styles cannot express — hover and
 * focus states, the swatch ring pseudo-element, scrollbars — lives here and is injected
 * once per document on first render. Layout and every configurable value stay inline,
 * so server-rendered markup is complete before this sheet arrives.
 *
 * Dynamic colours reach the sheet through custom properties set inline (`--pv-hover`).
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { useInsertionEffect } from 'react'

export const STYLE_ATTR = 'data-product-viewer'

const CSS = `
.pv-reset{margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;-webkit-appearance:none;appearance:none}
.pv-btn{cursor:pointer;-webkit-tap-highlight-color:transparent}
.pv-btn:disabled{cursor:not-allowed}
.pv-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.pv-hover:hover:not(:disabled){background-color:var(--pv-hover)}
.pv-swatch{position:relative;width:32px;height:32px;border-radius:100px;background:transparent;overflow:hidden;color:inherit}
.pv-swatch::before{content:"";position:absolute;inset:0;border-radius:100px;border:1.5px solid currentColor;opacity:0;transition:opacity .2s ease;pointer-events:none}
.pv-swatch[aria-checked="true"]::before,.pv-swatch:focus-visible::before{opacity:1}
.pv-swatch:focus-visible{outline:none}
.pv-swatch:hover:not(:disabled){opacity:.8}
.pv-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}
.pv-scroll::-webkit-scrollbar{width:4px}
.pv-scroll::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,.2);border-radius:2px}
.pv-loading-track{position:relative;width:120px;height:2px;border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden}
.pv-loading-fill{position:absolute;inset:0 auto 0 0;border-radius:2px;background:rgba(255,255,255,.85);transition:width .25s ease}
.pv-loading-fill[data-indeterminate="true"]{width:40%;animation:pv-slide 1.2s ease-in-out infinite}
@keyframes pv-slide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@media (prefers-reduced-motion:reduce){.pv-loading-fill[data-indeterminate="true"]{animation:none;width:100%;opacity:.5}}
`

let injected = false

/** Injects the stylesheet once per document. Safe to call from every component. */
export function useViewerStyles(): void {
  useInsertionEffect(() => {
    if (injected || typeof document === 'undefined') return
    injected = true
    if (document.head.querySelector(`style[${STYLE_ATTR}]`)) return
    const style = document.createElement('style')
    style.setAttribute(STYLE_ATTR, '')
    style.textContent = CSS
    document.head.appendChild(style)
  }, [])
}

/** Class list helper */
export const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')
