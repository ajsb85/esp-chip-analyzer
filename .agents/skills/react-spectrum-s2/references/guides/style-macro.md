# Style Macro

The `style` macro supports a constrained set of values per property that conform to Spectrum 2.

## Colors

All Spectrum 2 color tokens are available across color properties (e.g., `backgroundColor`, `color`, `borderColor`).

| Property | Values |
|---------|--------|
| `backgroundColor` | `accent`, `accent-subtle`, `neutral`, `neutral-subdued`, `neutral-subtle`, `negative`, `negative-subtle`, `informative`, `informative-subtle`, `positive`, `positive-subtle`, `notice`, `notice-subtle`, `gray`, `gray-subtle`, `red`, `red-subtle`, `orange`, `orange-subtle`, `yellow`, `yellow-subtle`, `chartreuse`, `chartreuse-subtle`, `celery`, `celery-subtle`, `green`, `green-subtle`, `seafoam`, `seafoam-subtle`, `cyan`, `cyan-subtle`, `blue`, `blue-subtle`, `indigo`, `indigo-subtle`, `purple`, `purple-subtle`, `fuchsia`, `fuchsia-subtle`, `magenta`, `magenta-subtle`, `pink`, `pink-subtle`, `turquoise`, `turquoise-subtle`, `cinnamon`, `cinnamon-subtle`, `brown`, `brown-subtle`, `silver`, `silver-subtle`, `disabled`, `base`, `layer-1`, `layer-2`, `pasteboard`, `elevated`, `black`, `white`, `baseColors` |
| `borderColor` | `negative`, `disabled`, `black`, `white`, `baseColors` |
| `color` | `accent`, `neutral`, `neutral-subdued`, `negative`, `disabled`, `heading`, `title`, `body`, `detail`, `code`, `auto`, `black`, `white`, `baseColors` |
| `fill` | `none`, `currentColor`, `accent`, `neutral`, `negative`, `informative`, `positive`, `notice`, `gray`, `red`, `orange`, `yellow`, `chartreuse`, `celery`, `green`, `seafoam`, `cyan`, `blue`, `indigo`, `purple`, `fuchsia`, `magenta`, `pink`, `turquoise`, `cinnamon`, `brown`, `silver`, `black`, `white`, `baseColors` |
| `outlineColor` | `focus-ring`, `black`, `white`, `baseColors` |
| `stroke` | `none`, `currentColor`, `black`, `white`, `baseColors` |

## Dimensions

| Property | Values |
|---------|--------|
| `aspectRatio` | `auto`, `square`, `video`, `number / number` |
| `borderBottomWidth` | `0`, `1`, `2`, `4` |
| `borderEndWidth` | `0`, `1`, `2`, `4` |
| `borderSpacing` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `borderStartWidth` | `0`, `1`, `2`, `4` |
| `borderStyle` | `solid`, `dashed`, `dotted`, `double`, `hidden`, `none` |
| `borderTopWidth` | `0`, `1`, `2`, `4` |
| `borderWidth` | `0`, `1`, `2`, `4` |
| `borderXWidth` | `0`, `1`, `2`, `4` |
| `borderYWidth` | `0`, `1`, `2`, `4` |
| `bottom` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `columnGap` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `containIntrinsicHeight` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `containIntrinsicWidth` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `flexBasis` | `auto`, `full`, `number`, `lengthPercentage` |
| `gap` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `height` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `inset` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `insetEnd` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `insetStart` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `insetX` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `insetY` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `left` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `margin` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `marginBottom` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `marginEnd` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `marginStart` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `marginTop` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `marginX` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `marginY` | `auto`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `maxHeight` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `none`, `number`, `lengthPercentage` |
| `maxSize` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `none`, `number`, `lengthPercentage` |
| `maxWidth` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `none`, `number`, `lengthPercentage` |
| `minHeight` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `minSize` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `minWidth` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `padding` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `paddingBottom` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `paddingEnd` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `paddingStart` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `paddingTop` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `paddingX` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `paddingY` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `position` | `absolute`, `fixed`, `relative`, `sticky`, `static` |
| `right` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `rotate` | `number`, `${number}deg`, `${number}rad`, `${number}grad`, `${number}turn` |
| `rowGap` | `text-to-control`, `text-to-visual`, `edge-to-text`, `pill`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scale` | `number`, `${number}%` |
| `scaleX` | `number`, `${number}%` |
| `scaleY` | `number`, `${number}%` |
| `scrollMargin` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollMarginBottom` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollMarginEnd` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollMarginStart` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollMarginTop` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollMarginX` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollMarginY` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPadding` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPaddingBottom` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPaddingEnd` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPaddingStart` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPaddingTop` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPaddingX` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `scrollPaddingY` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `size` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |
| `strokeWidth` | `0`, `1`, `2` |
| `textIndent` | `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `lengthPercentage` |
| `top` | `auto`, `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `transform` | `string` |
| `translate` | `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `translateX` | `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `translateY` | `full`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)`, `negativeSpacing (-2, -4, -8, -12, -16, -20, -24, -28, -32, -36, -40, -44, -48, -56, -64, -80, -96)`, `lengthPercentage` |
| `width` | `auto`, `full`, `min`, `max`, `fit`, `screen`, `number`, `lengthPercentage` |

