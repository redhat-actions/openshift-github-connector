export type Stringable = { toString(): string };

// these map to Bootstrap colours
export type Severity = "success" | "info" | "warning" | "danger";

export const STARTER_WORKFLOW = {
  raw: "https://raw.githubusercontent.com/actions/starter-workflows/main/ci/openshift.yml",
  htmlFile: "https://github.com/actions/starter-workflows/blob/main/ci/openshift.yml",

  blog: "https://www.openshift.com/blog/deploying-to-openshift-using-github-actions",
  youtube: "https://www.youtube.com/watch?v=6hgBO-1pKho",
};

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

export function getFriendlyDateTime(dateToFormat: Date): string {
  let date: string;
  let showTime = false;

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
