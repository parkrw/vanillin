/**
 * command-score — fuzzy matching scorer for command palettes.
 *
 * Ported from cmdk's `command-score` (MIT licence, Paco Coursey).
 * Original: https://github.com/pacocoursey/cmdk
 *
 * Scores are arranged so that a continuous match of characters produces a
 * total score of 1. The algorithm is recursive with memoisation; an
 * input-length cap prevents pathological pastes from blowing the stack.
 */

// --- scoring constants (verbatim from cmdk) ---

// Best case: this character is a match and continues a run.
var SCORE_CONTINUE_MATCH = 1
// A new match at a space-delimited word start.
var SCORE_SPACE_WORD_JUMP = 0.9
// A new match at a non-space word boundary (slash, bracket, etc.).
var SCORE_NON_SPACE_WORD_JUMP = 0.8
// Any other match (character jump).
var SCORE_CHARACTER_JUMP = 0.17
// Transposition penalty (user swapped two letters).
var SCORE_TRANSPOSITION = 0.1

// Decay for each skipped character between matches.
var PENALTY_SKIPPED = 0.999
// Slight penalty for case mismatch.
var PENALTY_CASE_MISMATCH = 0.9999
// Penalty for distance from the start of the word.
// NOTE: defined but unused in cmdk's original — kept for port fidelity.
var PENALTY_DISTANCE_FROM_START = 0.9
// Penalty when the match does not consume the entire string.
var PENALTY_NOT_COMPLETE = 0.99

// --- boundary detection ---

var IS_GAP_REGEXP = /[\\\/_+.#"@\[\(\{&]/
var COUNT_GAPS_REGEXP = /[\\\/_+.#"@\[\(\{&]/g
var IS_SPACE_REGEXP = /[\s-]/
var COUNT_SPACE_REGEXP = /[\s-]/g

/** Cap: inputs longer than this are truncated before scoring. */
var MAX_LENGTH = 256

// --- inner recursive scorer ---

function commandScoreInner(
  string,
  abbreviation,
  lowerString,
  lowerAbbreviation,
  stringIndex,
  abbreviationIndex,
  memoizedResults
) {
  if (abbreviationIndex === abbreviation.length) {
    return stringIndex === string.length
      ? SCORE_CONTINUE_MATCH
      : PENALTY_NOT_COMPLETE
  }

  var memoizeKey = stringIndex + "," + abbreviationIndex
  if (memoizedResults[memoizeKey] !== undefined) {
    return memoizedResults[memoizeKey]
  }

  var abbreviationChar = lowerAbbreviation.charAt(abbreviationIndex)
  var index = lowerString.indexOf(abbreviationChar, stringIndex)
  var highScore = 0

  var score, transposedScore, wordBreaks, spaceBreaks

  while (index >= 0) {
    score = commandScoreInner(
      string,
      abbreviation,
      lowerString,
      lowerAbbreviation,
      index + 1,
      abbreviationIndex + 1,
      memoizedResults
    )
    if (score > highScore) {
      if (index === stringIndex) {
        score *= SCORE_CONTINUE_MATCH
      } else if (IS_GAP_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP
        wordBreaks = string
          .slice(stringIndex, index - 1)
          .match(COUNT_GAPS_REGEXP)
        if (wordBreaks && stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, wordBreaks.length)
        }
      } else if (IS_SPACE_REGEXP.test(string.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP
        spaceBreaks = string
          .slice(stringIndex, index - 1)
          .match(COUNT_SPACE_REGEXP)
        if (spaceBreaks && stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, spaceBreaks.length)
        }
      } else {
        score *= SCORE_CHARACTER_JUMP
        if (stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, index - stringIndex)
        }
      }

      if (string.charAt(index) !== abbreviation.charAt(abbreviationIndex)) {
        score *= PENALTY_CASE_MISMATCH
      }
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerString.charAt(index - 1) ===
          lowerAbbreviation.charAt(abbreviationIndex + 1)) ||
      (lowerAbbreviation.charAt(abbreviationIndex + 1) ===
        lowerAbbreviation.charAt(abbreviationIndex) &&
        lowerString.charAt(index - 1) !==
          lowerAbbreviation.charAt(abbreviationIndex))
    ) {
      transposedScore = commandScoreInner(
        string,
        abbreviation,
        lowerString,
        lowerAbbreviation,
        index + 1,
        abbreviationIndex + 2,
        memoizedResults
      )

      if (transposedScore * SCORE_TRANSPOSITION > score) {
        score = transposedScore * SCORE_TRANSPOSITION
      }
    }

    if (score > highScore) {
      highScore = score
    }

    index = lowerString.indexOf(abbreviationChar, index + 1)
  }

  memoizedResults[memoizeKey] = highScore
  return highScore
}

function formatInput(string) {
  return string.toLowerCase().replace(COUNT_SPACE_REGEXP, " ")
}

/**
 * Score `string` against a search `abbreviation`.
 *
 * @param {string} string    — the candidate (item value + keywords).
 * @param {string} abbreviation — the user's typed search.
 * @param {string[]} [aliases] — extra searchable text (keywords).
 * @returns {number} 0 (no match) to 1 (perfect match).
 */
export function commandScore(string, abbreviation, aliases) {
  if (!string || !abbreviation) return 0

  // Input-length cap: truncate to prevent stack overflow on pathological input.
  string = string.slice(0, MAX_LENGTH)
  abbreviation = abbreviation.slice(0, MAX_LENGTH)

  if (aliases && aliases.length > 0) {
    string = string + " " + aliases.join(" ")
  }

  return commandScoreInner(
    string,
    abbreviation,
    formatInput(string),
    formatInput(abbreviation),
    0,
    0,
    {}
  )
}
