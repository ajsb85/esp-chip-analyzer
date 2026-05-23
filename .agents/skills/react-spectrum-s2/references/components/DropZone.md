# DropZone

A drop zone is an area into which one or multiple objects can be dragged and dropped.

```tsx
import {DropZone, IllustratedMessage, Heading, Content} from '@react-spectrum/s2/DropZone';
import {ButtonGroup, Button} from '@react-spectrum/s2/ButtonGroup';
import {FileTrigger} from '@react-spectrum/s2/FileTrigger';
import React, {useState} from 'react';
import CloudUpload from '@react-spectrum/s2/illustrations/gradient/generic1/CloudUpload';
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

function Example(props) {
  let [content, setContent] = useState<React.ReactNode>(null);
  return (
    <DropZone
      {...props}
      styles={style({width: 320, maxWidth: '90%'})}
      
      isFilled={!!content}
      // Determine whether dragged content should be accepted.
      getDropOperation={types => (
        ['text/plain', 'image/jpeg', 'image/png', 'image/gif'].some(t => types.has(t))
          ? 'copy'
          : 'cancel'
      )}
      onDrop={async (event) => {
        // Find the first accepted item.
        let item = event.items.find(item => (
          (item.kind === 'text' && item.types.has('text/plain')) ||
          (item.kind === 'file' && item.type.startsWith('image/'))
        ));

        if (item?.kind === 'text') {
          let text = await item.getText('text/plain');
          setContent(text);
        } else if (item?.kind === 'file') {
          let file = await item.getFile();
          let url = URL.createObjectURL(file);
          setContent(<img src={url} alt={item.name} className={style({maxHeight: 'full', maxWidth: 'full'})} />);
        }
      }}>
      {content || (
        <IllustratedMessage>
          <CloudUpload />
          <Heading>
            Drag and drop your file
          </Heading>
          <Content>
            Or, select a file from your computer
          </Content>
          <ButtonGroup>
            <FileTrigger
              acceptedFileTypes={['image/jpeg', 'image/png', 'image/gif']}
              onSelect={files => {
                if (!files) return;
                let url = URL.createObjectURL(files[0]);
                setContent(<img src={url} alt={files[0].name} className={style({maxHeight: 'full', maxWidth: 'full'})} />);
              }}>
              <Button variant="accent">Browse files</Button>
            </FileTrigger>
          </ButtonGroup>
        </IllustratedMessage>
      )}
    </DropZone>
  );
}
```

## API

```tsx
<DropZone>
  <IllustratedMessage />
</DropZone>
```

### DropZone

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `aria-describedby` | `string | undefined` | — | Identifies the element (or elements) that describes the object. |
| `aria-details` | `string | undefined` | — | Identifies the element (or elements) that provide a detailed, extended description for the object. |
| `aria-label` | `string | undefined` | — | Defines a string value that labels the current element. |
| `aria-labelledby` | `string | undefined` | — | Identifies the element (or elements) that labels the current element. |
| `children` | `ReactNode` | — | The content to display in the drop zone. |
| `getDropOperation` | `((types: DragTypes, allowedOperations: DropOperation[]) => DropOperation) | undefined` | — | A function returning the drop operation to be performed when items matching the given types are dropped on the drop target. |
| `id` | `string | undefined` | — | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `isFilled` | `boolean | undefined` | — | Whether the drop zone has been filled. |
| `onDrop` | `((e: DropEvent) => void) | undefined` | — | Handler that is called when a valid drag is dropped on the drop target. |
| `onDropActivate` | `((e: DropActivateEvent) => void) | undefined` | — | Handler that is called after a valid drag is held over the drop target for a period of time. This typically opens the item so that the user can drop within it. |
| `onDropEnter` | `((e: DropEnterEvent) => void) | undefined` | — | Handler that is called when a valid drag enters the drop target. |
| `onDropExit` | `((e: DropExitEvent) => void) | undefined` | — | Handler that is called when a valid drag exits the drop target. |
| `onDropMove` | `((e: DropMoveEvent) => void) | undefined` | — | Handler that is called when a valid drag is moved within the drop target. |
| `replaceMessage` | `string | undefined` | 'Drop file to replace' | The message to replace the default banner message that is shown when the drop zone is filled. |
| `size` | `"S" | "M" | "L" | undefined` | 'M' | The size of the DropZone. |
| `slot` | `string | null | undefined` | — | A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent. |
| `styles` | `StylesPropWithHeight | undefined` | — | Spectrum-defined styles, returned by the `style()` macro. |
| `UNSAFE_className` | `UnsafeClassName | undefined` | — | Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
| `UNSAFE_style` | `CSSProperties | undefined` | — | Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use the `style` macro via the `styles` prop instead. |