## Text

Spectrum 2 typography can be applied via the `font` shorthand, which sets `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, and `color`. You can override any of these individually.
Note that `font` should be applied on a per element basis rather than globally so as to properly conform with Spectrum designs.

```tsx
<main>
  <h1 className={style({font: 'heading-xl'})}>Heading</h1>
  <p className={style({font: 'body'})}>Body</p>
  <ul className={style({font: 'body-sm', fontWeight: 'bold'})}>
    <li>List item</li>
  </ul>
</main>
```

| Property | Values |
|---------|--------|
| `boxDecorationBreak` | `slice`, `clone` |
| `font` | `ui-xs`, `ui-sm`, `ui`, `ui-lg`, `ui-xl`, `ui-2xl`, `ui-3xl`, `heading-2xs`, `heading-xs`, `heading-sm`, `heading`, `heading-lg`, `heading-xl`, `heading-2xl`, `heading-3xl`, `title-xs`, `title-sm`, `title`, `title-lg`, `title-xl`, `title-2xl`, `title-3xl`, `body-2xs`, `body-xs`, `body-sm`, `body`, `body-lg`, `body-xl`, `body-2xl`, `body-3xl`, `detail-sm`, `detail`, `detail-lg`, `detail-xl`, `code-xs`, `code-sm`, `code`, `code-lg`, `code-xl` |
| `fontFamily` | `sans`, `serif`, `code` |
| `fontSize` | `ui-xs`, `ui-sm`, `ui`, `ui-lg`, `ui-xl`, `ui-2xl`, `ui-3xl`, `heading-2xs`, `heading-xs`, `heading-sm`, `heading`, `heading-lg`, `heading-xl`, `heading-2xl`, `heading-3xl`, `title-xs`, `title-sm`, `title`, `title-lg`, `title-xl`, `title-2xl`, `title-3xl`, `body-2xs`, `body-xs`, `body-sm`, `body`, `body-lg`, `body-xl`, `body-2xl`, `body-3xl`, `detail-sm`, `detail`, `detail-lg`, `detail-xl`, `code-xs`, `code-sm`, `code`, `code-lg`, `code-xl` |
| `fontWeight` | `normal`, `medium`, `bold`, `extra-bold`, `black`, `heading`, `title`, `detail` |
| `hyphens` | `none`, `manual`, `auto` |
| `lineClamp` | `number` |
| `lineHeight` | `ui`, `heading`, `title`, `body`, `detail`, `code` |
| `listStylePosition` | `inside`, `outside` |
| `listStyleType` | `none`, `disc`, `decimal` |
| `overflowWrap` | `normal`, `anywhere`, `break-word` |
| `textAlign` | `start`, `center`, `end`, `justify` |
| `textDecoration` | `none`, `underline`, `overline`, `line-through` |
| `textOverflow` | `ellipsis`, `clip` |
| `textTransform` | `uppercase`, `lowercase`, `capitalize`, `none` |
| `textWrap` | `wrap`, `nowrap`, `balance`, `pretty` |
| `truncate` | `boolean` |
| `verticalAlign` | `baseline`, `top`, `middle`, `bottom`, `text-top`, `text-bottom`, `sub`, `super` |
| `whiteSpace` | `normal`, `nowrap`, `pre`, `pre-line`, `pre-wrap`, `break-spaces` |
| `wordBreak` | `normal`, `break-all`, `keep-all`, `break-word` |

## Effects

| Property | Values |
|---------|--------|
| `animation` | `string` |
| `animationDelay` | `string`, `number` |
| `animationDirection` | `normal`, `reverse`, `alternate`, `alternate-reverse` |
| `animationDuration` | `string`, `number` |
| `animationFillMode` | `none`, `forwards`, `backwards`, `both` |
| `animationIterationCount` | `string`, `number` |
| `animationPlayState` | `paused`, `running` |
| `animationTimingFunction` | `default`, `linear`, `in`, `out`, `in-out` |
| `backgroundAttachment` | `fixed`, `local`, `scroll` |
| `backgroundBlendMode` | `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity` |
| `backgroundClip` | `border-box`, `padding-box`, `content-box`, `text` |
| `backgroundImage` | `string`, `LinearGradient` |
| `backgroundOrigin` | `border-box`, `padding-box`, `content-box` |
| `backgroundPosition` | `bottom`, `center`, `left`, `left bottom`, `left top`, `right`, `right bottom`, `right top`, `top` |
| `backgroundRepeat` | `repeat`, `no-repeat`, `repeat-x`, `repeat-y`, `round`, `space` |
| `backgroundSize` | `auto`, `cover`, `contain` |
| `borderBottomEndRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderBottomRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderBottomStartRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderEndRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderStartRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderTopEndRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderTopRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `borderTopStartRadius` | `none`, `sm`, `default`, `lg`, `xl`, `full`, `pill` |
| `boxShadow` | `emphasized`, `elevated`, `dragged`, `none` |
| `colorScheme` | `light`, `dark`, `light dark` |
| `filter` | `emphasized`, `elevated`, `dragged`, `none` |
| `forcedColorAdjust` | `auto`, `none` |
| `mixBlendMode` | `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity`, `plus-darker`, `plus-lighter` |
| `opacity` | `number` |
| `outlineOffset` | `number` |
| `outlineStyle` | `none`, `solid`, `dashed`, `dotted`, `double`, `inset` |
| `outlineWidth` | `0`, `1`, `2`, `4` |
| `transition` | `default`, `colors`, `opacity`, `shadow`, `transform`, `all`, `none` |
| `transitionDelay` | `string`, `number` |
| `transitionDuration` | `string`, `number` |
| `transitionTimingFunction` | `default`, `linear`, `in`, `out`, `in-out` |

