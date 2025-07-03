import { format, isToday, isYesterday, differenceInDays } from "date-fns";


export function formatMessageTime(dateString: string) {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return "Yesterday, " + format(date, "h:mm a");
  } else if (differenceInDays(new Date(), date) <= 6) {
    return format(date, "EEEE, MMM d" ); // e.g., "Monday"
  } else {
    return format(date, "MMM d, yyyy"); // e
  }
}
