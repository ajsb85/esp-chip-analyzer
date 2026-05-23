# ListView

A ListView displays a list of interactive items, and allows a user to navigate, select, or perform an action.

```tsx
import {ListView, ListViewItem, Text} from '@react-spectrum/s2/ListView';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<ListView
  
  styles={style({width: 'full', maxWidth: 400, height: 320})}>
  <ListViewItem id="adobe-photoshop" textValue="Adobe Photoshop">
    <Text>Adobe Photoshop</Text>
    <Text slot="description">Image editing software</Text>
  </ListViewItem>
  <ListViewItem id="adobe-xd" textValue="Adobe XD">
    <Text>Adobe XD</Text>
    <Text slot="description">UI/UX design tool</Text>
  </ListViewItem>
  <ListViewItem id="adobe-indesign" textValue="Adobe InDesign">
    <Text>Adobe InDesign</Text>
    <Text slot="description">Desktop publishing</Text>
  </ListViewItem>
</ListView>
```

## Content

`ListView` follows the [Collection Components API](collections.md?component=ListView), accepting both static and dynamic collections. This example shows a dynamic collection, passing a list of objects to the items prop, and a function to render the children.

```tsx
import {ListView, ListViewItem} from '@react-spectrum/s2/ListView';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

let files = [
  {id: 'adobe-photoshop', name: 'Adobe Photoshop'},
  {id: 'adobe-xd', name: 'Adobe XD'},
  {id: 'adobe-indesign', name: 'Adobe InDesign'}
];

<ListView aria-label="Dynamic files" items={files} styles={style({width: 'full', maxWidth: 400, height: 320})}>
  {item => (
    <ListViewItem id={item.id}>{item.name}</ListViewItem>
  )}
</ListView>
```

### Slots

`ListViewItem` supports icons, `Text`, [Image](Image.md), [ActionMenu](ActionMenu.md), and [ActionButtonGroup](ActionButtonGroup.md) as children, and must have a `textValue` prop for accessibility.

```tsx
import {ActionButton, Text} from '@react-spectrum/s2/ActionButton';
import {ActionButtonGroup} from '@react-spectrum/s2/ActionButtonGroup';
import {ActionMenu, MenuItem} from '@react-spectrum/s2/ActionMenu';
import {Image} from '@react-spectrum/s2/Image';
import {ListView, ListViewItem} from '@react-spectrum/s2/ListView';
import Edit from '@react-spectrum/s2/icons/Edit';
import Copy from '@react-spectrum/s2/icons/Copy';
import Delete from '@react-spectrum/s2/icons/Delete';
import File from '@react-spectrum/s2/icons/File';
import Share from '@react-spectrum/s2/icons/Share';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

let documents = [
  {id: 'project-brief', name: 'Project brief.pdf'},
  {id: 'quarterly-report', name: 'Quarterly report.docx'},
  {id: 'budget', name: 'Budget.xlsx'}
];
let images = [
  {id: 'dessert-sunset', name: 'Dessert sunset.jpg', image_url: 'https://images.unsplash.com/photo-1705034598432-1694e203cdf3?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
  {id: 'hiking-trail', name: 'Hiking trail.png', image_url: 'https://images.unsplash.com/photo-1722233987129-61dc344db8b6?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
  {id: 'mountain-with-lake', name: 'Mountain with lake.png', image_url: 'https://images.unsplash.com/photo-1722172118908-1a97c312ce8c?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
];

<div className={style({display: 'flex', gap: 24, width: 'full', flexWrap: 'wrap', justifyContent: 'center'})}>
  <ListView aria-label="Documents" items={documents} styles={style({flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 200, maxWidth: 400, height: 320})}>
    {item => (
      <ListViewItem id={item.id} textValue={item.name}>
        {/*- begin highlight -*/}
        <File />
        <Text>{item.name}</Text>
        <Text slot="description">Document</Text>
        <ActionButtonGroup aria-label="File actions">
          <ActionButton aria-label="Edit">
            <Edit />
          </ActionButton>
          <ActionButton aria-label="Delete">
            <Delete />
          </ActionButton>
        </ActionButtonGroup>
        {/*- end highlight -*/}
      </ListViewItem>
    )}
  </ListView>
  <ListView aria-label="Images" items={images} styles={style({flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 200, maxWidth: 400, height: 320})}>
    {item => (
      <ListViewItem id={item.id} textValue={item.name}>
        {/*- begin highlight -*/}
        <Image src={item.image_url} alt={item.name} />
        <Text>{item.name}</Text>
        <Text slot="description">Image</Text>
        <ActionMenu>
          <MenuItem>
            <Copy />
            <Text>Copy</Text>
          </MenuItem>
          <MenuItem>
            <Share />
            <Text>Share</Text>
          </MenuItem>
          <MenuItem>
            <Delete />
            <Text>Delete</Text>
          </MenuItem>
        </ActionMenu>
        {/*- end highlight -*/}
      </ListViewItem>
    )}
  </ListView>
</div>
```

