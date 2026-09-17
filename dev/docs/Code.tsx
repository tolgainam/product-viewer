/** Code block with a copy button. Plain <pre>: no highlighter dependency. */
import { useState } from 'react'

export function Code({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  }
  return (
    <pre className="code" data-lang={lang}>
      <button type="button" className="copy" onClick={copy} aria-label="Copy code">
        {copied ? 'Copied' : 'Copy'}
      </button>
      {children}
    </pre>
  )
}
