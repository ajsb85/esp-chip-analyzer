# IllustratedMessage

An IllustratedMessage displays an illustration and a message, usually
for an empty state or an error page.

```tsx
import {IllustratedMessage, Heading, Content} from '@react-spectrum/s2/IllustratedMessage';
import {ButtonGroup, Button} from '@react-spectrum/s2/ButtonGroup';
import Image from '@react-spectrum/s2/illustrations/gradient/generic1/Image';

<IllustratedMessage>
  <Image />
  <Heading>Create your first asset.</Heading>
  <Content>Get started by uploading or importing some assets.</Content>
  <ButtonGroup>
    <Button variant="secondary">Import</Button>
    <Button variant="accent">Upload</Button>
  </ButtonGroup>
</IllustratedMessage>
```

## API

```tsx
<IllustratedMessage>
  <Illustration />
  <Heading />
  <Content />
  <ButtonGroup />
</IllustratedMessage>
```

### IllustratedMessage