### Asynchronous loading

Use the `loadingState` and `onLoadMore` props to enable async loading and infinite scrolling.

```tsx
import {ListView, ListViewItem} from '@react-spectrum/s2/ListView';
import {useAsyncList} from '@react-spectrum/s2/useAsyncList';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

interface Character {
  name: string
}

function AsyncListView() {
  let list = useAsyncList<Character>({
    async load({signal, cursor}) {
      if (cursor) {
        cursor = cursor.replace(/^http:\/\//i, 'https://');
      }

      let res = await fetch(cursor || 'https://swapi.py4e.com/api/people/?search=', {signal});
      let json = await res.json();
      return {
        items: json.results,
        cursor: json.next
      };
    }
  });

  return (
    <ListView
      aria-label="Star Wars characters"
      loadingState={list.loadingState}
      onLoadMore={list.loadMore}
      items={list.items}
      styles={style({width: 'full', maxWidth: 400, height: 320})}>
      {item => (
        <ListViewItem id={item.name}>{item.name}</ListViewItem>
      )}
    </ListView>
  );
}
```

### Links

Use the `href` prop on a `ListViewItem` to create a link. See the [getting started guide](getting-started.md) to learn how to integrate with your framework. Link interactions vary depending on the selection behavior. See the [selection guide](selection.md) for more details.

```tsx
import {ListView, ListViewItem} from '@react-spectrum/s2/ListView';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<ListView aria-label="Bookmarks" styles={style({width: 'full', maxWidth: 400, height: 320})}>
  <ListViewItem id="adobe" href="https://adobe.com" target="_blank">
    adobe.com
  </ListViewItem>
  <ListViewItem id="spectrum" href="https://spectrum.adobe.com" target="_blank">
    spectrum.adobe.com
  </ListViewItem>
  <ListViewItem id="react-spectrum" href="https://react-spectrum.adobe.com" target="_blank">
    react-spectrum.adobe.com
  </ListViewItem>
</ListView>
```

### Empty state

Use `renderEmptyState` to render placeholder content when there are no items.

```tsx
import {ListView} from '@react-spectrum/s2/ListView';
import {IllustratedMessage, Heading, Content} from '@react-spectrum/s2/IllustratedMessage';
import {Link} from '@react-spectrum/s2/Link';
import FolderOpen from '@react-spectrum/s2/illustrations/linear/FolderOpen';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<ListView
  aria-label="Search results"
  styles={style({width: 'full', maxWidth: 400})}
  /*- begin highlight -*/
  renderEmptyState={() => (
    <IllustratedMessage>
      <FolderOpen />
      <Heading>No results</Heading>
      <Content>Press <Link href="https://adobe.com">here</Link> for more info.</Content>
    </IllustratedMessage>
  )}>
  {/*- end highlight -*/}
  {[]}
</ListView>
```

## Selection and actions

Use the `selectionMode` prop to enable single or multiple selection. The selected items can be controlled via the `selectedKeys` prop, matching the `id` prop of the items. The `onAction` event handles item actions. Items can be disabled with the `isDisabled` prop. See the [selection guide](selection.md?component=ListView) for more details.

