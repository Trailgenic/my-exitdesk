import { redirect } from "next/navigation";

// The previous PaymentElement flow called a nonexistent create-intent route.
// Preserve the legacy URL by sending visitors to the existing canonical checkout.
// Do not forward email or intake answers from the legacy query string.
export default function LegacyCheckoutPage() {
  redirect("https://www.mikeye.com/exit/checkout");
}
