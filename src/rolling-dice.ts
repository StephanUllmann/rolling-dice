import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('rolling-dice')
export class RollingDice extends LitElement {
  @query('.dice')
  private dice!: HTMLDivElement;

  @property({ type: Boolean })
  private isDragging = false;

  private isMouseDownNotClick = false;
  private isPotentialDoubleClick = false;
  private doubleClickTimeout: number | null = null;

  @property({ type: Boolean })
  private isRolling = false;

  @property({ type: Number, reflect: true })
  public value = 1;

  @property({ reflect: true })
  public id: string;

  @property() public color = 'indigo';
  @property() public size: 'small' | 'medium' | 'large' = 'medium';
  @property({ type: Boolean, attribute: 'manual-roll', reflect: true }) public manualRoll = false;
  @property({ type: Boolean, attribute: 'manual-move', reflect: true }) public manualMove = false;
  @property({ type: Boolean, attribute: 'locked', reflect: true }) public locked = false;
  @property({ type: String }) private animationTime = '2000ms';

  private abortController = new AbortController();

  static rollMap = {
    1: { x: 60, y: 0, z: null, className: '.one' },
    2: { x: 330, y: null, z: 0, className: '.two' },
    3: { x: 150, y: null, z: 90, className: '.three' },
    4: { x: 330, y: null, z: 90, className: '.four' },
    5: { x: 150, y: null, z: 0, className: '.five' },
    6: { x: 60, y: 180, z: null, className: '.six' },
  };

  constructor(id: string) {
    super();
    this.id = id ?? `${Math.floor(Math.random() * 100).toString()}-dice`;
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.addEventListener('roll-dice', this.handleRoll as EventListenerOrEventListenerObject);
  }

  private handleRoll(e?: MouseEvent) {
    if (this.isRolling) return;
    if (this.locked) return this.emitValue();
    e?.preventDefault();
    this.isRolling = true;

    const rolledNum = (Math.floor(Math.random() * 6) + 1) as keyof typeof RollingDice.rollMap;
    let { x, y, z, className } = RollingDice.rollMap[rolledNum];
    const randomAnimationTime = Math.floor(Math.random() * 2750) + 800;
    this.animationTime = `${randomAnimationTime}ms`;
    y = y ?? Math.floor(Math.random() * 360);
    z = z ?? Math.floor(Math.random() * 360);
    this.dice.dataset.rotateX = `${x - 360}deg`;
    this.dice.dataset.rotateY = `${y - 360}deg`;
    this.dice.dataset.rotateZ = `${z - 360}deg`;

    setTimeout(() => {
      this.isRolling = false;
      const face = this.getCurrentValue(className);
      this.animationTime = '0ms';
      this.dice.dataset.rotateX = `${x}deg`;
      this.dice.dataset.rotateY = `${y}deg`;
      this.dice.dataset.rotateZ = `${z}deg`;

      setTimeout(() => {
        face?.classList.remove('rolled');
      }, 2000);
    }, randomAnimationTime);
  }

  private getCurrentValue(className: string) {
    const face = this.shadowRoot?.querySelector(className);
    console.log(face);
    this.value = face?.children.length ?? 0;
    face?.classList.add('rolled');
    this.emitValue();
    return face;
  }

