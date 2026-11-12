# Vendored Untitled UI React components

The files in this folder, except `styles/tsepo-theme.css`, are copied from
the open-source Untitled UI React starter kit (untitledui CLI 0.1.69,
https://www.untitledui.com/react), licensed under the MIT licence. They are
kept as copied so they can be compared with upstream. Changes made for
Tšepo are listed below.

- `application/app-navigation/base-components/mobile-header.tsx`: takes the
  logo as a prop (the Tšepo mark) instead of the Untitled UI logo, and has no
  background blur.
- `application/modals/modal.tsx`: no background blur behind the overlay.
- `application/app-navigation/base-components/nav-item.tsx`: items sit on the
  sidebar tone (transparent, tinted when hovered or selected) instead of white.
- `providers/router-provider.tsx` and `foundations/social-icons/github.tsx` are
  copied unchanged.
- `base/avatar/utils.ts` and `base/buttons/button.tsx`: two one-line fixes so
  they pass our strict TypeScript settings.
- Unused variants (OTP, tag, payment and integration inputs and dropdowns,
  app store and social buttons) were not copied.

`styles/tsepo-theme.css` is ours: it replaces the Untitled UI fonts and
colours with the Tšepo tokens.
