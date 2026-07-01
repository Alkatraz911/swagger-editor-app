/** Routes that require authentication. Guests are redirected to the Main page. */
export const PRIVATE_ROUTES = ["/history"] as const;

export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
