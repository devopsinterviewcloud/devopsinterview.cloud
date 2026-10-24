/**
 * Presentation for the cover system: each book owns the colour of its cover
 * everywhere it appears. Text colours follow the contrast table in the design
 * notes (ink on orange and lime, white on blue only at 24px+, purple, red, ink).
 */
type BookStyle = {
  /** Chip text: "Book 2", "Books 1-5", "Bonus". */
  label: string
  /** Fill for the 12px colour key square. */
  square: string
  /** Fill plus text colour for a band or chip in the book's colour. */
  fill: string
  /** Rule colour for a callout's 6px left border. */
  border: string
  /** True when the fill is ink, so chips and outlines on it switch to paper. */
  onInk?: boolean
}

const styles: Record<string, BookStyle> = {
  '1': { label: 'Book 1', square: 'bg-book-blue', fill: 'bg-book-blue text-white', border: 'border-book-blue' },
  '2': { label: 'Book 2', square: 'bg-book-orange', fill: 'bg-book-orange text-ink', border: 'border-book-orange' },
  '3': { label: 'Book 3', square: 'bg-book-purple', fill: 'bg-book-purple text-white', border: 'border-book-purple' },
  '4': { label: 'Book 4', square: 'bg-book-lime', fill: 'bg-book-lime text-ink', border: 'border-book-lime' },
  '5': { label: 'Book 5', square: 'bg-book-red', fill: 'bg-book-red text-white', border: 'border-book-red' },
  bundle: { label: 'Books 1-5', square: 'bg-ink', fill: 'bg-ink text-white', border: 'border-ink', onInk: true },
  playbook: { label: 'Bonus', square: 'bg-paper', fill: 'bg-paper text-ink', border: 'border-hair' },
}

export function bookStyle(id: string): BookStyle {
  return styles[id] ?? styles.bundle
}

/**
 * "Containers & Orchestration: Kubernetes Interview Questions" splits into the
 * cover title and the rest, so the display face can carry the short part.
 */
export function splitTitle(title: string): { name: string; rest: string } {
  const i = title.indexOf(': ')
  return i === -1 ? { name: title, rest: '' } : { name: title.slice(0, i), rest: title.slice(i + 2) }
}

/** The topic line under a card title: "Kubernetes", "AWS, Azure & GCP". */
export function topicLine(title: string): string {
  return splitTitle(title).rest.replace(/ Interview Questions$/, '')
}
