/**
 * BetterBee — Clerk Minimal Theme Tokens.
 *
 * Clean, human-designed, minimal dark theme matching the workspace UI.
 */

import { dark } from "@clerk/themes";

export const clerkTheme = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#d48b38",
    colorBackground: "#17181f",
    colorText: "#f4f4f6",
    colorTextSecondary: "#8b8e9b",
    colorInputBackground: "#121317",
    colorInputText: "#f4f4f6",
    colorNeutral: "#262833",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "bg-[#17181f] border border-[#262833] rounded-xl p-6 sm:p-7 w-full shadow-xs",
    headerTitle: "text-lg font-medium text-[#f4f4f6] tracking-tight",
    headerSubtitle: "text-xs text-[#8b8e9b]",
    socialButtonsBlockButton:
      "bg-[#1e202b] border border-[#363a4d] hover:bg-[#262938] hover:border-[#4a5068] text-[#f4f4f6] transition-colors text-xs font-medium py-2.5 rounded-lg",
    socialButtonsBlockButtonText: "text-[#f4f4f6] font-medium text-xs",
    socialButtonsBlockButtonArrow: "text-[#8b8e9b]",
    socialButtonsIconButton:
      "bg-[#1e202b] border border-[#363a4d] hover:bg-[#262938] hover:border-[#4a5068] text-[#f4f4f6] transition-colors rounded-lg",
    dividerLine: "bg-[#262833]",
    dividerText: "text-[11px] font-mono text-[#6c6f80] bg-[#17181f] px-2",
    formButtonPrimary:
      "bg-[#f4f4f6] hover:bg-white text-[#121316] font-medium text-xs py-2.5 rounded-lg transition-colors cursor-pointer",
    formFieldLabel: "text-xs font-normal text-[#c8cbdb]",
    formFieldInput:
      "bg-[#121317] border border-[#262833] text-[#f4f4f6] text-xs rounded-lg placeholder:text-[#5a5d6c] focus:border-[#d48b38] focus:ring-0 transition-colors h-9 px-3",
    formFieldAction: "text-xs text-[#d48b38] hover:text-[#e5a04e]",
    footerActionText: "text-xs text-[#8b8e9b]",
    footerActionLink: "text-xs font-normal text-[#d48b38] hover:underline",
    footer: "bg-transparent border-t border-[#23252d] mt-4 pt-4",
    identityPreviewText: "text-[#f4f4f6] text-xs",
    identityPreviewEditButton: "text-[#d48b38] hover:text-[#e5a04e] text-xs",
    formResendCodeLink: "text-[#d48b38] hover:text-[#e5a04e] text-xs",
    alert: "bg-[#1f1614] border border-[#3d261e] text-[#f4f4f6] text-xs rounded-lg",
    alertText: "text-xs text-[#eaebee]",
  },
};
