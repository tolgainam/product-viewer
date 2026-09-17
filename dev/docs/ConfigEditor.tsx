/**
 * Live visual-config editor: edit the values, watch the viewer update, copy the config.
 * Starts from any preset; only the fields most people change are exposed.
 */
import { useMemo, useState } from 'react'
import { ProductViewer, defaultConfig, liquidGlassConfig, transparentBlueConfig } from '../../src'
import { ModelViewer } from '../../src/model'
import type { ProductViewerData, ProductViewerVisualConfig } from '../../src'
import type { GlassEffectType, GlassIntensity } from '../../src/internal/glass-effects'
import { Code } from './Code'

export const PRESETS: Record<string, ProductViewerVisualConfig> = {
  liquidGlassConfig,
  defaultConfig,
  transparentBlueConfig,
}

interface Values {
  pillDefault: string
  pillHover: string
  pillActive: string
  pillText: string
  pillGlass: GlassEffectType
  pillIntensity: GlassIntensity
  pillRadius: number
  cardBackground: string
  cardText: string
  cardGlass: GlassEffectType
  cardIntensity: GlassIntensity
  cardOpacity: number
  containerBackground: string
  dynamicBackground: boolean
  closeBackground: string
  closeIcon: string
}

const fromPreset = (p: ProductViewerVisualConfig): Values => {
  const pill = typeof p.pill.backgroundColor === 'string'
    ? { default: p.pill.backgroundColor, hover: p.pill.backgroundColor, active: p.pill.backgroundColor }
    : p.pill.backgroundColor
  const close = typeof p.closeButton.backgroundColor === 'string' ? p.closeButton.backgroundColor : p.closeButton.backgroundColor.default
  return {
    pillDefault: pill.default,
    pillHover: pill.hover,
    pillActive: pill.active,
    pillText: p.pill.textColor,
    pillGlass: p.pill.glassEffect,
    pillIntensity: p.pill.glassIntensity ?? 'medium',
    pillRadius: typeof p.pill.borderRadius === 'number' ? p.pill.borderRadius : 24,
    cardBackground: p.expandedCard.backgroundColor,
    cardText: p.expandedCard.textColor,
    cardGlass: p.expandedCard.glassEffect,
    cardIntensity: p.expandedCard.glassIntensity ?? 'medium',
    cardOpacity: p.expandedCard.descriptionOpacity,
    containerBackground: p.container.backgroundColor,
    dynamicBackground: !!p.container.dynamicBackground,
    closeBackground: close,
    closeIcon: p.closeButton.iconColor,
  }
}

const toConfig = (base: ProductViewerVisualConfig, v: Values): ProductViewerVisualConfig => ({
  ...base,
  pill: {
    ...base.pill,
    backgroundColor: { default: v.pillDefault, hover: v.pillHover, active: v.pillActive },
    textColor: v.pillText,
    glassEffect: v.pillGlass,
    glassIntensity: v.pillIntensity,
    borderRadius: v.pillRadius,
  },
  expandedCard: {
    ...base.expandedCard,
    backgroundColor: v.cardBackground,
    textColor: v.cardText,
    glassEffect: v.cardGlass,
    glassIntensity: v.cardIntensity,
    descriptionOpacity: v.cardOpacity,
  },
  container: { ...base.container, backgroundColor: v.containerBackground, dynamicBackground: v.dynamicBackground },
  closeButton: { ...base.closeButton, backgroundColor: { default: v.closeBackground, hover: v.closeBackground }, iconColor: v.closeIcon },
})

const snippet = (preset: string, v: Values) => `import { ProductViewer, ${preset} } from '@tolgainam/product-viewer'
import type { ProductViewerVisualConfig } from '@tolgainam/product-viewer'

const config: ProductViewerVisualConfig = {
  ...${preset},
  pill: {
    ...${preset}.pill,
    backgroundColor: { default: '${v.pillDefault}', hover: '${v.pillHover}', active: '${v.pillActive}' },
    textColor: '${v.pillText}',
    glassEffect: '${v.pillGlass}',
    glassIntensity: '${v.pillIntensity}',
    borderRadius: ${v.pillRadius},
  },
  expandedCard: {
    ...${preset}.expandedCard,
    backgroundColor: '${v.cardBackground}',
    textColor: '${v.cardText}',
    glassEffect: '${v.cardGlass}',
    glassIntensity: '${v.cardIntensity}',
    descriptionOpacity: ${v.cardOpacity},
  },
  container: {
    ...${preset}.container,
    backgroundColor: '${v.containerBackground}',
    dynamicBackground: ${v.dynamicBackground},
  },
  closeButton: {
    ...${preset}.closeButton,
    backgroundColor: '${v.closeBackground}',
    iconColor: '${v.closeIcon}',
  },
}

<ProductViewer data={product} visualConfig={config} />`

