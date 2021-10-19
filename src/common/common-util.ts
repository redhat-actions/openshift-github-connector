export type Stringable = { toString(): string };

// these map to Bootstrap and PF colours
export type Severity = "success" | "info" | "warning" | "danger";

/**
 * Joins a string array into a user-friendly list.
 * Eg, `joinList([ "tim", "erin", "john" ], "and")` => "tim, erin and john"
 */
export function joinList(strings_: readonly string[], andOrOr: "and" | "or" = "and"): string {
  // we have to duplicate "strings" here since we modify the array below and it's passed by reference
  const strings = Array.from(strings_).filter((s) => {
    if (!s) {
      return false;
    }
    return true;
  });

  // separate the last string from the others since we have to prepend andOrOr to it
  const lastString = strings.splice(strings.length - 1, 1)[0];

  let joined = strings.join(", ");
  if (strings.length > 0) {
    joined = `${joined} ${andOrOr} ${lastString}`;
  }
  else {
    joined = lastString;
  }
  return joined;
}

function getMonthName(monthOneBasedIndex: number, shortForm: boolean): string {
  const longNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];
  const shortNames = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
  ];

  if (shortForm) {
    return shortNames[monthOneBasedIndex];
  }
  return longNames[monthOneBasedIndex];
}

function get24hTime(fromDate: Date): string {
  let minutes = fromDate.getMinutes().toString();
  if (minutes.length === 1) {
    minutes = "0" + minutes;
  }
  return fromDate.getHours() + ":" + minutes;
}

export function getFriendlyDateTime(dateToFormat: Date, showTime_: boolean = false): string {
  let date: string;
  let showTime = showTime_;

  const today = new Date();
  if (dateToFormat.getDate() === today.getDate()) {
    date = "Today";
    const minutesAgo = (today.getHours() - dateToFormat.getHours()) * 60
      + (today.getMinutes() - dateToFormat.getMinutes());

    if (minutesAgo === 0) {
      return `Just now at ${get24hTime(dateToFormat)}`;
    }
    else if (minutesAgo < 60) {
      return `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago at ${get24hTime(dateToFormat)}`;
    }
    showTime = true;
  }
  else if (dateToFormat.getDate() === today.getDate() - 1) {
    date = "Yesterday";
    showTime = true;
  }
  else if (dateToFormat.getFullYear() === today.getFullYear()) {
    date = `${dateToFormat.getDate()} ${getMonthName(dateToFormat.getMonth(), false)}`;
  }
  else {
    date = `${dateToFormat.getDate()} ${getMonthName(dateToFormat.getMonth(), false)}, ${dateToFormat.getFullYear()}`;
  }

  if (showTime) {
    return `${date} at ${get24hTime(dateToFormat)}`;
  }
  return date;
}

// eslint-disable-next-line quotes
const BANNED_CHARS = '<>"^`{|';

export function containsBannedCharacters(s: string, allowSpaces: boolean = false): boolean {
  const banned = BANNED_CHARS + (allowSpaces ? "" : " ");

  const bannedRx = new RegExp(`[${banned}]`);
  return bannedRx.test(s);
}

export function removeUndefined<I>(array: Array<I | undefined>): Array<I> {
  return array.reduce((acc: Array<I>, item) => {
    if (item != null) {
      acc.push(item);
    }
    return acc;
  }, []);
}

/**
 * Do our best to transform the given string into a valid k8s resource name.
 * Note that since it strips characters, names that were unique before may not be unique after this change.
 */
export function toValidK8sName(rawName: string): string {
  // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names

  let cookedName = rawName;
  const maxLength = 253;
  if (rawName.length > maxLength) {
    cookedName = rawName.substring(0, maxLength - 1);
  }

  cookedName = cookedName.toLowerCase();
  cookedName = cookedName.replace(/[\s/.]/g, "-");
  cookedName = cookedName.replace(/[^a-z0-9-_]/g, "-");

  const alphaNumRx = /[a-z0-9]/;

  if (!alphaNumRx.test(cookedName[0])) {
    cookedName = "0" + cookedName;
  }
  if (!alphaNumRx.test(cookedName[cookedName.length - 1])) {
    cookedName += "0";
  }

  return cookedName;
}

export function uppercaseFirstChar(s: string): string {
  return s.charAt(0).toUpperCase() + s.substring(1);
}

interface ValidatePathOptions {
  allowEmpty: boolean,
  filenameOnly: boolean,
}

/**
 *
 * @returns An error message if the basename is illegal, or undefined if it is legal.
 */
export function validatePath(
  pathInput: string,
  options: ValidatePathOptions,
): string | undefined {
  try {
    if (pathInput.length === 0 && !options.allowEmpty) {
      return "Cannot be empty.";
    }

    let illegalsRx;
    if (options.filenameOnly) {
      illegalsRx = /([\\/<>:"*|]).*/g;
    }
    else {
      illegalsRx = /([<>:"*|]).*/g;
    }

    const match = illegalsRx.exec(pathInput);
    if (match != null && match.length > 1) {
      return `Illegal character "${match[1]}" in input.`;
    }
  }
  catch (err) {
    return err.message;
  }

  return undefined;
}
