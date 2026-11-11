import { useId, useMemo, useState } from 'react'
import { type Lang, t } from './i18n'
import { searchTowns, type Town, typeLabel } from './towns'

interface Props {
  lang: Lang
  onSelect: (town: Town) => void
  /** Keep the label for screen readers only (e.g. when the box floats over the flight view). */
  hideLabel?: boolean
}

export default function TownSearch({ lang, onSelect, hideLabel = false }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const results = useMemo(() => searchTowns(query), [query])
  const inputId = useId()
  const listId = useId()
  const showList = open && query.trim() !== ''

  function choose(town: Town) {
    onSelect(town)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && showList && results[active]) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'text-sm font-semibold text-sub'}>
        {t('flyToTown', lang)}
      </label>
      <input
        id={inputId}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${results[active].id}` : undefined}
        autoComplete="off"
        enterKeyHint="go"
        placeholder={hideLabel ? `${t('flyToTown', lang)}…` : t('searchPlaceholder', lang)}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-12 rounded-xl border border-line bg-card px-4 text-base text-ink placeholder:text-sub/80"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('flyToTown', lang)}
          className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_8px_24px_rgb(18_35_61/0.12)]"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sub">{t('noTownFound', lang)}</li>
          ) : (
            results.map((town, i) => (
              <li
                key={town.id}
                id={`${listId}-${town.id}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(town)
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-12 cursor-pointer items-center gap-2 px-4 py-2 ${i === active ? 'bg-sheet' : ''}`}
              >
                <span className="grow">
                  <span className="font-semibold">{town.name}</span>
                  <span className="text-sub"> · {town.state}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold tracking-wide text-sub uppercase">
                  {typeLabel(town.type, lang)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