const GLASS: GlassEffectType[] = ['frosted', 'liquid', 'minimal', 'none']
const INTENSITY: GlassIntensity[] = ['light', 'medium', 'strong']

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      <span className="chip" aria-hidden><span style={{ background: value }} /></span>
    </label>
  )
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span />
    </label>
  )
}

export function ConfigEditor({ data }: { data: ProductViewerData }) {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('liquidGlassConfig')
  const [values, setValues] = useState<Values>(() => fromPreset(liquidGlassConfig))
  const set = <K extends keyof Values>(key: K) => (v: Values[K]) => setValues((prev) => ({ ...prev, [key]: v }))
  const config = useMemo(() => toConfig(PRESETS[preset], values), [preset, values])

  return (
    <>
      <div className="toolbar">
        <label>
          Start from
          <select
            value={preset}
            onChange={(e) => {
              const next = e.target.value as keyof typeof PRESETS
              setPreset(next)
              setValues(fromPreset(PRESETS[next]))
            }}
          >
            {Object.keys(PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      </div>
      <div className="editor">
        <div className="fields">
          <h4>Pills</h4>
          <ColorField label="Background" value={values.pillDefault} onChange={set('pillDefault')} />
          <ColorField label="Hover" value={values.pillHover} onChange={set('pillHover')} />
          <ColorField label="Active" value={values.pillActive} onChange={set('pillActive')} />
          <ColorField label="Text" value={values.pillText} onChange={set('pillText')} />
          <SelectField label="Glass" value={values.pillGlass} options={GLASS} onChange={set('pillGlass')} />
          <SelectField label="Intensity" value={values.pillIntensity} options={INTENSITY} onChange={set('pillIntensity')} />
          <label className="field">
            <span>Radius</span>
            <input type="number" min={0} max={40} value={values.pillRadius} onChange={(e) => set('pillRadius')(Number(e.target.value))} />
            <span />
          </label>

          <h4>Open card</h4>
          <ColorField label="Background" value={values.cardBackground} onChange={set('cardBackground')} />
          <ColorField label="Text" value={values.cardText} onChange={set('cardText')} />
          <SelectField label="Glass" value={values.cardGlass} options={GLASS} onChange={set('cardGlass')} />
          <SelectField label="Intensity" value={values.cardIntensity} options={INTENSITY} onChange={set('cardIntensity')} />
          <label className="field">
            <span>Text opacity</span>
            <input type="number" min={0.3} max={1} step={0.05} value={values.cardOpacity} onChange={(e) => set('cardOpacity')(Number(e.target.value))} />
            <span />
          </label>

          <h4>Stage</h4>
          <ColorField label="Background" value={values.containerBackground} onChange={set('containerBackground')} />
          <label className="field">
            <span>Follow variant</span>
            <input type="checkbox" checked={values.dynamicBackground} onChange={(e) => set('dynamicBackground')(e.target.checked)} style={{ width: 'auto', justifySelf: 'start' }} />
            <span />
          </label>

          <h4>Close button</h4>
          <ColorField label="Background" value={values.closeBackground} onChange={set('closeBackground')} />
          <ColorField label="Icon" value={values.closeIcon} onChange={set('closeIcon')} />
        </div>
        <div>
          {/* Forced mobile layout so the preview fits beside the fields */}
          <ProductViewer data={data} visualConfig={config} modelRenderer={ModelViewer} layout="mobile" defaultFeatureIndex={0} />
        </div>
      </div>
      <h3>Your config</h3>
      <Code lang="tsx">{snippet(preset, values)}</Code>
    </>
  )
}