```tsx
import {ListView, ListViewItem, type Selection} from '@react-spectrum/s2/ListView';
import {ActionBar, ActionButton} from '@react-spectrum/s2/ActionBar';
import Edit from '@react-spectrum/s2/icons/Edit';
import Copy from '@react-spectrum/s2/icons/Copy';
import Delete from '@react-spectrum/s2/icons/Delete';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};
import {useState} from 'react';

function Example(props) {
  let [selected, setSelected] = useState<Selection>(new Set());

  return (
    <div className={style({width: 'full'})}>
      <ListView
        {...props}
        aria-label="Files"
        styles={style({width: 'full', maxWidth: 400, height: 320})}
        
        selectedKeys={selected}
        onSelectionChange={setSelected}
        onAction={key => alert(`Action on ${key}`)}
        renderActionBar={(selectedKeys) => {
          let selection = selectedKeys === 'all' ? 'all' : [...selectedKeys].join(', ');
          return (
            <ActionBar>
              <ActionButton aria-label="Edit" onPress={() => alert(`Edit ${selection}`)}>
                <Edit />
              </ActionButton>
              <ActionButton aria-label="Copy" onPress={() => alert(`Copy ${selection}`)}>
                <Copy />
              </ActionButton>
              <ActionButton aria-label="Delete" onPress={() => alert(`Delete ${selection}`)}>
                <Delete />
              </ActionButton>
            </ActionBar>
          );
        }}>
        <ListViewItem id="a">Brand guidelines.pdf</ListViewItem>
        <ListViewItem id="b">Icon set.svg</ListViewItem>
        <ListViewItem id="c">Homepage comp.fig</ListViewItem>
        <ListViewItem id="d" isDisabled>Archived.zip</ListViewItem>
      </ListView>
      <p>Current selection: {selected === 'all' ? 'all' : [...selected].join(', ')}</p>
    </div>
  );
}
```

### Navigation

Use the `hasChildItems` prop on `ListViewItem` to display a chevron indicator, signaling that an item can be navigated into. Combine with `onAction` and [Breadcrumbs](Breadcrumbs.md) to build a drill-down navigation pattern.

```tsx
import {Breadcrumbs, Breadcrumb} from '@react-spectrum/s2/Breadcrumbs';
import {ListView, ListViewItem, Text, type Key} from '@react-spectrum/s2/ListView';
import App from '@react-spectrum/s2/icons/App';
import Folder from '@react-spectrum/s2/icons/Folder';
import File from '@react-spectrum/s2/icons/File';
import Image from '@react-spectrum/s2/icons/Image';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};
import {useState} from 'react';

type FileItem = {id: string, name: string, icon: React.ReactNode};
type FolderItem = {id: string, name: string, icon: React.ReactNode, children: ListItem[]};
type ListItem = FileItem | FolderItem;
type BreadcrumbItem = {id: string, name: string, icon: React.ReactNode, children: ListItem[]};

let rootItems: ListItem[] = [
  {id: 'photoshop', name: 'Adobe Photoshop', icon: <App />},
  {id: 'xd', name: 'Adobe XD', icon: <App />},
  {id: 'documents', name: 'Documents', icon: <Folder />, children: [
    {id: 'sales-pitch', name: 'Sales Pitch', icon: <File />},
    {id: 'demo', name: 'Demo', icon: <File />},
    {id: 'taxes', name: 'Taxes', icon: <File />}
  ]},
  {id: 'indesign', name: 'Adobe InDesign', icon: <App />},
  {id: 'utilities', name: 'Utilities', icon: <Folder />, children: [
    {id: 'activity-monitor', name: 'Activity Monitor', icon: <App />}
  ]},
  {id: 'aftereffects', name: 'Adobe AfterEffects', icon: <App />},
  {id: 'illustrator', name: 'Adobe Illustrator', icon: <App />},
  {id: 'pictures', name: 'Pictures', icon: <Folder />, children: [
    {id: 'yosemite', name: 'Yosemite', icon: <Image />},
    {id: 'jackson-hole', name: 'Jackson Hole', icon: <Image />},
    {id: 'crater-lake', name: 'Crater Lake', icon: <Image />}
  ]}
];

function NavigationExample() {
  let [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    {id: 'root', name: 'Root', icon: <Folder />, children: rootItems}
  ]);

  let currentItems = breadcrumbs[breadcrumbs.length - 1].children;

  let onAction = (key: Key) => {
    let item = currentItems.find(item => item.id === key);
    if (item && 'children' in item) {
      setBreadcrumbs(prev => [...prev, item]);
    }
  };

  let onBreadcrumbAction = (key: Key) => {
    let index = breadcrumbs.findIndex(item => item.id === key);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  return (
    <div className={style({display: 'flex', flexDirection: 'column', gap: 8, width: 'full', maxWidth: 400})}>
      {/*- begin highlight -*/}
      <Breadcrumbs onAction={onBreadcrumbAction}>
        {breadcrumbs.map(item => (
          <Breadcrumb key={item.id} id={item.id}>{item.name}</Breadcrumb>
        ))}
      </Breadcrumbs>
      <ListView
        aria-label={breadcrumbs[breadcrumbs.length - 1].name}
        items={currentItems}
        onAction={onAction}
        styles={style({width: 'full', height: 320})}>
        {item => (
          <ListViewItem id={item.id} textValue={item.name} hasChildItems={item && 'children' in item}>
            {item.icon}
            <Text>{item.name}</Text>
          </ListViewItem>
        )}
      </ListView>
      {/*- end highlight -*/}
    </div>
  );
}
```

