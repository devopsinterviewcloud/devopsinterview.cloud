import { getAllQuestions, getQuestion, productForCategory, categoryLabel } from './questions'

describe('questions', () => {
  it('loads every page with the required frontmatter', () => {
    const all = getAllQuestions()
    expect(all.length).toBeGreaterThan(0)
    for (const q of all) {
      expect(q.title).toBeTruthy()
      expect(q.description.length).toBeGreaterThan(50)
      expect(q.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(q.html).toContain('The answer interviewers want')
    }
  })

  it('maps every used category to a product and a readable label', () => {
    for (const q of getAllQuestions()) {
      expect(productForCategory(q.category)).toBeDefined()
      expect(categoryLabel(q.category)).toBeTruthy()
      expect(categoryLabel(q.category)).not.toContain('_')
    }
  })

  it('rejects path-trick slugs', () => {
    expect(getQuestion('../../etc/passwd')).toBeNull()
    expect(getQuestion('no-such-question-xyz')).toBeNull()
  })
})
