# ActionBar

Action bars are used for single and bulk selection patterns when a user needs to perform actions on one or more items at the same time.

## S2 example

```tsx
import {ActionBar, ActionButton} from '@react-spectrum/s2/ActionBar';
import {TableView, TableHeader, TableBody, Column, Row, Cell} from '@react-spectrum/s2/TableView';
import Edit from '@react-spectrum/s2/icons/Edit';
import Copy from '@react-spectrum/s2/icons/Copy';
import Delete from '@react-spectrum/s2/icons/Delete';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

let rows = [
  {id: 1, name: 'Charizard', type: 'Fire, Flying', level: '67'},
  {id: 2, name: 'Blastoise', type: 'Water', level: '56'},
  {id: 3, name: 'Venusaur', type: 'Grass, Poison', level: '83'},
  {id: 4, name: 'Pikachu', type: 'Electric', level: '100'}
];

function Example(props) {
  return (
    <TableView
      aria-label="Table with action bar"
      selectionMode="multiple"
      defaultSelectedKeys={[2]}
      styles={style({width: 'full', height: 250})}
      renderActionBar={(selectedKeys) => (
        /*- begin focus -*/
        <ActionBar {...props}>
          <ActionButton aria-label="Edit" onPress={() => alert('Edit action')}>
            <Edit />
          </ActionButton>
          <ActionButton aria-label="Copy" onPress={() => alert('Copy action')}>
            <Copy />
          </ActionButton>
          <ActionButton aria-label="Delete" onPress={() => alert('Delete action')}>
            <Delete />
          </ActionButton>
        </ActionBar>
        /*- end focus -*/
      )}>
      <TableHeader>
        <Column key="name" isRowHeader>Name</Column>
        <Column key="type">Type</Column>
        <Column key="level">Level</Column>
      </TableHeader>
      <TableBody items={rows}>
        {item => (
          <Row>
            <Cell key="name">{item.name}</Cell>
            <Cell key="type">{item.type}</Cell>
            <Cell key="level">{item.level}</Cell>
          </Row>
        )}
      </TableBody>
    </TableView>
  );
}
```

```tsx
import {ActionBar, ActionButton, Text} from '@react-spectrum/s2/ActionBar';
import {ListView, ListViewItem} from '@react-spectrum/s2/ListView';
import Edit from '@react-spectrum/s2/icons/Edit';
import Copy from '@react-spectrum/s2/icons/Copy';
import Delete from '@react-spectrum/s2/icons/Delete';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

let items = [
  {id: 1, name: 'Charizard', type: 'Fire, Flying', level: '67'},
  {id: 2, name: 'Blastoise', type: 'Water', level: '56'},
  {id: 3, name: 'Venusaur', type: 'Grass, Poison', level: '83'},
  {id: 4, name: 'Pikachu', type: 'Electric', level: '100'}
];

function Example(props) {
  return (
    <ListView
      aria-label="List with action bar"
      selectionMode="multiple"
      defaultSelectedKeys={[2]}
      styles={style({width: 'full', height: 250})}
      items={items}
      renderActionBar={(selectedKeys) => (
        /*- begin focus -*/
        <ActionBar {...props}>
          <ActionButton aria-label="Edit" onPress={() => alert('Edit action')}>
            <Edit />
          </ActionButton>
          <ActionButton aria-label="Copy" onPress={() => alert('Copy action')}>
            <Copy />
          </ActionButton>
          <ActionButton aria-label="Delete" onPress={() => alert('Delete action')}>
            <Delete />
          </ActionButton>
        </ActionBar>
        /*- end focus -*/
      )}>
      {item => (
        <ListViewItem id={item.id} textValue={item.name}>
          <Text>{item.name}</Text>
          <Text slot="description">{item.type} • Level {item.level}</Text>
        </ListViewItem>
      )}
    </ListView>
  );
}
```

```tsx
import {ActionBar, ActionButton} from '@react-spectrum/s2/ActionBar';
import {TreeView, TreeViewItem, TreeViewItemContent} from '@react-spectrum/s2/TreeView';
import Edit from '@react-spectrum/s2/icons/Edit';
import Copy from '@react-spectrum/s2/icons/Copy';
import Delete from '@react-spectrum/s2/icons/Delete';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

function Example(props) {
  return (
    <TreeView
      aria-label="TreeView with action bar"
      selectionMode="multiple"
      defaultExpandedKeys={['documents', 'project', 'photos']}
      defaultSelectedKeys={['budget']}
      styles={style({width: 'full', height: 250, maxWidth: 400})}
      renderActionBar={(selectedKeys) => (
        /*- begin focus -*/
        <ActionBar {...props}>
          <ActionButton aria-label="Edit" onPress={() => alert('Edit action')}>
            <Edit />
          </ActionButton>
          <ActionButton aria-label="Copy" onPress={() => alert('Copy action')}>
            <Copy />
          </ActionButton>
          <ActionButton aria-label="Delete" onPress={() => alert('Delete action')}>
            <Delete />
          </ActionButton>
        </ActionBar>
        /*- end focus -*/
      )}>
      <TreeViewItem id="documents" textValue="Documents">
        <TreeViewItemContent>Documents</TreeViewItemContent>
        <TreeViewItem id="project" textValue="Project">
          <TreeViewItemContent>Project</TreeViewItemContent>
          <TreeViewItem id="report" textValue="Weekly Report">
            <TreeViewItemContent>Weekly Report</TreeViewItemContent>
          </TreeViewItem>
          <TreeViewItem id="budget" textValue="Budget">
            <TreeViewItemContent>Budget</TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem id="photos" textValue="Photos">
        <TreeViewItemContent>Photos</TreeViewItemContent>
        <TreeViewItem id="image-1" textValue="Image 1">
          <TreeViewItemContent>Image 1</TreeViewItemContent>
          </TreeViewItem>
        <TreeViewItem id="image-2" textValue="Image 2">
          <TreeViewItemContent>Image 2</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
    </TreeView>
  );
}
```

## API

```tsx
<ActionBar>
  <ActionButton />
</ActionBar>
```

### ActionBar

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | A list of ActionButtons to display. |
| `id` | `string | undefined` | — | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `isEmphasized` | `boolean | undefined` | — | Whether the ActionBar should be displayed with a emphasized style. |
| `onClearSelection` | `(() => void) | undefined` | — | Handler that is called when the ActionBar clear button is pressed. |
| `scrollRef` | `RefObject<HTMLElement | null> | undefined` | — | A ref to the scrollable element the ActionBar appears above. |
| `selectedItemCount` | `number | "all" | undefined` | — | The number of selected items that the ActionBar is currently linked to. If 0, the ActionBar is hidden. |
| `slot` | `string | null | undefined` | — | A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent. |
| `styles` | `StylesProp | undefined` | — | Spectrum-defined styles, returned by the `style()` macro. |
| `UNSAFE_className` | `UnsafeClassName | undefined` | — | Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
| `UNSAFE_style` | `CSSProperties | undefined` | — | Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