## API

```tsx
<ListView>
  <ListViewItem>
    <Icon />
    <Image />
    <Text />
    <Text slot="description" />
    <ActionMenu /> or <ActionButtonGroup />
  </ListViewItem>
</ListView>
```

### ListView

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `aria-describedby` | `string | undefined` | — | Identifies the element (or elements) that describes the object. |
| `aria-details` | `string | undefined` | — | Identifies the element (or elements) that provide a detailed, extended description for the object. |
| `aria-label` | `string | undefined` | — | Defines a string value that labels the current element. |
| `aria-labelledby` | `string | undefined` | — | Identifies the element (or elements) that labels the current element. |
| `autoFocus` | `boolean | FocusStrategy | undefined` | — | Whether to auto focus the gridlist or an option. |
| `children` | `ReactNode | ((item: T) => ReactNode)` | — | The children of the ListView. |
| `defaultSelectedKeys` | `"all" | Iterable<Key> | undefined` | — | The initial selected keys in the collection (uncontrolled). |
| `dependencies` | `readonly any[] | undefined` | — | Values that should invalidate the item cache when using dynamic collections. |
| `disabledBehavior` | `DisabledBehavior | undefined` | "all" | Whether `disabledKeys` applies to all interactions, or only selection. |
| `disabledKeys` | `Iterable<Key> | undefined` | — | The item keys that are disabled. These items cannot be selected, focused, or otherwise interacted with. |
| `disallowEmptySelection` | `boolean | undefined` | — | Whether the collection allows empty selection. |
| `disallowTypeAhead` | `boolean | undefined` | false | Whether typeahead navigation is disabled. |
| `escapeKeyBehavior` | `"none" | "clearSelection" | undefined` | 'clearSelection' | Whether pressing the escape key should clear selection in the grid list or not. Most experiences should not modify this option as it eliminates a keyboard user's ability to easily clear selection. Only use if the escape key is being handled externally or should not trigger selection clearing contextually. |
| `hideLinkOutIcon` | `boolean | undefined` | — | Hides the default link out icons on items that open links in a new tab. |
| `id` | `string | undefined` | — | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `isQuiet` | `boolean | undefined` | — | Whether the ListView should be displayed with a quiet style. |
| `items` | `Iterable<T> | undefined` | — | Item objects in the collection. |
| `loadingState` | `LoadingState | undefined` | — | The current loading state of the ListView. |
| `onAction` | `((key: Key) => void) | undefined` | — | Handler that is called when a user performs an action on an item. The exact user event depends on the collection's `selectionBehavior` prop and the interaction modality. |
| `onLoadMore` | `(() => void) | undefined` | — | Handler that is called when more items should be loaded, e.g. while scrolling near the bottom. |
| `onSelectionChange` | `((keys: Selection) => void) | undefined` | — | Handler that is called when the selection changes. |
| `overflowMode` | `"wrap" | "truncate" | undefined` | 'truncate' | Sets the overflow behavior for item contents. |
| `renderActionBar` | `((selectedKeys: "all" | Set<Key>) => ReactElement) | undefined` | — | Provides the ActionBar to display when items are selected in the ListView. |
| `renderEmptyState` | `((props: GridListRenderProps) => ReactNode) | undefined` | — | Provides content to display when there are no items in the list. |
| `selectedKeys` | `"all" | Iterable<Key> | undefined` | — | The currently selected keys in the collection (controlled). |
| `selectionMode` | `SelectionMode | undefined` | — | The type of selection that is allowed in the collection. |
| `selectionStyle` | `"checkbox" | "highlight" | undefined` | 'checkbox' | How selection should be displayed. |
| `shouldSelectOnPressUp` | `boolean | undefined` | — | Whether selection should occur on press up instead of press down. |
| `slot` | `string | null | undefined` | — | A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent. |
| `styles` | `StylesPropWithHeight | undefined` | — | Spectrum-defined styles, returned by the `style()` macro. |
| `UNSAFE_className` | `UnsafeClassName | undefined` | — | Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
| `UNSAFE_style` | `CSSProperties | undefined` | — | Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |

