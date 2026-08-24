/** Shared country list for Discover filters and Edit Profile. */
export const COUNTRY_OPTIONS = [
  "United States", "United Kingdom", "Germany", "France", "Brazil",
  "India", "Saudi Arabia", "Egypt", "Nigeria", "South Africa", "China", "Japan",
  "South Korea", "Turkey", "Sweden", "Denmark", "Netherlands", "Spain", "Italy",
  "Canada", "Australia", "Indonesia", "Thailand", "Vietnam", "Pakistan", "Kenya",
  "Ghana", "Morocco", "United Arab Emirates", "Mexico", "Argentina", "Colombia",
  "Chile", "Peru", "Russia", "Poland", "Greece", "Portugal", "Belgium",
  "Switzerland", "Austria", "Ireland", "Finland", "Czech Republic", "Hungary",
  "Singapore", "Malaysia", "Philippines", "Bangladesh", "Iran", "Iraq", "Syria", "Yemen",
] as const;

export type CountryOption = (typeof COUNTRY_OPTIONS)[number];

export function isCountryOption(value: string): value is CountryOption {
  return (COUNTRY_OPTIONS as readonly string[]).includes(value);
}