  private emitValue() {
    this.dispatchEvent(
      new CustomEvent('dice-rolled', {
        detail: {
          id: this.id,
          value: this.value,
        },
        bubbles: true,
      })
    );
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isDragging || this.isRolling || !this.manualMove || this.locked) return;
    e.preventDefault();
    this.isDragging = true;
  }
  private handleMouseUp(e: MouseEvent) {
    if (!this.isDragging || this.isRolling) return;
    e.preventDefault();

    this.isDragging = false;
    this.abortController.abort();
    this.abortController = new AbortController();
    this.locked = false;
    requestAnimationFrame(() => {
      this.isMouseDownNotClick = false;
    });
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.manualMove) return;
    e.preventDefault();
    this.isMouseDownNotClick = true;
    const { movementX, movementY } = e;
    this.dice.dataset.rotateX = `${(parseFloat(this.dice.dataset.rotateX!.slice(0, -3)) - movementY * 0.5) % 360}deg`;
    this.dice.dataset.rotateY = `${(parseFloat(this.dice.dataset.rotateY!.slice(0, -3)) + movementX * 0.5) % 360}deg`;
  }

  private handleMouseLeave(e: MouseEvent) {
    e.preventDefault();
    window.addEventListener('pointermove', this.handleMouseMove.bind(this), { signal: this.abortController.signal });
    window.addEventListener(
      'pointerup',
      (ev) => {
        ev.preventDefault();
        this.isDragging = false;
        this.abortController.abort();
        this.abortController = new AbortController();
      },
      { once: true }
    );
  }

  private handleDblClick(e: MouseEvent) {
    if (!this.manualRoll) return;

    if (this.doubleClickTimeout) {
      clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = null;
    }

    this.isPotentialDoubleClick = false;
    this.handleRoll(e);
  }

  private handleClick() {
    if (this.isMouseDownNotClick) return;
    if (!this.manualRoll) {
      this.locked = !this.locked;
      return;
    }

    if (this.isPotentialDoubleClick) {
      this.isPotentialDoubleClick = false;
      if (this.doubleClickTimeout) {
        clearTimeout(this.doubleClickTimeout);
        this.doubleClickTimeout = null;
      }
      return;
    }

    this.isPotentialDoubleClick = true;

    this.doubleClickTimeout = window.setTimeout(() => {
      if (this.isPotentialDoubleClick) {
        this.locked = !this.locked;
        this.isPotentialDoubleClick = false;
      }
    }, 150);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    if (this.doubleClickTimeout) clearTimeout(this.doubleClickTimeout);
    this.abortController.abort();
  }

  render() {
    const selectedStyle = html`<style>
      :host {
        filter: drop-shadow(1px 1px 4px ${this.color}) drop-shadow(-1px -1px 4px ${this.color})
          drop-shadow(-1px 1px 4px ${this.color}) drop-shadow(1px -1px 4px ${this.color});
      }
    </style>`;
    return html` ${this.locked ? selectedStyle : ''}
      <div
        @dblclick=${this.handleDblClick}
        @click=${this.handleClick}
        @pointerdown=${this.handleMouseDown}
        @pointerup=${this.handleMouseUp}
        @pointermove=${this.handleMouseMove}
        @mouseleave=${this.handleMouseLeave}
        class=${`dice ${this.isRolling ? 'moving' : ''}`}
        data-size=${this.size === 'small' ? '8rem' : this.size === 'medium' ? '12rem' : '15rem'}
        data-color=${this.color}
        data-rotate-x="65deg"
        data-rotate-y="0deg"
        data-rotate-z="30deg"
        data-animation-time=${this.animationTime}
        data-manual-move=${this.manualMove ? 'grab' : 'default'}
        tabindex="0"
      >
        <div class="color-stop"></div>
        <div class="color-stop"></div>
        <div class="face one">
          <span class="dot"></span>
        </div>
        <div class="face two">
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="face three">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="face four">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="face five">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="face six">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>`;
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    :host {
      display: inline-block;
    }
    .dice {
      --w: attr(data-size type(<length>), 15rem);
      --c: attr(data-color type(<color>), indigo);
      --x: attr(data-rotate-x type(<angle>));
      --y: attr(data-rotate-y type(<angle>));
      --z: attr(data-rotate-z type(<angle>));
      --stop-w: calc(var(--w) - 7px);
      --c-dark: oklch(from var(--c) calc(l * 0.7) c h);

      display: inline-grid;
      container-type: inline-size;
      width: var(--w);
      position: relative;
      aspect-ratio: 1;
      transform-style: preserve-3d;
      transform: rotateX(var(--x)) rotateY(var(--y)) rotateZ(var(--z));
      border: 3px solid transparent;
      will-change: transform;

      &.moving {
        --t: attr(data-animation-time type(<time>), 1000ms);

        transition: transform cubic-bezier(0.209, 0.997, 0.61, 1);
        transition-duration: var(--t);
        & > * {
          cursor: wait;
        }
      }

      &::before {
        content: '';
        display: block;
        position: absolute;
        width: var(--stop-w);
        height: var(--stop-w);
        background-color: var(--c-dark);
        place-self: center;
      }

      &:active {
        cursor: grabbing;
      }

      &::selection {
        background-color: transparent;
      }

      & > * {
        --cc: oklch(from var(--c) l c h / 90%);
        --mm: attr(data-manual-move type(<custom-ident>));
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        place-items: center;
        place-content: center;
        font-size: 3rem;
        grid-area: 1/1/2/2;
        width: 100%;
        height: 100%;
        cursor: var(--mm);
        background-color: var(--cc);
        background-image: radial-gradient(
            ellipse in oklch,
            transparent,
            transparent 74%,
            oklch(from var(--cc) calc(l * 0.8) c h)
          ),
          radial-gradient(
            circle at 64% in oklch,
            transparent,
            transparent 70%,
            oklch(from var(--cc) calc(l * 2.125) c h)
          );
        background-blend-mode: soft-light;
        /* border: 5px solid oklch(from var(--c) calc(l * 0.7) c h); */
        border: calc(var(--w) / 35) solid oklch(from var(--c) calc(l * 0.7) c h);
        border: 2.5cqw solid oklch(from var(--c) calc(l * 0.7) c h);
        outline: 4px solid oklch(from var(--c) calc(l * 0.7) c h);
        border-radius: 2rem;
        transform-style: preserve-3d;

        @supports (corner-shape: bevel) {
          border-radius: 4rem;
          corner-shape: squircle;
        }

        &::after {
          content: '';
          width: 100%;
          aspect-ratio: 1;
          background-image: none;
          background-color: var(--c-dark);
          position: absolute;
          transform: translateZ(-1px);
          border-radius: 0.5rem;
        }
      }
      .color-stop {
        outline: none;
        width: var(--stop-w);
        height: var(--stop-w);
        place-self: center;
        border: 3px solid transparent;
        border-radius: 0;
        background-image: none;
        background-color: var(--c-dark);
        transform: rotateY(90deg);
        backface-visibility: visible;

        &:nth-of-type(2) {
          transform: rotateX(90deg);
        }
      }
      .one {
        transform: translateZ(calc(var(--w) / 2));
      }
      .two {
        transform: rotateX(90deg) translateZ(calc(var(--w) / 2));
      }
      .three {
        transform: rotateY(90deg) translateZ(calc(var(--w) / 2));
      }
      .four {
        transform: rotateY(90deg) rotateX(180deg) translateZ(calc(var(--w) / 2));
      }
      .five {
        transform: rotateX(90deg) rotateY(180deg) translateZ(calc(var(--w) / 2));
      }
      .six {
        transform: rotateX(180deg) translateZ(calc(var(--w) / 2));
      }

      .dot {
        --cc: oklch(from var(--c) 92.5% c h);
        display: block;
        width: calc(var(--w) / 6);
        aspect-ratio: 1;
        background-color: var(--cc);
        box-shadow: 0px 0px 5px 5px inset oklch(from var(--cc) 80% c calc(h + 30));
        border-radius: 100%;
        backface-visibility: hidden;
        transform-style: preserve-3d;
        transform: translateZ(1px);
      }
      .one {
        :nth-child(1) {
          grid-area: 1/1/3/3;
        }
      }
      .two {
        :nth-child(2) {
          grid-area: 2/2/3/3;
        }
      }
      .three {
        :nth-child(1) {
          grid-area: 1/1/2/2;
        }
        :nth-child(2) {
          grid-area: 1/1/3/3;
        }
        :nth-child(3) {
          grid-area: 2/2/3/3;
        }
      }

      .five {
        :nth-child(1) {
          grid-area: 1/1/2/2;
        }
        :nth-child(2) {
          grid-area: 2/1/3/2;
        }
        :nth-child(3) {
          grid-area: 1/2/2/3;
        }
        :nth-child(4) {
          grid-area: 2/2/3/3;
        }
        :nth-child(5) {
          grid-area: 1/1/3/3;
        }
      }
      .six {
        padding: 0.75rem 0;
        grid-template-rows: repeat(3, 1fr);
      }

      @property --l {
        syntax: '<percentage>';
        inherits: true;
        initial-value: 40%;
      }
      .rolled {
        --l: 30%;
        background-color: oklch(from var(--c) var(--l) c h / 90%);
        animation: 2000ms blink forwards infinite;
      }

      @keyframes blink {
        25%,
        75% {
          --l: 40%;
        }
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'rolling-dice': RollingDice;
  }
}
