import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../messages/en.json";
import ruMessages from "../../messages/ru.json";

const messagesByLocale: Record<string, typeof enMessages> = {
  en: enMessages,
  ru: ruMessages,
};

type RenderWithIntlOptions = {
  locale?: string;
};

/** Renders a component wrapped in the i18n provider with the given locale's messages. */
export function renderWithIntl(
  ui: ReactElement,
  options: RenderWithIntlOptions = {},
) {
  let currentLocale = options.locale ?? "en";

  function IntlWrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={currentLocale}
        messages={messagesByLocale[currentLocale] ?? enMessages}
      >
        {children}
      </NextIntlClientProvider>
    );
  }

  const result = render(ui, { wrapper: IntlWrapper });

  return {
    ...result,
    rerenderWithLocale: (
      nextUi: ReactElement,
      nextOptions: RenderWithIntlOptions = {},
    ) => {
      if (nextOptions.locale) {
        currentLocale = nextOptions.locale;
      }
      result.rerender(nextUi);
    },
  };
}
