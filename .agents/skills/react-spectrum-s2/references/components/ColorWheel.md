# ColorWheel

A ColorWheel allows users to adjust the hue of an HSL or HSB color value on a circular track.

```tsx
import {ColorWheel} from '@react-spectrum/s2/ColorWheel';

<ColorWheel />
```

## Value

Use the `value` or `defaultValue` prop to set the color value. The value may be a string or `Color` object, parsed using the `parseColor` function.

The `onChange` event is called as the user drags, and `onChangeEnd` is called when the thumb is released. These are always called with a `Color` object.

```tsx
import {ColorWheel} from '@react-spectrum/s2/ColorWheel';
import {useState} from 'react';
import {parseColor} from '@react-stately/color';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

function Example() {
  let [currentValue, setCurrentValue] = useState(parseColor('hsl(50, 100%, 50%)'));
  let [finalValue, setFinalValue] = useState(currentValue);

  return (
    <>
      <ColorWheel
        /*- begin highlight -*/
        value={currentValue}
        onChange={setCurrentValue}
        onChangeEnd={setFinalValue} />
        {/*- end highlight -*/}
      <pre className={style({font: 'body'})}>
        onChange value: {currentValue.toString('hex')}{'\n'}
        onChangeEnd value: {finalValue.toString('hex')}
      </pre>
    </>
  );
}
```

{/* ## Integration

ColorWheel works well alongside other color components to create complete color picking experiences.

```tsx render hideImports
"use client";
import {ColorWheel, ColorSlider, ColorSwatch} from '@react-spectrum/s2';
import {useState} from 'react';

function Example() {
  let [color, setColor] = useState('hsl(30, 80%, 60%)');

  return (
    <div style={{display: 'flex', gap: 20, alignItems: 'center'}}>
      <ColorWheel
        value={color}
        onChange={setColor} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <ColorSlider
          label="Saturation"
          channel="saturation"
          value={color}
          onChange={setColor} />
        <ColorSlider
          label="Lightness"
          channel="lightness"
          value={color}
          onChange={setColor} />
        <ColorSwatch color={color} size="L" />
      </div>
    </div>
  );
}
``` */}

## API

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `aria-describedby` | `string | undefined` | — | Identifies the element (or elements) that describes the object. |
| `aria-details` | `string | undefined` | — | Identifies the element (or elements) that provide a detailed, extended description for the object. |
| `aria-label` | `string | undefined` | — | Defines a string value that labels the current element. |
| `aria-labelledby` | `string | undefined` | — | Identifies the element (or elements) that labels the current element. |
| `defaultValue` | `string | Color | undefined` | 'hsl(0, 100%, 50%)' | The default value (uncontrolled). |
| `form` | `string | undefined` | — | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `id` | `string | undefined` | — | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `isDisabled` | `boolean | undefined` | — | Whether the ColorWheel is disabled. |
| `name` | `string | undefined` | — | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `onChange` | `((value: Color) => void) | undefined` | — | Handler that is called when the value changes, as the user drags. |
| `onChangeEnd` | `((value: Color) => void) | undefined` | — | Handler that is called when the user stops dragging. |
| `size` | `number | undefined` | 192 |  |
| `slot` | `string | null | undefined` | — | A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent. |
| `styles` | `StylesProp | undefined` | — | Spectrum-defined styles, returned by the `style()` macro. |
| `UNSAFE_className` | `UnsafeClassName | undefined` | — | Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
| `UNSAFE_style` | `CSSProperties | undefined` | — | Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
| `value` | `string | Color | undefined` | — | The current value (controlled). |

## Related Types

### Color

### parseColor

`parseColor(value: string): IColor`

Parses a color from a string value. Throws an error if the string could not be parsed.