## Layout

| Property | Values |
|---------|--------|
| `alignContent` | `normal`, `center`, `start`, `end`, `space-between`, `space-around`, `space-evenly`, `baseline`, `stretch` |
| `alignItems` | `start`, `end`, `center`, `baseline`, `stretch` |
| `alignSelf` | `auto`, `start`, `end`, `center`, `stretch`, `baseline` |
| `borderCollapse` | `collapse`, `separate` |
| `boxSizing` | `border-box`, `content-box` |
| `breakAfter` | `auto`, `avoid`, `all`, `avoid-page`, `page`, `left`, `right`, `column` |
| `breakBefore` | `auto`, `avoid`, `all`, `avoid-page`, `page`, `left`, `right`, `column` |
| `breakInside` | `auto`, `avoid`, `avoid-page`, `avoid-column` |
| `captionSide` | `top`, `bottom` |
| `clear` | `inline-start`, `inline-end`, `left`, `right`, `both`, `none` |
| `contain` | `none`, `strict`, `content`, `size`, `inline-size`, `layout`, `style`, `paint` |
| `display` | `block`, `inline-block`, `inline`, `flex`, `inline-flex`, `grid`, `inline-grid`, `contents`, `list-item`, `none` |
| `flexDirection` | `row`, `column`, `row-reverse`, `column-reverse` |
| `flexGrow` | `number` |
| `flexShrink` | `number` |
| `flexWrap` | `wrap`, `wrap-reverse`, `nowrap` |
| `float` | `inline-start`, `inline-end`, `right`, `left`, `none` |
| `gridArea` | `string` |
| `gridAutoColumns` | `auto`, `min-content`, `max-content`, `${number}fr`, `minmax(${string}, ${string})`, `string`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `gridAutoFlow` | `row`, `column`, `dense`, `row dense`, `column dense` |
| `gridAutoRows` | `auto`, `min-content`, `max-content`, `${number}fr`, `minmax(${string}, ${string})`, `string`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `gridColumnEnd` | `string` |
| `gridColumnStart` | `string` |
| `gridRowEnd` | `string` |
| `gridRowStart` | `string` |
| `gridTemplateAreas` | `string[]` |
| `gridTemplateColumns` | `auto`, `min-content`, `max-content`, `${number}fr`, `minmax(${string}, ${string})`, `none`, `subgrid`, `string`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `gridTemplateRows` | `auto`, `min-content`, `max-content`, `${number}fr`, `minmax(${string}, ${string})`, `none`, `subgrid`, `string`, `baseSpacing (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96)` |
| `justifyContent` | `normal`, `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly`, `stretch` |
| `justifyItems` | `start`, `end`, `center`, `stretch` |
| `justifySelf` | `auto`, `start`, `end`, `center`, `stretch` |
| `order` | `number` |
| `overflow` | `auto`, `hidden`, `clip`, `visible`, `scroll` |
| `overflowX` | `auto`, `hidden`, `clip`, `visible`, `scroll` |
| `overflowY` | `auto`, `hidden`, `clip`, `visible`, `scroll` |
| `overscrollBehavior` | `auto`, `contain`, `none` |
| `overscrollBehaviorX` | `auto`, `contain`, `none` |
| `overscrollBehaviorY` | `auto`, `contain`, `none` |
| `placeContent` | `normal`, `center`, `start`, `end`, `space-between`, `space-around`, `space-evenly`, `stretch` |
| `placeItems` | `start`, `end`, `center`, `stretch` |
| `placeSelf` | `auto`, `start`, `end`, `center`, `stretch` |
| `scrollBehavior` | `auto`, `smooth` |
| `tableLayout` | `auto`, `fixed` |