### ListViewItem

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | The contents of the item. |
| `download` | `string | boolean | undefined` | — | Causes the browser to download the linked URL. A string may be provided to suggest a file name. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download). |
| `hasChildItems` | `boolean | undefined` | — | Whether the item has child items (renders a chevron indicator). |
| `href` | `string | undefined` | — | A URL to link to. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href). |
| `hrefLang` | `string | undefined` | — | Hints at the human language of the linked URL. See[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#hreflang). |
| `id` | `Key | undefined` | — | The unique id of the item. |
| `isDisabled` | `boolean | undefined` | — | Whether the item is disabled. |
| `onAction` | `(() => void) | undefined` | — | Handler that is called when a user performs an action on the item. The exact user event depends on the collection's `selectionBehavior` prop and the interaction modality. |
| `onHoverChange` | `((isHovering: boolean) => void) | undefined` | — | Handler that is called when the hover state changes. |
| `onHoverEnd` | `((e: HoverEvent) => void) | undefined` | — | Handler that is called when a hover interaction ends. |
| `onHoverStart` | `((e: HoverEvent) => void) | undefined` | — | Handler that is called when a hover interaction starts. |
| `onPress` | `((e: PressEvent) => void) | undefined` | — | Handler that is called when the press is released over the target. |
| `onPressChange` | `((isPressed: boolean) => void) | undefined` | — | Handler that is called when the press state changes. |
| `onPressEnd` | `((e: PressEvent) => void) | undefined` | — | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressStart` | `((e: PressEvent) => void) | undefined` | — | Handler that is called when a press interaction starts. |
| `onPressUp` | `((e: PressEvent) => void) | undefined` | — | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `ping` | `string | undefined` | — | A space-separated list of URLs to ping when the link is followed. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#ping). |
| `referrerPolicy` | `HTMLAttributeReferrerPolicy | undefined` | — | How much of the referrer to send when following the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#referrerpolicy). |
| `rel` | `string | undefined` | — | The relationship between the linked resource and the current page. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel). |
| `routerOptions` | `undefined` | — | Options for the configured client side router. |
| `target` | `HTMLAttributeAnchorTarget | undefined` | — | The target window for the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target). |
| `textValue` | `string | undefined` | — | A string representation of the item's contents, used for features like typeahead. |
| `value` | `object | undefined` | — | The object value that this item represents. When using dynamic collections, this is set automatically. |
