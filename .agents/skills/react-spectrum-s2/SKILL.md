---
name: "react-spectrum-s2"
description: "Build accessible UI components with React Spectrum S2 (Spectrum 2). Use when developers mention React Spectrum, Spectrum 2, S2, @react-spectrum/s2, or Adobe design system components. Provides documentation for buttons, forms, dialogs, tables, date/time pickers, color pickers, and other accessible components."
license: "Apache-2.0"
compatibility: "Requires a React project with @react-spectrum/s2 installed."
metadata:
  author: "Adobe"
  website: "https://react-spectrum.adobe.com/"
---

# React Spectrum S2 (Spectrum 2)

React Spectrum S2 is Adobe's implementation of the Spectrum 2 design system in React. It provides a collection of accessible, adaptive, and high-quality UI components.

If the requirements do not clearly specify which React Spectrum component to use, consult the [Component Decision Tree](references/guides/component-decision-tree.md) before choosing a component.

## Styling

Use React Spectrum S2 components and the S2 `style` macro as the default styling approach.

- Import the `style` macro using the `{type: 'macro'}` import attribute: `import {style} from '@react-spectrum/s2/style' with {type: 'macro'};`
- Remember that the `style` macro runs at build time and returns class names.
- Avoid introducing Tailwind, `radix-ui`, `shadcn/ui`, or any other third-party design system components in S2 implementations.
- Prefer S2 components first, and use their `styles` prop only for the supported layout-style properties.
- For generic layouts (flex, grid, etc.), use native HTML elements with the `style` macro.
- For card-style layouts, use the S2 `Card` component instead of building something custom.
- IMPORTANT: Avoid using the `UNSAFE_style` and `UNSAFE_className` props.

For React Spectrum components, the `styles` prop is intentionally limited. Supported properties are:

- `margin`, `marginStart`, `marginEnd`, `marginTop`, `marginBottom`, `marginX`, `marginY`
- `width`, `minWidth`, `maxWidth`
- `flexGrow`, `flexShrink`, `flexBasis`
- `justifySelf`, `alignSelf`, `order`
- `gridArea`, `gridRow`, `gridRowStart`, `gridRowEnd`, `gridColumn`, `gridColumnStart`, `gridColumnEnd`
- `position`, `zIndex`, `top`, `bottom`, `inset`, `insetX`, `insetY`, `insetStart`, `insetEnd`
- `visibility`
- `height`, `minHeight`, `maxHeight` (only in specific components without an intrinsic height)

Example:

```tsx
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};
import {Button} from '@react-spectrum/s2';

<Button styles={style({marginStart: 8})}>Edit</Button>
```

When styling native HTML elements or React Aria Components, use `className={style(...)}` instead of the limited `styles` prop. In those cases, you are not limited to the React Spectrum component property subset.

Example:

```tsx
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};
import {Checkbox} from 'react-aria-components';

<div className={style({display: 'grid', gap: 12, padding: 16, backgroundColor: 'gray-75'})}>
  <h2 className={style({font: 'heading-sm'})}>Preferences</h2>
  <Checkbox
    className={style({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: {
        default: 'neutral',
        isSelected: 'blue-900'
      }
    })}
  />
</div>
```

The `style` macro supports runtime conditions:

```tsx
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

const styles = style({
  backgroundColor: {
    variant: {
      primary: 'accent',
      secondary: 'neutral'
    }
  }
});

function MyComponent({variant}: {variant: 'primary' | 'secondary'}) {
  return <div className={styles({variant})} />
}
```

Boolean conditions starting with `is` or `allows` can be used directly without nesting:

```tsx
const styles = style({
  backgroundColor: {
    default: 'gray-100',
    isSelected: 'gray-900',
    allowsRemoving: 'gray-400'
  }
});

<div className={styles({isSelected: true})} />
```

Note:
- Base spacing values (for `margin`, `gap`, etc.): Use pixels following a 4px grid (`0`, `2`, `4`, `8`, `12`, `16`...)

See [Styling](references/guides/styling.md) for the full guide and [Style Macro](references/guides/style-macro.md) for the full property and utility reference.

If you encounter issues related to the `style` macro import, see the 'Framework setup' section of the [Getting started](references/guides/getting-started.md) guide.

