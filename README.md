# Rolling Dice Web Component

`rolling-dice` is a customizable Lit-based web component that simulates a rolling dice. It supports various features such as manual rolling, locking, and drag-and-drop movement.

## Installation

Install the package via npm:

```bash
npm install lit @stephanullmann/rolling-dice
bun add lit @stephanullmann/rolling-dice --registry https://registry.npmjs.org/
```

> **Note:** This package depends on `lit`. Ensure it is installed in your project. If you are using a bundler, `lit` will be automatically resolved as a dependency.

## Usage

Import the component in your project:

```html
<script type="module" src="node_modules/@stephanullmann/rolling-dice/dist/index.js"></script>
```

Add the `rolling-dice` component to your HTML:

```html
<rolling-dice id="dice1" color="blue" size="large" manual-roll manual-move></rolling-dice>
```

### Attributes

| Attribute     | Type      | Default  | Description                                     |
| ------------- | --------- | -------- | ----------------------------------------------- |
| `id`          | `string`  | Random   | Unique identifier for the dice.                 |
| `color`       | `string`  | `indigo` | Color of the dice.                              |
| `size`        | `string`  | `medium` | Size of the dice (`small`, `medium`, `large`).  |
| `manual-roll` | `boolean` | `false`  | Enables manual rolling on double-click.         |
| `manual-move` | `boolean` | `false`  | Enables drag-and-drop movement.                 |
| `locked`      | `boolean` | `false`  | Locks the dice, preventing rolling or movement. |

### Events

| Event         | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `dice-rolled` | Fired when the dice finishes rolling. Contains the `id` and `value` of the dice.   |
| `roll-dice`   | Custom event that triggers the dice to roll. The component listens for this event. |

### Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rolling Dice Example</title>
    <script type="module" src="node_modules/@stephanullmann/rolling-dice/dist/index.js"></script>
  </head>
  <body>
    <rolling-dice id="dice1" color="blue" size="large" manual-roll manual-move></rolling-dice>

    <button id="rollButton">Roll Dice</button>

    <script>
      const dice = document.querySelector('#dice1');
      const rollButton = document.querySelector('#rollButton');

      rollButton.addEventListener('click', () => {
        dice.dispatchEvent(new CustomEvent('roll-dice'));
      });

      dice.addEventListener('dice-rolled', (event) => {
        console.log(`Dice rolled: ID=${event.detail.id}, Value=${event.detail.value}`);
      });
    </script>
  </body>
</html>
```

## Development

To build the project:

```bash
npm run build:package
```

To test the component locally:

```bash
npm link
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
