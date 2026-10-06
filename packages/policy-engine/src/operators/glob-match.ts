function escapeRegexCharacter(character: string): string {
  const regexSpecialCharacters = "\\^$.*+?()[]{}|";

  return regexSpecialCharacters.includes(character) ? `\\${character}` : character;
}

export function globMatch(actual: string, pattern: string): boolean {
  let regexPattern = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern.charAt(index);

    if (character === "*") {
      const nextCharacter = pattern.charAt(index + 1);

      if (nextCharacter === "*") {
        regexPattern += ".*";
        index += 1;
      } else {
        regexPattern += "[^/]*";
      }

      continue;
    }

    regexPattern += escapeRegexCharacter(character);
  }

  regexPattern += "$";

  return new RegExp(regexPattern).test(actual);
}