## Typography

Avoid using `Text`/`Heading`/`Content` as standalone typography primitives. These should only be used inside specific React Spectrum components where they inherit the intended slots and default styles.

- Use `Text`/`Heading`/`Content` inside components like cards, lists, pickers, menus, tabs, and other Spectrum composition APIs where `slot="label"`, `slot="description"`, or default/implicit Text slots are used. Component docs will have examples of these.
- For standalone headings, body copy, captions, and other page-level typography, use native HTML elements plus the `style` macro.

Example:

```tsx
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<section>
  <h1 className={style({font: 'heading-xl', marginBottom: 8})}>
    Project overview
  </h1>
  <p className={style({font: 'body', color: 'neutral-subdued'})}>
    Review status, owners, and upcoming milestones.
  </p>
  <p className={style({font: 'body-sm', marginTop: 12})}>
    Last updated 2 hours ago
  </p>
</section>
```

See [Style Macro](references/guides/style-macro.md) for the available typography tokens and related text styling options.

## Icons

Use React Spectrum's built-in icons and illustrations.

- Import icons from `@react-spectrum/s2/icons/...`
- Import illustrations from `@react-spectrum/s2/illustrations/...`
- Avoid introducing third-party icon libraries such as `lucide-react`, `phosphor-icons`, or `heroicons`

Commonly used icons include `AlertTriangle`, `Close`, `ChevronDown`, `Checkmark`, `Preview`, `CheckmarkCircle`, `Add`, `ChevronUp`, `Data`, `FileText`, `InfoCircle`, `OpenIn`, `Chat`, and `Code`.

Example icon:

```tsx
import AlertTriangle from '@react-spectrum/s2/icons/AlertTriangle';

<AlertTriangle />
```

Example illustrations:

```tsx
import DropToUpload from '@react-spectrum/s2/illustrations/gradient/generic1/DropToUpload';

<DropToUpload />
```

- Note that illustrations can be in a Gradient or Linear style.
- Gradient illustrations can include Generic 1 and Generic 2 variants.

See [Icons](references/components/icons.md) and [Illustrations](references/components/illustrations.md) for the full catalogs and usage guidance.

## Documentation Structure

The `references/` directory contains detailed documentation organized as follows:

### Guides
- [Component Decision Tree](references/guides/component-decision-tree.md): How to choose the right S2 component when requirements do not name one explicitly.
- [Collections](references/guides/collections.md): Many components display a collection of items, and provide functionality such as keyboard navigation, and selection. Learn how to load and render collections using React Spectrum's compositional API.
- [Forms](references/guides/forms.md): Learn how to integrate with HTML forms, validate and submit data, and use React Spectrum with form libraries.
- [Getting started](references/guides/getting-started.md): ## Installation
- [Migrating to Spectrum 2](references/guides/migrating.md): Learn how to migrate from React Spectrum v3 to Spectrum 2.
- [Selection](references/guides/selection.md): Many collection components support selecting items by clicking or tapping them, or by using the keyboard. Learn how to handle selection events, how to control selection programmatically, and the data structures used to represent a selection.
- [Style Macro](references/guides/style-macro.md): The  macro supports a constrained set of values per property that conform to Spectrum 2.
- [Styling](references/guides/styling.md): Learn how to use the  macro to apply Spectrum tokens directly in your components with type-safe autocompletion.
- [Testing](references/guides/testing.md): Learn how to test an application built with React Spectrum using test utilities to simulate common user interactions.
- [Working with AI](references/guides/ai.md): Learn how to use the React Spectrum MCP Server, Agent Skills, and more to help you build with AI.

