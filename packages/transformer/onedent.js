import { makeDedent } from './dedent.js'

const onedent = makeDedent('  ')

/**
 * @param {string} string
 */
export default (string) => onedent(string).trim()