## Misc

| Property | Values |
|---------|--------|
| `appearance` | `none`, `auto` |
| `caretColor` | `auto`, `transparent` |
| `cursor` | `auto`, `default`, `pointer`, `wait`, `text`, `move`, `help`, `not-allowed`, `none`, `context-menu`, `progress`, `cell`, `crosshair`, `vertical-text`, `alias`, `copy`, `no-drop`, `grab`, `grabbing`, `all-scroll`, `col-resize`, `row-resize`, `n-resize`, `e-resize`, `s-resize`, `w-resize`, `ne-resize`, `nw-resize`, `se-resize`, `ew-resize`, `ns-resize`, `nesw-resize`, `nwse-resize`, `zoom-in`, `zoom-out` |
| `disableTapHighlight` | `true` |
| `isolation` | `isolate`, `auto` |
| `objectFit` | `contain`, `cover`, `fill`, `none`, `scale-down` |
| `objectPosition` | `bottom`, `center`, `left`, `left bottom`, `left top`, `right`, `right bottom`, `right top`, `top` |
| `pointerEvents` | `none`, `auto` |
| `resize` | `none`, `vertical`, `horizontal`, `both` |
| `scrollSnapAlign` | `start`, `end`, `center`, `none` |
| `scrollSnapStop` | `normal`, `always` |
| `scrollSnapType` | `x`, `y`, `both`, `x mandatory`, `y mandatory`, `both mandatory` |
| `touchAction` | `auto`, `none`, `pan-x`, `pan-y`, `manipulation`, `pinch-zoom` |
| `transformOrigin` | `center`, `top`, `top right`, `right`, `bottom right`, `bottom`, `bottom left`, `left` |
| `unicodeBidi` | `normal`, `embed`, `bidi-override`, `isolate`, `isolate-override`, `plaintext` |
| `userSelect` | `none`, `text`, `all`, `auto` |
| `visibility` | `visible`, `hidden`, `collapse` |
| `willChange` | `auto`, `scroll-position`, `contents`, `transform` |
| `zIndex` | `number` |

## Conditions

