export function canViewOfferDetails(userRole: "admin" | "user") {
  return userRole === "admin";
}