### Components
- [Accordion](references/components/Accordion.md): An accordion is a container for multiple accordion items.
- [ActionBar](references/components/ActionBar.md): Action bars are used for single and bulk selection patterns when a user needs to perform actions on one or more items at the same time.
- [ActionButton](references/components/ActionButton.md): ActionButtons allow users to perform an action.
- [ActionButtonGroup](references/components/ActionButtonGroup.md): An ActionButtonGroup is a grouping of related ActionButtons.
- [ActionMenu](references/components/ActionMenu.md): ActionMenu combines an ActionButton with a Menu for simple "more actions" use cases.
- [Avatar](references/components/Avatar.md): An avatar is a thumbnail representation of an entity, such as a user or an organization.
- [AvatarGroup](references/components/AvatarGroup.md): An avatar group is a grouping of avatars that are related to each other.
- [Badge](references/components/Badge.md): Badges are used for showing a small amount of color-categorized metadata, ideal for getting a user's attention.
- [Breadcrumbs](references/components/Breadcrumbs.md): Breadcrumbs show hierarchy and navigational context for a user's location within an application.
- [Button](references/components/Button.md): Buttons allow users to perform an action.
- [ButtonGroup](references/components/ButtonGroup.md): ButtonGroup handles overflow for a grouping of buttons whose actions are related to each other.
- [Calendar](references/components/Calendar.md): Calendars display a grid of days in one or more months and allow users to select a single date.
- [Card](references/components/Card.md): A Card summarizes an object that a user can select or navigate to.
- [CardView](references/components/CardView.md): A CardView displays a group of related objects, with support for selection and bulk actions.
- [Checkbox](references/components/Checkbox.md): Checkboxes allow users to select multiple items from a list of individual items,
- [CheckboxGroup](references/components/CheckboxGroup.md): A CheckboxGroup allows users to select one or more items from a list of choices.
- [ColorArea](references/components/ColorArea.md): A ColorArea allows users to adjust two channels of an RGB, HSL or HSB color value against a two-dimensional gradient background.
- [ColorField](references/components/ColorField.md): A color field allows users to edit a hex color or individual color channel value.
- [ColorSlider](references/components/ColorSlider.md): A ColorSlider allows users to adjust an individual channel of a color value.
- [ColorSwatch](references/components/ColorSwatch.md): A ColorSwatch displays a preview of a selected color.
- [ColorSwatchPicker](references/components/ColorSwatchPicker.md): A ColorSwatchPicker displays a list of color swatches and allows a user to select one of them.
- [ColorWheel](references/components/ColorWheel.md): A ColorWheel allows users to adjust the hue of an HSL or HSB color value on a circular track.
- [ComboBox](references/components/ComboBox.md): ComboBox allow users to choose a single option from a collapsible list of options when space is limited.
- [ContextualHelp](references/components/ContextualHelp.md): Contextual help shows a user extra information about the state of an adjacent component, or a total view.
- [DateField](references/components/DateField.md): DateFields allow users to enter and edit date and time values using a keyboard.
- [DatePicker](references/components/DatePicker.md): DatePickers combine a DateField and a Calendar popover to allow users to enter or select a date and time value.
- [DateRangePicker](references/components/DateRangePicker.md): DateRangePickers combine two DateFields and a RangeCalendar popover to allow users
- [Dialog](references/components/Dialog.md): Dialogs are windows containing contextual information, tasks, or workflows that appear over the user interface.
- [Disclosure](references/components/Disclosure.md): A disclosure is a collapsible section of content. It is composed of a header with a heading and trigger button, and a panel that contains the content.
- [Divider](references/components/Divider.md): Dividers bring clarity to a layout by grouping and dividing content in close proximity.
- [DropZone](references/components/DropZone.md): A drop zone is an area into which one or multiple objects can be dragged and dropped.
- [Form](references/components/Form.md): Forms allow users to enter data that can be submitted while providing alignment and styling for form fields.
- [Icons](references/components/icons.md): React Spectrum offers a set of open source icons that can be imported from .
- [IllustratedMessage](references/components/IllustratedMessage.md): An IllustratedMessage displays an illustration and a message, usually
- [Illustrations](references/components/illustrations.md): React Spectrum offers a collection of illustrations that can be imported from .
- [Image](references/components/Image.md): An image with support for skeleton loading and custom error states.
- [InlineAlert](references/components/InlineAlert.md): Inline alerts display a non-modal message associated with objects in a view.
- [Link](references/components/Link.md): Links allow users to navigate to a different location.
- [LinkButton](references/components/LinkButton.md): A LinkButton combines the functionality of a link with the appearance of a button. Useful for allowing users to navigate to another page.
- [ListView](references/components/ListView.md): A ListView displays a list of interactive items, and allows a user to navigate, select, or perform an action.
- [mcp](references/components/mcp.md)
- [Menu](references/components/Menu.md): Menus display a list of actions or options that a user can choose.
- [Meter](references/components/Meter.md): Meters are visual representations of a quantity or an achievement.
- [NumberField](references/components/NumberField.md): NumberFields allow users to input number values with a keyboard or increment/decrement with step buttons.
- [Picker](references/components/Picker.md): Pickers allow users to choose a single option from a collapsible list of options when space is limited.
- [Popover](references/components/Popover.md): A popover is an overlay element positioned relative to a trigger.
- [ProgressBar](references/components/ProgressBar.md): ProgressBars show the progression of a system operation: downloading, uploading, processing, etc., in a visual way.
- [ProgressCircle](references/components/ProgressCircle.md): ProgressCircles show the progression of a system operation such as downloading, uploading, or processing, in a visual way.
- [Provider](references/components/Provider.md): Provider is the container for all React Spectrum components.
- [RadioGroup](references/components/RadioGroup.md): Radio groups allow users to select a single option from a list of mutually exclusive options.
- [RangeCalendar](references/components/RangeCalendar.md): RangeCalendars display a grid of days in one or more months and allow users to select a contiguous range of dates.
- [RangeSlider](references/components/RangeSlider.md): RangeSliders allow users to quickly select a subset range. They should be used when the upper and lower bounds to the range are invariable.
- [SearchField](references/components/SearchField.md): A SearchField is a text field designed for searches.
- [SegmentedControl](references/components/SegmentedControl.md): A SegmentedControl is a mutually exclusive group of buttons used for view switching.
- [SelectBoxGroup](references/components/SelectBoxGroup.md): SelectBoxGroup allows users to select one or more options from a list.
- [Skeleton](references/components/Skeleton.md): A Skeleton wraps around content to render it as a placeholder.
- [Slider](references/components/Slider.md): Sliders allow users to quickly select a value within a range. They should be used when the upper and lower bounds to the range are invariable.
- [StatusLight](references/components/StatusLight.md): Status lights are used to color code categories and labels commonly found in data visualization.
- [Switch](references/components/Switch.md): Switches allow users to turn an individual option on or off.
- [TableView](references/components/TableView.md): Tables are containers for displaying information. They allow users to quickly scan, sort, compare, and take action on large amounts of data.
- [Tabs](references/components/Tabs.md): Tabs organize content into multiple sections and allow users to navigate between them. The content under the set of tabs should be related and form a coherent unit.
- [TagGroup](references/components/TagGroup.md): Tags allow users to categorize content. They can represent keywords or people, and are grouped to describe an item or a search request.
- [TextArea](references/components/TextArea.md): A textarea allows a user to input mult-line text.
- [TextField](references/components/TextField.md): TextFields are text inputs that allow users to input custom text entries
- [TimeField](references/components/TimeField.md): TimeFields allow users to enter and edit time values using a keyboard.
- [Toast](references/components/Toast.md): A ToastContainer renders the queued toasts in an application. It should be placed
- [ToggleButton](references/components/ToggleButton.md): ToggleButtons allow users to toggle a selection on or off, for example
- [ToggleButtonGroup](references/components/ToggleButtonGroup.md): A ToggleButtonGroup is a grouping of related ToggleButtons, with single or multiple selection.
- [Tooltip](references/components/Tooltip.md): Display container for Tooltip content. Has a directional arrow dependent on its placement.
- [TreeView](references/components/TreeView.md): A tree view provides users with a way to navigate nested hierarchical information.

### Testing
- [Testing CheckboxGroup](references/testing/CheckboxGroup/testing.md)
- [Testing ComboBox](references/testing/ComboBox/testing.md)
- [Testing Dialog](references/testing/Dialog/testing.md)
- [Testing ListView](references/testing/ListView/testing.md)
- [Testing Menu](references/testing/Menu/testing.md)
- [Testing Picker](references/testing/Picker/testing.md)
- [Testing RadioGroup](references/testing/RadioGroup/testing.md)
- [Testing TableView](references/testing/TableView/testing.md)
- [Testing Tabs](references/testing/Tabs/testing.md)
- [Testing TreeView](references/testing/TreeView/testing.md)
