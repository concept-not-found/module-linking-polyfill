/**
 * @template T,R
 * @typedef {import('./grammar.mjs').MatchResult<T, R>} MatchResult<T, R>
 */

/**
 * @template T,R
 * @typedef {import('./grammar.mjs').Matched<T, R>} Matched<T, R>
 */

/**
 * Asserts is Matched.
 *
 * @template T,R
 * @param {MatchResult<T, R>} result
 * @return {asserts result is Matched<T, R>}
 */
export function assertMatched(result) {
  if (!result.match) {
    throw new Error('failed to assert match result is matched')
  }
}