| Property | Values |
|---------|--------|
| `forcedColors` | `@media (forced-colors: active)` |
| `touch` | `@media not ((hover: hover) and (pointer: fine))` |
| `sm` | `@media (min-width: ${pxToRem(640)})` |
| `md` | `@media (min-width: ${pxToRem(768)})` |
| `lg` | `@media (min-width: ${pxToRem(1024)})` |
| `xl` | `@media (min-width: ${pxToRem(1280)})` |
| `2xl` | `@media (min-width: ${pxToRem(1536)})` |

## Utilities

The style macro system provides built-in utility functions for common patterns.

### baseColor

Returns a set of stateful color token references for the default, hovered, focus-visible,
and pressed states of a component.

```tsx
import {baseColor, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  backgroundColor: baseColor('gray-100')
});
```

### color

Resolves a Spectrum color token name to a CSS color value string.
Supports opacity modifiers via the `color/opacity` syntax.

```tsx
import {color, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  color: color('gray-800'),
  borderColor: color('accent-900/50')
});
```

### lightDark

Produces a `light-dark()` CSS color value that resolves to different colors
depending on the current color scheme.

```tsx
import {lightDark, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  backgroundColor: lightDark('gray-25', 'gray-900')
});
```

### colorMix

Mixes two Spectrum colors by a given percentage using CSS `color-mix()` in sRGB color space.

```tsx
import {colorMix, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  backgroundColor: colorMix('accent-900', 'gray-25', 50)
});
```

### size

Converts a pixel value to a scalable CSS size expression using the Spectrum 2 scale factor.
The result is a `calc()` expression that multiplies the rem-converted value by the current scale factor.
The scale factor differs between touch and non-touch devices.

```tsx
import {size, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  width: size(200),
  height: size(48)
});
```

### space

Converts a pixel value to a Spectrum spacing token in `rem` units.

```tsx
import {space, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  gap: space(12) // 12/16 = 0.75rem
});
```

### fontRelative

Converts a pixel value to a font-relative `em` length. Useful for sizing elements
relative to the current font size. Defaults to a 14px base.

```tsx
import {fontRelative, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  gap: fontRelative(2)  // 2/14 = ~0.143em
});
```

### focusRing

Returns consistent Spectrum focus ring outline styles for interactive components.

```tsx
import {focusRing, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  ...focusRing(),
  borderRadius: 'lg'
});
```

### iconStyle

Generates styles for an icon element with the given size, color, and layout options.
Must be imported with `{type: 'macro'}`.

```tsx
import {iconStyle} from '@react-spectrum/s2/style' with {type: 'macro'};
import Edit from '@react-spectrum/s2/icons/Edit';

<Edit styles={iconStyle({size: 'XL', color: 'positive'})} />
```

See the [Icons](icons.md#api) page for more information.

### css

Injects a raw CSS string into the style system. The CSS is wrapped in a generated
class name and placed within the specified `@layer`. Returns the generated class name.
This is an escape hatch for advanced cases (e.g. pseudo selectors or features not yet
available in the style macro API), and should be used sparingly.
Must be imported with `{type: 'macro'}`.

```tsx
import {css} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = css(`
  backdrop-filter: blur(8px);
`);
```

### mergeStyles

Merges multiple style strings together, combining the CSS properties from each.
Later styles take precedence over earlier ones for the same property.
Useful for composing styles from multiple `style()` macro calls.

```tsx
import {mergeStyles} from '@react-spectrum/s2';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

const baseStyles = style({padding: 8});
const overrideStyles = style({padding: 16, color: 'heading'});
const merged = mergeStyles(baseStyles, overrideStyles);
// merged has `padding: 16` and `color: heading`.
```

### centerPadding

Calculates vertical padding to center a single line of text within a container.
Uses the CSS `self()` function and `1lh` unit to compute the padding based on
the container's minimum height and border widths.
This is useful for precise vertical centering without introducing a flex/grid layout to the container.

```tsx
import {centerPadding, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  paddingY: centerPadding()
});
```

### setColorScheme

Returns style properties that set the CSS `color-scheme` for a component.
Defaults to the page's color scheme and supports `'light'`, `'dark'`, and `'light dark'` values
via the `colorScheme` render prop condition.
Intended for root containers (e.g. providers, modals, and popovers), and not needed for individual components.

```tsx
import {setColorScheme, style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  ...setColorScheme(),
  backgroundColor: 'layer-1'
});
```
