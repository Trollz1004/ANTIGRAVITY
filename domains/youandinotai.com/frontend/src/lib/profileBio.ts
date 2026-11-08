/**
 * Profile bio display helpers.
 *
 * ProfileSetup stores a member's profile answer inside the bio text as its
 * own paragraph that starts with STORED_PROFILE_ANSWER_KEY. That key is a
 * storage detail: it stays exactly as it is so every existing profile keeps
 * parsing. Members and visitors only ever see DISPLAY_PROFILE_ANSWER_LABEL
 * (ruling from Josh, 2026-11-07).
 */
export const STORED_PROFILE_ANSWER_KEY = 'Prompt: ';
export const DISPLAY_PROFILE_ANSWER_LABEL = 'Profile answer: ';

/** Returns the bio as members should read it, with the stored key relabelled. */
export function formatBioForDisplay(bio: string): string {
  return bio
    .split('\n')
    .map(line => {
      const indent = line.length - line.trimStart().length;
      const body = line.slice(indent);
      if (!body.startsWith(STORED_PROFILE_ANSWER_KEY)) return line;
      return (
        line.slice(0, indent) +
        DISPLAY_PROFILE_ANSWER_LABEL +
        body.slice(STORED_PROFILE_ANSWER_KEY.length)
      );
    })
    .join('\n');
}
