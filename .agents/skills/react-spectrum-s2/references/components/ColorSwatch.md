# ColorSwatch

A ColorSwatch displays a preview of a selected color.

```tsx
import {ColorSwatch} from '@react-spectrum/s2/ColorSwatch';

<ColorSwatch />
```

## Value

A ColorSwatch displays a color value passed via the `color` prop. The value can be a string or `Color` object. When no color is provided or the color is transparent, a red slash will be displayed.

```tsx
import {ColorSwatch} from '@react-spectrum/s2/ColorSwatch';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<div className={style({display: 'flex', gap: 12, alignItems: 'center'})}>
  <ColorSwatch color="#ff6600" />
  <ColorSwatch color="rgb(255, 0, 255)" />
  <ColorSwatch color="hsl(120, 100%, 42%)" />
  <ColorSwatch color="rgba(0, 150, 255, 0.5)" />
  <ColorSwatch />
</div>
```

## Custom sizing

ColorSwatch can be resized using the `styles` prop.

```tsx
import {ColorSwatch} from '@react-spectrum/s2/ColorSwatch';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<ColorSwatch
  color="#10b981"
  styles={style({width: 80, height: 40})} />
```

## Accessibility

By default, ColorSwatch includes a localized color description for screen reader users (e.g. "dark vibrant blue"). Use the `colorName` prop to override this. Set an `aria-label` to provide additional context. In this example, a screen reader will announce "Fire truck red, Background color".

```tsx
import {ColorSwatch} from '@react-spectrum/s2/ColorSwatch';

<ColorSwatch
  color="#f00"
  aria-label="Background color"
  colorName="Fire truck red" />
```

## API

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `aria-describedby` | `string | undefined` | — | Identifies the element (or elements) that describes the object. |
| `aria-details` | `string | undefined` | — | Identifies the element (or elements) that provide a detailed, extended description for the object. |
| `aria-label` | `string | undefined` | — | Defines a string value that labels the current element. |
| `aria-labelledby` | `string | undefined` | — | Identifies the element (or elements) that labels the current element. |
| `color` | `string | Color | undefined` | — | The color value to display in the swatch. |
| `colorName` | `string | undefined` | — | A localized accessible name for the color. By default, a description is generated from the color value, but this can be overridden if you have a more specific color name (e.g. Pantone colors). |
| `id` | `string | undefined` | — | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `rounding` | `"none" | "default" | "full" | undefined` | 'default' | The corner rounding of the ColorSwatch. |
| `size` | `"S" | "M" | "L" | "XS" | undefined` | 'M' | The size of the ColorSwatch. |
| `slot` | `string | null | undefined` | — | A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent. |
| `styles` | `StylesPropWithHeight | undefined` | — | Spectrum-defined styles, returned by the `style()` macro. |
| `UNSAFE_className` | `UnsafeClassName | undefined` | — | Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
| `UNSAFE_style` | `CSSProperties | undefined` | — | Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |

## Related Types

### Color
